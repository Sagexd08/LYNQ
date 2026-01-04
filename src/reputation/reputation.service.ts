import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RepaymentClassification } from '../repayments/classification';

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

    async applyRepaymentOutcome(
        userId: string,
        classification: RepaymentClassification,
        lateDays: number
    ): Promise<{ blocked: boolean }> {
        const reputation = await this.prisma.reputation.findUnique({
            where: { userId },
        });

        if (!reputation) {
            throw new NotFoundException(`Reputation for user ${userId} not found`);
        }

        let scoreChange = 0;
        let newConsecutiveLateCount = reputation.consecutiveLateCount;
        let newCleanCycleCount = reputation.cleanCycleCount;
        let newMaxScoreBeforeLastPenalty = reputation.maxScoreBeforeLastPenalty;
        let shouldBlock = false;

        switch (classification) {
            case RepaymentClassification.EARLY:
                scoreChange = 12;
                newCleanCycleCount += 1;
                newConsecutiveLateCount = 0;
                break;

            case RepaymentClassification.ON_TIME:
                scoreChange = 10;
                newCleanCycleCount += 1;
                newConsecutiveLateCount = 0;
                break;

            case RepaymentClassification.PARTIAL:
                break;

            case RepaymentClassification.LATE:
                scoreChange = -5;

                if (newConsecutiveLateCount === 1) {
                    scoreChange = -20;
                    newMaxScoreBeforeLastPenalty = reputation.score;
                    shouldBlock = true;
                }

                newConsecutiveLateCount += 1;
                newCleanCycleCount = 0;
                break;
        }

        let newScore = reputation.score + scoreChange;

        const isCleanCycle = classification === RepaymentClassification.EARLY ||
            classification === RepaymentClassification.ON_TIME;

        if (isCleanCycle && newCleanCycleCount >= 2 && newMaxScoreBeforeLastPenalty !== null) {
            const penaltyAmount = Math.abs(newMaxScoreBeforeLastPenalty - reputation.score);
            const recoveryAmount = Math.floor(penaltyAmount * 0.5);
            const recoveredScore = newScore + recoveryAmount;
            newScore = Math.min(recoveredScore, newMaxScoreBeforeLastPenalty);
        }

        if (isCleanCycle && newCleanCycleCount === 3) {
            newScore += 10;
            if (newMaxScoreBeforeLastPenalty !== null) {
                newScore = Math.min(newScore, newMaxScoreBeforeLastPenalty);
            }
        }

        if (newScore > 100) newScore = 100;
        if (newScore < 0) newScore = 0;

        await this.prisma.reputation.update({
            where: { userId },
            data: {
                score: newScore,
                consecutiveLateCount: newConsecutiveLateCount,
                cleanCycleCount: newCleanCycleCount,
                maxScoreBeforeLastPenalty: newMaxScoreBeforeLastPenalty,
                updatedAt: new Date(),
            },
        });

        if (shouldBlock) {
            await this.prisma.user.update({
                where: { id: userId },
                data: { status: 'blocked' },
            });
        }

        return { blocked: shouldBlock };
    }

    async attemptUnblock(userId: string): Promise<boolean> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                reputation: true,
                loans: { where: { status: 'active' } },
            },
        });

        if (!user || user.status !== 'blocked') {
            return false;
        }

        const hasActiveLoan = user.loans.length > 0;
        if (hasActiveLoan) {
            return false;
        }

        const reputation = user.reputation;
        if (!reputation || reputation.cleanCycleCount < 1) {
            return false;
        }

        await this.prisma.user.update({
            where: { id: userId },
            data: { status: 'active' },
        });

        return true;
    }
}
