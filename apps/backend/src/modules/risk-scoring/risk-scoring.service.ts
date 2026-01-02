import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UserService } from '../user/services/user.service';
import { LoanService } from '../loan/services/loan.service';
import { LoanStatus, Loan } from '../../common/types/database.types';
import { BlacklistService } from '../compliance/blacklist.service';
import { DecimalUtil, Decimal } from '../../common/utils/decimal.util';

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface CreditScoreResult {
  score: number;
  grade: string;
  breakdown: CreditScoreBreakdown;
  timestamp: Date;
  method: 'ALGORITHM_V1';
}

export interface CreditScoreBreakdown {
  paymentHistory: { score: number; weight: 0.35 };
  utilization: { score: number; weight: 0.25 };
  accountAge: { score: number; weight: 0.15 };
  reputation: { score: number; weight: 0.15 };
  diversification: { score: number; weight: 0.10 };
}

export interface FraudDetectionResult {
  riskScore: number; 
  recommendation: 'APPROVE' | 'REVIEW' | 'REJECT';
  flags: string[];
  timestamp: Date;
}

export interface LoanRiskAssessment {
  loanId: string;
  riskLevel: RiskLevel;
  defaultProbability: number;
  liquidationRisk: number;
  collateralHealth: number;
  recommendation: string;
  timestamp: Date;
}

@Injectable()
export class RiskScoringService {
  private readonly logger = new Logger(RiskScoringService.name);

  constructor(
    private readonly userService: UserService,
    @Inject(forwardRef(() => LoanService))
    private readonly loanService: LoanService,
    private readonly supabase: SupabaseService,
    @Inject(forwardRef(() => BlacklistService))
    private readonly blacklistService: BlacklistService,
  ) { }

  async calculateUserCreditScore(userId: string): Promise<CreditScoreResult> {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const loans = await this.loanService.findAllByUser(userId);

    const paymentHistory = this.calculatePaymentHistoryScore(loans);
    const utilization = this.calculateUtilizationScore(loans);
    const accountAge = this.calculateAccountAgeScore(user.createdAt);
    const reputation = this.calculateReputationScore(user.reputationPoints);
    const diversification = this.calculateDiversificationScore(loans);

    const rawScore = DecimalUtil.add(
      DecimalUtil.add(
        DecimalUtil.add(
          DecimalUtil.add(
            DecimalUtil.multiply(DecimalUtil.fromNumber(paymentHistory), '0.35'),
            DecimalUtil.multiply(DecimalUtil.fromNumber(utilization), '0.25')
          ),
          DecimalUtil.multiply(DecimalUtil.fromNumber(accountAge), '0.15')
        ),
        DecimalUtil.multiply(DecimalUtil.fromNumber(reputation), '0.15')
      ),
      DecimalUtil.multiply(DecimalUtil.fromNumber(diversification), '0.10')
    );

    const scaledScore = DecimalUtil.multiply(rawScore, '10');
    const score = Math.max(Math.min(Math.round(DecimalUtil.toNumber(scaledScore)), 1000), 0);
    const grade = this.calculateGrade(score);

    const result: CreditScoreResult = {
      score,
      grade,
      breakdown: {
        paymentHistory: { score: paymentHistory, weight: 0.35 },
        utilization: { score: utilization, weight: 0.25 },
        accountAge: { score: accountAge, weight: 0.15 },
        reputation: { score: reputation, weight: 0.15 },
        diversification: { score: diversification, weight: 0.10 }
      },
      timestamp: new Date(),
      method: 'ALGORITHM_V1'
    };

    await this.persistCreditScore(userId, result);

    this.logger.log(
      `Credit Score: ${score} (${grade}) | History: ${paymentHistory.toFixed(1)}% | Util: ${utilization.toFixed(1)}% | Age: ${accountAge.toFixed(1)}% | Rep: ${reputation.toFixed(1)}% | Div: ${diversification.toFixed(1)}%`
    );

    return result;
  }

  private calculatePaymentHistoryScore(loans: Loan[]): number {
    const completedLoans = loans.filter(l =>
      [LoanStatus.REPAID, LoanStatus.DEFAULTED, LoanStatus.LIQUIDATED].includes(l.status)
    );

    if (completedLoans.length === 0) {
      return 50;
    }

    const repaidCount = loans.filter(l => l.status === LoanStatus.REPAID).length;
    const defaultCount = loans.filter(l =>
      [LoanStatus.DEFAULTED, LoanStatus.LIQUIDATED].includes(l.status)
    ).length;

    const total = repaidCount + defaultCount;
    if (total === 0) return 50;

    const successRate = DecimalUtil.toNumber(
      DecimalUtil.multiply(
        DecimalUtil.divide(DecimalUtil.fromNumber(repaidCount), DecimalUtil.fromNumber(total)),
        '100'
      )
    );

    return Math.max(Math.min(successRate, 100), 0);
  }

  private calculateUtilizationScore(loans: Loan[]): number {
    const activeLoans = loans.filter(l =>
      [LoanStatus.ACTIVE, LoanStatus.PENDING].includes(l.status)
    );

    if (activeLoans.length === 0) {
      return 100;
    }

    const totalOutstanding = activeLoans.reduce(
      (sum: Decimal, l) => DecimalUtil.add(sum, l.outstandingAmount || '0'),
      DecimalUtil.fromNumber(0)
    );

    const totalCollateral = activeLoans.reduce(
      (sum: Decimal, l) => DecimalUtil.add(sum, l.collateralAmount || '0'),
      DecimalUtil.fromNumber(0)
    );

    if (DecimalUtil.isZero(totalCollateral)) {
      return 0;
    }

    const adjustedCollateral = DecimalUtil.multiply(totalCollateral, '0.8');
    const ltv = DecimalUtil.toNumber(
      DecimalUtil.multiply(
        DecimalUtil.divide(totalOutstanding, adjustedCollateral),
        '100'
      )
    );
    const score = Math.max(100 - ltv, 0);

    return Math.min(score, 100);
  }

  private calculateAccountAgeScore(createdAt: Date): number {
    const now = new Date();
    const ageMs = now.getTime() - new Date(createdAt).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    const ageYears = ageDays / 365;

    const score = ageYears * 100;

    return Math.min(score, 100);
  }

  private calculateReputationScore(reputationPoints: number): number {
    const score = DecimalUtil.toNumber(
      DecimalUtil.multiply(
        DecimalUtil.divide(DecimalUtil.fromNumber(reputationPoints), '1000'),
        '100'
      )
    );
    return Math.min(score, 100);
  }

  private calculateDiversificationScore(loans: Loan[]): number {
    if (loans.length === 0) return 50;

    const uniqueChains = new Set(loans.map(l => l.chain)).size;

    return Math.min(uniqueChains * 25, 100);
  }

  private calculateGrade(score: number): string {
    if (score >= 900) return 'A+';
    if (score >= 850) return 'A';
    if (score >= 800) return 'A-';
    if (score >= 750) return 'B+';
    if (score >= 700) return 'B';
    if (score >= 650) return 'B-';
    if (score >= 600) return 'C+';
    if (score >= 550) return 'C';
    if (score >= 500) return 'D';
    return 'F';
  }

  async detectFraudRisk(userId: string, loanAmount: number): Promise<FraudDetectionResult> {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const allLoans = await this.loanService.findAllByUser(userId);
    const loansLast24h = allLoans.filter(l => {
      const createdAt = new Date(l.createdAt);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return createdAt > oneDayAgo;
    });

    let riskScore = 0;
    const flags: string[] = [];

    if (allLoans.length > 0) {
      const amounts = allLoans.map(l => DecimalUtil.fromString(l.amount || '0'));
      const sortedAmounts = amounts.sort((a, b) => a.comparedTo(b));
      const medianAmount = sortedAmounts[Math.floor(sortedAmounts.length / 2)];

      if (!DecimalUtil.isZero(medianAmount)) {
        const threshold = DecimalUtil.multiply(medianAmount, '5');
        if (DecimalUtil.greaterThan(DecimalUtil.fromNumber(loanAmount), threshold)) {
          riskScore += 20;
          flags.push('UNUSUAL_AMOUNT');
        }
      }
    }

    if (loansLast24h.length > 5) {
      riskScore += 25;
      flags.push('HIGH_VELOCITY');
    }

    const accountAgeDays = this.getAccountAgeDays(user.createdAt);
    if (accountAgeDays < 30) {
      riskScore += 15;
      flags.push('NEW_ACCOUNT');
    }

    if (user.reputationPoints < 100) {
      riskScore += 10;
      flags.push('LOW_REPUTATION');
    }

    const isBlacklisted = await this.checkBlacklist(user.id);
    if (isBlacklisted) {
      riskScore = 100;
      flags.push('BLACKLISTED');
    }

    const recommendation = this.getRecommendation(riskScore);

    const result: FraudDetectionResult = {
      riskScore,
      recommendation,
      flags,
      timestamp: new Date()
    };

    await this.persistFraudCheck(userId, result);

    this.logger.log(
      `Fraud Check: User ${userId} | Risk: ${riskScore} | Recommendation: ${recommendation} | Flags: ${flags.join(', ')}`
    );

    return result;
  }

  async assessLoanRisk(loanId: string): Promise<LoanRiskAssessment> {
    const loan = await this.loanService.findById(loanId);
    const user = await this.userService.findById(loan.userId);
    const creditScore = await this.calculateUserCreditScore(user.id);

    const collateralValue = DecimalUtil.fromString(loan.collateralAmount || '0');
    const loanAmount = DecimalUtil.fromString(loan.amount || '0');
    const outstandingAmount = DecimalUtil.fromString(loan.outstandingAmount || '0');

    const defaultProbabilityRaw = DecimalUtil.toNumber(
      DecimalUtil.multiply(
        DecimalUtil.divide(
          DecimalUtil.subtract(DecimalUtil.fromNumber(900), DecimalUtil.fromNumber(creditScore.score)),
          '900'
        ),
        '100'
      )
    );
    const defaultProbability = Math.max(0, Math.min(100, defaultProbabilityRaw));

    const liquidationRisk = DecimalUtil.isZero(collateralValue) 
      ? 100 
      : DecimalUtil.toNumber(
          DecimalUtil.multiply(
            DecimalUtil.divide(loanAmount, collateralValue),
            '100'
          )
        );

    const collateralHealth = DecimalUtil.isZero(outstandingAmount)
      ? 100
      : DecimalUtil.toNumber(
          DecimalUtil.multiply(
            DecimalUtil.divide(
              DecimalUtil.subtract(collateralValue, outstandingAmount),
              outstandingAmount
            ),
            '100'
          )
        );

    let riskLevel = RiskLevel.LOW;
    if (defaultProbability > 50 || liquidationRisk > 120) {
      riskLevel = RiskLevel.CRITICAL;
    } else if (defaultProbability > 25 || liquidationRisk > 100) {
      riskLevel = RiskLevel.HIGH;
    } else if (defaultProbability > 10 || liquidationRisk > 80) {
      riskLevel = RiskLevel.MEDIUM;
    }

    const recommendation = this.getMonitoringRecommendation(riskLevel);

    const result: LoanRiskAssessment = {
      loanId,
      riskLevel,
      defaultProbability: Number(DecimalUtil.toFixed(DecimalUtil.fromNumber(defaultProbability), 2)),
      liquidationRisk: Number(DecimalUtil.toFixed(DecimalUtil.fromNumber(liquidationRisk), 2)),
      collateralHealth: Number(DecimalUtil.toFixed(DecimalUtil.fromNumber(collateralHealth), 2)),
      recommendation,
      timestamp: new Date()
    };

    await this.persistLoanRisk(loanId, result);

    return result;
  }

  async collectTrainingData(loanId: string) {
    try {
      const loan = await this.loanService.findById(loanId);
      const user = await this.userService.findById(loan.userId);
      const creditScore = await this.calculateUserCreditScore(user.id);
      const fraudCheck = await this.detectFraudRisk(user.id, DecimalUtil.toNumber(DecimalUtil.fromString(loan.amount || '0')));

      const features = {
        account_age_days: this.getAccountAgeDays(user.createdAt),
        reputation_points: user.reputationPoints,
        reputation_tier: user.reputationTier,
        loan_amount: DecimalUtil.toNumber(DecimalUtil.fromString(loan.amount || '0')),
        collateral_amount: DecimalUtil.toNumber(DecimalUtil.fromString(loan.collateralAmount || '0')),
        interest_rate: DecimalUtil.toNumber(DecimalUtil.fromString(loan.interestRate || '0')),
        duration_days: loan.durationDays,
        chain: loan.chain,
        credit_score: creditScore.score,
        fraud_risk_score: fraudCheck.riskScore,
        hour_of_day: new Date().getHours(),
        day_of_week: new Date().getDay(),
        outcome: null,
        outcome_date: null
      };

      await this.supabase.getClient()
        .from('ml_training_data')
        .insert({
          loanId,
          userId: user.id,
          features,
          collected_at: new Date()
        });
    } catch (error) {
      this.logger.error(`Failed to collect training data for loan ${loanId}: ${error.message}`);
    }
  }

  async updateTrainingOutcome(loanId: string, outcome: 'REPAID' | 'DEFAULTED') {
    try {
      await this.supabase.getClient()
        .from('ml_training_data')
        .update({
          'features.outcome': outcome,
          'features.outcome_date': new Date().toISOString()
        })
        .eq('loanId', loanId);
    } catch (error) {
      this.logger.error(`Failed to update training outcome for loan ${loanId}: ${error.message}`);
    }
  }

  private async persistCreditScore(userId: string, result: CreditScoreResult) {
    try {
      await this.supabase.getClient()
        .from('credit_scores')
        .insert({
          userId,
          score: result.score,
          grade: result.grade,
          breakdown: result.breakdown,
          method: result.method,
          calculatedAt: result.timestamp
        });
    } catch (error) {
      this.logger.error(`Failed to persist credit score: ${error.message}`);
    }
  }

  private async persistFraudCheck(userId: string, result: FraudDetectionResult) {
    try {
      await this.supabase.getClient()
        .from('fraud_checks')
        .insert({
          userId,
          riskScore: result.riskScore,
          recommendation: result.recommendation,
          flags: result.flags,
          checkedAt: result.timestamp
        });
    } catch (error) {
      this.logger.error(`Failed to persist fraud check: ${error.message}`);
    }
  }

  private async persistLoanRisk(loanId: string, result: LoanRiskAssessment) {
    try {
      await this.supabase.getClient()
        .from('loan_risk_assessments')
        .insert({
          loanId,
          riskLevel: result.riskLevel,
          defaultProbability: result.defaultProbability,
          liquidationRisk: result.liquidationRisk,
          collateralHealth: result.collateralHealth,
          recommendation: result.recommendation,
          assessedAt: result.timestamp
        });
    } catch (error) {
      this.logger.error(`Failed to persist loan risk: ${error.message}`);
    }
  }

  private getRecommendation(riskScore: number): 'APPROVE' | 'REVIEW' | 'REJECT' {
    if (riskScore >= 70) return 'REJECT';
    if (riskScore >= 30) return 'REVIEW';
    return 'APPROVE';
  }

  private getMonitoringRecommendation(riskLevel: RiskLevel): string {
    const recommendations = {
      [RiskLevel.LOW]: 'STANDARD_MONITORING',
      [RiskLevel.MEDIUM]: 'ENHANCED_MONITORING',
      [RiskLevel.HIGH]: 'STRICT_MONITORING',
      [RiskLevel.CRITICAL]: 'IMMEDIATE_INTERVENTION'
    };
    return recommendations[riskLevel];
  }

  private getAccountAgeDays(createdAt: Date | string): number {
    const now = new Date();
    const ageMs = now.getTime() - new Date(createdAt).getTime();
    return Math.ceil(ageMs / (1000 * 60 * 60 * 24));
  }

  private async checkBlacklist(userId: string): Promise<boolean> {
    try {
      const user = await this.userService.findById(userId);

      if (!user.walletAddresses) {
        return false;
      }

      const chains = Object.keys(user.walletAddresses);

      for (const chain of chains) {
        const address = user.walletAddresses[chain];
        if (!address) continue;

        const result = await this.blacklistService.checkAddress(address, chain);

        if (result.isBlacklisted) {
          this.logger.error(
            `User ${userId} has blacklisted address ${address} on ${chain}: ${result.reason} (${result.source})`
          );
          return true;
        }
      }

      return false;
    } catch (error) {
      this.logger.error(`Blacklist check failed for user ${userId}: ${error.message}`);
      return false;
    }
  }
}
