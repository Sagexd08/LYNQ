



export const NETWORKS = {
  ETHEREUM_MAINNET: {
    id: '1',
    name: 'Ethereum Mainnet',
    nodeUrl: 'https://mainnet.infura.io/v3/',
    explorer: 'https://etherscan.io'
  },
  ETHEREUM_SEPOLIA: {
    id: '11155111',
    name: 'Ethereum Sepolia',
    nodeUrl: 'https://sepolia.infura.io/v3/',
    explorer: 'https://sepolia.etherscan.io'
  },
  POLYGON_MAINNET: {
    id: '137',
    name: 'Polygon Mainnet',
    nodeUrl: 'https://polygon-rpc.com',
    explorer: 'https://polygonscan.com'
  }
};


export const DEFAULT_NETWORK = NETWORKS.ETHEREUM_MAINNET;


export const STORAGE_KEYS = {
  WALLET_CONNECTION: 'wallet_connection',
  NETWORK_PREFERENCE: 'network_preference',
  AUTH_TOKEN: 'auth_token'
};



export const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};


export const CONNECTION_TIMEOUT = 30000; 


export const WALLET_FEATURES = {
  ENABLE_SOCIAL_LOGIN: true,
  ENABLE_MULTI_WALLET: true,
  AUTO_CONNECT_LAST_WALLET: true,
  SHOW_TESTNET_WARNING: true
};
