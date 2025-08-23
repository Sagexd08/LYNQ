// Global type declarations for the project

// Asset imports
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

// Font imports
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

// Common wallet interface for better type safety
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

declare global {
  interface Window {
    // Aptos wallet providers with standardized interface
    aptos?: BaseWalletProvider;
    martian?: BaseWalletProvider;
    pontem?: BaseWalletProvider;
    fewcha?: BaseWalletProvider;
    rise?: BaseWalletProvider;
    nightly?: {
      aptos?: BaseWalletProvider;
    };
    // Add more wallet providers as needed
    petra?: BaseWalletProvider;
    hippo?: BaseWalletProvider;
    okx?: BaseWalletProvider;
  }

  // Vite environment variables with better typing
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  interface ImportMetaEnv {
    // App configuration
    readonly VITE_APP_NAME?: string;
    readonly VITE_APP_VERSION?: string;
    readonly VITE_APP_DESCRIPTION?: string;
    
    // Particle configuration
    readonly VITE_PARTICLE_PROJECT_ID?: string;
    readonly VITE_PARTICLE_CLIENT_KEY?: string;
    readonly VITE_PARTICLE_APP_ID?: string;
    
    // Network configuration
    readonly VITE_DEFAULT_NETWORK?: 'mainnet' | 'testnet' | 'devnet';
    readonly VITE_APTOS_NODE_URL?: string;
    readonly VITE_APTOS_FAUCET_URL?: string;
    
    // Feature flags
    readonly VITE_ENABLE_ANALYTICS?: string;
    readonly VITE_ENABLE_ERROR_REPORTING?: string;
    readonly VITE_ENABLE_DEBUG?: string;
    
    // API configuration
    readonly VITE_API_BASE_URL?: string;
    readonly VITE_API_KEY?: string;
    
    // Standard Vite env vars
    readonly DEV: boolean;
    readonly PROD: boolean;
    readonly MODE: string;
    readonly BASE_URL: string;
    readonly SSR: boolean;
    
    // Allow any other env vars for flexibility
    readonly [key: `VITE_${string}`]: string | undefined;
  }
}

// Common types for the application
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

// Utility types
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

export {};
