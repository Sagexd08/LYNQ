import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RiskService } from '../risk/risk.service';
import { CollateralService } from '../collateral/collateral.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { RepayLoanDto } from './dto/repay-loan.dto';

@Injectable()
export class LoansService {
    private readonly logger = new Logger(LoansService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly riskService: RiskService,
        private readonly collateralService: CollateralService,
    ) { }

    async createLoan(userId: string, dto: CreateLoanDto) {
        const profile = await this.prisma.profile.findUnique({
            where: { id: userId },
            include: {
                loans: {
                    where: { status: 'ACTIVE' },
                },
            },
        });

        if (!profile) {
            throw new NotFoundException('Profile not found');
        }

        if (profile.isBlocked) {
            throw new BadRequestException('User is blocked from creating loans');
        }

        if (profile.loans.length > 0) {
            throw new BadRequestException('User already has an active loan');
        }

        const riskEvaluation = await this.riskService.evaluateLoanRisk({
            walletAddress: profile.walletAddress,
            walletAgeDays: dto.walletAgeDays || 30,
            totalTransactions: dto.totalTransactions || 10,
            totalVolumeUsd: dto.totalVolumeUsd || 1000,
            defiInteractions: dto.defiInteractions || 5,
            loanAmount: dto.amount,
            collateralValueUsd: dto.collateralValueUsd || 0,
            termMonths: dto.termMonths,
        });

        if (riskEvaluation.recommendedAction === 'REJECT') {
            throw new BadRequestException(
                `Loan rejected due to high risk. Credit score: ${riskEvaluation.creditScore}`,
            );
        }

        if (dto.amount > riskEvaluation.maxLoanAmount) {
            throw new BadRequestException(
                `Loan amount exceeds maximum allowed ($${riskEvaluation.maxLoanAmount.toFixed(2)})`,
            );
        }

        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + dto.termMonths);

        const loan = await this.prisma.loan.create({
            data: {
                userId,
                amount: dto.amount,
                interestRate: riskEvaluation.interestRate,
                termMonths: dto.termMonths,
                status: 'PENDING',
                riskLevel: riskEvaluation.riskLevel,
                defaultProbability: riskEvaluation.defaultProbability,
                recommendedAction: riskEvaluation.recommendedAction,
                dueDate,
            },
        });

        await this.riskService.saveRiskAssessment(loan.id, riskEvaluation);

        this.logger.log(
            `Loan created: ${loan.id} for user ${userId}, amount: ${dto.amount}, risk: ${riskEvaluation.riskLevel}`,
        );

        return {
            ...loan,
            riskAssessment: {
                creditScore: riskEvaluation.creditScore,
                riskLevel: riskEvaluation.riskLevel,
                interestRate: riskEvaluation.interestRate,
                maxLoanAmount: riskEvaluation.maxLoanAmount,
                recommendedAction: riskEvaluation.recommendedAction,
            },
        };
    }

    async activateLoan(loanId: string, collateralData?: {
        tokenAddress: string;
        tokenSymbol: string;
        amount: number;
        chainId: number;
        txHash?: string;
    }) {
        const loan = await this.prisma.loan.findUnique({
            where: { id: loanId },
        });

        if (!loan) {
            throw new NotFoundException('Loan not found');
        }

        if (loan.status !== 'PENDING') {
            throw new BadRequestException('Only pending loans can be activated');
        }

        if (collateralData) {
            await this.collateralService.lockCollateral({
                loanId,
                ...collateralData,
            });
        }

        const updatedLoan = await this.prisma.loan.update({
            where: { id: loanId },
            data: { status: 'ACTIVE' },
            include: { collaterals: true },
        });

        await this.prisma.profile.update({
            where: { id: loan.userId },
            data: {
                totalLoans: { increment: 1 },
                totalBorrowed: { increment: loan.amount },
            },
        });

        this.logger.log(`Loan activated: ${loanId}`);

        return updatedLoan;
    }

    async repayLoan(loanId: string, dto: RepayLoanDto) {
        const loan = await this.prisma.loan.findUnique({
            where: { id: loanId },
            include: { profile: true },
        });

        if (!loan) {
            throw new NotFoundException('Loan not found');
        }

        if (loan.status !== 'ACTIVE') {
            throw new BadRequestException('Only active loans can be repaid');
        }

        const totalOwed = loan.amount * (1 + loan.interestRate / 100);
        const remaining = totalOwed - loan.amountRepaid;
        const paymentAmount = Math.min(dto.amount, remaining);

        await this.prisma.repayment.create({
            data: {
                loanId,
                amount: paymentAmount,
                onChainTxHash: dto.txHash,
            },
        });

        const newAmountRepaid = loan.amountRepaid + paymentAmount;
        const isFullyRepaid = newAmountRepaid >= totalOwed;

        const updatedLoan = await this.prisma.loan.update({
            where: { id: loanId },
            data: {
                amountRepaid: newAmountRepaid,
                status: isFullyRepaid ? 'REPAID' : 'ACTIVE',
                repaidAt: isFullyRepaid ? new Date() : null,
            },
        });

        if (isFullyRepaid) {
            await this.prisma.profile.update({
                where: { id: loan.userId },
                data: {
                    successfulLoans: { increment: 1 },
                    totalRepaid: { increment: newAmountRepaid },
                    reputationScore: { increment: 5 },
                },
            });

            await this.collateralService.unlockCollateral({ loanId });

            this.logger.log(`Loan fully repaid: ${loanId}`);
        }

        return {
            ...updatedLoan,
            paymentAmount,
            totalOwed,
            remainingBalance: totalOwed - newAmountRepaid,
            isFullyRepaid,
        };
    }

    async markDefaulted(loanId: string) {
        const loan = await this.prisma.loan.findUnique({
            where: { id: loanId },
        });

        if (!loan) {
            throw new NotFoundException('Loan not found');
        }

        if (loan.status !== 'ACTIVE') {
            throw new BadRequestException('Only active loans can be marked as defaulted');
        }

        const now = new Date();
        if (loan.dueDate && loan.dueDate > now) {
            throw new BadRequestException('Loan is not overdue yet');
        }

        const updatedLoan = await this.prisma.loan.update({
            where: { id: loanId },
            data: {
                status: 'DEFAULTED',
                defaultedAt: now,
            },
        });

        await this.prisma.profile.update({
            where: { id: loan.userId },
            data: {
                defaultedLoans: { increment: 1 },
                reputationScore: { decrement: 20 },
            },
        });

        await this.collateralService.seizeCollateral(loanId);

        this.logger.log(`Loan defaulted: ${loanId}`);

        return updatedLoan;
    }

    async findOne(id: string) {
        const loan = await this.prisma.loan.findUnique({
            where: { id },
            include: {
                profile: true,
                collaterals: true,
                riskAssessment: true,
                repayments: true,
            },
        });

        if (!loan) {
            throw new NotFoundException('Loan not found');
        }

        return loan;
    }

    async findByUser(userId: string) {
        return this.prisma.loan.findMany({
            where: { userId },
            include: {
                collaterals: true,
                riskAssessment: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findAll(options?: { status?: string; limit?: number; offset?: number }) {
        const { status, limit = 20, offset = 0 } = options || {};

        const where = status ? { status: status as any } : {};

        const [loans, total] = await Promise.all([
            this.prisma.loan.findMany({
                where,
                include: {
                    profile: {
                        select: {
                            walletAddress: true,
                            tier: true,
                            reputationScore: true,
                        },
                    },
                    riskAssessment: true,
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.loan.count({ where }),
        ]);

        return {
            data: loans,
            total,
            limit,
            offset,
        };
    }
}
