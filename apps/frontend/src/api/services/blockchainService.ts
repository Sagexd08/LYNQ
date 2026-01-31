import { blockchainApiClient } from '../client';
import type { ActiveLoan, LoanRequest, TrustScore } from '../../types/loan';

export class BlockchainService {
  static async getLoansByUser(walletAddress: string): Promise<ActiveLoan[]> {
    return blockchainApiClient.get<ActiveLoan[]>(`/loans/user/${walletAddress}`);
  }

  static async getLoanById(loanId: string): Promise<ActiveLoan> {
    return blockchainApiClient.get<ActiveLoan>(`/loans/${loanId}`);
  }

  static async createLoan(request: Partial<LoanRequest>): Promise<LoanRequest> {
    return blockchainApiClient.post<LoanRequest>('/loans', request);
  }

  static async repayLoan(loanId: string, amount: string): Promise<{ txHash: string }> {
    return blockchainApiClient.post(`/loans/${loanId}/repay`, { amount });
  }

  static async getTrustScore(walletAddress: string): Promise<TrustScore> {
    return blockchainApiClient.get<TrustScore>(`/trust-score/${walletAddress}`);
  }

  static async getLoanStats(): Promise<any> {
    return blockchainApiClient.get('/loans/stats');
  }

  static async getContractState(): Promise<any> {
    return blockchainApiClient.get('/contract/state');
  }
}

