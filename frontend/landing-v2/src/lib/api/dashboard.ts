import api from './client';
import {
    DashboardData,
    ProtocolStats,
    Loan,
} from './types';

const getZeroProtocolStats = (): ProtocolStats => ({
    totalValueLocked: 0,
    activeLoans: 0,
    totalUsers: 0,
    defaultProbability: 0,
    liquidationExposure: 0,
    avgInterestRate: 0,
    totalCollateral: 0,
    utilizationRate: 0,
    avgHealthFactor: 0,
});

export const dashboardApi = {
    async getProtocolStats(): Promise<ProtocolStats> {
        try {
            const response = await api.get<ProtocolStats>('/stats/protocol');
            return response.data;
        } catch {
            return getZeroProtocolStats();
        }
    },

    async getDashboardData(): Promise<DashboardData> {
        const protocolStats = await this.getProtocolStats();

        const loansResponse = await api.get<Loan[]>('/loans').catch(() => ({ data: [] }));
        const recentLoans = loansResponse.data.slice(0, 5);

        return {
            protocolStats,
            userRiskProfile: {
                creditScore: 0,
                riskLevel: 0,
                collateralUtilization: 0,
                liquidationProximity: 0,
                maxBorrow: 0,
                healthFactor: 0,
                tier: 'BRONZE',
            },
            modelConfidence: {
                credit: 0,
                fraud: 0,
                default: 0,
                ensembleAgreement: 0,
            },
            recentLoans,
            riskAlerts: [],
            marketSignals: [],
        };
    },

    async getRecentLoans(limit: number = 5): Promise<Loan[]> {
        const response = await api.get<Loan[]>(`/loans?limit=${limit}`);
        return response.data;
    },
};
