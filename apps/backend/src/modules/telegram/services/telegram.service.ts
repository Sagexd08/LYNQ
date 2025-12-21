import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    NotificationType,
    NotificationPayload,
    TelegramUser,
    NotificationPreferences,
    DEFAULT_NOTIFICATION_PREFERENCES,
} from '../types/notification.types';
import { getMessageTemplate, TemplateData } from '../templates/message.templates';

interface TelegramApiResponse {
    ok: boolean;
    result?: any;
    description?: string;
    error_code?: number;
}

interface SendMessageOptions {
    parse_mode?: 'MarkdownV2' | 'HTML' | 'Markdown';
    disable_web_page_preview?: boolean;
    disable_notification?: boolean;
    reply_markup?: any;
}

@Injectable()
export class TelegramService implements OnModuleInit {
    private readonly logger = new Logger(TelegramService.name);
    private readonly baseUrl: string;
    private readonly botToken: string;
    private isEnabled: boolean = false;

    // In-memory storage for demo - use database in production
    private readonly users: Map<string, TelegramUser> = new Map();
    private readonly walletToChatId: Map<string, string> = new Map();

    constructor(private readonly configService: ConfigService) {
        this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN', '');
        this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
    }

    async onModuleInit() {
        if (!this.botToken) {
            this.logger.warn('⚠️ TELEGRAM_BOT_TOKEN not configured - Telegram notifications disabled');
            return;
        }

        try {
            const me = await this.getMe();
            if (me.ok) {
                this.isEnabled = true;
                this.logger.log(`✅ Telegram Bot connected: @${me.result.username}`);
            }
        } catch (error) {
            this.logger.error('❌ Failed to connect to Telegram Bot API', error);
        }
    }

    /**
     * Check if Telegram notifications are enabled
     */
    isNotificationsEnabled(): boolean {
        return this.isEnabled;
    }

    /**
     * Get bot information
     */
    async getMe(): Promise<TelegramApiResponse> {
        return this.apiRequest('getMe');
    }

    /**
     * Send a text message to a chat
     */
    async sendMessage(
        chatId: string,
        text: string,
        options: SendMessageOptions = {}
    ): Promise<TelegramApiResponse> {
        if (!this.isEnabled) {
            this.logger.debug('Telegram notifications disabled, skipping message');
            return { ok: false, description: 'Telegram notifications disabled' };
        }

        const payload = {
            chat_id: chatId,
            text,
            parse_mode: options.parse_mode || 'MarkdownV2',
            disable_web_page_preview: options.disable_web_page_preview ?? true,
            disable_notification: options.disable_notification ?? false,
            ...options,
        };

        return this.apiRequest('sendMessage', payload);
    }

    /**
     * Send a notification based on type and data
     */
    async sendNotification(payload: NotificationPayload): Promise<boolean> {
        try {
            const chatId = payload.chatId || this.getChatIdByUserId(payload.userId);
            if (!chatId) {
                this.logger.warn(`No chat ID found for user: ${payload.userId}`);
                return false;
            }

            // Check user preferences
            if (payload.userId) {
                const user = this.users.get(payload.userId);
                if (user && !this.shouldSendNotification(payload.type, user.preferences)) {
                    this.logger.debug(`Notification ${payload.type} disabled for user ${payload.userId}`);
                    return false;
                }
            }

            const message = getMessageTemplate(payload.type, payload.data as TemplateData);
            const result = await this.sendMessage(chatId, message);

            if (result.ok) {
                this.logger.log(`✉️ Notification sent: ${payload.type} to ${chatId}`);
            } else {
                this.logger.error(`Failed to send notification: ${result.description}`);
            }

            return result.ok;
        } catch (error) {
            this.logger.error(`Error sending notification: ${error.message}`, error.stack);
            return false;
        }
    }

    /**
     * Send a notification to a wallet address
     */
    async notifyByWallet(
        walletAddress: string,
        type: NotificationType,
        data: Record<string, any>
    ): Promise<boolean> {
        const chatId = this.walletToChatId.get(walletAddress.toLowerCase());
        if (!chatId) {
            this.logger.debug(`No Telegram chat linked to wallet: ${walletAddress}`);
            return false;
        }

        return this.sendNotification({ type, chatId, data });
    }

    // ============ CONVENIENCE METHODS ============

    /**
     * Notify about loan creation
     */
    async notifyLoanCreated(userId: string, loanData: any): Promise<boolean> {
        return this.sendNotification({
            type: NotificationType.LOAN_CREATED,
            userId,
            data: {
                loanId: loanData.id,
                amount: loanData.amount,
                chain: loanData.chain,
                collateralAmount: loanData.collateralAmount,
                interestRate: loanData.interestRate,
            },
        });
    }

    /**
     * Notify about loan approval
     */
    async notifyLoanApproved(userId: string, loanData: any): Promise<boolean> {
        return this.sendNotification({
            type: NotificationType.LOAN_APPROVED,
            userId,
            data: {
                loanId: loanData.id,
                amount: loanData.amount,
                interestRate: loanData.interestRate,
                dueDate: loanData.dueDate,
            },
        });
    }

    /**
     * Notify about loan activation
     */
    async notifyLoanActivated(userId: string, loanData: any): Promise<boolean> {
        return this.sendNotification({
            type: NotificationType.LOAN_ACTIVATED,
            userId,
            data: {
                loanId: loanData.id,
                amount: loanData.amount,
                collateralAmount: loanData.collateralAmount,
                healthFactor: loanData.healthFactor,
                dueDate: loanData.dueDate,
                transactionHash: loanData.transactionHash,
            },
        });
    }

    /**
     * Notify about loan repayment
     */
    async notifyLoanRepaid(userId: string, loanData: any): Promise<boolean> {
        return this.sendNotification({
            type: NotificationType.LOAN_REPAID,
            userId,
            data: {
                loanId: loanData.id,
                amount: loanData.amount,
                transactionHash: loanData.transactionHash,
            },
        });
    }

    /**
     * Notify about loan liquidation
     */
    async notifyLoanLiquidated(userId: string, loanData: any): Promise<boolean> {
        return this.sendNotification({
            type: NotificationType.LOAN_LIQUIDATED,
            userId,
            data: {
                loanId: loanData.id,
                amount: loanData.amount,
                collateralAmount: loanData.collateralAmount,
                transactionHash: loanData.transactionHash,
            },
        });
    }

    /**
     * Notify about health factor warning
     */
    async notifyHealthFactorWarning(userId: string, data: any): Promise<boolean> {
        const type = data.healthFactor < 1.2
            ? NotificationType.HEALTH_FACTOR_CRITICAL
            : NotificationType.HEALTH_FACTOR_WARNING;

        return this.sendNotification({
            type,
            userId,
            data: {
                loanId: data.loanId,
                currentHealthFactor: data.healthFactor,
                threshold: 1.5,
                collateralValue: data.collateralValue,
                debtValue: data.debtValue,
            },
        });
    }

    /**
     * Notify about credit score update
     */
    async notifyCreditScoreUpdate(userId: string, data: any): Promise<boolean> {
        const type = data.newTier !== data.oldTier
            ? (data.newScore > data.oldScore
                ? NotificationType.TIER_UPGRADED
                : NotificationType.TIER_DOWNGRADED)
            : NotificationType.CREDIT_SCORE_UPDATED;

        return this.sendNotification({
            type,
            userId,
            data: {
                oldScore: data.oldScore,
                newScore: data.newScore,
                oldTier: data.oldTier,
                newTier: data.newTier,
                reason: data.reason,
            },
        });
    }

    /**
     * Notify about vouch received
     */
    async notifyVouchReceived(userId: string, data: any): Promise<boolean> {
        return this.sendNotification({
            type: NotificationType.VOUCH_RECEIVED,
            userId,
            data: {
                voucherId: data.voucherId,
                voucherAddress: data.voucherAddress,
                amount: data.amount,
                message: data.message,
            },
        });
    }

    /**
     * Notify about transaction confirmation
     */
    async notifyTransactionConfirmed(userId: string, data: any): Promise<boolean> {
        const type = data.type === 'deposit'
            ? NotificationType.DEPOSIT_CONFIRMED
            : NotificationType.WITHDRAWAL_CONFIRMED;

        return this.sendNotification({
            type,
            userId,
            data: {
                type: data.type,
                amount: data.amount,
                asset: data.asset,
                transactionHash: data.transactionHash,
                chain: data.chain,
            },
        });
    }

    /**
     * Send welcome message to new user
     */
    async sendWelcome(chatId: string): Promise<boolean> {
        return this.sendNotification({
            type: NotificationType.WELCOME,
            chatId,
            data: {},
        });
    }

    // ============ USER MANAGEMENT ============

    /**
     * Register a user for Telegram notifications
     */
    registerUser(
        userId: string,
        chatId: string,
        walletAddress: string,
        username?: string
    ): TelegramUser {
        const user: TelegramUser = {
            id: userId,
            chatId,
            walletAddress: walletAddress.toLowerCase(),
            username,
            isActive: true,
            preferences: { ...DEFAULT_NOTIFICATION_PREFERENCES },
            createdAt: new Date(),
        };

        this.users.set(userId, user);
        this.walletToChatId.set(walletAddress.toLowerCase(), chatId);

        this.logger.log(`📱 User registered for Telegram: ${userId} -> ${chatId}`);
        return user;
    }

    /**
     * Update user notification preferences
     */
    updatePreferences(userId: string, preferences: Partial<NotificationPreferences>): boolean {
        const user = this.users.get(userId);
        if (!user) return false;

        user.preferences = { ...user.preferences, ...preferences };
        this.users.set(userId, user);
        return true;
    }

    /**
     * Unregister a user from Telegram notifications
     */
    unregisterUser(userId: string): boolean {
        const user = this.users.get(userId);
        if (!user) return false;

        this.walletToChatId.delete(user.walletAddress);
        this.users.delete(userId);
        return true;
    }

    /**
     * Get user by ID
     */
    getUser(userId: string): TelegramUser | undefined {
        return this.users.get(userId);
    }

    // ============ PRIVATE METHODS ============

    private getChatIdByUserId(userId?: string): string | undefined {
        if (!userId) return undefined;
        return this.users.get(userId)?.chatId;
    }

    private shouldSendNotification(type: NotificationType, prefs: NotificationPreferences): boolean {
        // Map notification types to preference keys
        const prefMap: Partial<Record<NotificationType, keyof NotificationPreferences>> = {
            [NotificationType.LOAN_CREATED]: 'loanAlerts',
            [NotificationType.LOAN_APPROVED]: 'loanAlerts',
            [NotificationType.LOAN_ACTIVATED]: 'loanAlerts',
            [NotificationType.LOAN_REPAID]: 'loanAlerts',
            [NotificationType.LOAN_LIQUIDATED]: 'loanAlerts',
            [NotificationType.LOAN_DUE_SOON]: 'loanAlerts',
            [NotificationType.LOAN_OVERDUE]: 'loanAlerts',
            [NotificationType.HEALTH_FACTOR_WARNING]: 'healthFactorAlerts',
            [NotificationType.HEALTH_FACTOR_CRITICAL]: 'healthFactorAlerts',
            [NotificationType.LIQUIDATION_RISK]: 'healthFactorAlerts',
            [NotificationType.CREDIT_SCORE_UPDATED]: 'creditScoreAlerts',
            [NotificationType.TIER_UPGRADED]: 'creditScoreAlerts',
            [NotificationType.TIER_DOWNGRADED]: 'creditScoreAlerts',
            [NotificationType.DEPOSIT_CONFIRMED]: 'transactionAlerts',
            [NotificationType.WITHDRAWAL_CONFIRMED]: 'transactionAlerts',
            [NotificationType.DAILY_SUMMARY]: 'dailySummary',
            [NotificationType.PRICE_ALERT]: 'priceAlerts',
        };

        const prefKey = prefMap[type];
        if (!prefKey) return true; // Allow unspecified notification types

        return prefs[prefKey];
    }

    private async apiRequest(method: string, body?: any): Promise<TelegramApiResponse> {
        try {
            const url = `${this.baseUrl}/${method}`;
            const options: RequestInit = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            };

            if (body) {
                options.body = JSON.stringify(body);
            }

            const response = await fetch(url, options);
            const data = await response.json() as TelegramApiResponse;

            if (!data.ok) {
                this.logger.error(`Telegram API error: ${data.description}`);
            }

            return data;
        } catch (error) {
            this.logger.error(`Telegram API request failed: ${error.message}`);
            return { ok: false, description: error.message };
        }
    }

    /**
     * Set webhook for receiving updates (optional - for bot commands)
     */
    async setWebhook(url: string): Promise<TelegramApiResponse> {
        return this.apiRequest('setWebhook', { url });
    }

    /**
     * Delete webhook
     */
    async deleteWebhook(): Promise<TelegramApiResponse> {
        return this.apiRequest('deleteWebhook');
    }

    /**
     * Get webhook info
     */
    async getWebhookInfo(): Promise<TelegramApiResponse> {
        return this.apiRequest('getWebhookInfo');
    }
}
