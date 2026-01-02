
export const CONTRACTS = {
  LOAN_PLATFORM: "0x1234567890123456789012345678901234567890", 
};
export const NETWORKS = {
  MAINNET: {
    chainId: 1,
    name: "Ethereum Mainnet",
    rpcUrl: "https:
    blockExplorer: "https:
  },
  SEPOLIA: {
    chainId: 11155111,
    name: "Sepolia Testnet",
    rpcUrl: "https:
    blockExplorer: "https:
  },
  LOCALHOST: {
    chainId: 31337,
    name: "Localhost",
    rpcUrl: "http:
    blockExplorer: "http:
  }
};
export const LOAN_CONSTANTS = {
  REPUTATION_SCALE: 1000,
  BASE_INTEREST_RATE: 500, 
  MAX_INTEREST_RATE: 2000, 
  PLATFORM_FEE: 100, 
  MAX_LOAN_DURATION: 365 * 24 * 60 * 60, 
  MIN_LOAN_AMOUNT: "0.01", 
  MAX_LOAN_AMOUNT: "100", 
};
export const TOKENS = {
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    address: "0x0000000000000000000000000000000000000000", 
    icon: "⟠",
    coingeckoId: "ethereum"
  }
};
export const API_ENDPOINTS = {
  COINGECKO: "https:
  ETHERSCAN: "https:
};
export const SUPPORTED_WALLETS = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: "🦊",
    downloadUrl: "https:
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: "🔷",
    downloadUrl: "https:
  },
  {
    id: "walletconnect",
    name: "WalletConnect",
    icon: "🔗",
    downloadUrl: "https:
  }
];
export const INTEREST_RATE_PARAMS = {
  BASE_RATE: 0.05, 
  REPUTATION_MULTIPLIER: 0.5, 
  MAX_RATE: 0.25, 
  MIN_RATE: 0.02, 
};
export const REPUTATION_PARAMS = {
  NEW_USER_SCORE: 500, 
  MAX_SCORE: 1000,
  MIN_SCORE: 0,
  REPAYMENT_WEIGHT: 0.7, 
  TIMELINESS_WEIGHT: 0.2, 
  VOLUME_WEIGHT: 0.1, 
};
export const UI_CONSTANTS = {
  TOAST_DURATION: 3000, 
  ANIMATION_DURATION: 300, 
  DEBOUNCE_DELAY: 500, 
  ITEMS_PER_PAGE: 10,
};
export const DEFAULT_LOAN_TERMS = [
  { days: 7, label: "7 days", apr: "6.5%" },
  { days: 30, label: "30 days", apr: "8.2%" },
  { days: 90, label: "90 days", apr: "9.5%" },
  { days: 180, label: "180 days", apr: "11.0%" },
  { days: 365, label: "1 year", apr: "15.0%" }
];
export const COLLATERAL_OPTIONS = [
  {
    value: "eth",
    label: "ETH Token",
    ltv: "80%", 
    minimumAmount: "0.1"
  },
  {
    value: "nft",
    label: "NFT Collection",
    ltv: "60%",
    minimumAmount: "1"
  },
  {
    value: "token",
    label: "ERC-20 Tokens",
    ltv: "70%",
    minimumAmount: "100"
  }
];
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: "Please connect your wallet first",
  INSUFFICIENT_BALANCE: "Insufficient balance for this transaction",
  INVALID_AMOUNT: "Please enter a valid amount",
  NETWORK_ERROR: "Network error. Please try again.",
  TRANSACTION_FAILED: "Transaction failed. Please try again.",
  CONTRACT_ERROR: "Smart contract error. Please contact support.",
};
export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: "Wallet connected successfully",
  LOAN_CREATED: "Loan created successfully",
  LOAN_REPAID: "Loan repaid successfully",
  TRANSACTION_CONFIRMED: "Transaction confirmed",
};
