import api from './client';
import { MarketData, LendingPool } from './types';

const defaultLendingPools: LendingPool[] = [];

export const marketsApi = {
    async getMarketData(): Promise<MarketData> {
        try {
            const response = await api.get<MarketData>('/markets');
            return response.data;
        } catch {
            return {
                totalMarkets: 0,
                totalLiquidity: 0,
                volume24h: 0,
                avgApy: 0,
                utilization: 0,
                lendingPools: [],
            };
        }
    },

    async getLendingPools(): Promise<LendingPool[]> {
        try {
            const response = await api.get<LendingPool[]>('/markets/pools');
            return response.data;
        } catch {
            return defaultLendingPools;
        }
    },

    async getPoolByAsset(asset: string): Promise<LendingPool | null> {
        try {
            const response = await api.get<LendingPool>(`/markets/pools/${asset}`);
            return response.data;
        } catch {
            return defaultLendingPools.find(p => p.asset === asset) || null;
        }
    },

    async getChainUtilization(): Promise<Array<{
        name: string;
        utilization: number;
        borrowed: string;
        available: string;
    }>> {
        const pools = await this.getLendingPools();
        const chainMap = new Map<string, { totalBorrowed: number; totalAvailable: number; count: number; utilSum: number }>();

        for (const pool of pools) {
            const existing = chainMap.get(pool.chain);
            const available = pool.liquidity - pool.totalBorrowed;
            if (existing) {
                existing.totalBorrowed += pool.totalBorrowed;
                existing.totalAvailable += available;
                existing.utilSum += pool.utilization;
                existing.count++;
            } else {
                chainMap.set(pool.chain, {
                    totalBorrowed: pool.totalBorrowed,
                    totalAvailable: available,
                    utilSum: pool.utilization,
                    count: 1,
                });
            }
        }

        return Array.from(chainMap.entries()).map(([name, data]) => ({
            name,
            utilization: Math.round(data.utilSum / data.count),
            borrowed: `${(data.totalBorrowed / 1000000).toFixed(1)}M`,
            available: `${(data.totalAvailable / 1000000).toFixed(1)}M`,
        }));
    },

    async getMarketTrends(): Promise<Array<{
        metric: string;
        value: string;
        change: string;
        direction: 'up' | 'down';
    }>> {
        try {
            const response = await api.get('/markets/trends');
            return response.data;
        } catch (error) {
            console.error("Failed to fetch market trends:", error);
            return [
                { metric: 'Total Volume', value: '$0', change: '0%', direction: 'up' },
                { metric: 'Avg APY', value: '0%', change: '0%', direction: 'up' },
                { metric: 'New Loans', value: '0', change: '0%', direction: 'up' },
                { metric: 'Default Rate', value: '0%', change: '0%', direction: 'down' },
            ];
        }
    },
};
