import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RepaymentClassification } from '../repayments/classification';
import { ReputationEventType, Prisma } from '@prisma/client';

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
        return this.prisma.reputationEvent.findMany({
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
            let newConsecutiveLateCount = reputation.consecutiveLateCount;
            let newCleanCycleCount = reputation.cleanCycleCount;
            let newMaxScoreBeforeLastPenalty = reputation.maxScoreBeforeLastPenalty;
            let shouldBlock = false;
            let eventType: ReputationEventType;
            let reason: string;

            switch (classification) {
                case RepaymentClassification.EARLY:
                    scoreChange = 12;
                    newCleanCycleCount += 1;
                    newConsecutiveLateCount = 0;
                    eventType = ReputationEventType.EARLY_REPAYMENT;
                    reason = 'Paid ≥24h before due date';
                    break;

                case RepaymentClassification.ON_TIME:
                    scoreChange = 10;
                    newCleanCycleCount += 1;
                    newConsecutiveLateCount = 0;
                    eventType = ReputationEventType.ON_TIME_REPAYMENT;
                    reason = 'Paid on or before due date';
                    break;

                case RepaymentClassification.PARTIAL:
                    eventType = ReputationEventType.PARTIAL_REPAYMENT;
                    reason = 'Partial payment received';
                    break;

                case RepaymentClassification.LATE:
                    scoreChange = -5;
                    eventType = ReputationEventType.LATE_REPAYMENT;
                    reason = `Paid ${lateDays} day(s) late`;

                    if (newConsecutiveLateCount === 1) {
                        scoreChange = -20;
                        newMaxScoreBeforeLastPenalty = reputation.score;
                        shouldBlock = true;
                        eventType = ReputationEventType.CONSECUTIVE_LATE_BLOCK;
                        reason = 'Second consecutive late payment - account blocked';
                    }

                    newConsecutiveLateCount += 1;
                    newCleanCycleCount = 0;
                    break;

                default:
                    eventType = ReputationEventType.PARTIAL_REPAYMENT;
                    reason = 'Unknown classification';
            }

            let newScore = reputation.score + scoreChange;

            const isCleanCycle = classification === RepaymentClassification.EARLY ||
                classification === RepaymentClassification.ON_TIME;

            let recoveryApplied = false;
            if (isCleanCycle && newCleanCycleCount >= 2 && newMaxScoreBeforeLastPenalty !== null) {
                const penaltyAmount = Math.abs(newMaxScoreBeforeLastPenalty - reputation.score);
                const recoveryAmount = Math.floor(penaltyAmount * 0.5);
                const recoveredScore = newScore + recoveryAmount;
                const cappedScore = Math.min(recoveredScore, newMaxScoreBeforeLastPenalty);

                if (cappedScore > newScore) {
                    const recoveryDelta = cappedScore - newScore;
                    newScore = cappedScore;
                    recoveryApplied = true;

                    await tx.reputationEvent.create({
                        data: {
                            userId,
                            type: ReputationEventType.RECOVERY,
                            delta: recoveryDelta,
                            previousScore: reputation.score + scoreChange,
                            newScore,
                            loanId,
                            reason: `Recovery: 50% of penalty (${recoveryAmount}) applied after ${newCleanCycleCount} clean cycles`,
                        },
                    });
                }
            }

            if (isCleanCycle && newCleanCycleCount === 3) {
                const bonusScore = newScore + 10;
                const cappedBonus = newMaxScoreBeforeLastPenalty !== null
                    ? Math.min(bonusScore, newMaxScoreBeforeLastPenalty)
                    : bonusScore;

                if (cappedBonus > newScore) {
                    const bonusDelta = cappedBonus - newScore;
                    newScore = cappedBonus;

                    await tx.reputationEvent.create({
                        data: {
                            userId,
                            type: ReputationEventType.RECOVERY,
                            delta: bonusDelta,
                            previousScore: newScore - bonusDelta,
                            newScore,
                            loanId,
                            reason: 'Bonus: 3 consecutive clean cycles achieved',
                        },
                    });
                }
            }

            if (newScore > 100) newScore = 100;
            if (newScore < 0) newScore = 0;

            await tx.reputation.update({
                where: { userId },
                data: {
                    score: newScore,
                    consecutiveLateCount: newConsecutiveLateCount,
                    cleanCycleCount: newCleanCycleCount,
                    maxScoreBeforeLastPenalty: newMaxScoreBeforeLastPenalty,
                    updatedAt: new Date(),
                },
            });

            if (scoreChange !== 0) {
                await tx.reputationEvent.create({
                    data: {
                        userId,
                        type: eventType,
                        delta: scoreChange,
                        previousScore,
                        newScore: previousScore + scoreChange,
                        loanId,
                        reason,
                    },
                });
            }

            if (shouldBlock) {
                await tx.user.update({
                    where: { id: userId },
                    data: { status: 'blocked' },
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
                    loans: { where: { status: 'active' } },
                },
            });

            if (!user || user.status !== 'BLOCKED') {
                return false;
            }

            const hasActiveLoan = user.loans.length > 0;
            if (hasActiveLoan) {
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

            await tx.reputationEvent.create({
                data: {
                    userId,
                    type: ReputationEventType.UNBLOCK,
                    delta: 0,
                    previousScore: reputation.score,
                    newScore: reputation.score,
                    reason: 'Account unblocked after clean cycle',
                },
            });

            return true;
        });
    }
}
