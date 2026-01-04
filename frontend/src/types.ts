export interface User {
    id: string;
    phone: string;
    status: 'active' | 'blocked';
    loans: Loan[];
    reputation?: Reputation;
}

export interface Loan {
    id: string;
    amount: number;
    dueAt: string; // ISO date string
    status: 'active' | 'repaid' | 'overdue';
    lateDays: number;
    partialExtensionUsed: boolean;
}

export interface Reputation {
    userId: string;
    score: number;
    consecutiveLateCount: number;
    cleanCycleCount: number;
}

export const ReputationEventType = {
    EARLY_REPAYMENT: 'EARLY_REPAYMENT',
    ON_TIME_REPAYMENT: 'ON_TIME_REPAYMENT',
    PARTIAL_REPAYMENT: 'PARTIAL_REPAYMENT',
    LATE_REPAYMENT: 'LATE_REPAYMENT',
    CONSECUTIVE_LATE_BLOCK: 'CONSECUTIVE_LATE_BLOCK',
    RECOVERY: 'RECOVERY',
    UNBLOCK: 'UNBLOCK',
    ADMIN_ADJUSTMENT: 'ADMIN_ADJUSTMENT',
} as const;

export type ReputationEventType = typeof ReputationEventType[keyof typeof ReputationEventType];


export interface ReputationEvent {
    id: string;
    type: ReputationEventType;
    delta: number;
    previousScore: number;
    newScore: number;
    reason?: string;
    createdAt: string;
}
