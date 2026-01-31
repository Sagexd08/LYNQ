import { blockchainApiClient } from '../client';

export interface NotificationPreferences {
  telegram?: boolean;
  email?: boolean;
  push?: boolean;
}

export interface NotificationSettings {
  userId: string;
  preferences: NotificationPreferences;
  telegramChatId?: string;
  email?: string;
}

export class NotificationService {
  static async updateSettings(settings: NotificationSettings): Promise<void> {
    return blockchainApiClient.post('/notifications/settings', settings);
  }

  static async getSettings(userId: string): Promise<NotificationSettings> {
    return blockchainApiClient.get<NotificationSettings>(`/notifications/settings/${userId}`);
  }

  static async sendTestNotification(userId: string, channel: 'telegram' | 'email' | 'push'): Promise<void> {
    return blockchainApiClient.post('/notifications/test', { userId, channel });
  }

  static async getNotifications(userId: string, limit = 50): Promise<any[]> {
    return blockchainApiClient.get('/notifications', {
      params: { userId, limit },
    });
  }

  static async markAsRead(userId: string, notificationId: string): Promise<void> {
    return blockchainApiClient.post(`/notifications/${notificationId}/read`, { userId });
  }
}

