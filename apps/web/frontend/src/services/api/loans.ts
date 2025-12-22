import apiClient from './client';

export interface CreateLoanRequest {
    amount: string;
    chain: string;
    collateralTokenAddress: string;
    collateralAmount: string;
    durationDays: number;
    transactionHash?: string;
    onChainId?: string;
}

export interface RepayLoanRequest {
    amount: string;
    transactionHash: string;
}

export const loanApi = {
    create: async (data: CreateLoanRequest) => {
        return apiClient.post('/loans', data);
    },

    checkEligibility: async (amount: number) => {
        return apiClient.get('/loans/check-eligibility', { params: { amount } });
    },

    repay: async (id: string, data: RepayLoanRequest) => {
        return apiClient.put(`/loans/${id}/repay`, data);
    },

    getMyLoans: async (status?: string) => {
        return apiClient.get('/loans/my-loans', { params: { status } });
    },

    refinance: async (id: string) => {
        return apiClient.post(`/loans/${id}/refinance`);
    }
};
