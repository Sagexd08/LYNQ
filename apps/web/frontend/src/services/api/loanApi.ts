import { PaginatedResponse } from '../../types/schemas';
import apiClient from './client';

export interface CreateLoanRequest {
  amount: string;
  chain: string;
  collateralTokenAddress: string;
  collateralAmount: string;
  durationDays: number;
  transactionHash?: string;
  onChainId?: string;
  interestRate?: string;
}

export interface LoanResponse {
  id: string;
  userId: string;
  amount: string;
  outstandingAmount: string;
  chain: string;
  collateralTokenAddress: string;
  collateralAmount: string;
  interestRate: string;
  durationDays: number;
  status: 'PENDING' | 'ACTIVE' | 'REPAID' | 'DEFAULTED' | 'LIQUIDATED';
  transactionHash?: string;
  startDate?: string;
  dueDate?: string;
  createdAt: string;
}

export interface RepayLoanRequest {
  amount: string;
  transactionHash: string;
}

export interface RefinanceOffer {
  success: boolean;
  proposal: {
    loanId: string;
    newInterestRate: number;
    newDuration: number;
    timestamp: number;
    nonce: number;
  };
  signature: string;
  betterTerms: {
    oldRate: number;
    newRate: number;
    improvement: string;
  };
}

export const loanApi = {

  async create(data: CreateLoanRequest): Promise<LoanResponse> {
    const response = await apiClient.post<LoanResponse>('/loans', data);
    return response.data;
  },

  async getMyLoans(status?: string, page: number = 1, limit: number = 20): Promise<PaginatedResponse<LoanResponse>> {
    const params = { status, page, limit };
    const response = await apiClient.get<PaginatedResponse<LoanResponse>>('/loans/my-loans', { params });
    return response.data;
  },

  async getById(id: string): Promise<LoanResponse> {
    const response = await apiClient.get<LoanResponse>(`/loans/${id}`);
    return response.data;
  },

  async checkEligibility(amount: number): Promise<any> {
    const response = await apiClient.get('/loans/check-eligibility', { params: { amount } });
    return response.data;
  },

  async repay(id: string, data: RepayLoanRequest): Promise<LoanResponse> {
    const response = await apiClient.put<LoanResponse>(`/loans/${id}/repay`, data);
    return response.data;
  },

  async refinance(id: string): Promise<any> {
    const response = await apiClient.post(`/loans/${id}/refinance`);
    return response.data;
  },

  async checkRefinance(id: string): Promise<RefinanceOffer> {
    const response = await apiClient.post<RefinanceOffer>(`/loans/${id}/refinance-offer`);
    return response.data;
  },

  async syncLoanFromChain(transactionHash: string, chain: string): Promise<LoanResponse> {
    const response = await apiClient.post<LoanResponse>('/loans/sync', {
      transactionHash,
      chain,
    });
    return response.data;
  },
};

export default loanApi;

