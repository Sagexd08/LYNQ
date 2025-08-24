// src/components/wallet/walletConfig.ts
import { useState, useEffect } from 'react';
import detectEthereumProvider from '@metamask/detect-provider';
import { CoinbaseWalletSDK } from '@coinbase/wallet-sdk';

export interface WalletResponse {
  address: string;
  publicKey?: string;
  walletName?: string;
  networkName?: string;
  chainId?: string;
}

export interface WalletProvider {
  id: string;
  name: string;
  icon: string;
  description: string;
  downloadUrl: string;
  detectMethod: () => boolean;
  connect: () => Promise<WalletResponse>;
}

export interface SavedWalletConnection {
  address: string;
  walletType: string;
  connectedAt: string;
  connected?: boolean;
  walletName?: string;
  publicKey?: string;
  networkName?: string;
  chainId?: string;
  email?: string;
  name?: string;
  social?: boolean;
}

// Initialize Coinbase Wallet SDK
const coinbaseWallet = new CoinbaseWalletSDK({
  appName: 'LYNQ',
  appLogoUrl: ''
});

const coinbaseProvider = coinbaseWallet.makeWeb3Provider();

// Available wallet providers configuration
export const walletProviders: WalletProvider[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '🦊',
    description: 'The most popular Ethereum wallet',
    downloadUrl: 'https://metamask.io/',
    detectMethod: () => !!(window.ethereum && window.ethereum.isMetaMask),
    connect: async (): Promise<WalletResponse> => {
      const provider = await detectEthereumProvider();
      if (!provider || !window.ethereum) {
        throw new Error('MetaMask wallet not found');
      }
      
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string;
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }
      
      return {
        address: accounts[0],
        walletName: 'MetaMask',
        chainId: chainId,
        networkName: getNetworkName(chainId)
      };
    }
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: '�',
    description: 'Secure wallet by Coinbase',
    downloadUrl: 'https://www.coinbase.com/wallet',
    detectMethod: () => !!(window.ethereum && window.ethereum.isCoinbaseWallet),
    connect: async (): Promise<WalletResponse> => {
      try {
        const accounts = await coinbaseProvider.request({ method: 'eth_requestAccounts' }) as string[];
        const chainId = await coinbaseProvider.request({ method: 'eth_chainId' }) as string;
        
        if (!accounts || accounts.length === 0) {
          throw new Error('No accounts found');
        }
        
        return {
          address: accounts[0],
          walletName: 'Coinbase Wallet',
          chainId: chainId,
          networkName: getNetworkName(chainId)
        };
      } catch (error) {
        throw new Error('Coinbase Wallet connection failed');
      }
    }
  }
];

// Helper function to get network name from chain ID
function getNetworkName(chainId: string): string {
  const networks: Record<string, string> = {
    '0x1': 'Ethereum Mainnet',
    '0x5': 'Goerli Testnet',
    '0xaa36a7': 'Sepolia Testnet',
    '0x89': 'Polygon Mainnet',
    '0x13881': 'Polygon Mumbai',
    '0xa': 'Optimism',
    '0xa4b1': 'Arbitrum One',
    '0x38': 'BSC Mainnet',
    '0x61': 'BSC Testnet'
  };
  return networks[chainId] || 'Unknown Network';
}

/**
 * Fast, robust wallet detection hook
 */
export const useWalletDetection = (): { detectedWallets: Record<string, boolean>; isDetecting: boolean } => {
  const [detectedWallets, setDetectedWallets] = useState<Record<string, boolean>>({});
  const [isDetecting, setIsDetecting] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    const detectWallets = () => {
      const detected: Record<string, boolean> = {};
      for (const wallet of walletProviders) {
        try {
          detected[wallet.id] = !!wallet.detectMethod();
        } catch {
          detected[wallet.id] = false;
        }
      }
      if (active) {
        setDetectedWallets(detected);
        setIsDetecting(false);
      }
    };
    detectWallets();
    const interval = setInterval(detectWallets, 1500); // Fast detection
    window.addEventListener('focus', detectWallets);
    document.addEventListener('visibilitychange', detectWallets);
    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener('focus', detectWallets);
      document.removeEventListener('visibilitychange', detectWallets);
    };
  }, []);
  return { detectedWallets, isDetecting };
};

/**
 * Connect to any supported wallet by ID
 */
export const connectToWallet = async (walletId: string): Promise<WalletResponse> => {
  const wallet = walletProviders.find(w => w.id === walletId);
  if (!wallet) throw new Error('Wallet not supported');
  return wallet.connect();
};

// Local storage keys
const WALLET_CONNECTION_KEY = 'wallet_connection';

/**
 * Save wallet connection info to localStorage
 */
export const saveWalletConnection = (connectionInfo: SavedWalletConnection): void => {
  if (!connectionInfo) return;
  try {
    localStorage.setItem(WALLET_CONNECTION_KEY, JSON.stringify(connectionInfo));
  } catch (error) {
    console.error('Failed to save wallet connection:', error);
  }
};

/**
 * Get saved wallet connection from localStorage
 */
export const getSavedWalletConnection = (): SavedWalletConnection | null => {
  try {
    const saved = localStorage.getItem(WALLET_CONNECTION_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Failed to get saved wallet connection:', error);
    return null;
  }
};

/**
 * Clear saved wallet connection from localStorage
 */
export const clearSavedWalletConnection = (): void => {
  try {
    localStorage.removeItem(WALLET_CONNECTION_KEY);
  } catch (error) {
    console.error('Failed to clear wallet connection:', error);
  }
};
