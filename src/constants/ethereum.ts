// Ethereum-based constants for LYNQ lending platform

// Contract addresses (these would be deployed contract addresses)
export const CONTRACTS = {
  LOAN_PLATFORM: "0x1234567890123456789012345678901234567890", // Placeholder
  // Add other contract addresses as needed
};

// Network configurations
export const NETWORKS = {
  MAINNET: {
    chainId: 1,
    name: "Ethereum Mainnet",
    rpcUrl: "https://mainnet.infura.io/v3/YOUR_PROJECT_ID",
    blockExplorer: "https://etherscan.io"
  },
  SEPOLIA: {
    chainId: 11155111,
    name: "Sepolia Testnet",
    rpcUrl: "https://sepolia.infura.io/v3/YOUR_PROJECT_ID",
    blockExplorer: "https://sepolia.etherscan.io"
  },
  LOCALHOST: {
    chainId: 31337,
    name: "Localhost",
    rpcUrl: "http://localhost:8545",
    blockExplorer: "http://localhost:8545"
  }
};

// Loan platform constants
export const LOAN_CONSTANTS = {
  REPUTATION_SCALE: 1000,
  BASE_INTEREST_RATE: 500, // 5% in basis points
  MAX_INTEREST_RATE: 2000, // 20% in basis points
  PLATFORM_FEE: 100, // 1% in basis points
  MAX_LOAN_DURATION: 365 * 24 * 60 * 60, // 365 days in seconds
  MIN_LOAN_AMOUNT: "0.01", // 0.01 ETH minimum
  MAX_LOAN_AMOUNT: "100", // 100 ETH maximum
};

// Token information
export const TOKENS = {
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    address: "0x0000000000000000000000000000000000000000", // Native ETH
    icon: "⟠",
    coingeckoId: "ethereum"
  }
};

// API endpoints
export const API_ENDPOINTS = {
  COINGECKO: "https://api.coingecko.com/api/v3",
  ETHERSCAN: "https://api.etherscan.io/api",
  // Add other API endpoints as needed
};

// Wallet configurations
export const SUPPORTED_WALLETS = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: "🦊",
    downloadUrl: "https://metamask.io/"
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: "🔷",
    downloadUrl: "https://wallet.coinbase.com/"
  },
  {
    id: "walletconnect",
    name: "WalletConnect",
    icon: "🔗",
    downloadUrl: "https://walletconnect.com/"
  }
];

// Interest rate calculation parameters
export const INTEREST_RATE_PARAMS = {
  BASE_RATE: 0.05, // 5%
  REPUTATION_MULTIPLIER: 0.5, // How much reputation affects rate
  MAX_RATE: 0.25, // 25% maximum
  MIN_RATE: 0.02, // 2% minimum
};

// Reputation scoring parameters
export const REPUTATION_PARAMS = {
  NEW_USER_SCORE: 500, // Starting score for new users
  MAX_SCORE: 1000,
  MIN_SCORE: 0,
  REPAYMENT_WEIGHT: 0.7, // 70% weight for repayment history
  TIMELINESS_WEIGHT: 0.2, // 20% weight for on-time payments
  VOLUME_WEIGHT: 0.1, // 10% weight for loan volume
};

// UI Constants
export const UI_CONSTANTS = {
  TOAST_DURATION: 3000, // 3 seconds
  ANIMATION_DURATION: 300, // 300ms
  DEBOUNCE_DELAY: 500, // 500ms for search inputs
  ITEMS_PER_PAGE: 10,
};

// Default loan terms
export const DEFAULT_LOAN_TERMS = [
  { days: 7, label: "7 days", apr: "6.5%" },
  { days: 30, label: "30 days", apr: "8.2%" },
  { days: 90, label: "90 days", apr: "9.5%" },
  { days: 180, label: "180 days", apr: "11.0%" },
  { days: 365, label: "1 year", apr: "15.0%" }
];

// Collateral options for loans
export const COLLATERAL_OPTIONS = [
  {
    value: "eth",
    label: "ETH Token",
    ltv: "80%", // Loan-to-value ratio
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

// Error messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: "Please connect your wallet first",
  INSUFFICIENT_BALANCE: "Insufficient balance for this transaction",
  INVALID_AMOUNT: "Please enter a valid amount",
  NETWORK_ERROR: "Network error. Please try again.",
  TRANSACTION_FAILED: "Transaction failed. Please try again.",
  CONTRACT_ERROR: "Smart contract error. Please contact support.",
};

// Success messages
export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: "Wallet connected successfully",
  LOAN_CREATED: "Loan created successfully",
  LOAN_REPAID: "Loan repaid successfully",
  TRANSACTION_CONFIRMED: "Transaction confirmed",
};
