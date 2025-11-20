export const COIN_LIST = [
  "bitcoin",
  "ethereum", 
  "uniswap",
  "aave",
  "curve-dao-token",
  "chainlink",
  "litecoin",
  "maker",
  "compound-governance-token",
  "the-graph",
  "optimism",
  "arbitrum",
  "avalanche-2",
  "solana",
  "toncoin"
].join(",");

export const API_ENDPOINTS = {
  MAINNET: "https://mainnet.infura.io/v3/",
  TESTNET: "https://sepolia.infura.io/v3/",
  COINGECKO: "https://api.coingecko.com/api/v3/coins/markets",
  BACKEND: "http://localhost:3000/api/v1"
} as const;

export const REQUEST_TIMEOUT = 10000;
