import { useState, useEffect, useCallback } from 'react';
import { marketsApi } from '@/lib/api/markets';
import { MarketData, LendingPool } from '@/lib/api/types';

export function useMarkets() {
    const [data, setData] = useState<MarketData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMarkets = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const marketData = await marketsApi.getMarketData();
            setData(marketData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch market data');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMarkets();
        const interval = setInterval(fetchMarkets, 30000);
        return () => clearInterval(interval);
    }, [fetchMarkets]);

    return {
        data,
        isLoading,
        error,
        refresh: fetchMarkets,
    };
}

export function useLendingPools() {
    const [pools, setPools] = useState<LendingPool[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPools = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await marketsApi.getLendingPools();
            setPools(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch lending pools');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPools();
    }, [fetchPools]);

    return { pools, isLoading, error, refresh: fetchPools };
}

export function useChainUtilization() {
    const [utilization, setUtilization] = useState<Array<{
        name: string;
        utilization: number;
        borrowed: string;
        available: string;
    }>>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUtilization = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await marketsApi.getChainUtilization();
            setUtilization(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch chain utilization');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUtilization();
    }, [fetchUtilization]);

    return { utilization, isLoading, error, refresh: fetchUtilization };
}

export function useMarketTrends() {
    const [trends, setTrends] = useState<Array<{
        metric: string;
        value: string;
        change: string;
        direction: 'up' | 'down';
    }>>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTrends = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await marketsApi.getMarketTrends();
            setTrends(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch market trends');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTrends();
    }, [fetchTrends]);

    return { trends, isLoading, error, refresh: fetchTrends };
}
