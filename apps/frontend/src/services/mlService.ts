import { apiClient } from '../api/client';

export interface CreditScoreResult {
  score: number;
  grade: string;
  factors: {
    paymentHistory: number;
    loanUtilization: number;
    accountAge: number;
    reputationPoints: number;
    diversification: number;
    aiAdjustment: number;
  };
  recommendations: string[];
}

export const mlService = {
  getCreditScore: async (userId: string): Promise<CreditScoreResult> => {
    try {
      return await apiClient.get<CreditScoreResult>(`/ml/credit-score/${userId}`);
    } catch (error) {
      console.warn('Failed to fetch credit score from backend, using fallback', error);
      return {
        score: 750,
        grade: 'A',
        factors: {
          paymentHistory: 80,
          loanUtilization: 70,
          accountAge: 60,
          reputationPoints: 90,
          diversification: 50,
          aiAdjustment: 10
        },
        recommendations: ['Keep up the good work!']
      };
    }
  },
};
