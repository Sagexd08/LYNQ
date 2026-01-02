import { ethers } from 'ethers';
export interface ChainConfig {
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
}
export const SUPPORTED_CHAINS: Record<string, ChainConfig> = {
    mantle: {
        chainId: 5000,
        chainIdHex: '0x1388',
        name: 'Mantle',
        rpcUrl: 'https:
        explorerUrl: 'https:
        nativeCurrency: { name: 'Mantle', symbol: 'MNT', decimals: 18 },
        isTestnet: false,
    },
    mantleSepolia: {
        chainId: 5003,
        chainIdHex: '0x138b',
        name: 'Mantle Sepolia',
        rpcUrl: 'https:
        explorerUrl: 'https:
        nativeCurrency: { name: 'Mantle', symbol: 'MNT', decimals: 18 },
        isTestnet: true,
    },
    ethereum: {
        chainId: 1,
        chainIdHex: '0x1',
        name: 'Ethereum',
        rpcUrl: 'https:
        explorerUrl: 'https:
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        isTestnet: false,
    },
    sepolia: {
        chainId: 11155111,
        chainIdHex: '0xaa36a7',
        name: 'Sepolia',
        rpcUrl: 'https:
        explorerUrl: 'https:
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        isTestnet: true,
    },
    polygon: {
        chainId: 137,
        chainIdHex: '0x89',
        name: 'Polygon',
        rpcUrl: 'https:
        explorerUrl: 'https:
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        isTestnet: false,
    },
    arbitrum: {
        chainId: 42161,
        chainIdHex: '0xa4b1',
        name: 'Arbitrum One',
        rpcUrl: 'https:
        explorerUrl: 'https:
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        isTestnet: false,
    },
};
const providerCache: Map<string, ethers.JsonRpcProvider> = new Map();
export function getProvider(chainKey: string = 'mantleSepolia'): ethers.JsonRpcProvider {
    if (providerCache.has(chainKey)) {
        return providerCache.get(chainKey)!;
    }
    const config = SUPPORTED_CHAINS[chainKey];
    if (!config) {
        throw new Error(`Unsupported chain: ${chainKey}`);
    }
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    providerCache.set(chainKey, provider);
    return provider;
}
export function getChainByChainId(chainId: number | string): { key: string; config: ChainConfig } | null {
    const numericChainId = typeof chainId === 'string' ? parseInt(chainId) : chainId;
    for (const [key, config] of Object.entries(SUPPORTED_CHAINS)) {
        if (config.chainId === numericChainId) {
            return { key, config };
        }
    }
    return null;
}
export async function getNativeBalance(
    address: string,
    chainKey: string = 'mantleSepolia'
): Promise<{ balance: string; formatted: string; symbol: string }> {
    try {
        const provider = getProvider(chainKey);
        const config = SUPPORTED_CHAINS[chainKey];
        const balanceWei = await provider.getBalance(address);
        const formatted = ethers.formatEther(balanceWei);
        return {
            balance: balanceWei.toString(),
            formatted: parseFloat(formatted).toFixed(4),
            symbol: config?.nativeCurrency?.symbol || 'ETH',
        };
    } catch (error) {
        console.error(`Error fetching balance for ${address} on ${chainKey}:`, error);
        return { balance: '0', formatted: '0.0000', symbol: 'ETH' };
    }
}
export async function getTokenBalance(
    address: string,
    tokenAddress: string,
    chainKey: string = 'mantleSepolia'
): Promise<{ balance: string; formatted: string; decimals: number }> {
    try {
        const provider = getProvider(chainKey);
        const erc20Abi = [
            'function balanceOf(address owner) view returns (uint256)',
            'function decimals() view returns (uint8)',
            'function symbol() view returns (string)',
        ];
        const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, provider);
        const [balance, decimals] = await Promise.all([
            (tokenContract as any).balanceOf(address),
            (tokenContract as any).decimals(),
        ]);
        const formatted = ethers.formatUnits(balance, decimals);
        return {
            balance: balance.toString(),
            formatted: parseFloat(formatted).toFixed(4),
            decimals,
        };
    } catch (error) {
        console.error(`Error fetching token balance:`, error);
        return { balance: '0', formatted: '0.0000', decimals: 18 };
    }
}
export async function getBlockNumber(chainKey: string = 'mantleSepolia'): Promise<number> {
    const provider = getProvider(chainKey);
    return provider.getBlockNumber();
}
export async function getGasPrice(chainKey: string = 'mantleSepolia'): Promise<string> {
    const provider = getProvider(chainKey);
    const feeData = await provider.getFeeData();
    return ethers.formatUnits(feeData.gasPrice || 0, 'gwei');
}
export async function estimateGas(
    tx: ethers.TransactionRequest,
    chainKey: string = 'mantleSepolia'
): Promise<string> {
    const provider = getProvider(chainKey);
    const gasEstimate = await provider.estimateGas(tx);
    return gasEstimate.toString();
}
export function watchBlocks(
    callback: (blockNumber: number) => void,
    chainKey: string = 'mantleSepolia'
): () => void {
    const provider = getProvider(chainKey);
    provider.on('block', callback);
    return () => {
        provider.off('block', callback);
    };
}
export async function getTransactionReceipt(
    txHash: string,
    chainKey: string = 'mantleSepolia'
): Promise<ethers.TransactionReceipt | null> {
    const provider = getProvider(chainKey);
    return provider.getTransactionReceipt(txHash);
}
export async function waitForTransaction(
    txHash: string,
    chainKey: string = 'mantleSepolia',
    confirmations: number = 1
): Promise<ethers.TransactionReceipt | null> {
    const provider = getProvider(chainKey);
    return provider.waitForTransaction(txHash, confirmations);
}
export function isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
}
export function formatAddress(address: string, chars: number = 4): string {
    if (!address) return '';
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}
export function formatBalance(balance: string | number, decimals: number = 4): string {
    const num = typeof balance === 'string' ? parseFloat(balance) : balance;
    return num.toFixed(decimals);
}
export function getExplorerUrl(
    hashOrAddress: string,
    type: 'address' | 'tx' = 'address',
    chainKey: string = 'mantleSepolia'
): string {
    const config = SUPPORTED_CHAINS[chainKey];
    if (!config) return '';
    return `${config.explorerUrl}/${type}/${hashOrAddress}`;
}
