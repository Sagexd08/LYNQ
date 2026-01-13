import api from './client';
import {
  RiskEvaluationRequest,
  RiskEvaluationResponse,
} from './types';

export const riskApi = {
  /**
   * Evaluate loan risk
   */
  async evaluateRisk(
    request: RiskEvaluationRequest
  ): Promise<RiskEvaluationResponse> {
    const response = await api.post<RiskEvaluationResponse>(
      '/risk/evaluate',
      request
    );
    return response.data;
  },

  /**
   * Get risk assessment for a loan
   */
  async getRiskAssessment(loanId: string): Promise<RiskEvaluationResponse> {
    const response = await api.get<RiskEvaluationResponse>(
      `/risk/${loanId}`
    );
    return response.data;
  },
};
