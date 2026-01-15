import api from './client';
import { ReputationData, Profile } from './types';

const tierThresholds = {
    BRONZE: { min: 0, max: 299 },
    SILVER: { min: 300, max: 599 },
    GOLD: { min: 600, max: 849 },
    PLATINUM: { min: 850, max: 1000 },
};

const getTierFromScore = (score: number): 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' => {
    if (score >= 850) return 'PLATINUM';
    if (score >= 600) return 'GOLD';
    if (score >= 300) return 'SILVER';
    return 'BRONZE';
};

const getNextTier = (currentTier: string, score: number) => {
    const tiers = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
    const currentIndex = tiers.indexOf(currentTier);
    if (currentIndex >= tiers.length - 1) return undefined;

    const nextTierName = tiers[currentIndex + 1];
    const threshold = tierThresholds[nextTierName as keyof typeof tierThresholds];

    return {
        name: nextTierName,
        requiredScore: threshold.min,
        pointsNeeded: Math.max(0, threshold.min - score),
    };
};

export const reputationApi = {
    async getReputationData(): Promise<ReputationData> {
        try {
            const profileResponse = await api.get<Profile>('/auth/me');
            const profile = profileResponse.data;

            const score = profile.reputationScore || 750;
            const tier = getTierFromScore(score);

            return {
                score,
                tier,
                rank: 0,
                history: [{ date: new Date().toISOString().split('T')[0], score }],
                factors: [],
                achievements: [],
                nextTier: getNextTier(tier, score),
            };
        } catch {
            return this.getDefaultReputationData();
        }
    },

    generateScoreHistory(currentScore: number): Array<{ date: string; score: number }> {
        return [{ date: new Date().toISOString().split('T')[0], score: currentScore }];
    },

    getDefaultReputationData(): ReputationData {
        return {
            score: 750,
            tier: 'GOLD',
            rank: 0,
            history: [],
            factors: [],
            achievements: [],
            nextTier: {
                name: 'PLATINUM',
                requiredScore: 850,
                pointsNeeded: 100,
            },
        };
    },

    async updateReputation(userId: string): Promise<ReputationData> {
        await api.post(`/reputation/${userId}/recalculate`).catch(() => { });
        return this.getReputationData();
    },
};
