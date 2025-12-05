import apiClient from './client';

export interface CreateLoanRequest {
  amount: string;
  chain: string;
  collateralTokenAddress: string;
  collateralAmount: string;
  durationDays: number;
  transactionHash?: string;
  onChainLoanId?: string;
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

export const loanApi = {

  async createLoan(data: CreateLoanRequest): Promise<LoanResponse> {
    const response = await apiClient.post<LoanResponse>('/loans', data);
    return response.data;
  },

  async getUserLoans(status?: string): Promise<LoanResponse[]> {
    const params = status ? { status } : {};
    const response = await apiClient.get<LoanResponse[]>('/loans', { params });
    return response.data;
  },

  async getLoanById(id: string): Promise<LoanResponse> {
    const response = await apiClient.get<LoanResponse>(`/loans/${id}`);
    return response.data;
  },

  async repayLoan(id: string, data: RepayLoanRequest): Promise<LoanResponse> {
    const response = await apiClient.put<LoanResponse>(`/loans/${id}/repay`, data);
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
