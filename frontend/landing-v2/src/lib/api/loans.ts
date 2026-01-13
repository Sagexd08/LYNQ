import api from './client';
import {
  CreateLoanRequest,
  Loan,
  RepayLoanRequest,
  RepayLoanResponse,
} from './types';

export const loansApi = {
  /**
   * Create a new loan request
   */
  async createLoan(request: CreateLoanRequest): Promise<Loan> {
    const response = await api.post<Loan>('/loans', request);
    return response.data;
  },

  /**
   * Get all loans for the current user
   */
  async getLoans(): Promise<Loan[]> {
    const response = await api.get<Loan[]>('/loans');
    return response.data;
  },

  /**
   * Get a specific loan by ID
   */
  async getLoan(loanId: string): Promise<Loan> {
    const response = await api.get<Loan>(`/loans/${loanId}`);
    return response.data;
  },

  /**
   * Repay a loan
   */
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
