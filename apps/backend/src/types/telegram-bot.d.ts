/**
 * Type declarations for node-telegram-bot-api
 * Since @types/node-telegram-bot-api doesn't exist, we'll provide our own definitions
 */

declare module 'node-telegram-bot-api' {
  interface TelegramBotOptions {
    polling?: boolean;
    webHook?: {
      host: string;
      port: number;
      key?: string;
      cert?: string;
    };
  }

  interface Message {
    message_id: number;
    date: number;
    chat: {
      id: number;
      type: string;
      first_name?: string;
      last_name?: string;
      username?: string;
    };
    from?: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    text?: string;
    entities?: any[];
  }

  interface CallbackQuery {
    id: string;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat_instance: string;
    message?: Message;
    data?: string;
  }

  interface InlineKeyboardButton {
    text: string;
    callback_data?: string;
    url?: string;
  }

  interface ReplyMarkup {
    inline_keyboard?: InlineKeyboardButton[][];
    keyboard?: any[][];
    remove_keyboard?: boolean;
  }

  class TelegramBot {
    constructor(token: string, options?: TelegramBotOptions);

    onText(regexp: RegExp, callback: (msg: Message, match: RegExpExecArray | null) => void): void;
    on(event: string, callback: (msg: any) => void): void;
    sendMessage(chatId: string | number, text: string, options?: any): Promise<Message>;
    sendChatAction(chatId: string | number, action: string): Promise<boolean>;
    answerCallbackQuery(callbackQueryId: string, options?: any): Promise<boolean>;
    stopPolling(): void;
  }

  export default TelegramBot;
}
