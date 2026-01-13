// Authentication Types
export interface WalletChallengeRequest {
  walletAddress: string;
}

export interface WalletChallengeResponse {
  nonce: string;
  message: string;
}

export interface WalletVerifyRequest {
  walletAddress: string;
  signature: string;
  nonce: string; // Required - nonce from challenge response
}

export interface WalletVerifyResponse {
  accessToken: string;
  profile: {
    id: string;
    walletAddress: string;
    tier: string;
    reputationScore: number;
  };
}

export interface Profile {
  id: string;
  walletAddress: string;
  reputationScore: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  totalLoans: number;
  successfulLoans: number;
  defaultedLoans: number;
  totalBorrowed: number;
  totalRepaid: number;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

// Loan Types
export interface CreateLoanRequest {
  amount: number;
  termMonths: number;
  collateralValueUsd?: number;
  walletAgeDays?: number;
  totalTransactions?: number;
  totalVolumeUsd?: number;
  defiInteractions?: number;
}

export interface Loan {
  id: string;
  userId: string;
  amount: number;
  interestRate: number;
  termMonths: number;
  status: 'PENDING' | 'ACTIVE' | 'REPAID' | 'DEFAULTED' | 'LIQUIDATED';
  riskLevel?: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  defaultProbability?: number;
  recommendedAction?: string;
  amountRepaid: number;
  dueDate?: string;
  repaidAt?: string;
  defaultedAt?: string;
  createdAt: string;
  updatedAt: string;
  riskAssessment?: RiskAssessment;
  collaterals?: Collateral[];
}

export interface RiskAssessment {
  id: string;
  loanId: string;
  creditScore: number;
  fraudScore: number;
  anomalyScore: number;
  riskLevel: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  defaultProbability: number;
  recommendedAction: string;
  confidenceScore?: number;
  topFactors?: Array<{
    feature: string;
    impact: string;
    value: number;
    contribution: number;
  }>;
  mlModelVersion?: string;
  processingTimeMs?: number;
  isFallback: boolean;
  createdAt: string;
}

export interface Collateral {
  id: string;
  loanId: string;
  tokenAddress: string;
  tokenSymbol: string;
  amount: number;
  valueUsd: number;
  chainId: number;
  status: 'LOCKED' | 'RELEASED' | 'SEIZED';
  lockedAt: string;
  releasedAt?: string;
  seizedAt?: string;
}

export interface RepayLoanRequest {
  amount: number;
}

export interface RepayLoanResponse {
  id: string;
  loanId: string;
  amount: number;
  createdAt: string;
}

// Risk Types
export interface RiskEvaluationRequest {
  walletAddress: string;
  walletAgeDays?: number;
  totalTransactions?: number;
  totalVolumeUsd?: number;
  defiInteractions?: number;
  loanAmount: number;
  collateralValueUsd?: number;
  termMonths: number;
}

export interface RiskEvaluationResponse {
  creditScore: number;
  fraudScore: number;
  anomalyScore: number;
  riskLevel: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  defaultProbability: number;
  recommendedAction: string;
  interestRate: number;
  maxLoanAmount: number;
  fraudCheckResult: {
    isSuspicious: boolean;
    fraudScore: number;
    reasons: string[];
  };
  isFallback: boolean;
  mlModelVersion?: string;
  topFactors?: Array<{
    feature: string;
    impact: string;
    value: number;
    contribution: number;
  }>;
}

// Health Types
export interface HealthResponse {
  status: string;
  database: {
    status: string;
    responseTime?: number;
  };
  redis: {
    status: string;
    responseTime?: number;
  };
  mlService: {
    status: string;
    responseTime?: number;
  };
  blockchain: {
    status: string;
    responseTime?: number;
  };
  uptime: number;
}
