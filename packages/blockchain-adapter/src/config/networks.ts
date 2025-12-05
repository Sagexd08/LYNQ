
export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  isTestnet: boolean;
  contracts?: {
    loanCore?: string;
    reputationPoints?: string;
    flashLoanProvider?: string;
  };
}

export const NETWORKS: Record<string, NetworkConfig> = {

  ethereum: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    isTestnet: false,
  },

  sepolia: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
    explorerUrl: 'https://sepolia.etherscan.io',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    isTestnet: true,
  },

  mantle: {
    chainId: 5000,
    name: 'Mantle',
    rpcUrl: process.env.MANTLE_RPC_URL || 'https://rpc.mantle.xyz',
    explorerUrl: 'https://mantlescan.xyz',
    nativeCurrency: {
      name: 'Mantle',
      symbol: 'MNT',
      decimals: 18,
    },
    isTestnet: false,
  },

  mantleSepolia: {
    chainId: 5003,
    name: 'Mantle Sepolia Testnet',
    rpcUrl: process.env.MANTLE_SEPOLIA_RPC_URL || 'https://rpc.sepolia.mantle.xyz',
    explorerUrl: 'https://explorer.sepolia.mantle.xyz',
    nativeCurrency: {
      name: 'Mantle',
      symbol: 'MNT',
      decimals: 18,
    },
    isTestnet: true,
  },

  polygon: {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    isTestnet: false,
  },

  bsc: {
    chainId: 56,
    name: 'BNB Smart Chain',
    rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
    explorerUrl: 'https://bscscan.com',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    isTestnet: false,
  },

  localhost: {
    chainId: 31337,
    name: 'Localhost',
    rpcUrl: 'http://127.0.0.1:8545',
    explorerUrl: '',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    isTestnet: true,
  },
};

export const CHAIN_ID_TO_NETWORK: Record<number, string> = Object.entries(NETWORKS).reduce(
  (acc, [key, config]) => {
    acc[config.chainId] = key;
    return acc;
  },
  {} as Record<number, string>
);

export function getNetworkByChainId(chainId: number): NetworkConfig | undefined {
  const networkKey = CHAIN_ID_TO_NETWORK[chainId];
  return networkKey ? NETWORKS[networkKey] : undefined;
}

export function getExplorerTxUrl(chainId: number, txHash: string): string {
  const network = getNetworkByChainId(chainId);
  if (!network || !network.explorerUrl) return '';
  return `${network.explorerUrl}/tx/${txHash}`;
}

export function getExplorerAddressUrl(chainId: number, address: string): string {
  const network = getNetworkByChainId(chainId);
  if (!network || !network.explorerUrl) return '';
  return `${network.explorerUrl}/address/${address}`;
}

export function isSupportedChain(chainId: number): boolean {
  return chainId in CHAIN_ID_TO_NETWORK;
}

export function getSupportedChainIds(): number[] {
  return Object.values(NETWORKS).map((n) => n.chainId);
}

export function isMantleNetwork(chainId: number): boolean {
  return chainId === 5000 || chainId === 5003;
}

export function getMantleRpcUrl(isTestnet: boolean = false): string {
  return isTestnet ? NETWORKS.mantleSepolia.rpcUrl : NETWORKS.mantle.rpcUrl;
}
