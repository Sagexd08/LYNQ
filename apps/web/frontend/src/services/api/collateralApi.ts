import apiClient from './client';
import { PaginatedResponse } from '../../types/schemas';

export interface CollateralResponse {
    id: string;
    userId: string;
    tokenAddress: string;
    amount: string;
    lockedAmount: string;
    status: 'active' | 'locked' | 'withdrawn' | 'liquidated';
    metadata?: any;
    createdAt: string;
    updatedAt: string;
}

export const collateralApi = {
    async listUserCollateral(page: number = 1, limit: number = 20): Promise<PaginatedResponse<CollateralResponse>> {
        const params = { page, limit };
        const response = await apiClient.get<PaginatedResponse<CollateralResponse>>('/collateral', { params });
        return response.data;
    },

    async getCollateral(id: string): Promise<CollateralResponse> {
        const response = await apiClient.get<CollateralResponse>(`/collateral/${id}`);
        return response.data;
    },
};

export default collateralApi;
