// src/config/walletConfig.js
/**
 * Configuration constants for wallet integration
 */

// Supported networks
export const NETWORKS = {
  APTOS_MAINNET: {
    id: '1',
    name: 'Aptos Mainnet',
    nodeUrl: 'https://fullnode.mainnet.aptoslabs.com/v1',
    explorer: 'https://explorer.aptoslabs.com'
  },
  APTOS_TESTNET: {
    id: '2',
    name: 'Aptos Testnet',
    nodeUrl: 'https://fullnode.testnet.aptoslabs.com/v1',
    explorer: 'https://testnet.explorer.aptoslabs.com'
  },
  APTOS_DEVNET: {
    id: '33',
    name: 'Aptos Devnet',
    nodeUrl: 'https://fullnode.devnet.aptoslabs.com/v1',
    explorer: 'https://devnet.explorer.aptoslabs.com'
  }
};

// Default network to use
export const DEFAULT_NETWORK = NETWORKS.APTOS_MAINNET;

// Local storage keys
export const STORAGE_KEYS = {
  WALLET_CONNECTION: 'wallet_connection',
  NETWORK_PREFERENCE: 'network_preference',
  AUTH_TOKEN: 'auth_token'
};

// Firebase config for Google authentication
// Replace with your actual Firebase project configuration
export const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Connection timeout in milliseconds
export const CONNECTION_TIMEOUT = 30000; // 30 seconds

// Feature flags
export const WALLET_FEATURES = {
  ENABLE_SOCIAL_LOGIN: true,
  ENABLE_MULTI_WALLET: true,
  AUTO_CONNECT_LAST_WALLET: true,
  SHOW_TESTNET_WARNING: true
};
