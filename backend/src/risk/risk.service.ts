import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MlService, RiskLevel, RecommendedAction } from '../ml/ml.service';
import { RiskEvaluationDto } from './dto/risk-evaluation.dto';
import { MlAssessmentResponseDto } from '../ml/dto';

export interface FraudCheckResult {
    isSuspicious: boolean;
    fraudScore: number;
    reasons: string[];
}

export interface RiskEvaluationResult {
    creditScore: number;
    fraudScore: number;
    anomalyScore: number;
    riskLevel: RiskLevel;
    defaultProbability: number;
    recommendedAction: RecommendedAction;
    interestRate: number;
    maxLoanAmount: number;
    fraudCheckResult: FraudCheckResult;
    isFallback: boolean;
    mlModelVersion?: string;
    topFactors?: any[];
}

@Injectable()
export class RiskService {
    private readonly logger = new Logger(RiskService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly mlService: MlService,
    ) { }

    async evaluateLoanRisk(dto: RiskEvaluationDto): Promise<RiskEvaluationResult> {
        // Find user by wallet address in JSONB array using raw SQL
        const userRows = await this.prisma.$queryRaw<Array<{ id: string }>>`
            SELECT id FROM users 
            WHERE "walletAddresses" @> ${JSON.stringify([dto.walletAddress.toLowerCase()])}::jsonb
            LIMIT 1
        `;
        
        if (userRows.length === 0) {
            throw new NotFoundException('User not found');
        }
        
        const user = await this.prisma.user.findUnique({
            where: { id: userRows[0].id },
            include: {
                loans: {
                    select: {
                        status: true,
                        amount: true,
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const metadata = (user.metadata as any) || {};
        const totalLoans = metadata.totalLoans || 0;
        const defaultedLoans = metadata.defaultedLoans || 0;

        const fraudCheck = this.performFraudChecks({
            walletAgeDays: dto.walletAgeDays,
            totalTransactions: dto.totalTransactions,
            totalVolumeUsd: dto.totalVolumeUsd,
            loanAmount: dto.loanAmount,
            previousLoans: totalLoans,
            defaults: defaultedLoans,
        });

        const mlAssessment = await this.mlService.assessCreditRisk({
            walletAddress: dto.walletAddress,
            walletAgeDays: dto.walletAgeDays,
            totalTransactions: dto.totalTransactions,
            totalVolumeUsd: dto.totalVolumeUsd,
            defiInteractions: dto.defiInteractions,
            loanAmount: dto.loanAmount,
            collateralValueUsd: dto.collateralValueUsd,
            termMonths: dto.termMonths,
            previousLoans: totalLoans,
            successfulRepayments: metadata.successfulLoans || 0,
            defaults: defaultedLoans,
            reputationScore: user.reputationPoints,
        });

        const finalRiskLevel = this.determineFinalRiskLevel(mlAssessment, fraudCheck);
        const finalAction = this.determineFinalAction(mlAssessment, fraudCheck);
        const interestRate = this.calculateInterestRate(finalRiskLevel, fraudCheck);

        return {
            creditScore: mlAssessment.creditScore,
            fraudScore: Math.max(mlAssessment.fraudScore, fraudCheck.fraudScore),
            anomalyScore: mlAssessment.anomalyScore,
            riskLevel: finalRiskLevel,
            defaultProbability: mlAssessment.defaultProbability,
            recommendedAction: finalAction,
            interestRate,
            maxLoanAmount: mlAssessment.maxLoanAmount,
            fraudCheckResult: fraudCheck,
            isFallback: mlAssessment.isFallback,
            mlModelVersion: mlAssessment.modelVersion,
            topFactors: mlAssessment.topFactors,
        };
    }

    async saveRiskAssessment(loanId: string, evaluation: RiskEvaluationResult): Promise<void> {
        await this.prisma.loanRiskAssessment.create({
            data: {
                loanId,
                riskLevel: evaluation.riskLevel,
                defaultProbability: evaluation.defaultProbability,
                recommendation: evaluation.recommendedAction,
                assessedAt: new Date(),
            },
        });
    }

    async getRiskAssessment(loanId: string) {
        const assessment = await this.prisma.loanRiskAssessment.findFirst({
            where: { loanId },
            include: { loan: true },
        });

        if (!assessment) {
            throw new NotFoundException('Risk assessment not found');
        }

        return assessment;
    }

    private performFraudChecks(data: {
        walletAgeDays: number;
        totalTransactions: number;
        totalVolumeUsd: number;
        loanAmount: number;
        previousLoans: number;
        defaults: number;
    }): FraudCheckResult {
        const reasons: string[] = [];
        let fraudScore = 0;

        if (data.walletAgeDays < 7) {
            reasons.push('Wallet created less than 7 days ago');
            fraudScore += 0.4;
        } else if (data.walletAgeDays < 30) {
            reasons.push('Wallet created less than 30 days ago');
            fraudScore += 0.2;
        }

        if (data.totalTransactions < 5) {
            reasons.push('Very low transaction count');
            fraudScore += 0.3;
        }

        if (data.defaults > 0) {
            reasons.push(`User has ${data.defaults} default(s) on record`);
            fraudScore += data.defaults * 0.15;
        }

        if (data.totalTransactions > 0) {
            const avgTxValue = data.totalVolumeUsd / data.totalTransactions;
            if (data.loanAmount > avgTxValue * 20) {
                reasons.push('Loan amount significantly exceeds typical transaction size');
                fraudScore += 0.25;
            }
        }

        if (data.walletAgeDays < 30 && data.loanAmount > 1000) {
            reasons.push('New wallet requesting substantial loan');
            fraudScore += 0.2;
        }

        fraudScore = Math.min(fraudScore, 1.0);

        return {
            isSuspicious: fraudScore > 0.5,
            fraudScore,
            reasons,
        };
    }

    private determineFinalRiskLevel(
        mlAssessment: MlAssessmentResponseDto,
        fraudCheck: FraudCheckResult,
    ): RiskLevel {
        const mlRiskLevel = mlAssessment.riskLevel as RiskLevel;

        if (fraudCheck.isSuspicious || fraudCheck.fraudScore > 0.6) {
            if (mlRiskLevel === RiskLevel.VERY_LOW || mlRiskLevel === RiskLevel.LOW) {
                return RiskLevel.MEDIUM;
            }
            if (mlRiskLevel === RiskLevel.MEDIUM) {
                return RiskLevel.HIGH;
            }
            return RiskLevel.VERY_HIGH;
        }

        return mlRiskLevel;
    }

    private determineFinalAction(
        mlAssessment: MlAssessmentResponseDto,
        fraudCheck: FraudCheckResult,
    ): RecommendedAction {
        if (fraudCheck.fraudScore > 0.7) {
            return RecommendedAction.REJECT;
        }

        if (fraudCheck.isSuspicious) {
            return RecommendedAction.MANUAL_REVIEW;
        }

        return mlAssessment.recommendedAction as RecommendedAction;
    }

    private calculateInterestRate(riskLevel: RiskLevel, fraudCheck: FraudCheckResult): number {
        const baseRates: Record<RiskLevel, number> = {
            [RiskLevel.VERY_LOW]: 5.0,
            [RiskLevel.LOW]: 7.5,
            [RiskLevel.MEDIUM]: 10.0,
            [RiskLevel.HIGH]: 15.0,
            [RiskLevel.VERY_HIGH]: 20.0,
        };

        let rate = baseRates[riskLevel];

        if (fraudCheck.isSuspicious) {
            rate += 2.5;
        }

        return Math.min(rate, 25.0);
    }
}
