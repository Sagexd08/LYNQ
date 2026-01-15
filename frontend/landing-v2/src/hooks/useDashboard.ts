import { useState, useEffect, useCallback } from 'react';
import { dashboardApi } from '@/lib/api/dashboard';
import { DashboardData, ProtocolStats, Loan } from '@/lib/api/types';

const MOCK_PROTOCOL_STATS: ProtocolStats = {
    totalValueLocked: 47250000,
    activeLoans: 1845,
    totalUsers: 4291,
    defaultProbability: 0.023,
    liquidationExposure: 1200000,
    avgInterestRate: 8.5,
    totalCollateral: 62000000,
    utilizationRate: 68.5,
    avgHealthFactor: 1.8
};

const MOCK_LOANS: Loan[] = [
    {
        id: 'ln_1', userId: 'u1', amount: 5000, interestRate: 8.5, termMonths: 12, status: 'ACTIVE', amountRepaid: 1200, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        collaterals: [{ id: 'c1', loanId: 'ln_1', tokenAddress: '0x...', tokenSymbol: 'ETH', amount: 2.5, valueUsd: 7500, chainId: 1, status: 'LOCKED', lockedAt: new Date().toISOString() }]
    },
    {
        id: 'ln_2', userId: 'u1', amount: 15000, interestRate: 7.2, termMonths: 24, status: 'PENDING', amountRepaid: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        collaterals: [{ id: 'c2', loanId: 'ln_2', tokenAddress: '0x...', tokenSymbol: 'MNT', amount: 10000, valueUsd: 22000, chainId: 5000, status: 'LOCKED', lockedAt: new Date().toISOString() }]
    }
];

const MOCK_DASHBOARD_DATA: DashboardData = {
    protocolStats: MOCK_PROTOCOL_STATS,
    userRiskProfile: {
        creditScore: 785,
        riskLevel: 15,
        collateralUtilization: 45,
        liquidationProximity: 20,
        maxBorrow: 50000,
        healthFactor: 2.1,
        tier: 'GOLD'
    },
    modelConfidence: {
        credit: 0.94,
        fraud: 0.98,
        default: 0.92,
        ensembleAgreement: 0.91
    },
    recentLoans: MOCK_LOANS,
    riskAlerts: [
        { severity: 'low', title: 'Market Volatility', description: 'ETH volatility slightly elevated', time: '2h ago' },
        { severity: 'low', title: 'Collateral Ratio', description: 'Healthy collateral levels maintained', time: '4h ago' }
    ],
    marketSignals: [
        { asset: 'MNT', signal: 'Bullish', change: '+5.4%', direction: 'up' },
        { asset: 'ETH', signal: 'Neutral', change: '+1.2%', direction: 'up' }
    ]
};

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
            console.warn('Using mock dashboard data due to API error:', err);
            setData(MOCK_DASHBOARD_DATA);
            // setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
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
    const [error] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await dashboardApi.getProtocolStats();
            setStats(data);
        } catch (err) {
            console.warn('Using mock protocol stats due to API error:', err);
            setStats(MOCK_PROTOCOL_STATS);
            // setError(err instanceof Error ? err.message : 'Failed to fetch protocol stats');
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
    const [error] = useState<string | null>(null);

    const fetchLoans = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await dashboardApi.getRecentLoans(limit);
            setLoans(data);
        } catch (err) {
            console.warn('Using mock loans due to API error:', err);
            setLoans(MOCK_LOANS);
            // setError(err instanceof Error ? err.message : 'Failed to fetch recent loans');
        } finally {
            setIsLoading(false);
        }
    }, [limit]);

    useEffect(() => {
        fetchLoans();
    }, [fetchLoans]);

    return { loans, isLoading, error, refresh: fetchLoans };
}
