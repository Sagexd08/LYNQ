import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RepaymentClassification } from '../repayments/classification';
import { ReputationEventType } from '@prisma/client';

@Injectable()
export class ReputationService {
    constructor(private readonly prisma: PrismaService) { }

    async getScore(userId: string) {
        const rep = await this.prisma.reputation.findUnique({
            where: { userId },
        });

        if (!rep) {
            throw new NotFoundException(`Reputation for user ${userId} not found`);
        }

        return rep;
    }

    async getHistory(userId: string) {
        return this.prisma.reputation_events.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }

    async applyRepaymentOutcome(
        userId: string,
        classification: RepaymentClassification,
        lateDays: number,
        loanId?: string
    ): Promise<{ blocked: boolean }> {
        return this.prisma.$transaction(async (tx) => {
            const reputation = await tx.reputation.findUnique({
                where: { userId },
            });

            if (!reputation) {
                throw new NotFoundException(`Reputation for user ${userId} not found`);
            }

            const previousScore = reputation.score;
            let scoreChange = 0;
            let newConsecutiveSuccessful = reputation.consecutiveSuccessful ?? 0;
            let newLatePayments = reputation.latePayments ?? 0;
            let newEarlyRepayments = reputation.earlyRepayments ?? 0;
            let shouldBlock = false;
            let eventType: ReputationEventType;

            switch (classification) {
                case RepaymentClassification.EARLY:
                    scoreChange = 12;
                    newConsecutiveSuccessful += 1;
                    newEarlyRepayments += 1;
                    eventType = ReputationEventType.EARLY_REPAYMENT;
                    break;

                case RepaymentClassification.ON_TIME:
                    scoreChange = 10;
                    newConsecutiveSuccessful += 1;
                    eventType = ReputationEventType.LOAN_REPAID;
                    break;

                case RepaymentClassification.PARTIAL:
                    eventType = ReputationEventType.PARTIAL_REPAYMENT;
                    break;

                case RepaymentClassification.LATE:
                    scoreChange = -5;
                    eventType = ReputationEventType.LATE_PAYMENT;
                    newConsecutiveSuccessful = 0;
                    newLatePayments += 1;

                    if (newLatePayments >= 2) {
                        scoreChange = -20;
                        shouldBlock = true;
                        eventType = ReputationEventType.ACCOUNT_BLOCKED;
                    }
                    break;

                default:
                    eventType = ReputationEventType.PARTIAL_REPAYMENT;
            }

            let newScore = reputation.score + scoreChange;
            if (newScore > 1000) newScore = 1000;
            if (newScore < 0) newScore = 0;

            await tx.reputation.update({
                where: { userId },
                data: {
                    score: newScore,
                    consecutiveSuccessful: newConsecutiveSuccessful,
                    latePayments: newLatePayments,
                    earlyRepayments: newEarlyRepayments,
                    lastUpdated: new Date(),
                },
            });

            if (scoreChange !== 0) {
                await tx.reputation_events.create({
                    data: {
                        userId,
                        reputationId: reputation.id,
                        eventType,
                        pointsChange: scoreChange,
                        previousScore,
                        newScore,
                        metadata: { loanId },
                    },
                });
            }

            if (shouldBlock) {
                await tx.user.update({
                    where: { id: userId },
                    data: { status: 'BLOCKED' },
                });
            }

            return { blocked: shouldBlock };
        });
    }

    async attemptUnblock(userId: string): Promise<boolean> {
        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id: userId },
                include: {
                    reputation: true,
                    loans: { where: { status: 'ACTIVE' } },
                },
            });

            if (!user || user.status !== 'BLOCKED') {
                return false;
            }

            if (user.loans.length > 0) {
                return false;
            }

            const reputation = user.reputation;
            if (!reputation) {
                return false;
            }

            await tx.user.update({
                where: { id: userId },
                data: { status: 'ACTIVE' },
            });

            await tx.reputation_events.create({
                data: {
                    userId,
                    reputationId: reputation.id,
                    eventType: ReputationEventType.ACCOUNT_UNBLOCKED,
                    pointsChange: 0,
                    previousScore: reputation.score,
                    newScore: reputation.score,
                    metadata: { reason: 'Account unblocked' },
                },
            });

            return true;
        });
    }
}
