
export interface NetworkConfig {
  chainId: number;
  chainIdHex: string;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  isTestnet: boolean;
  contracts: {
    loanCore: string;
    reputationPoints: string;
  };
}
export const NETWORKS: Record<string, NetworkConfig> = {
  ethereum: {
    chainId: 1,
    chainIdHex: '0x1',
    name: 'Ethereum Mainnet',
    rpcUrl: 'https:
    explorerUrl: 'https:
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    isTestnet: false,
    contracts: {
      loanCore: import.meta.env.VITE_LOAN_CORE_ADDRESS_ETHEREUM || '',
      reputationPoints: import.meta.env.VITE_REPUTATION_POINTS_ADDRESS_ETHEREUM || '',
    },
  },
  sepolia: {
    chainId: 11155111,
    chainIdHex: '0xaa36a7',
    name: 'Sepolia Testnet',
    rpcUrl: 'https:
    explorerUrl: 'https:
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    isTestnet: true,
    contracts: {
      loanCore: import.meta.env.VITE_LOAN_CORE_ADDRESS_SEPOLIA || '',
      reputationPoints: import.meta.env.VITE_REPUTATION_POINTS_ADDRESS_SEPOLIA || '',
    },
  },
  mantle: {
    chainId: 5000,
    chainIdHex: '0x1388',
    name: 'Mantle Mainnet',
    rpcUrl: 'https:
    explorerUrl: 'https:
    nativeCurrency: {
      name: 'Mantle',
      symbol: 'MNT',
      decimals: 18,
    },
    isTestnet: false,
    contracts: {
      loanCore: import.meta.env.VITE_LOAN_CORE_ADDRESS_MANTLE || '',
      reputationPoints: import.meta.env.VITE_REPUTATION_POINTS_ADDRESS_MANTLE || '',
    },
  },
  mantleSepolia: {
    chainId: 5003,
    chainIdHex: '0x138b',
    name: 'Mantle Sepolia',
    rpcUrl: 'https:
    explorerUrl: 'https:
    nativeCurrency: {
      name: 'Mantle',
      symbol: 'MNT',
      decimals: 18,
    },
    isTestnet: true,
    contracts: {
      loanCore: import.meta.env.VITE_LOAN_CORE_ADDRESS_MANTLE_SEPOLIA || '',
      reputationPoints: import.meta.env.VITE_REPUTATION_POINTS_ADDRESS_MANTLE_SEPOLIA || '',
    },
  },
  polygon: {
    chainId: 137,
    chainIdHex: '0x89',
    name: 'Polygon',
    rpcUrl: 'https:
    explorerUrl: 'https:
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    isTestnet: false,
    contracts: {
      loanCore: import.meta.env.VITE_LOAN_CORE_ADDRESS_POLYGON || '',
      reputationPoints: import.meta.env.VITE_REPUTATION_POINTS_ADDRESS_POLYGON || '',
    },
  },
  bsc: {
    chainId: 56,
    chainIdHex: '0x38',
    name: 'BNB Smart Chain',
    rpcUrl: 'https:
    explorerUrl: 'https:
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    isTestnet: false,
    contracts: {
      loanCore: import.meta.env.VITE_LOAN_CORE_ADDRESS_BSC || '',
      reputationPoints: import.meta.env.VITE_REPUTATION_POINTS_ADDRESS_BSC || '',
    },
  },
  localhost: {
    chainId: 31337,
    chainIdHex: '0x7a69',
    name: 'Localhost',
    rpcUrl: 'http:
    explorerUrl: '',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    isTestnet: true,
    contracts: {
      loanCore: import.meta.env.VITE_LOAN_CORE_ADDRESS || '',
      reputationPoints: import.meta.env.VITE_REPUTATION_POINTS_ADDRESS || '',
    },
  },
};
export function getNetworkByChainId(chainId: number): NetworkConfig | undefined {
  return Object.values(NETWORKS).find(n => n.chainId === chainId);
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
  return !!getNetworkByChainId(chainId);
}
export function getSupportedChainIds(): number[] {
  return Object.values(NETWORKS).map(n => n.chainId);
}
export function isMantleNetwork(chainId: number): boolean {
  return chainId === 5000 || chainId === 5003;
}
export function getContractsForChain(chainId: number): { loanCore: string; reputationPoints: string } | undefined {
  const network = getNetworkByChainId(chainId);
  return network?.contracts;
}
export async function switchNetwork(chainId: number): Promise<void> {
  if (!window.ethereum) throw new Error('No wallet detected');
  const network = getNetworkByChainId(chainId);
  if (!network) throw new Error('Unsupported network');
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: network.chainIdHex }],
    });
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: network.chainIdHex,
          chainName: network.name,
          nativeCurrency: network.nativeCurrency,
          rpcUrls: [network.rpcUrl],
          blockExplorerUrls: network.explorerUrl ? [network.explorerUrl] : [],
        }],
      });
    } else {
      throw switchError;
    }
  }
}
export const DEFAULT_NETWORK = import.meta.env.VITE_DEFAULT_NETWORK || 'sepolia';
export const DEFAULT_CHAIN_ID = NETWORKS[DEFAULT_NETWORK]?.chainId || 11155111;
