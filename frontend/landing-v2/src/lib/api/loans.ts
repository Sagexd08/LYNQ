import api from './client';
import {
  CreateLoanRequest,
  Loan,
  RepayLoanRequest,
  RepayLoanResponse,
} from './types';

export const loansApi = {
  
  async createLoan(request: CreateLoanRequest): Promise<Loan> {
    const response = await api.post<Loan>('/loans', request);
    return response.data;
  },

  async getLoans(): Promise<Loan[]> {
    const response = await api.get<Loan[]>('/loans');
    return response.data;
  },

  async getLoan(loanId: string): Promise<Loan> {
    const response = await api.get<Loan>(`/loans/${loanId}`);
    return response.data;
  },

  async repayLoan(
    loanId: string,
    request: RepayLoanRequest
  ): Promise<RepayLoanResponse> {
    const response = await api.post<RepayLoanResponse>(
      `/loans/${loanId}/repay`,
      request
    );
    return response.data;
  },
};
