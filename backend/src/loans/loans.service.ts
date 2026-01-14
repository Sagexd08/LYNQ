import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { RiskService } from '../risk/risk.service';
import { CollateralService } from '../collateral/collateral.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { RepayLoanDto } from './dto/repay-loan.dto';
import { ethers } from 'ethers';
import { QUEUE_NAMES } from '../queues/queues.module';

@Injectable()
export class LoansService {
    private readonly logger = new Logger(LoansService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly riskService: RiskService,
        private readonly collateralService: CollateralService,
        private readonly blockchainService: BlockchainService,
        @InjectQueue(QUEUE_NAMES.BLOCKCHAIN_SYNC)
        private readonly blockchainSyncQueue: Queue,
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

        const metadata = (user.metadata as any) || {};
        if (metadata.isBlocked) {
            throw new BadRequestException('User is blocked from creating loans');
        }

        if (user.loans.length > 0) {
            throw new BadRequestException('User already has an active loan');
        }

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
                onChainLoanId: null,
                transactionHash: null,
                riskLevel: riskEvaluation.riskLevel,
                metadata: {
                    onChainSync: {
                        status: 'QUEUED',
                        queuedAt: new Date().toISOString(),
                    },
                },
            },
        });

        const amountInWei = ethers.parseEther(dto.amount.toString());
        const collateralAmountWei = ethers.parseEther((dto.collateralValueUsd || 0).toString());
        const interestRateBps = Math.round(riskEvaluation.interestRate * 100);

        if (!this.blockchainService.isBlockchainConnected()) {
            this.logger.error('Blockchain not connected. Job will fail fast');
        }

        await this.blockchainSyncQueue.add('create-loan', {
            loanId: loan.id,
            amountWei: amountInWei.toString(),
            collateralAmountWei: collateralAmountWei.toString(),
            collateralToken: dto.collateralTokenAddress || '0x0',
            interestRateBps,
            durationDays,
        });

        await this.riskService.saveRiskAssessment(loan.id, riskEvaluation);

        this.logger.log(
            `Loan created: ${loan.id} for user ${userId}, amount: ${dto.amount}, risk: ${riskEvaluation.riskLevel}, onChain sync queued`,
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
            isOnChain: false,
            onChainSyncStatus: 'QUEUED',
        };
    }

    async activateLoan(loanId: string, collateralData: {
        tokenAddress: string;
        tokenSymbol: string;
        amount: string | number;
        chainId: number;
        txHash: string; // Make txHash required
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

        // Convert amount to number if it's a string
        const collateralAmount = typeof collateralData.amount === 'string' 
            ? parseFloat(collateralData.amount) 
            : collateralData.amount;

        if (isNaN(collateralAmount) || collateralAmount <= 0) {
            throw new BadRequestException('Invalid collateral amount');
        }

        // CRITICAL: Verify collateral transaction on-chain before activating
        if (this.blockchainService.isBlockchainConnected()) {
            // Ensure loan has on-chain ID before verification
            if (!loan.onChainLoanId) {
                throw new BadRequestException('Loan does not have an on-chain ID. Cannot verify collateral deposit.');
            }

            try {
                // Verify the collateral lock transaction actually happened
                const isVerified = await this.blockchainService.verifyCollateralDeposit(
                    collateralData.txHash,
                    loan.onChainLoanId,
                    collateralData.tokenAddress,
                    collateralAmount,
                );

                if (!isVerified) {
                    throw new BadRequestException('Collateral deposit not verified on-chain');
                }

                this.logger.log(`Collateral verified on-chain for loan ${loanId}, tx: ${collateralData.txHash}`);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logger.error(`Collateral verification failed: ${errorMessage}`);
                throw new BadRequestException(`Collateral verification failed: ${errorMessage}`);
            }
        } else {
            // For MVP on testnet, require blockchain connection
            throw new BadRequestException('Blockchain connection required for loan activation');
        }

        let activationTxHash: string | null = null;
        let collateralLocked = false;
        
        try {
            await this.collateralService.lockCollateral({
                loanId,
                tokenAddress: collateralData.tokenAddress,
                tokenSymbol: collateralData.tokenSymbol,
                amount: collateralAmount,
                chainId: collateralData.chainId,
                txHash: collateralData.txHash,
            }, loan.userId);
            collateralLocked = true;

            // Activate loan on-chain
            if (loan.onChainLoanId) {
                activationTxHash = await this.blockchainService.activateLoanOnChain(loan.onChainLoanId);
                this.logger.log(`Loan activated on-chain: ${loan.onChainLoanId}, tx: ${activationTxHash}`);
            }
        } catch (error) {
            // If activation fails, unlock collateral to maintain consistency
            if (collateralLocked) {
                try {
                    await this.collateralService.unlockCollateral({ loanId }, loan.userId);
                    this.logger.warn(`Collateral unlocked due to activation failure for loan ${loanId}`);
                } catch (unlockError) {
                    const unlockErrorMessage = unlockError instanceof Error ? unlockError.message : String(unlockError);
                    this.logger.error(
                        `CRITICAL: Failed to unlock collateral after activation failure for loan ${loanId}: ${unlockErrorMessage}. ` +
                        `Manual intervention required - collateral is locked but loan activation failed.`
                    );
                    // Throw a specific error that indicates collateral is stuck
                    const activationErrorMessage = error instanceof Error ? error.message : String(error);
                    throw new BadRequestException(
                        `Loan activation failed and collateral unlock also failed. ` +
                        `Loan ID: ${loanId}. Activation error: ${activationErrorMessage}. ` +
                        `Unlock error: ${unlockErrorMessage}. Manual intervention required.`
                    );
                }
            }
            
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Loan activation failed for ${loanId}: ${errorMessage}`);
            throw error;
        }

        const updatedLoan = await this.prisma.loan.update({
            where: { id: loanId },
            data: {
                status: 'ACTIVE',
                startDate: new Date(),
                collateralTokenAddress: collateralData.tokenAddress,
                collateralAmount: collateralAmount,
                transactionHash: activationTxHash || loan.transactionHash,
            },
        });

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

        let onChainVerified = false;
        if (loan.onChainLoanId && dto.txHash) {
            if (!this.blockchainService.isBlockchainConnected()) {
                throw new BadRequestException('Blockchain connection required for on-chain loan repayment');
            }

            try {
                onChainVerified = await this.blockchainService.verifyRepayment(
                    dto.txHash,
                    loan.onChainLoanId,
                    dto.amount,
                );

                if (!onChainVerified) {
                    throw new BadRequestException('Repayment transaction not verified on-chain');
                }

                this.logger.log(`Repayment verified on-chain: ${dto.txHash}`);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logger.error(`Repayment verification failed: ${errorMessage}`);
                throw new BadRequestException(`Repayment verification failed: ${errorMessage}`);
            }
        } else if (loan.onChainLoanId && !dto.txHash) {
            throw new BadRequestException('Transaction hash required for on-chain loan repayment');
        }

        const totalOwed = Number(loan.amount) * (1 + Number(loan.interestRate) / 100);
        const amountRepaid = Number(loan.amount) - Number(loan.outstandingAmount);
        if (amountRepaid < 0 || amountRepaid > Number(loan.amount)) {
            this.logger.error(
                `Invalid amountRepaid calculation for loan ${loanId}: ` +
                `amount=${loan.amount}, outstandingAmount=${loan.outstandingAmount}, amountRepaid=${amountRepaid}`
            );
            throw new BadRequestException('Invalid loan state: outstanding amount calculation error');
        }
        
        const remaining = totalOwed - amountRepaid;
        const paymentAmount = Math.min(dto.amount, remaining);

        await this.prisma.repayments.create({
            data: {
                loanId,
                amount: paymentAmount,
                transactionHash: dto.txHash,
                userId: loan.userId,
            },
        });

        const newOutstanding = Number(loan.outstandingAmount) - paymentAmount;
        const isFullyRepaid = newOutstanding <= 0;

        // If fully repaid, unlock collateral on-chain
        if (isFullyRepaid && loan.onChainLoanId && this.blockchainService.isBlockchainConnected()) {
            try {
                await this.blockchainService.unlockCollateralOnChain(loan.onChainLoanId);
                this.logger.log(`Collateral unlocked on-chain for loan ${loanId}`);
            } catch (error) {
                this.logger.error(`Failed to unlock collateral on-chain: ${error.message}`);
                // Don't fail the repayment, but log for manual resolution
            }
        }

        const updatedLoan = await this.prisma.loan.update({
            where: { id: loanId },
            data: {
                outstandingAmount: Math.max(0, newOutstanding),
                status: isFullyRepaid ? 'REPAID' : 'ACTIVE',
                repaidDate: isFullyRepaid ? new Date() : null,
            },
        });

        if (isFullyRepaid) {
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

            await this.collateralService.unlockCollateral({ loanId }, loan.userId);

            this.logger.log(`Loan fully repaid: ${loanId}`);
        }

        const totalRepaid = (Number(loan.amount) - Number(loan.outstandingAmount)) + paymentAmount;
        return {
            ...updatedLoan,
            paymentAmount,
            totalOwed,
            remainingBalance: Math.max(0, totalOwed - totalRepaid),
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