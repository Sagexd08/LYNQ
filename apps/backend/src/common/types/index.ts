

import { Request } from 'express';


export interface JwtPayload {
    sub: string;
    email?: string;
    wallet?: string;
    iat?: number;
    exp?: number;
}


export interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        sub?: string;
        email?: string;
        wallet?: string;
    };
}


export interface SafeUserResponse {
    id: string;
    email: string;
    walletAddresses?: Record<string, string>;
    reputationTier: string;
    reputationPoints: number;
    kycVerified: boolean;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}


export interface AuthResponse {
    access_token: string;
    user: SafeUserResponse;
}


export interface LoanMetadata {
    onChainId?: string;
    riskFlags?: string[];
    [key: string]: unknown;
}


export interface EligibilityResult {
    eligible: boolean;
    riskScore?: number;
    flags: string[];
}


export interface RefinanceOfferResult {
    success: boolean;
    proposal: {
        loanId: unknown;
        newInterestRate: number;
        newDuration: number;
        timestamp: number;
        nonce: number;
    };
    signature: string;
    betterTerms: {
        oldRate: number;
        newRate: number;
        improvement: string;
    };
}


export interface CreditScoreBreakdown {
    paymentHistory: number;
    utilization: number;
    accountAge: number;
    reputation: number;
    diversification: number;
    aiAdjustment: number;
}


export interface CreditScoreResult {
    score: number;
    grade: string;
    breakdown: CreditScoreBreakdown;
}


export interface LoanEventArgs {
    loanId: bigint;
    borrower?: string;
    amount?: bigint;
    payer?: string;
    liquidator?: string;
}


export interface BlockchainEvent {
    args: [bigint, ...unknown[]];
    blockNumber: number;
    transactionHash: string;
}


export interface BaseMlModelInput {
    modelId?: string;
    trainingData?: unknown[];
    parameters?: Record<string, unknown>;
}


export interface TelegramUpdate {
    update_id?: number;
    message?: {
        message_id?: number;
        text?: string;
        chat: {
            id: number;
            type?: string;
        };
        from?: {
            id: number;
            username?: string;
            first_name?: string;
        };
    };
}
