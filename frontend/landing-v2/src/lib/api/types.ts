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
  nonce: string;
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
  onChainLoanId?: string;
  transactionHash?: string;
  isOnChain?: boolean;
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
  userId?: string;
  utilization?: number;
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

export interface LockCollateralRequest {
  loanId: string;
  tokenAddress: string;
  tokenSymbol: string;
  amount: number;
  chainId?: number;
}

export interface UnlockCollateralRequest {
  collateralId: string;
  loanId: string;
}

export interface ProtocolStats {
  totalValueLocked: number;
  activeLoans: number;
  totalUsers: number;
  defaultProbability: number;
  liquidationExposure: number;
  avgInterestRate: number;
  totalCollateral: number;
  utilizationRate: number;
  avgHealthFactor: number;
}

export interface UserPortfolio {
  totalValue: number;
  activeLoans: Loan[];
  totalBorrowed: number;
  totalRepaid: number;
  availableCredit: number;
  collaterals: Collateral[];
  healthFactor: number;
  riskLevel: number;
  transactions: Transaction[];
}

export interface Transaction {
  id: string;
  type: 'REPAYMENT' | 'BORROW' | 'COLLATERAL_ADD' | 'COLLATERAL_LOCK' | 'COLLATERAL_UNLOCK';
  amount: string;
  loanId?: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  txHash?: string;
}

export interface MarketData {
  totalMarkets: number;
  totalLiquidity: number;
  volume24h: number;
  avgApy: number;
  utilization: number;
  lendingPools: LendingPool[];
}

export interface LendingPool {
  asset: string;
  chain: string;
  apy: number;
  apr: number;
  liquidity: number;
  utilization: number;
  riskTier: 'Low' | 'Medium' | 'High';
  totalBorrowed: number;
  totalSupplied: number;
}

export interface ReputationData {
  score: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  rank?: number;
  history: Array<{
    date: string;
    score: number;
  }>;
  factors: Array<{
    name: string;
    weight: number;
    value: number;
    contribution: number;
  }>;
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    earnedAt?: string;
    isEarned: boolean;
  }>;
  nextTier?: {
    name: string;
    requiredScore: number;
    pointsNeeded: number;
  };
}

export interface DashboardData {
  protocolStats: ProtocolStats;
  userRiskProfile: {
    creditScore: number;
    riskLevel: number;
    collateralUtilization: number;
    liquidationProximity: number;
    maxBorrow: number;
    healthFactor: number;
    tier: string;
  };
  modelConfidence: {
    credit: number;
    fraud: number;
    default: number;
    ensembleAgreement: number;
  };
  recentLoans: Loan[];
  riskAlerts: Array<{
    severity: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    time: string;
  }>;
  marketSignals: Array<{
    asset: string;
    signal: string;
    change: string;
    direction: 'up' | 'down';
  }>;
}

export interface IntelligenceData {
  predictions: Array<{
    metric: string;
    current: number;
    predicted: number;
    confidence: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  insights: Array<{
    id: string;
    type: 'opportunity' | 'warning' | 'info';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    actionable: boolean;
  }>;
  riskForecasts: Array<{
    period: string;
    defaultRate: number;
    liquidationRisk: number;
    marketVolatility: number;
  }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}
