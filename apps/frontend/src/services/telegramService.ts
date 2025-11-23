import axios from 'axios';
import { APP_CONFIG, ENV_CONFIG } from "../config/env";

export interface TelegramMessageOptions {
  chatId?: string | number;
  parseMode?: 'Markdown' | 'MarkdownV2' | 'HTML';
  disableNotification?: boolean;
}

const getBotToken = (): string => {
  
  const token = (ENV_CONFIG as any).VITE_TELEGRAM_BOT_TOKEN || (import.meta.env as any).VITE_TELEGRAM_BOT_TOKEN;
  return token || '';
};

const getDefaultChatId = (): string => {
  const chatId = (ENV_CONFIG as any).VITE_TELEGRAM_DEFAULT_CHAT_ID || (import.meta.env as any).VITE_TELEGRAM_DEFAULT_CHAT_ID;
  return chatId || '';
};

export const TelegramService = {
  isConfigured(): boolean {
    return Boolean(getBotToken());
  },

  async sendMessage(text: string, options: TelegramMessageOptions = {}): Promise<void> {
    const token = getBotToken();
    if (!token) return; 

    const chatId = options.chatId || getDefaultChatId();
    if (!chatId) return; 

    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    try {
      await axios.post(url, {
        chat_id: chatId,
        text,
        parse_mode: options.parseMode || 'Markdown',
        disable_notification: options.disableNotification ?? true,
      });
    } catch (error) {
      if (APP_CONFIG.enableDebugLogs) {
        console.warn('[Telegram] Failed to send message', error);
      }
    }
  },

  
  async notifyLoanGranted(params: { loanId: string; borrower: string; amountDisplay: string; aprBps?: string; dueDate?: string; }): Promise<void> {
    const { loanId, borrower, amountDisplay, aprBps, dueDate } = params;
    const text = `✅ Loan Granted\n• ID: ${loanId}\n• Borrower: ${borrower}\n• Amount: ${amountDisplay}${aprBps ? `\n• APR (bps): ${aprBps}` : ''}${dueDate ? `\n• Due: ${dueDate}` : ''}`;
    await this.sendMessage(text);
  },

  async notifyPaymentApplied(params: { loanId: string; borrower: string; amountDisplay: string; lateFine?: string; interest?: string; principal?: string; closed: boolean; }): Promise<void> {
    const { loanId, borrower, amountDisplay, lateFine, interest, principal, closed } = params;
    const text = `${closed ? '🎉 Loan Fully Repaid' : '💸 Payment Received'}\n• ID: ${loanId}\n• Borrower: ${borrower}\n• Amount: ${amountDisplay}` +
      `${lateFine ? `\n• Late fine: ${lateFine}` : ''}${interest ? `\n• Interest: ${interest}` : ''}${principal ? `\n• Principal: ${principal}` : ''}`;
    await this.sendMessage(text);
  },

  async notifyOverdue(params: { loanId: string; borrower: string; dueDate: string; totalDueDisplay?: string; }): Promise<void> {
    const { loanId, borrower, dueDate, totalDueDisplay } = params;
    const text = `⏰ Loan Overdue\n• ID: ${loanId}\n• Borrower: ${borrower}\n• Due: ${dueDate}${totalDueDisplay ? `\n• Total Due: ${totalDueDisplay}` : ''}`;
    await this.sendMessage(text);
  },
};


