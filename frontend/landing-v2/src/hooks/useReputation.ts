import { useState, useEffect, useCallback } from 'react';
import { reputationApi } from '@/lib/api/reputation';
import { ReputationData } from '@/lib/api/types';

export function useReputation() {
    const [data, setData] = useState<ReputationData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchReputation = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const reputationData = await reputationApi.getReputationData();
            setData(reputationData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch reputation data');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReputation();
    }, [fetchReputation]);

    const recalculate = useCallback(async (userId: string) => {
        setIsLoading(true);
        try {
            const updatedData = await reputationApi.updateReputation(userId);
            setData(updatedData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to recalculate reputation');
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        data,
        isLoading,
        error,
        refresh: fetchReputation,
        recalculate,
    };
}

export function useReputationScore() {
    const { data, isLoading, error } = useReputation();

    return {
        score: data?.score ?? 0,
        tier: data?.tier ?? 'BRONZE',
        rank: data?.rank,
        isLoading,
        error,
    };
}

export function useAchievements() {
    const { data, isLoading, error } = useReputation();

    const earned = data?.achievements.filter(a => a.isEarned) ?? [];
    const pending = data?.achievements.filter(a => !a.isEarned) ?? [];

    return {
        achievements: data?.achievements ?? [],
        earned,
        pending,
        isLoading,
        error,
    };
}
