import { useState, useEffect, useCallback } from 'react';
import { dashboardApi } from '@/lib/api/dashboard';
import { DashboardData, ProtocolStats, Loan } from '@/lib/api/types';

export function useDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboard = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const dashboardData = await dashboardApi.getDashboardData();
            setData(dashboardData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    return {
        data,
        isLoading,
        error,
        refresh: fetchDashboard,
    };
}

export function useProtocolStats() {
    const [stats, setStats] = useState<ProtocolStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await dashboardApi.getProtocolStats();
            setStats(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch protocol stats');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, [fetchStats]);

    return { stats, isLoading, error, refresh: fetchStats };
}

export function useRecentLoans(limit: number = 5) {
    const [loans, setLoans] = useState<Loan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLoans = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await dashboardApi.getRecentLoans(limit);
            setLoans(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch recent loans');
        } finally {
            setIsLoading(false);
        }
    }, [limit]);

    useEffect(() => {
        fetchLoans();
    }, [fetchLoans]);

    return { loans, isLoading, error, refresh: fetchLoans };
}
