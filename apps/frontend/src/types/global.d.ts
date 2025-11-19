


declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}


declare module '*.ttf' {
  const content: string;
  export default content;
}

declare module '*.woff' {
  const content: string;
  export default content;
}

declare module '*.woff2' {
  const content: string;
  export default content;
}


interface WalletAccount {
  address: string;
  publicKey?: string;
}

interface WalletTransaction {
  hash: string;
}

interface WalletNetwork {
  name: string;
  chainId: string;
  url: string;
}

interface BaseWalletProvider {
  connect(): Promise<WalletAccount>;
  disconnect(): Promise<void>;
  account(): Promise<WalletAccount>;
  signAndSubmitTransaction(transaction: any): Promise<WalletTransaction>;
  signTransaction?(transaction: any): Promise<any>;
  network?(): Promise<WalletNetwork>;
  isConnected?(): Promise<boolean>;
}


interface EthereumProvider {
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  request(args: { method: string; params?: any[] }): Promise<any>;
  on(event: string, handler: (...args: any[]) => void): void;
  removeListener(event: string, handler: (...args: any[]) => void): void;
}

declare global {
  interface Window {
    
    ethereum?: EthereumProvider;
  }

  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  interface ImportMetaEnv {
    
    readonly VITE_APP_NAME?: string;
    readonly VITE_APP_VERSION?: string;
    readonly VITE_APP_DESCRIPTION?: string;
    
    
    readonly VITE_PARTICLE_PROJECT_ID?: string;
    readonly VITE_PARTICLE_CLIENT_KEY?: string;
    readonly VITE_PARTICLE_APP_ID?: string;
    
    
    readonly VITE_DEFAULT_NETWORK?: 'mainnet' | 'testnet' | 'sepolia';
    readonly VITE_ETHEREUM_NODE_URL?: string;
    readonly VITE_INFURA_PROJECT_ID?: string;
    
    
    readonly VITE_ENABLE_ANALYTICS?: string;
    readonly VITE_ENABLE_ERROR_REPORTING?: string;
    readonly VITE_ENABLE_DEBUG?: string;
    
    
    readonly VITE_API_BASE_URL?: string;
    readonly VITE_API_KEY?: string;
    
    
    readonly DEV: boolean;
    readonly PROD: boolean;
    readonly MODE: string;
    readonly BASE_URL: string;
    readonly SSR: boolean;
    
    
    readonly [key: `VITE_${string}`]: string | undefined;
  }
}


export interface AppError extends Error {
  code?: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}


export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

export {};
