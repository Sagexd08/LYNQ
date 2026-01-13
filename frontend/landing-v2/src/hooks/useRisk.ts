import { useMutation, useQuery } from '@tanstack/react-query';
import { riskApi } from '@/lib/api/risk';
import {
  RiskEvaluationRequest,
  RiskEvaluationResponse,
} from '@/lib/api/types';
import toast from 'react-hot-toast';

export function useRiskEvaluation() {
  const mutation = useMutation({
    mutationFn: (request: RiskEvaluationRequest) =>
      riskApi.evaluateRisk(request),
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || 'Failed to evaluate risk'
      );
    },
  });

  return {
    evaluateRisk: mutation.mutateAsync,
    riskData: mutation.data,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

export function useRiskAssessment(loanId: string | null) {
  const {
    data: assessment,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['risk', loanId],
    queryFn: () => riskApi.getRiskAssessment(loanId!),
    enabled: !!loanId,
    staleTime: 5 * 60 * 1000, 
  });

  return {
    assessment,
    isLoading,
    error,
  };
}
