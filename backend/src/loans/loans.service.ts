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
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                loans: {
                    where: { status: 'ACTIVE' },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Check if user is blocked (stored in metadata)
        const metadata = (user.metadata as any) || {};
        if (metadata.isBlocked) {
            throw new BadRequestException('User is blocked from creating loans');
        }

        if (user.loans.length > 0) {
            throw new BadRequestException('User already has an active loan');
        }

        // Get wallet address from JSONB array
        const walletAddresses = (user.walletAddresses as string[]) || [];
        const walletAddress = walletAddresses[0] || '';

        const riskEvaluation = await this.riskService.evaluateLoanRisk({
            walletAddress: walletAddress,
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

        // Calculate duration days from term months
        const durationDays = dto.termMonths * 30;
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + dto.termMonths);

        const loan = await this.prisma.loan.create({
            data: {
                userId,
                amount: dto.amount,
                outstandingAmount: dto.amount,
                chain: dto.chain || 'ethereum',
                collateralTokenAddress: dto.collateralTokenAddress || '0x0',
                collateralAmount: dto.collateralValueUsd || 0,
                interestRate: riskEvaluation.interestRate,
                durationDays,
                status: 'PENDING',
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

        // Update user metadata with loan stats
        const user = await this.prisma.user.findUnique({ where: { id: loan.userId } });
        const userMetadata = (user?.metadata as any) || {};
        userMetadata.totalLoans = (userMetadata.totalLoans || 0) + 1;
        userMetadata.totalBorrowed = (userMetadata.totalBorrowed || 0) + Number(loan.amount);
        
        await this.prisma.user.update({
            where: { id: loan.userId },
            data: { metadata: userMetadata },
        });

        this.logger.log(`Loan activated: ${loanId}`);

        return updatedLoan;
    }

    async repayLoan(loanId: string, dto: RepayLoanDto) {
        const loan = await this.prisma.loan.findUnique({
            where: { id: loanId },
            include: { user: true },
        });

        if (!loan) {
            throw new NotFoundException('Loan not found');
        }

        if (loan.status !== 'ACTIVE') {
            throw new BadRequestException('Only active loans can be repaid');
        }

        const totalOwed = Number(loan.amount) * (1 + Number(loan.interestRate) / 100);
        const amountRepaid = Number(loan.outstandingAmount) - Number(loan.amount);
        const remaining = totalOwed - amountRepaid;
        const paymentAmount = Math.min(dto.amount, remaining);

        await this.prisma.repayment.create({
            data: {
                loanId,
                amount: paymentAmount,
                onChainTxHash: dto.txHash,
            },
        });

        const newOutstanding = Number(loan.outstandingAmount) - paymentAmount;
        const isFullyRepaid = newOutstanding <= 0;

        const updatedLoan = await this.prisma.loan.update({
            where: { id: loanId },
            data: {
                outstandingAmount: Math.max(0, newOutstanding),
                status: isFullyRepaid ? 'REPAID' : 'ACTIVE',
                repaidDate: isFullyRepaid ? new Date() : null,
            },
        });

        if (isFullyRepaid) {
            // Update user metadata
            const user = await this.prisma.user.findUnique({ where: { id: loan.userId } });
            const userMetadata = (user?.metadata as any) || {};
            userMetadata.successfulLoans = (userMetadata.successfulLoans || 0) + 1;
            userMetadata.totalRepaid = (userMetadata.totalRepaid || 0) + paymentAmount;
            
            await this.prisma.user.update({
                where: { id: loan.userId },
                data: {
                    metadata: userMetadata,
                    reputationPoints: { increment: 5 },
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

        // Update user metadata
        const user = await this.prisma.user.findUnique({ where: { id: loan.userId } });
        const userMetadata = (user?.metadata as any) || {};
        userMetadata.defaultedLoans = (userMetadata.defaultedLoans || 0) + 1;
        
        await this.prisma.user.update({
            where: { id: loan.userId },
            data: {
                metadata: userMetadata,
                reputationPoints: { decrement: 20 },
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
                user: true,
                riskAssessments: true,
                mlTrainingData: true,
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
                riskAssessments: true,
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
                    user: {
                        select: {
                            walletAddresses: true,
                            reputationTier: true,
                            reputationPoints: true,
                        },
                    },
                    riskAssessments: true,
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