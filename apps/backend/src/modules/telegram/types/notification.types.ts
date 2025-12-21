/**
 * Notification types for the Telegram bot
 */
export enum NotificationType {
    // Loan Events
    LOAN_CREATED = 'LOAN_CREATED',
    LOAN_APPROVED = 'LOAN_APPROVED',
    LOAN_ACTIVATED = 'LOAN_ACTIVATED',
    LOAN_REPAID = 'LOAN_REPAID',
    LOAN_LIQUIDATED = 'LOAN_LIQUIDATED',
    LOAN_DUE_SOON = 'LOAN_DUE_SOON',
    LOAN_OVERDUE = 'LOAN_OVERDUE',

    // Refinance Events
    REFINANCE_AVAILABLE = 'REFINANCE_AVAILABLE',
    REFINANCE_COMPLETED = 'REFINANCE_COMPLETED',

    // Health Factor Alerts
    HEALTH_FACTOR_WARNING = 'HEALTH_FACTOR_WARNING',
    HEALTH_FACTOR_CRITICAL = 'HEALTH_FACTOR_CRITICAL',
    LIQUIDATION_RISK = 'LIQUIDATION_RISK',

    // Credit Score Events
    CREDIT_SCORE_UPDATED = 'CREDIT_SCORE_UPDATED',
    TIER_UPGRADED = 'TIER_UPGRADED',
    TIER_DOWNGRADED = 'TIER_DOWNGRADED',

    // Social/Vouching Events
    VOUCH_RECEIVED = 'VOUCH_RECEIVED',
    VOUCH_UTILIZED = 'VOUCH_UTILIZED',

    // Transaction Events
    DEPOSIT_CONFIRMED = 'DEPOSIT_CONFIRMED',
    WITHDRAWAL_CONFIRMED = 'WITHDRAWAL_CONFIRMED',

    // System Events
    WELCOME = 'WELCOME',
    DAILY_SUMMARY = 'DAILY_SUMMARY',
    PRICE_ALERT = 'PRICE_ALERT',
}

export interface NotificationPayload {
    type: NotificationType;
    userId?: string;
    chatId?: string;
    data: Record<string, any>;
}

export interface LoanNotificationData {
    loanId: string;
    amount: string;
    chain: string;
    collateralAmount?: string;
    interestRate?: string;
    dueDate?: Date;
    healthFactor?: number;
    transactionHash?: string;
}

export interface CreditScoreNotificationData {
    oldScore: number;
    newScore: number;
    oldTier: string;
    newTier: string;
    reason?: string;
}

export interface VouchNotificationData {
    voucherId: string;
    voucherAddress: string;
    amount: string;
    message?: string;
}

export interface HealthFactorNotificationData {
    loanId: string;
    currentHealthFactor: number;
    threshold: number;
    collateralValue: string;
    debtValue: string;
}

export interface TransactionNotificationData {
    type: 'deposit' | 'withdrawal';
    amount: string;
    asset: string;
    transactionHash: string;
    chain: string;
}

export interface TelegramUser {
    id: string;
    chatId: string;
    walletAddress: string;
    username?: string;
    isActive: boolean;
    preferences: NotificationPreferences;
    createdAt: Date;
}

export interface NotificationPreferences {
    loanAlerts: boolean;
    healthFactorAlerts: boolean;
    creditScoreAlerts: boolean;
    transactionAlerts: boolean;
    dailySummary: boolean;
    priceAlerts: boolean;
    marketingMessages: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
    loanAlerts: true,
    healthFactorAlerts: true,
    creditScoreAlerts: true,
    transactionAlerts: true,
    dailySummary: false,
    priceAlerts: false,
    marketingMessages: false,
};
