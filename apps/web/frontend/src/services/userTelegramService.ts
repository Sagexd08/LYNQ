export interface UserTelegramMapping {
  address: string; 
  chatId: string;  
}

const STORAGE_KEY = 'user_telegram_mappings';

function load(): UserTelegramMapping[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(mappings: UserTelegramMapping[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));
  } catch {
    
  }
}

export const UserTelegramService = {
  getChatIdForAddress(address: string): string | null {
    const mappings = load();
    const found = mappings.find(m => m.address.toLowerCase() === address.toLowerCase());
    return found?.chatId || null;
  },

  setChatIdForAddress(address: string, chatId: string): void {
    const mappings = load();
    const idx = mappings.findIndex(m => m.address.toLowerCase() === address.toLowerCase());
    if (idx >= 0) {
      if (mappings[idx]) {
        mappings[idx].chatId = chatId;
      }
    } else {
      mappings.push({ address, chatId });
    }
    save(mappings);
  },
};


