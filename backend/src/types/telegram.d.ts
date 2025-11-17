/**
 * Type declarations for node-telegram-bot-api
 */

declare module 'node-telegram-bot-api' {
  interface BotOptions {
    polling?: boolean | { interval: number; params?: Record<string, any> };
    webHook?: { port: number; host?: string } | { url: string };
  }

  interface SendMessageOptions {
    parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    reply_markup?: any;
    disable_web_page_preview?: boolean;
    disable_notification?: boolean;
  }

  interface Message {
    message_id: number;
    date: number;
    chat: Chat;
    from?: User;
    text?: string;
    reply_to_message?: Message;
  }

  interface Chat {
    id: number;
    type: string;
    title?: string;
    username?: string;
    first_name?: string;
    last_name?: string;
  }

  interface User {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
  }

  interface CallbackQuery {
    id: string;
    from: User;
    chat_instance: string;
    message?: Message;
    inline_message_id?: string;
    data?: string;
  }

  class TelegramBot {
    constructor(token: string, options?: BotOptions);
    
    onText(regexp: RegExp, callback: (msg: Message, match: RegExpExecArray | null) => void): void;
    on(event: string, callback: (data: any) => void): void;
    
    sendMessage(chatId: number | string, text: string, options?: SendMessageOptions): Promise<Message>;
    sendChatAction(chatId: number | string, action: string): Promise<boolean>;
    answerCallbackQuery(callbackQueryId: string, options?: Record<string, any>): Promise<boolean>;
    
    stopPolling(): Promise<void>;
    deleteWebhook(): Promise<void>;
  }

  export default TelegramBot;
}
