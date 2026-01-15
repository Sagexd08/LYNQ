import api from './client';
import {
    LockCollateralRequest,
    UnlockCollateralRequest,
    Collateral,
} from './types';

export const collateralApi = {
    async lockCollateral(request: LockCollateralRequest): Promise<Collateral> {
        const response = await api.post<Collateral>('/collateral/lock', request);
        return response.data;
    },

    async unlockCollateral(request: UnlockCollateralRequest): Promise<Collateral> {
        const response = await api.post<Collateral>('/collateral/unlock', request);
        return response.data;
    },

    async getCollateralByUser(): Promise<Collateral[]> {
        const response = await api.get<Collateral[]>('/collateral/user');
        return response.data;
    },

    async getCollateralById(id: string): Promise<Collateral> {
        const response = await api.get<Collateral>(`/collateral/${id}`);
        return response.data;
    },

    async getTotalValue(): Promise<{ userId: string; totalValueUsd: number }> {
        const response = await api.get<{ userId: string; totalValueUsd: number }>('/collateral/value/total');
        return response.data;
    },
};
