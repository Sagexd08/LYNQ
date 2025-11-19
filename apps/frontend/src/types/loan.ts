
export interface TrustScore {
  score: number;
  creditHistory: number;
  repaymentRecord: number;
  collateralValue: number;
  lastUpdated: string;
}

export interface LoanRequest {
  id: string;
  borrower: string;
  amount: number;
  tokenType: string;
  purpose: string;
  collateralAddress?: string;
  status: 'pending' | 'approved' | 'active' | 'repaid' | 'defaulted' | 'rejected';
  createdAt: string;
  approvedAt?: string;
  interestRate?: number;
  dueDate?: string;
  txHash?: string;
}

export interface ActiveLoan {
  id: string;
  borrower: string;
  amount: number;
  remainingAmount: number;
  tokenType: string;
  purpose: string;
  collateralAddress?: string;
  interestRate: number;
  status: 'active' | 'overdue' | 'grace_period' | 'defaulted';
  startDate: string;
  dueDate: string;
  nextPaymentDate: string;
  nextPaymentAmount: number;
  totalPaid: number;
  txHash: string;
  repaymentSchedule: RepaymentSchedule[];
}

export interface RepaymentSchedule {
  paymentNumber: number;
  dueDate: string;
  amount: number;
  principal: number;
  interest: number;
  status: 'pending' | 'paid' | 'overdue';
  paidDate?: string;
  txHash?: string;
}

export interface LoanSettings {
  maxLoanAmount: number;
  minLoanAmount: number;
  baseInterestRate: number;
  maxLoanTerm: number; 
  minTrustScore: number;
  collateralRatio: number; 
  gracePeriod: number; 
}

export interface ContractState {
  isInitialized: boolean;
  totalLoansIssued: number;
  totalAmountLent: number;
  totalRepaid: number;
  defaultRate: number;
  adminAddress: string;
}

export interface LoanStats {
  totalActiveLoans: number;
  totalAmountBorrowed: number;
  totalRepaid: number;
  averageInterestRate: number;
  defaultRate: number;
  userStats: {
    totalBorrowed: number;
    totalRepaid: number;
    activeLoans: number;
    trustScore: number;
    creditScore: string;
  };
}

export interface WalletConnectionState {
  isConnected: boolean;
  address: string | null;
  balance: number;
  network: string;
  walletType: string | null;
}

export interface TransactionResult {
  success: boolean;
  txHash?: string;
  error?: string;
  blockNumber?: number;
  gasUsed?: number;
}

export type LoanAction = 
  | 'request'
  | 'approve'
  | 'reject'
  | 'repay'
  | 'liquidate'
  | 'extend'
  | 'cancel';

export interface LoanActivityLog {
  id: string;
  loanId: string;
  action: LoanAction;
  amount?: number;
  txHash: string;
  timestamp: string;
  details?: string;
}


export interface ContractPayload {
  type: 'entry_function_payload';
  function: string;
  type_arguments: string[];
  arguments: any[];
}

export interface ViewPayload {
  function: string;
  type_arguments: string[];
  arguments: any[];
}
