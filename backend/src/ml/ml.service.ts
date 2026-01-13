import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, timeout, catchError, retry } from 'rxjs';
import { MlAssessmentRequestDto, MlAssessmentResponseDto } from './dto';

export enum RiskLevel {
    VERY_LOW = 'VERY_LOW',
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    VERY_HIGH = 'VERY_HIGH',
}

export enum RecommendedAction {
    APPROVE = 'APPROVE',
    APPROVE_WITH_CONDITIONS = 'APPROVE_WITH_CONDITIONS',
    MANUAL_REVIEW = 'MANUAL_REVIEW',
    REJECT = 'REJECT',
}

@Injectable()
export class MlService {
    private readonly logger = new Logger(MlService.name);
    private circuitBreakerOpen = false;
    private failureCount = 0;
    private lastFailureTime = 0;
    private readonly FAILURE_THRESHOLD = 5;
    private readonly RECOVERY_TIME_MS = 60000;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) { }

    async assessCreditRisk(request: MlAssessmentRequestDto): Promise<MlAssessmentResponseDto> {
        if (this.isCircuitBreakerOpen()) {
            this.logger.warn('Circuit breaker is open, using fallback');
            return this.fallbackAssessment(request);
        }

        try {
            const response = await firstValueFrom(
                this.httpService.post<MlAssessmentResponseDto>('/api/ml/credit-score', {
                    wallet_address: request.walletAddress,
                    wallet_age_days: request.walletAgeDays,
                    total_transactions: request.totalTransactions,
                    total_volume_usd: request.totalVolumeUsd,
                    defi_interactions: request.defiInteractions,
                    loan_amount: request.loanAmount,
                    collateral_value_usd: request.collateralValueUsd,
                    term_months: request.termMonths,
                    previous_loans: request.previousLoans,
                    successful_repayments: request.successfulRepayments,
                    defaults: request.defaults,
                    reputation_score: request.reputationScore,
                }).pipe(
                    timeout(10000),
                    retry({ count: 2, delay: 1000 }),
                    catchError((error) => {
                        this.recordFailure();
                        throw error;
                    }),
                ),
            );

            this.resetCircuitBreaker();
            return this.transformResponse(response.data);
        } catch (error) {
            this.logger.error(`ML service call failed: ${error.message}`);
            return this.fallbackAssessment(request);
        }
    }

    private isCircuitBreakerOpen(): boolean {
        if (!this.circuitBreakerOpen) return false;

        const timeSinceLastFailure = Date.now() - this.lastFailureTime;
        if (timeSinceLastFailure >= this.RECOVERY_TIME_MS) {
            this.logger.log('Circuit breaker half-open, allowing test request');
            return false;
        }
        return true;
    }

    private recordFailure(): void {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        if (this.failureCount >= this.FAILURE_THRESHOLD) {
            this.circuitBreakerOpen = true;
            this.logger.warn('Circuit breaker opened due to repeated failures');
        }
    }

    private resetCircuitBreaker(): void {
        this.failureCount = 0;
        this.circuitBreakerOpen = false;
    }

    private transformResponse(data: any): MlAssessmentResponseDto {
        return {
            creditScore: data.credit_score,
            fraudScore: data.fraud_score,
            anomalyScore: data.anomaly_score,
            riskLevel: data.risk_level as RiskLevel,
            defaultProbability: data.default_probability,
            recommendedAction: data.recommended_action as RecommendedAction,
            interestRateSuggestion: data.interest_rate_suggestion,
            maxLoanAmount: data.max_loan_amount,
            confidenceScore: data.confidence_score,
            topFactors: data.top_factors?.map((f: any) => ({
                feature: f.feature,
                impact: f.impact,
                value: f.value,
                contribution: f.contribution,
            })),
            modelVersion: data.model_version,
            processingTimeMs: data.processing_time_ms,
            isFallback: data.is_fallback,
        };
    }

    fallbackAssessment(request: MlAssessmentRequestDto): MlAssessmentResponseDto {
        this.logger.log('Using fallback rule-based assessment');

        const collateralRatio = request.collateralValueUsd / request.loanAmount;
        let score = 500;

        if (request.walletAgeDays >= 365) score += 150;
        else if (request.walletAgeDays >= 180) score += 100;
        else if (request.walletAgeDays >= 90) score += 50;
        else if (request.walletAgeDays < 30) score -= 50;

        if (request.reputationScore >= 80) score += 150;
        else if (request.reputationScore >= 60) score += 75;
        else if (request.reputationScore < 40) score -= 100;

        if (collateralRatio >= 2.0) score += 100;
        else if (collateralRatio >= 1.5) score += 75;
        else if (collateralRatio >= 1.0) score += 25;
        else score -= 100;

        if (request.previousLoans > 0 && request.defaults === 0) {
            score += 50 * Math.min(request.successfulRepayments, 3);
        }
        score -= request.defaults * 150;

        score = Math.max(100, Math.min(1000, score));

        let riskLevel: RiskLevel;
        let defaultProbability: number;
        let interestRate: number;

        if (score >= 800) {
            riskLevel = RiskLevel.VERY_LOW;
            defaultProbability = 0.02;
            interestRate = 5.0;
        } else if (score >= 700) {
            riskLevel = RiskLevel.LOW;
            defaultProbability = 0.05;
            interestRate = 7.5;
        } else if (score >= 600) {
            riskLevel = RiskLevel.MEDIUM;
            defaultProbability = 0.12;
            interestRate = 10.0;
        } else if (score >= 500) {
            riskLevel = RiskLevel.HIGH;
            defaultProbability = 0.22;
            interestRate = 15.0;
        } else {
            riskLevel = RiskLevel.VERY_HIGH;
            defaultProbability = 0.40;
            interestRate = 20.0;
        }

        let fraudScore = 0;
        if (request.walletAgeDays < 7) fraudScore += 0.5;
        if (request.totalTransactions < 3) fraudScore += 0.3;
        if (request.defaults > 2) fraudScore += 0.4;
        fraudScore = Math.min(fraudScore, 1.0);

        let recommendedAction: RecommendedAction;
        if (fraudScore > 0.7 || request.defaults >= 2) {
            recommendedAction = RecommendedAction.REJECT;
        } else if (fraudScore > 0.4 || riskLevel === RiskLevel.VERY_HIGH) {
            recommendedAction = RecommendedAction.MANUAL_REVIEW;
        } else if (riskLevel === RiskLevel.HIGH || riskLevel === RiskLevel.MEDIUM) {
            recommendedAction = RecommendedAction.APPROVE_WITH_CONDITIONS;
        } else {
            recommendedAction = RecommendedAction.APPROVE;
        }

        let maxLoan = request.collateralValueUsd * 0.75;
        if (riskLevel === RiskLevel.VERY_HIGH) maxLoan *= 0.25;
        else if (riskLevel === RiskLevel.HIGH) maxLoan *= 0.5;
        else if (riskLevel === RiskLevel.MEDIUM) maxLoan *= 0.75;

        return {
            creditScore: score,
            fraudScore,
            anomalyScore: 0.1,
            riskLevel,
            defaultProbability,
            recommendedAction,
            interestRateSuggestion: interestRate,
            maxLoanAmount: maxLoan,
            modelVersion: 'fallback-v1.0',
            isFallback: true,
        };
    }
}
