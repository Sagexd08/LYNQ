import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { BlockchainService } from '../../blockchain/blockchain.service';
import { ReputationService } from '../../reputation/reputation.service';
import { TelegramService } from '../../telegram/telegram.service';
import { NotificationType } from '../../telegram/dto/send-notification.dto';
import { RepaymentClassification } from '../../repayments/classification';
import { QUEUE_NAMES } from '../queues.module';

export interface LiquidationCheckJobData {
    loanId: string;
}

@Processor(QUEUE_NAMES.LIQUIDATION)
@Injectable()
export class LiquidationProcessor extends WorkerHost {
    private readonly logger = new Logger(LiquidationProcessor.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly blockchainService: BlockchainService,
        private readonly reputationService: ReputationService,
        private readonly telegramService: TelegramService,
    ) {
        super();
    }

    async process(job: Job<LiquidationCheckJobData>) {
        const { loanId } = job.data;
        this.logger.log(`Processing liquidation check for loan ${loanId}`);

        const loan = await this.prisma.loan.findUnique({
            where: { id: loanId },
            include: { user: true },
        });

        if (!loan || loan.status !== 'ACTIVE') {
            this.logger.log(`Loan ${loanId} not active, skipping`);
            return { skipped: true };
        }

        const now = new Date();
        const dueDate = loan.dueDate;
        
        if (!dueDate || now <= dueDate) {
            this.logger.log(`Loan ${loanId} not overdue yet`);
            return { skipped: true };
        }

        const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        // Grace period: 3 days before liquidation
        if (daysOverdue <= 3) {
            this.logger.log(`Loan ${loanId} in grace period (${daysOverdue} days overdue)`);
            
            // Send warning notification
            await this.telegramService.sendNotification(loan.userId, {
                type: NotificationType.LOAN_DEFAULTED, // Using LOAN_DEFAULTED for overdue warnings
                title: 'Loan Overdue Warning',
                message: `Your loan is ${daysOverdue} day(s) overdue. Please repay to avoid liquidation.`,
            });

            return { warning: true, daysOverdue };
        }

        // Execute liquidation
        this.logger.log(`Executing liquidation for loan ${loanId} (${daysOverdue} days overdue)`);

        try {
            // 1. Mark as defaulted on-chain (if applicable)
            if (loan.onChainLoanId && this.blockchainService.isBlockchainConnected()) {
                await this.blockchainService.markLoanDefaulted(loan.onChainLoanId);
                await this.blockchainService.seizeCollateral(loan.onChainLoanId);
            }

            // 2. Update DB
            await this.prisma.loan.update({
                where: { id: loanId },
                data: {
                    status: 'DEFAULTED',
                    defaultedAt: now,
                    lateDays: daysOverdue,
                },
            });

            // 3. Update user reputation (using LATE classification with days overdue)
            await this.reputationService.applyRepaymentOutcome(
                loan.userId,
                RepaymentClassification.LATE,
                daysOverdue,
                loanId,
            );

            // 4. Update user metadata atomically to prevent race conditions
            // Use a transaction with row locking to ensure atomic increment
            await this.prisma.$transaction(async (tx) => {
                // Lock the user row for update
                await tx.$executeRaw`
                    SELECT id FROM users WHERE id = ${loan.userId} FOR UPDATE
                `;
                
                // Atomically increment defaultedLoans in JSON metadata using PostgreSQL JSONB functions
                await tx.$executeRaw`
                    UPDATE users
                    SET metadata = jsonb_set(
                        COALESCE(metadata, '{}'::jsonb),
                        '{defaultedLoans}',
                        to_jsonb(COALESCE((metadata->>'defaultedLoans')::int, 0) + 1)
                    )
                    WHERE id = ${loan.userId}
                `;
            });

            // 5. Notify user
            await this.telegramService.sendNotification(loan.userId, {
                type: NotificationType.LOAN_DEFAULTED,
                title: 'Loan Defaulted',
                message: `Your loan has been marked as defaulted after ${daysOverdue} days overdue. Collateral has been liquidated.`,
            });

            this.logger.log(`Loan ${loanId} liquidated successfully`);
            return { liquidated: true, daysOverdue };

        } catch (error) {
            this.logger.error(`Liquidation failed for loan ${loanId}: ${error.message}`);
            throw error;
        }
    }
}
