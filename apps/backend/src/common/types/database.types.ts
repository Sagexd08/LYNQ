
export enum ReputationTier {
    BRONZE = 'BRONZE',
    SILVER = 'SILVER',
    GOLD = 'GOLD',
    PLATINUM = 'PLATINUM',
}

export enum LoanStatus {
    PENDING = 'PENDING',
    ACTIVE = 'ACTIVE',
    REPAID = 'REPAID',
    DEFAULTED = 'DEFAULTED',
    LIQUIDATED = 'LIQUIDATED',
}

export enum CollateralStatus {
    LOCKED = 'LOCKED',
    UNLOCKED = 'UNLOCKED',
    LIQUIDATED = 'LIQUIDATED',
}

export enum AuditOutcome {
    PASS = 'PASS',
    FAIL = 'FAIL',
    WARN = 'WARN',
}

export interface User {
    id: string;
    email: string;
    password?: string;
    walletAddresses?: Record<string, string>;
    reputationTier: ReputationTier;
    reputationPoints: number;
    kycVerified: boolean;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    loans?: Loan[]; 
}

export interface LoanMetadata {
    onChainId?: string;
    riskFlags?: string[];
    riskScore?: number;
    auditLogId?: string;
    [key: string]: any; 
}

export interface Loan {
    id: string;
    userId: string;
    user?: User; 
    amount: string;
    outstandingAmount: string;
    chain: string;
    collateralTokenAddress: string;
    collateralAmount: string;
    interestRate: string;
    durationDays: number;
    status: LoanStatus;
    contractAddress?: string;
    transactionHash?: string;
    startDate?: Date;
    dueDate?: Date;
    repaidDate?: Date;
    metadata?: LoanMetadata;
    createdAt: Date;
    updatedAt: Date;
}

export interface Repayment {
    id: string;
    loanId: string;
    amount: string;
    currency: string;
    transactionHash: string;
    status: string;
    createdAt: Date;
}

export interface Collateral {
    id: string;
    userId: string;
    tokenAddress: string;
    amount: string;
    status: CollateralStatus;
    lastValuation?: string | null;
    lastValuationAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface AuditLog {
    id: string;
    action: string;
    resource?: string | null;
    userId?: string | null;
    riskScore?: number | null;
    riskLevel?: string | null;
    recommendation?: string | null;
    confidence?: number | null;
    metadata?: any;
    createdAt: Date;
}

export interface LearningModule {
    id: string;
    title: string;
    description: string;
    content: string;
    video_url?: string;
    difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    points_reward: number;
    created_at: Date;
}

export interface LearningProgress {
    id: string;
    user_id: string;
    module_id: string;
    status: 'STARTED' | 'COMPLETED';
    score: number;
    completed_at?: Date;
    created_at: Date;
    module?: LearningModule;
}

export interface QuizAttempt {
    id: string;
    user_id: string;
    module_id: string;
    answers: Record<string, any>;
    score: number;
    passed: boolean;
    created_at: Date;
}

