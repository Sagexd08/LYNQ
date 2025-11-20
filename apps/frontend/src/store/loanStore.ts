import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ActiveLoan, LoanRequest, TrustScore } from '../types/loan';

export interface LoanState {
  activeLoans: ActiveLoan[];
  loanRequests: LoanRequest[];
  trustScore: TrustScore | null;
  selectedLoan: ActiveLoan | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoanActions {
  setActiveLoans: (loans: ActiveLoan[]) => void;
  addActiveLoan: (loan: ActiveLoan) => void;
  updateActiveLoan: (loanId: string, updates: Partial<ActiveLoan>) => void;
  removeActiveLoan: (loanId: string) => void;
  setLoanRequests: (requests: LoanRequest[]) => void;
  addLoanRequest: (request: LoanRequest) => void;
  updateLoanRequest: (requestId: string, updates: Partial<LoanRequest>) => void;
  setTrustScore: (score: TrustScore) => void;
  selectLoan: (loan: ActiveLoan | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialLoanState: LoanState = {
  activeLoans: [],
  loanRequests: [],
  trustScore: null,
  selectedLoan: null,
  isLoading: false,
  error: null,
};

export const useLoanStore = create<LoanState & LoanActions>()(
  devtools(
    (set) => ({
      ...initialLoanState,
      
      setActiveLoans: (loans) => set(
        { activeLoans: loans },
        false,
        'loans/setActiveLoans'
      ),
      
      addActiveLoan: (loan) => set(
        (state) => ({ activeLoans: [...state.activeLoans, loan] }),
        false,
        'loans/addActiveLoan'
      ),
      
      updateActiveLoan: (loanId, updates) => set(
        (state) => ({
          activeLoans: state.activeLoans.map(loan =>
            loan.id === loanId ? { ...loan, ...updates } : loan
          ),
          selectedLoan: state.selectedLoan?.id === loanId
            ? { ...state.selectedLoan, ...updates }
            : state.selectedLoan,
        }),
        false,
        'loans/updateActiveLoan'
      ),
      
      removeActiveLoan: (loanId) => set(
        (state) => ({
          activeLoans: state.activeLoans.filter(loan => loan.id !== loanId),
          selectedLoan: state.selectedLoan?.id === loanId ? null : state.selectedLoan,
        }),
        false,
        'loans/removeActiveLoan'
      ),
      
      setLoanRequests: (requests) => set(
        { loanRequests: requests },
        false,
        'loans/setLoanRequests'
      ),
      
      addLoanRequest: (request) => set(
        (state) => ({ loanRequests: [...state.loanRequests, request] }),
        false,
        'loans/addLoanRequest'
      ),
      
      updateLoanRequest: (requestId, updates) => set(
        (state) => ({
          loanRequests: state.loanRequests.map(request =>
            request.id === requestId ? { ...request, ...updates } : request
          ),
        }),
        false,
        'loans/updateLoanRequest'
      ),
      
      setTrustScore: (score) => set(
        { trustScore: score },
        false,
        'loans/setTrustScore'
      ),
      
      selectLoan: (loan) => set(
        { selectedLoan: loan },
        false,
        'loans/selectLoan'
      ),
      
      setLoading: (isLoading) => set(
        { isLoading },
        false,
        'loans/setLoading'
      ),
      
      setError: (error) => set(
        { error },
        false,
        'loans/setError'
      ),
      
      reset: () => set(initialLoanState, false, 'loans/reset'),
    }),
    { name: 'LoanStore' }
  )
);

