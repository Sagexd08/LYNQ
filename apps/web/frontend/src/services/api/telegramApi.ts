import apiClient from './client';

export interface TelegramStatus {
    enabled: boolean;
    bot: {
        id: number;
        is_bot: boolean;
        first_name: string;
        username: string;
    } | null;
    timestamp: string;
}

export interface TelegramPreferences {
    loanAlerts: boolean;
    healthFactorAlerts: boolean;
    creditScoreAlerts: boolean;
    transactionAlerts: boolean;
    dailySummary: boolean;
    priceAlerts: boolean;
    marketingMessages: boolean;
}

export interface RegisterTelegramRequest {
    chatId: string;
    walletAddress: string;
    username?: string;
}

export interface RegisterTelegramResponse {
    success: boolean;
    message: string;
    user?: {
        id: string;
        chatId: string;
        preferences: TelegramPreferences;
    };
}

export interface PreferencesResponse {
    registered: boolean;
    chatId?: string;
    preferences: TelegramPreferences | null;
}

export interface TestNotificationRequest {
    chatId: string;
    message?: string;
}

export const telegramApi = {
    async getStatus(): Promise<TelegramStatus> {
        const response = await apiClient.get<TelegramStatus>('/telegram/status');
        return response.data;
    },

    async register(data: RegisterTelegramRequest): Promise<RegisterTelegramResponse> {
        const response = await apiClient.post<RegisterTelegramResponse>('/telegram/register', data);
        return response.data;
    },

    async unregister(): Promise<{ success: boolean; message: string }> {
        const response = await apiClient.delete<{ success: boolean; message: string }>('/telegram/unregister');
        return response.data;
    },

    async getPreferences(): Promise<PreferencesResponse> {
        const response = await apiClient.get<PreferencesResponse>('/telegram/preferences');
        return response.data;
    },

    async updatePreferences(preferences: Partial<TelegramPreferences>): Promise<{
        success: boolean;
        message: string;
        preferences?: TelegramPreferences;
    }> {
        const response = await apiClient.put('/telegram/preferences', preferences);
        return response.data;
    },

    async sendTestNotification(data: TestNotificationRequest): Promise<{
        success: boolean;
        message: string;
    }> {
        const response = await apiClient.post('/telegram/test', data);
        return response.data;
    },

    getBotLink(): string {
        const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'LYNQBot';
        return `https://t.me/${botUsername}`;
    },

    getBotUsername(): string {
        return import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'LYNQBot';
    },
};

export default telegramApi;
