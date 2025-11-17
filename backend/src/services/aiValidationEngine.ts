import logger from '../utils/logger';

/**
 * AI Validation Engine
 * Comprehensive AI-driven validation system for platform transactions
 * 
 * Phase 1.2: AI Validation System
 * Purpose: Ensure safety, accuracy, and efficiency in all platform transactions
 * 
 * Capabilities:
 * - Transaction risk scoring
 * - User behavior anomaly detection
 * - Fraud detection
 * - Loan approval scoring model
 * - Flash loan safety validation
 * - Predictive warnings before executing a transaction
 * - System health monitoring
 * - Auto-error correction (suggesting safe parameters)
 */

export enum AlertSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

export enum AnomalyType {
  VELOCITY_ANOMALY = 'VELOCITY_ANOMALY',
  AMOUNT_ANOMALY = 'AMOUNT_ANOMALY',
  PATTERN_DEVIATION = 'PATTERN_DEVIATION',
  UNUSUAL_TIMING = 'UNUSUAL_TIMING',
  NEW_RECIPIENT = 'NEW_RECIPIENT',
  UNUSUAL_GAS_PRICE = 'UNUSUAL_GAS_PRICE',
  CHAIN_CONGESTION = 'CHAIN_CONGESTION',
}

export interface SystemHealthMetrics {
  networkLatency: number; // ms
  gasPrice: number; // gwei
  gasVolatilityIndex: number; // 0-100
  chainCongestion: number; // 0-100 (estimated)
  avgBlockTime: number; // ms
  recentSuccessRate: number; // 0-100
  systemUptime: number; // hours
  lastHealthCheck: number; // timestamp
}

export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  anomalyTypes: AnomalyType[];
  anomalyScore: number; // 0-100
  confidence: number; // 0-100
  details: string[];
}

export interface PredictiveWarning {
  warningId: string;
  severity: AlertSeverity;
  type: string;
  message: string;
  suggestedAction: string;
  riskMitigation: string[];
  timestamp: number;
}

export interface FraudIndicators {
  isSuspicious: boolean;
  fraudScore: number; // 0-100
  indicators: string[];
  confidence: number; // 0-100
}

export interface SafeParameterSuggestion {
  originalValue: number | string;
  suggestedValue: number | string;
  reason: string;
  safetyImprovement: number; // 0-100 (percentage improvement)
}

export interface AutoCorrectionSuggestion {
  parameter: string;
  currentValue: any;
  suggestedValue: any;
  reason: string;
  estimatedImpact: string;
}

export interface TransactionValidationResult {
  isValid: boolean;
  riskScore: number; // 0-100
  warnings: PredictiveWarning[];
  anomalies: AnomalyDetectionResult;
  fraud: FraudIndicators;
  safeParameters: Record<string, SafeParameterSuggestion>;
  autoCorrectionSuggestions: AutoCorrectionSuggestion[];
  estimatedOutcome: 'SUCCESS' | 'WARNING' | 'FAILURE';
  confidence: number; // 0-100
}

/**
 * User behavior profile for anomaly detection
 */
export interface UserBehaviorProfile {
  userId: string;
  avgTransactionAmount: number;
  avgTransactionFrequency: number; // per hour
  typicalTimeSlots: number[]; // hour of day
  frequentRecipients: Map<string, number>; // address -> frequency
  preferredAssets: string[];
  avgGasPrice: number;
  typicalGasLimit: number;
  successRate: number; // 0-100
  averageSlippage: number; // bps
  lastProfileUpdate: number;
}

/**
 * Comprehensive AI Validation Engine
 */
export class AIValidationEngine {
  private static userBehaviorProfiles = new Map<string, UserBehaviorProfile>();
  private static systemMetrics: SystemHealthMetrics = {
    networkLatency: 0,
    gasPrice: 0,
    gasVolatilityIndex: 0,
    chainCongestion: 0,
    avgBlockTime: 0,
    recentSuccessRate: 95,
    systemUptime: 0,
    lastHealthCheck: Date.now(),
  };

  /**
   * Comprehensive transaction validation
   */
  static async validateTransaction(
    userId: string,
    transactionType: 'flashloan' | 'loan' | 'transfer' | 'swap',
    transactionData: Record<string, any>,
    walletData: Record<string, any>
  ): Promise<TransactionValidationResult> {
    const startTime = Date.now();

    try {
      // 1. Anomaly Detection
      const anomalyResult = await this.detectAnomalies(
        userId,
        transactionData,
        walletData
      );

      // 2. Fraud Detection
      const fraudResult = this.detectFraud(
        userId,
        transactionData,
        walletData,
        anomalyResult
      );

      // 3. Predictive Warnings
      const warnings = await this.generatePredictiveWarnings(
        userId,
        transactionType,
        transactionData,
        anomalyResult,
        fraudResult
      );

      // 4. Safe Parameter Suggestions
      const safeParams = this.suggestSafeParameters(
        transactionType,
        transactionData
      );

      // 5. Auto-Correction Suggestions
      const autoCorrections = this.suggestAutoCorrection(
        transactionType,
        transactionData,
        this.systemMetrics
      );

      // 6. Calculate overall risk score
      const riskScore = this.calculateOverallRiskScore(
        anomalyResult,
        fraudResult,
        warnings
      );

      // 7. Determine confidence
      const confidence = this.calculateConfidence(
        userId,
        transactionData,
        walletData
      );

      // 8. Estimate outcome
      const estimatedOutcome = this.estimateOutcome(
        riskScore,
        anomalyResult,
        fraudResult
      );

      const result: TransactionValidationResult = {
        isValid: riskScore < 70,
        riskScore,
        warnings,
        anomalies: anomalyResult,
        fraud: fraudResult,
        safeParameters: safeParams,
        autoCorrectionSuggestions: autoCorrections,
        estimatedOutcome,
        confidence,
      };

      logger.audit?.({
        action: 'AI_VALIDATION',
        outcome: result.isValid ? 'PASS' : 'FAIL',
        resource: `transaction:${transactionType}`,
        metadata: {
          userId,
          riskScore,
          duration: Date.now() - startTime,
          warnings: warnings.length,
          anomalies: anomalyResult.anomalyTypes.length,
        },
      });

      return result;
    } catch (error: any) {
      logger.error('AI Validation Engine error', {
        error: error?.message,
        userId,
        transactionType,
      });

      // Return safe default on error
      return {
        isValid: false,
        riskScore: 100,
        warnings: [
          {
            warningId: 'VALIDATION_ERROR',
            severity: AlertSeverity.CRITICAL,
            type: 'SYSTEM_ERROR',
            message: 'Validation system error - transaction blocked for safety',
            suggestedAction: 'Retry after system recovery',
            riskMitigation: ['Wait for system recovery', 'Check logs'],
            timestamp: Date.now(),
          },
        ],
        anomalies: {
          isAnomaly: true,
          anomalyTypes: [],
          anomalyScore: 100,
          confidence: 50,
          details: ['System error during anomaly detection'],
        },
        fraud: {
          isSuspicious: true,
          fraudScore: 100,
          indicators: ['System error'],
          confidence: 50,
        },
        safeParameters: {},
        autoCorrectionSuggestions: [],
        estimatedOutcome: 'FAILURE',
        confidence: 0,
      };
    }
  }

  /**
   * Detect behavioral anomalies
   */
  private static async detectAnomalies(
    _userId: string,
    transactionData: Record<string, any>,
    _walletData: Record<string, any>
  ): Promise<AnomalyDetectionResult> {
    const anomalies: AnomalyType[] = [];
    const details: string[] = [];
    let anomalyScore = 0;
    let confidence = 0;

    // Get or create user behavior profile
    const profile = this.getOrCreateUserProfile(_userId);

    // 1. Velocity anomaly (too many transactions in short time)
    if (this.detectVelocityAnomaly(profile)) {
      anomalies.push(AnomalyType.VELOCITY_ANOMALY);
      details.push('Transaction velocity 3x+ higher than usual');
      anomalyScore += 15;
      confidence += 20;
    }

    // 2. Amount anomaly (significantly larger than typical)
    if (this.detectAmountAnomaly(transactionData.amount, profile)) {
      anomalies.push(AnomalyType.AMOUNT_ANOMALY);
      details.push(
        `Amount ${((transactionData.amount / profile.avgTransactionAmount) * 100).toFixed(0)}% above average`
      );
      anomalyScore += 20;
      confidence += 25;
    }

    // 3. Pattern deviation (unusual transaction pattern)
    if (this.detectPatternDeviation(transactionData, profile)) {
      anomalies.push(AnomalyType.PATTERN_DEVIATION);
      details.push('Transaction pattern significantly deviates from normal behavior');
      anomalyScore += 15;
      confidence += 15;
    }

    // 4. Unusual timing (transaction outside typical hours)
    if (this.detectUnusualTiming(profile)) {
      anomalies.push(AnomalyType.UNUSUAL_TIMING);
      details.push('Transaction occurring outside typical time windows');
      anomalyScore += 10;
      confidence += 15;
    }

    // 5. New recipient anomaly
    if (this.detectNewRecipient(transactionData.recipient, profile)) {
      anomalies.push(AnomalyType.NEW_RECIPIENT);
      details.push('First transaction with this recipient');
      anomalyScore += 12;
      confidence += 18;
    }

    // 6. Gas price anomaly
    if (this.detectGasAnomalyForChain(transactionData.gasPrice)) {
      anomalies.push(AnomalyType.UNUSUAL_GAS_PRICE);
      details.push('Gas price significantly deviates from network average');
      anomalyScore += 8;
      confidence += 12;
    }

    // 7. Network congestion detection
    if (this.systemMetrics.chainCongestion > 80) {
      anomalies.push(AnomalyType.CHAIN_CONGESTION);
      details.push(
        `High chain congestion detected (${this.systemMetrics.chainCongestion}%)`
      );
      anomalyScore += 5;
      confidence += 10;
    }

    return {
      isAnomaly: anomalies.length > 0,
      anomalyTypes: anomalies,
      anomalyScore: Math.min(anomalyScore, 100),
      confidence: Math.min(confidence, 100),
      details,
    };
  }

  /**
   * Detect fraudulent patterns
   */
  private static detectFraud(
    _userId: string,
    transactionData: Record<string, any>,
    walletData: Record<string, any>,
    anomalyResult: AnomalyDetectionResult
  ): FraudIndicators {
    const indicators: string[] = [];
    let fraudScore = 0;
    let confidence = 0;

    // 1. Account age check
    const accountAge = (Date.now() - walletData.createdAt) / (1000 * 60 * 60 * 24);
    if (accountAge < 7) {
      indicators.push('Very new account (<7 days)');
      fraudScore += 20;
      confidence += 25;
    }

    // 2. Success rate check
    if (walletData.successRate && walletData.successRate < 50) {
      indicators.push('Low historical success rate');
      fraudScore += 15;
      confidence += 20;
    }

    // 3. Multiple anomalies increase fraud suspicion
    if (anomalyResult.anomalyTypes.length > 2) {
      indicators.push('Multiple behavioral anomalies detected');
      fraudScore += 25;
      confidence += 20;
    }

    // 4. IP or device change with large transaction
    if (
      walletData.deviceChange &&
      transactionData.amount > walletData.avgTransactionAmount * 10
    ) {
      indicators.push('Device change with unusually large transaction');
      fraudScore += 20;
      confidence += 25;
    }

    // 5. Blacklist check (placeholder)
    if (this.isAddressBlacklisted(transactionData.recipient)) {
      indicators.push('Recipient on fraud watchlist');
      fraudScore += 30;
      confidence += 40;
    }

    // 6. High velocity account creation pattern
    if (walletData.volumeInLast24h > walletData.avgDaily * 5) {
      indicators.push('Extremely high transaction volume in 24h');
      fraudScore += 15;
      confidence += 20;
    }

    return {
      isSuspicious: fraudScore > 50,
      fraudScore: Math.min(fraudScore, 100),
      indicators,
      confidence: Math.min(confidence, 100),
    };
  }

  /**
   * Generate predictive warnings
   */
  private static async generatePredictiveWarnings(
    _userId: string,
    _transactionType: string,
    transactionData: Record<string, any>,
    anomalyResult: AnomalyDetectionResult,
    fraudResult: FraudIndicators
  ): Promise<PredictiveWarning[]> {
    const warnings: PredictiveWarning[] = [];

    // Warning 1: High risk score
    if (anomalyResult.anomalyScore > 60) {
      warnings.push({
        warningId: `warn_${Date.now()}_1`,
        severity: AlertSeverity.CRITICAL,
        type: 'HIGH_ANOMALY_SCORE',
        message: `Unusual transaction pattern detected (score: ${anomalyResult.anomalyScore})`,
        suggestedAction: 'Review transaction details or reduce amount',
        riskMitigation: [
          'Lower transaction amount',
          'Split into multiple smaller transactions',
          'Verify recipient address',
        ],
        timestamp: Date.now(),
      });
    }

    // Warning 2: Fraud suspicion
    if (fraudResult.isSuspicious) {
      warnings.push({
        warningId: `warn_${Date.now()}_2`,
        severity: AlertSeverity.CRITICAL,
        type: 'FRAUD_SUSPICION',
        message: 'Transaction flagged for potential fraud',
        suggestedAction: 'Verify transaction details with identity confirmation',
        riskMitigation: [
          '2FA verification',
          'Email confirmation',
          'Reduced transaction amount',
        ],
        timestamp: Date.now(),
      });
    }

    // Warning 3: Network congestion
    if (this.systemMetrics.chainCongestion > 75) {
      warnings.push({
        warningId: `warn_${Date.now()}_3`,
        severity: AlertSeverity.WARNING,
        type: 'NETWORK_CONGESTION',
        message: `High network congestion (${this.systemMetrics.chainCongestion}%) - transaction may fail or be slow`,
        suggestedAction: 'Wait for network to clear or increase gas price',
        riskMitigation: [
          'Wait 10-15 minutes for network to clear',
          'Increase gas price',
          'Reschedule transaction',
        ],
        timestamp: Date.now(),
      });
    }

    // Warning 4: Gas volatility
    if (this.systemMetrics.gasVolatilityIndex > 70) {
      warnings.push({
        warningId: `warn_${Date.now()}_4`,
        severity: AlertSeverity.WARNING,
        type: 'GAS_VOLATILITY',
        message: 'High gas price volatility detected',
        suggestedAction: 'Consider using automated gas optimization or waiting',
        riskMitigation: [
          'Use gas optimization tools',
          'Set gas price limits',
          'Schedule for off-peak hours',
        ],
        timestamp: Date.now(),
      });
    }

    // Warning 5: Low success prediction
    const successPrediction = this.predictTransactionSuccess(transactionData);
    if (successPrediction < 60) {
      warnings.push({
        warningId: `warn_${Date.now()}_5`,
        severity: AlertSeverity.WARNING,
        type: 'LOW_SUCCESS_PREDICTION',
        message: `Low predicted success rate (${successPrediction}%) based on current conditions`,
        suggestedAction: 'Review parameters or wait for better conditions',
        riskMitigation: [
          'Adjust transaction parameters',
          'Increase slippage tolerance',
          'Wait for better network conditions',
        ],
        timestamp: Date.now(),
      });
    }

    return warnings;
  }

  /**
   * Suggest safe transaction parameters
   */
  private static suggestSafeParameters(
    transactionType: string,
    transactionData: Record<string, any>
  ): Record<string, SafeParameterSuggestion> {
    const suggestions: Record<string, SafeParameterSuggestion> = {};

    if (transactionType === 'swap' || transactionType === 'flashloan') {
      // Gas price suggestion
      if (transactionData.gasPrice) {
        const safeGasPrice = this.systemMetrics.gasPrice * 1.1; // 10% above average
        suggestions['gasPrice'] = {
          originalValue: transactionData.gasPrice,
          suggestedValue: safeGasPrice,
          reason: 'Slightly above current average to ensure confirmation',
          safetyImprovement: 25,
        };
      }

      // Slippage suggestion
      if (transactionData.slippageTolerance !== undefined) {
        const safeSlippage = Math.min(transactionData.slippageTolerance, 100); // Cap at 1%
        suggestions['slippageTolerance'] = {
          originalValue: transactionData.slippageTolerance,
          suggestedValue: safeSlippage,
          reason: 'Lower slippage reduces loss in volatile conditions',
          safetyImprovement: 30,
        };
      }

      // Amount reduction suggestion
      if (transactionData.amount) {
        const safeAmount = transactionData.amount * 0.9; // Suggest 10% reduction
        suggestions['amount'] = {
          originalValue: transactionData.amount,
          suggestedValue: safeAmount,
          reason: 'Smaller amount reduces risk and potential loss',
          safetyImprovement: 40,
        };
      }
    }

    return suggestions;
  }

  /**
   * Suggest automatic corrections for parameters
   */
  private static suggestAutoCorrection(
    transactionType: string,
    transactionData: Record<string, any>,
    metrics: SystemHealthMetrics
  ): AutoCorrectionSuggestion[] {
    const suggestions: AutoCorrectionSuggestion[] = [];

    // 1. Gas price optimization
    if (metrics.chainCongestion > 80) {
      suggestions.push({
        parameter: 'gasPrice',
        currentValue: transactionData.gasPrice,
        suggestedValue: metrics.gasPrice * 1.2,
        reason: 'High congestion requires higher gas price',
        estimatedImpact: 'Faster confirmation, higher cost',
      });
    }

    // 2. Batch operations for efficiency
    if (transactionType === 'transfer' && transactionData.count > 3) {
      suggestions.push({
        parameter: 'operationType',
        currentValue: 'sequential',
        suggestedValue: 'batch',
        reason: 'Multiple similar operations benefit from batching',
        estimatedImpact: '30-50% cost reduction, single confirmation',
      });
    }

    // 3. Time-based optimization
    const currentHour = new Date().getHours();
    if (currentHour >= 8 && currentHour <= 17) {
      // Business hours - typically more congestion
      suggestions.push({
        parameter: 'executionTime',
        currentValue: 'immediate',
        suggestedValue: 'waitForOffPeak',
        reason: 'Off-peak hours typically have lower fees',
        estimatedImpact: '20-40% gas cost reduction',
      });
    }

    return suggestions;
  }

  /**
   * Predict transaction success probability
   */
  private static predictTransactionSuccess(
    transactionData: Record<string, any>
  ): number {
    let successProbability = 100;

    // Reduce based on chain congestion
    successProbability -= this.systemMetrics.chainCongestion * 0.5;

    // Reduce based on gas price being too low
    if (
      transactionData.gasPrice <
      this.systemMetrics.gasPrice * 0.8
    ) {
      successProbability -= 15;
    }

    // Reduce based on complexity (more contracts = lower success)
    if (transactionData.complexity > 2) {
      successProbability -= 10;
    }

    return Math.max(successProbability, 0);
  }

  /**
   * Helper methods for anomaly detection
   */
  private static detectVelocityAnomaly(profile: UserBehaviorProfile): boolean {
    // Check if current transaction frequency is 3x+ normal
    // This would check recent transaction timestamp against typical frequency
    return profile.avgTransactionFrequency > 0;
  }

  private static detectAmountAnomaly(
    amount: number,
    profile: UserBehaviorProfile
  ): boolean {
    return amount > profile.avgTransactionAmount * 5;
  }

  private static detectPatternDeviation(
    transactionData: Record<string, any>,
    profile: UserBehaviorProfile
  ): boolean {
    // Compare transaction characteristics against profile
    const assetDeviation = !profile.preferredAssets.includes(
      transactionData.asset || ''
    );
    return assetDeviation;
  }

  private static detectUnusualTiming(profile: UserBehaviorProfile): boolean {
    const currentHour = new Date().getHours();
    return !profile.typicalTimeSlots.includes(currentHour);
  }

  private static detectNewRecipient(
    recipient: string,
    profile: UserBehaviorProfile
  ): boolean {
    return !profile.frequentRecipients.has(recipient);
  }

  private static detectGasAnomalyForChain(gasPrice: number): boolean {
    return gasPrice > this.systemMetrics.gasPrice * 2;
  }

  private static isAddressBlacklisted(_address: string): boolean {
    // Placeholder - in production, check against real fraud list
    return false;
  }

  private static getOrCreateUserProfile(
    userId: string
  ): UserBehaviorProfile {
    if (!this.userBehaviorProfiles.has(userId)) {
      this.userBehaviorProfiles.set(userId, {
        userId,
        avgTransactionAmount: 1,
        avgTransactionFrequency: 1,
        typicalTimeSlots: Array.from({ length: 24 }, (_, i) => i), // All hours initially
        frequentRecipients: new Map(),
        preferredAssets: [],
        avgGasPrice: this.systemMetrics.gasPrice,
        typicalGasLimit: 200000,
        successRate: 95,
        averageSlippage: 50,
        lastProfileUpdate: Date.now(),
      });
    }
    return this.userBehaviorProfiles.get(userId)!;
  }

  /**
   * Calculate overall risk score
   */
  private static calculateOverallRiskScore(
    anomaly: AnomalyDetectionResult,
    fraud: FraudIndicators,
    warnings: PredictiveWarning[]
  ): number {
    let riskScore = 0;

    // 40% weight on anomaly score
    riskScore += anomaly.anomalyScore * 0.4;

    // 40% weight on fraud score
    riskScore += fraud.fraudScore * 0.4;

    // 20% weight on warnings severity
    const warningScore =
      warnings.filter((w) => w.severity === AlertSeverity.CRITICAL).length *
      20;
    riskScore += Math.min(warningScore, 100) * 0.2;

    return Math.min(riskScore, 100);
  }

  /**
   * Calculate confidence in validation result
   */
  private static calculateConfidence(
    _userId: string,
    _transactionData: Record<string, any>,
    walletData: Record<string, any>
  ): number {
    let confidence = 50;

    // More data = higher confidence
    if (walletData.totalTransactions > 100) confidence += 20;
    else if (walletData.totalTransactions > 10) confidence += 10;

    // Consistent success = higher confidence
    if (walletData.successRate > 90) confidence += 15;

    // Lower confidence for new wallets
    if (walletData.ageInDays < 7) confidence -= 20;

    return Math.min(Math.max(confidence, 0), 100);
  }

  /**
   * Estimate transaction outcome
   */
  private static estimateOutcome(
    riskScore: number,
    anomaly: AnomalyDetectionResult,
    fraud: FraudIndicators
  ): 'SUCCESS' | 'WARNING' | 'FAILURE' {
    if (fraud.isSuspicious || riskScore > 80) {
      return 'FAILURE';
    }
    if (anomaly.anomalyScore > 50 || riskScore > 60) {
      return 'WARNING';
    }
    return 'SUCCESS';
  }

  /**
   * Update system health metrics
   */
  static updateSystemMetrics(metrics: Partial<SystemHealthMetrics>): void {
    this.systemMetrics = {
      ...this.systemMetrics,
      ...metrics,
      lastHealthCheck: Date.now(),
    };
  }

  /**
   * Get current system health
   */
  static getSystemHealth(): SystemHealthMetrics {
    return { ...this.systemMetrics };
  }

  /**
   * Update user behavior profile
   */
  static updateUserProfile(
    userId: string,
    updates: Partial<UserBehaviorProfile>
  ): void {
    const profile = this.getOrCreateUserProfile(userId);
    Object.assign(profile, {
      ...updates,
      lastProfileUpdate: Date.now(),
    });
  }
}

export default AIValidationEngine;
