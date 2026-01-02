import { Injectable, Logger } from '@nestjs/common';
import { MLServiceClient, CreditScoreRequest } from './ml-service.client';
import { DecimalUtil } from '../../common/utils/decimal.util';
import Decimal from 'decimal.js';

@Injectable()
export class MLService {
  private readonly logger = new Logger(MLService.name);

  constructor(private readonly mlClient: MLServiceClient) {}

  async assessCreditRisk(params: {
    userId: string;
    loanAmount: string;
    loanTermMonths: number;
    collateralAmount: string;
    collateralType: string;
    userProfile?: any;
  }) {
    try {
      const request: CreditScoreRequest = {
        applicant_id: params.userId,
        loan_amount: parseFloat(params.loanAmount),
        loan_term_months: params.loanTermMonths,
        collateral_amount: parseFloat(params.collateralAmount),
        collateral_type: params.collateralType,
        age: params.userProfile?.age,
        annual_income: params.userProfile?.annual_income,
        credit_score: params.userProfile?.credit_score,
        total_portfolio_value: params.userProfile?.portfolio_value,
      };

      const response = await this.mlClient.getCreditScore(request);

      // Calculate adjusted interest rate based on ML prediction
      const baseRate = 5.0; // Base rate from config
      const adjustedRate = response.interest_rate;

      return {
        creditScore: response.credit_score,
        defaultProbability: response.default_probability,
        riskLevel: response.risk_level,
        recommendedAction: response.recommended_action,
        interestRate: adjustedRate,
        confidenceInterval: response.confidence_interval,
        explanation: response.explanation,
        featureImportance: response.feature_importance,
        modelVersion: response.model_version,
        inferenceTimeMs: response.inference_time_ms,
      };
    } catch (error) {
      this.logger.error(`Credit risk assessment failed: ${error.message}`, error.stack);
      
      // Fallback to rule-based assessment
      return this.fallbackRiskAssessment(params);
    }
  }

  private fallbackRiskAssessment(params: any) {
    this.logger.warn('Using fallback risk assessment');

    const loanAmount = DecimalUtil.fromString(params.loanAmount);
    const collateralAmount = DecimalUtil.fromString(params.collateralAmount);
    const ltv = DecimalUtil.divide(loanAmount, collateralAmount).times(100);

    let riskLevel = 'MEDIUM';
    let interestRate = 8.0;

    if (DecimalUtil.lessThan(ltv, new Decimal(50))) {
      riskLevel = 'LOW';
      interestRate = 6.0;
    } else if (DecimalUtil.greaterThan(ltv, new Decimal(80))) {
      riskLevel = 'HIGH';
      interestRate = 12.0;
    }

    return {
      creditScore: 650,
      defaultProbability: 0.15,
      riskLevel,
      recommendedAction: riskLevel === 'HIGH' ? 'MANUAL_REVIEW' : 'APPROVE',
      interestRate,
      confidenceInterval: { lower: 0.10, upper: 0.20 },
      explanation: 'Fallback assessment based on LTV ratio',
      featureImportance: {},
      modelVersion: 'fallback',
      inferenceTimeMs: 0,
    };
  }

  async getModelStatus() {
    try {
      const healthy = await this.mlClient.healthCheck();
      const info = healthy ? await this.mlClient.getModelInfo() : null;

      return {
        healthy,
        info,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
