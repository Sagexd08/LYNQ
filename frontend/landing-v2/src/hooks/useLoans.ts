import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { loansApi } from '@/lib/api/loans';
import { CreateLoanRequest, Loan } from '@/lib/api/types';
import toast from 'react-hot-toast';

export function useLoans() {
  const queryClient = useQueryClient();

  const {
    data: loans,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['loans'],
    queryFn: () => loansApi.getLoans(),
    staleTime: 30 * 1000, 
  });

  const createLoanMutation = useMutation({
    mutationFn: (request: CreateLoanRequest) => loansApi.createLoan(request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast.success(`Loan request created! Status: ${data.status}`);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to create loan request';
      toast.error(Array.isArray(message) ? message.join(', ') : message);
    },
  });

  const repayLoanMutation = useMutation({
    mutationFn: ({
      loanId,
      amount,
    }: {
      loanId: string;
      amount: number;
    }) => loansApi.repayLoan(loanId, { amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast.success('Repayment successful!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to process repayment';
      toast.error(Array.isArray(message) ? message.join(', ') : message);
    },
  });

  return {
    loans: loans || [],
    isLoading,
    error,
    createLoan: createLoanMutation.mutateAsync,
    isCreatingLoan: createLoanMutation.isPending,
    repayLoan: repayLoanMutation.mutateAsync,
    isRepaying: repayLoanMutation.isPending,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['loans'] }),
  };
}

export function useLoan(loanId: string | null) {
  const {
    data: loan,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['loans', loanId],
    queryFn: () => loansApi.getLoan(loanId!),
    enabled: !!loanId,
    staleTime: 30 * 1000,
  });

  return {
    loan,
    isLoading,
    error,
  };
}
