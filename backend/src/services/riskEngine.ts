import logger from '../utils/logger';
import { z } from 'zod';

/**
 * Risk scoring levels
 */
export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export const RiskLevelLabel: Record<RiskLevel, 'low' | 'medium' | 'high' | 'critical'> = {
  [RiskLevel.LOW]: 'low',
  [RiskLevel.MEDIUM]: 'medium',
  [RiskLevel.HIGH]: 'high',
  [RiskLevel.CRITICAL]: 'critical',
};

/**
 * Risk assessment result
 */
export interface RiskAssessment {
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  reasons: string[];
  flags: string[];
  recommendation: 'APPROVE' | 'WARN' | 'BLOCK';
  confidence: number; // 0-100
  suggestions?: string[];
  safeParams?: Record<string, unknown>;
}

/**
 * Wallet history for risk assessment
 */
export interface WalletHistory {
  address: string;
  totalTransactions: number;
  totalVolume: bigint;
  avgTransactionSize: bigint;
  firstSeenTimestamp: number;
  lastSeenTimestamp: number;
  isContract: boolean;
  tokenBalances: Map<string, bigint>;
  trustScore?: number; // From TrustScore contract
}

/**
 * Flash loan context for risk assessment
 */
export interface FlashLoanContext {
  asset: string;
  totalAmount: bigint;
  premium: bigint;
  recipientCount: number;
  recipients: string[];
  allocations: bigint[];
  initiator: string;
  receiverContract: string;
  timestamp: number;
  // Added risk features
  availableLiquidity?: bigint; // pool liquidity
  expectedSlippageBps?: number; // 0..10000
  gasGwei?: number; // current gas price
  gasVolatilityIndex?: number; // 0..100
  counterpartyAlerts?: string[]; // external intel flags
  walletHealth?: number; // 0..100 health of initiator
}

/**
 * Loan credit risk input
 */
export interface CreditRiskInput {
  monthlyIncome: number; // in fiat units
  proposedEmi: number; // proposed monthly payment
  onTimeRepaymentRatio?: number; // 0..1
  priorDefaults?: number; // count
  behaviorAnomalies?: string[];
  existingDebtToIncome?: number; // 0..1
  tenureMonths?: number; // requested tenure
  userTrustScore?: number; // optional trust score
}

/**
 * Phase 1.2: AI Validation Engine
 * Heuristic-based risk scoring and anomaly detection
 *
 * Scoring methodology (0-100):
 * - Base score: 20 (neutral baseline)
 * - Wallet history risk: ±30 points
 * - Transaction pattern risk: ±20 points
 * - Amount anomaly risk: ±15 points
 * - Recipient risk: ±15 points
 *
 * Examples:
 * - Established wallet, normal activity: 15-35 (Low)
 * - New wallet, moderate activity: 40-60 (Medium)
 * - Suspicious pattern, unusual amounts: 65-80 (High)
 * - Clear indicators of attack: 85-100 (Critical)
 */
export class RiskEngine {
  /**
   * Perform comprehensive risk assessment
   */
  static async assessRisk(
    context: FlashLoanContext,
    walletHistories: Map<string, WalletHistory>
  ): Promise<RiskAssessment> {
    const reasons: string[] = [];
    const flags: string[] = [];
    let riskScore = 20; // Base score

    // 1. Assess initiator wallet history risk
    const initiatorHistory = walletHistories.get(context.initiator);
    if (initiatorHistory) {
      const historyRisk = this.assessWalletHistoryRisk(initiatorHistory);
      riskScore += historyRisk.score;
      reasons.push(...historyRisk.reasons);
      flags.push(...historyRisk.flags);
    } else {
      // Unknown wallet
      riskScore += 20;
      flags.push('UNKNOWN_WALLET');
      reasons.push('Initiator wallet history not found');
    }

    // 2. Assess receiver contract risk
    const receiverHistory = walletHistories.get(context.receiverContract);
    if (receiverHistory && !receiverHistory.isContract) {
      riskScore += 15;
      flags.push('RECEIVER_NOT_CONTRACT');
      reasons.push('Receiver address is not a contract');
    }

    // 3. Assess transaction pattern risk
    const patternRisk = this.assessTransactionPatternRisk(
      context,
      initiatorHistory
    );
    riskScore += patternRisk.score;
    reasons.push(...patternRisk.reasons);
    flags.push(...patternRisk.flags);

    // 4. Assess amount anomaly risk
    const amountRisk = this.assessAmountAnomalyRisk(context, initiatorHistory);
    riskScore += amountRisk.score;
    reasons.push(...amountRisk.reasons);
    flags.push(...amountRisk.flags);

    // 5. Assess recipient risk
    const recipientRisk = this.assessRecipientRisk(
      context,
      walletHistories
    );
    riskScore += recipientRisk.score;
    reasons.push(...recipientRisk.reasons);
    flags.push(...recipientRisk.flags);

    // 6. Assess premium adequacy
    const premiumRisk = this.assessPremiumRisk(context);
    riskScore += premiumRisk.score;
    reasons.push(...premiumRisk.reasons);
    flags.push(...premiumRisk.flags);

    // 6b. Liquidity headroom / slippage / gas volatility / wallet health / intel flags
    const envRisk = this.assessEnvironmentRisk(context);
    riskScore += envRisk.score;
    reasons.push(...envRisk.reasons);
    flags.push(...envRisk.flags);

    // Clamp score to 0-100
    riskScore = Math.max(0, Math.min(100, riskScore));

    // Determine risk level
    const riskLevel = this.scoreToLevel(riskScore);

    // Determine recommendation
    const recommendation = this.scoreToRecommendation(
      riskScore,
      flags
    );

    // Calculate confidence (higher with more wallet data)
    const confidence = this.calculateConfidence(
      context,
      walletHistories
    );

    const suggestions = this.suggestMitigations({ riskScore, flags, reasons, context });
    const safeParams = this.suggestSafeParams(context);

    logger.audit?.({
      action: 'AI_RISK_ASSESSMENT',
      outcome: recommendation,
      resource: 'flashloan:preview',
      metadata: {
        initiator: context.initiator,
        riskScore,
        riskLevel,
        flags: [...new Set(flags)],
        reasons: [...new Set(reasons)],
        suggestions,
        safeParams,
      },
    });

    return {
      riskScore,
      riskLevel,
      reasons: [...new Set(reasons)], // Remove duplicates
      flags: [...new Set(flags)],
      recommendation,
      confidence,
      suggestions,
      safeParams,
    };
  }

  /**
   * Assess wallet history risk
   */
  private static assessWalletHistoryRisk(
    history: WalletHistory
  ): { score: number; reasons: string[]; flags: string[] } {
    let score = 0;
    const reasons: string[] = [];
    const flags: string[] = [];

    const walletAgeSeconds = Date.now() / 1000 - history.firstSeenTimestamp;
    const walletAgeDays = walletAgeSeconds / 86400;

    // New wallet risk
    if (walletAgeDays < 1) {
      score += 25;
      flags.push('BRAND_NEW_WALLET');
      reasons.push('Wallet created less than 24 hours ago');
    } else if (walletAgeDays < 7) {
      score += 15;
      flags.push('VERY_NEW_WALLET');
      reasons.push('Wallet less than 7 days old');
    } else if (walletAgeDays < 30) {
      score += 8;
      reasons.push('Wallet less than 30 days old');
    } else if (walletAgeDays > 365) {
      score -= 8;
      reasons.push('Wallet established (>1 year)');
    }

    // Transaction history risk
    if (history.totalTransactions < 5) {
      score += 12;
      flags.push('LOW_TRANSACTION_COUNT');
      reasons.push('Very few historical transactions');
    } else if (history.totalTransactions < 20) {
      score += 6;
      reasons.push('Limited transaction history');
    } else {
      score -= 5;
      reasons.push('Good transaction history');
    }

    // Trust score from smart contract
    if (history.trustScore !== undefined) {
      if (history.trustScore < 300) {
        score += 15;
        flags.push('LOW_TRUST_SCORE');
        reasons.push(`Low trust score: ${history.trustScore}`);
      } else if (history.trustScore > 800) {
        score -= 10;
        reasons.push(`High trust score: ${history.trustScore}`);
      }
    }

    return { score, reasons, flags };
  }

  /**
   * Assess transaction pattern risk
   */
  private static assessTransactionPatternRisk(
    context: FlashLoanContext,
    initiatorHistory?: WalletHistory
  ): { score: number; reasons: string[]; flags: string[] } {
    let score = 0;
    const reasons: string[] = [];
    const flags: string[] = [];

    if (!initiatorHistory) {
      return { score, reasons, flags };
    }

    const avgTxSize = initiatorHistory.avgTransactionSize;
    const currentTxSize = context.totalAmount;

    // Rapid increase in transaction size
    if (avgTxSize > 0n && currentTxSize > avgTxSize * 100n) {
      score += 12;
      flags.push('MASSIVE_SIZE_JUMP');
      reasons.push('Transaction size 100x+ average');
    } else if (avgTxSize > 0n && currentTxSize > avgTxSize * 10n) {
      score += 6;
      reasons.push('Transaction size 10x+ average');
    }

    // Multi-recipient distribution risk
    if (context.recipientCount > 10) {
      score += 8;
      flags.push('HIGH_RECIPIENT_COUNT');
      reasons.push(`High recipient count: ${context.recipientCount}`);
    }

    // Check for unusual allocation patterns
    const avgAllocation =
      context.allocations.reduce((a, b) => a + b, 0n) / BigInt(context.allocations.length);
    const maxAllocation = Math.max(...context.allocations.map(a => Number(a)));

    if (maxAllocation > Number(avgAllocation) * 5) {
      score += 4;
      reasons.push('Unusual allocation distribution detected');
    }

    return { score, reasons, flags };
  }

  /**
   * Assess amount anomaly risk
   */
  private static assessAmountAnomalyRisk(
    context: FlashLoanContext,
    _initiatorHistory?: WalletHistory
  ): { score: number; reasons: string[]; flags: string[] } {
    let score = 0;
    const reasons: string[] = [];
    const flags: string[] = [];

    // Very large transaction
    if (context.totalAmount > 10n ** 18n * 1000n) {
      // > 1000 ETH equivalent
      score += 8;
      flags.push('VERY_LARGE_AMOUNT');
      reasons.push('Very large transaction amount');
    }

    // Premium analysis
    const premiumBps = Number(
      (context.premium * 10000n) / context.totalAmount
    );
    if (premiumBps < 1) {
      score += 5;
      flags.push('SUSPICIOUSLY_LOW_PREMIUM');
      reasons.push('Premium unusually low');
    }

    return { score, reasons, flags };
  }

  /**
   * Assess recipient risk
   */
  private static assessRecipientRisk(
    context: FlashLoanContext,
    walletHistories: Map<string, WalletHistory>
  ): { score: number; reasons: string[]; flags: string[] } {
    let score = 0;
    const reasons: string[] = [];
    const flags: string[] = [];

    let unknownRecipients = 0;
    let newRecipients = 0;

    for (const recipient of context.recipients) {
      const history = walletHistories.get(recipient);

      if (!history) {
        unknownRecipients++;
      } else {
        const walletAgeDays =
          (Date.now() / 1000 - history.firstSeenTimestamp) / 86400;
        if (walletAgeDays < 7) {
          newRecipients++;
        }
      }
    }

    // Check for unknown recipients
    if (unknownRecipients > context.recipientCount * 0.5) {
      score += 10;
      flags.push('MAJORITY_UNKNOWN_RECIPIENTS');
      reasons.push(`${unknownRecipients}/${context.recipientCount} recipients unknown`);
    } else if (unknownRecipients > 0) {
      score += 4;
      reasons.push(`${unknownRecipients} unknown recipients`);
    }

    // Check for new recipients
    if (newRecipients > context.recipientCount * 0.5) {
      score += 8;
      flags.push('MAJORITY_NEW_RECIPIENTS');
      reasons.push(`${newRecipients}/${context.recipientCount} recipients very new`);
    }

    return { score, reasons, flags };
  }

  /**
   * Assess premium adequacy
   */
  private static assessPremiumRisk(
    context: FlashLoanContext
  ): { score: number; reasons: string[]; flags: string[] } {
    let score = 0;
    const reasons: string[] = [];
    const flags: string[] = [];

    // Premium should be at least 5 bps (0.05%)
    const minPremium = context.totalAmount / 2000n;
    if (context.premium < minPremium) {
      score += 3;
      reasons.push('Premium below expected minimum');
    }

    return { score, reasons, flags };
  }

  private static assessEnvironmentRisk(
    context: FlashLoanContext
  ): { score: number; reasons: string[]; flags: string[] } {
    let score = 0;
    const reasons: string[] = [];
    const flags: string[] = [];

    if (context.availableLiquidity !== undefined && context.totalAmount > 0n) {
      const headroom = Number(context.availableLiquidity) - Number(context.totalAmount);
      if (headroom < 0) {
        score += 15;
        flags.push('INSUFFICIENT_LIQUIDITY');
        reasons.push('Requested amount exceeds available liquidity');
      } else if (headroom < Number(context.totalAmount) * 0.1) {
        score += 6;
        reasons.push('Tight liquidity headroom');
      }
    }

    if (typeof context.expectedSlippageBps === 'number') {
      if (context.expectedSlippageBps > 200) {
        score += 10;
        flags.push('HIGH_SLIPPAGE');
        reasons.push('Expected slippage > 2%');
      } else if (context.expectedSlippageBps > 50) {
        score += 4;
        reasons.push('Expected slippage > 0.5%');
      }
    }

    if (typeof context.gasVolatilityIndex === 'number') {
      if (context.gasVolatilityIndex > 70) {
        score += 6;
        flags.push('GAS_VOLATILITY_HIGH');
        reasons.push('High gas volatility environment');
      }
    }

    if (typeof context.walletHealth === 'number' && context.walletHealth < 30) {
      score += 6;
      reasons.push('Low wallet health score');
    }

    if (Array.isArray(context.counterpartyAlerts) && context.counterpartyAlerts.length) {
      score += 8;
      flags.push('COUNTERPARTY_ALERTS');
      reasons.push('Counterparty intel alerts present');
    }

    return { score, reasons, flags };
  }

  private static suggestMitigations(
    data: { riskScore: number; flags: string[]; reasons: string[]; context: FlashLoanContext }
  ): string[] {
    const { flags } = data;
    const suggestions: string[] = [];
    if (flags.includes('HIGH_SLIPPAGE')) suggestions.push('Reduce trade size or add more liquidity sources');
    if (flags.includes('INSUFFICIENT_LIQUIDITY')) suggestions.push('Lower amount or switch to a pool with deeper liquidity');
    if (flags.includes('MASSIVE_SIZE_JUMP')) suggestions.push('Stage the operation in smaller chunks');
    if (flags.includes('BRAND_NEW_WALLET')) suggestions.push('Increase trust via smaller preliminary transactions');
    if (flags.includes('GAS_VOLATILITY_HIGH')) suggestions.push('Use time-weighted execution or set gas caps');
    if (flags.includes('MAJORITY_UNKNOWN_RECIPIENTS')) suggestions.push('Verify recipients and whitelists before execution');
    return suggestions;
  }

  private static suggestSafeParams(context: FlashLoanContext): Record<string, unknown> {
    const safe: Record<string, unknown> = {};
    if (typeof context.expectedSlippageBps === 'number') {
      safe.maxSlippageBps = Math.max(10, Math.floor(context.expectedSlippageBps * 0.5));
    }
    if (context.totalAmount) {
      safe.suggestedAmount = context.availableLiquidity ? (context.availableLiquidity > context.totalAmount ? context.totalAmount : context.availableLiquidity) : context.totalAmount;
    }
    if (typeof context.gasGwei === 'number') {
      safe.maxFeeGwei = Math.ceil(context.gasGwei * 1.2);
    }
    return safe;
  }

  /**
   * Convert risk score to risk level
   */
  private static scoreToLevel(score: number): RiskLevel {
    if (score < 30) return RiskLevel.LOW;
    if (score < 55) return RiskLevel.MEDIUM;
    if (score < 80) return RiskLevel.HIGH;
    return RiskLevel.CRITICAL;
  }

  /**
   * Convert risk score to recommendation
   */
  private static scoreToRecommendation(
    score: number,
    flags: string[]
  ): 'APPROVE' | 'WARN' | 'BLOCK' {
    // Check for critical flags
    const criticalFlags = [
      'MASSIVE_SIZE_JUMP',
      'BRAND_NEW_WALLET',
      'MAJORITY_UNKNOWN_RECIPIENTS',
      'RECEIVER_NOT_CONTRACT',
    ];

    const hasCriticalFlag = flags.some(f => criticalFlags.includes(f));

    if (score >= 80 || hasCriticalFlag) {
      return 'BLOCK';
    }
    if (score >= 55) {
      return 'WARN';
    }
    return 'APPROVE';
  }

  /**
   * Calculate confidence score based on data availability
   */
  private static calculateConfidence(
    context: FlashLoanContext,
    walletHistories: Map<string, WalletHistory>
  ): number {
    let confidence = 50; // Base confidence

    // Higher confidence with initiator history
    if (walletHistories.has(context.initiator)) {
      confidence += 20;
    }

    // Higher confidence with receiver history
    if (walletHistories.has(context.receiverContract)) {
      confidence += 10;
    }

    // Higher confidence with more recipient history
    const recipientsWithHistory = context.recipients.filter(r =>
      walletHistories.has(r)
    ).length;
    confidence += Math.min(15, recipientsWithHistory * 2);

    return Math.min(100, confidence);
  }

  /**
   * Batch risk assessment for multiple recipients
   */
  static assessCreditRisk(input: CreditRiskInput): RiskAssessment {
    let riskScore = 20;
    const reasons: string[] = [];
    const flags: string[] = [];

    const income = Math.max(0, input.monthlyIncome || 0);
    const emi = Math.max(0, input.proposedEmi || 0);
    const ratio = income > 0 ? emi / income : 1; // EMI-to-income

    if (ratio > 0.6) {
      riskScore += 25;
      flags.push('HIGH_DTI');
      reasons.push('EMI exceeds 60% of monthly income');
    } else if (ratio > 0.4) {
      riskScore += 10;
      reasons.push('EMI between 40% and 60% of income');
    } else if (ratio < 0.2) {
      riskScore -= 8;
      reasons.push('Healthy EMI-to-income ratio (<20%)');
    }

    if (typeof input.existingDebtToIncome === 'number') {
      if (input.existingDebtToIncome > 0.5) {
        riskScore += 10;
        flags.push('HIGH_EXISTING_DTI');
        reasons.push('High existing debt-to-income');
      } else if (input.existingDebtToIncome < 0.2) {
        riskScore -= 5;
        reasons.push('Low existing debt load');
      }
    }

    if (typeof input.onTimeRepaymentRatio === 'number') {
      if (input.onTimeRepaymentRatio < 0.7) {
        riskScore += 15;
        flags.push('LOW_REPAYMENT_DISCIPLINE');
        reasons.push('Low on-time repayment history (<70%)');
      } else if (input.onTimeRepaymentRatio > 0.95) {
        riskScore -= 5;
        reasons.push('Excellent on-time repayment history');
      }
    }

    if ((input.priorDefaults || 0) > 0) {
      riskScore += 20;
      flags.push('PRIOR_DEFAULTS');
      reasons.push(`${input.priorDefaults} prior defaults reported`);
    }

    if (Array.isArray(input.behaviorAnomalies) && input.behaviorAnomalies.length) {
      const penalty = Math.min(10, input.behaviorAnomalies.length * 3);
      riskScore += penalty;
      flags.push('BEHAVIOR_ANOMALIES');
      reasons.push('Behavioral anomalies detected');
    }

    if (typeof input.userTrustScore === 'number') {
      if (input.userTrustScore < 300) {
        riskScore += 10;
        flags.push('LOW_TRUST_SCORE');
        reasons.push('Low trust score');
      } else if (input.userTrustScore > 800) {
        riskScore -= 5;
        reasons.push('High trust score');
      }
    }

    // Clamp and levels
    riskScore = Math.max(0, Math.min(100, riskScore));
    const riskLevel = this.scoreToLevel(riskScore);

    const recommendation = this.scoreToRecommendation(riskScore, flags);

    const suggestions = this.suggestCreditMitigations(flags);
    const safeParams = this.suggestCreditSafeParams(input);

    logger.audit?.({
      action: 'AI_CREDIT_RISK_ASSESSMENT',
      outcome: recommendation,
      resource: 'loan:application',
      metadata: {
        riskScore,
        riskLevel,
        flags: [...new Set(flags)],
        reasons: [...new Set(reasons)],
        suggestions,
        safeParams,
      },
    });

    return {
      riskScore,
      riskLevel,
      reasons: [...new Set(reasons)],
      flags: [...new Set(flags)],
      recommendation,
      confidence: 70,
      suggestions,
      safeParams,
    };
  }

  private static suggestCreditMitigations(flags: string[]): string[] {
    const s: string[] = [];
    if (flags.includes('HIGH_DTI')) s.push('Reduce EMI or extend tenure to lower EMI-to-income');
    if (flags.includes('HIGH_EXISTING_DTI')) s.push('Consolidate or repay existing debts to lower DTI');
    if (flags.includes('LOW_REPAYMENT_DISCIPLINE')) s.push('Enable autopay and reduce requested amount');
    if (flags.includes('PRIOR_DEFAULTS')) s.push('Require collateral or guarantor');
    if (flags.includes('LOW_TRUST_SCORE')) s.push('Increase down payment or accept smaller principal');
    if (flags.includes('BEHAVIOR_ANOMALIES')) s.push('Manual review and enhanced KYC');
    return s;
  }

  private static suggestCreditSafeParams(input: CreditRiskInput): Record<string, unknown> {
    const safe: Record<string, unknown> = {};
    const income = Math.max(0, input.monthlyIncome || 0);
    const cap = income * 0.35; // cap EMI at 35% of income
    safe.recommendedMaxEmi = Math.floor(cap);
    if (input.proposedEmi > cap) {
      safe.requireCollateral = true;
    }
    if (typeof input.tenureMonths === 'number' && input.tenureMonths < 12) {
      safe.suggestedTenureMonths = 12;
    }
    return safe;
  }

  static async assessBatchRisk(
    context: FlashLoanContext,
    walletHistories: Map<string, WalletHistory>
  ): Promise<Map<string, RiskAssessment>> {
    const results = new Map<string, RiskAssessment>();

    // Assess each recipient individually
    for (let i = 0; i < context.recipients.length; i++) {
      const recipient = context.recipients[i];
      const allocation = context.allocations[i];

      const recipientContext: FlashLoanContext = {
        ...context,
        totalAmount: allocation,
        recipients: [recipient],
        allocations: [allocation],
        recipientCount: 1,
      };

      const assessment = await this.assessRisk(
        recipientContext,
        walletHistories
      );
      results.set(recipient, assessment);
    }

    return results;
  }
}

export default RiskEngine;
