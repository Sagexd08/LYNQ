import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

export interface ChainConfig {
    name: string;
    chainId: number;
    rpcUrl: string;
    explorerUrl: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    isTestnet: boolean;
}

export type SupportedChain =
    | 'mantle'
    | 'mantleSepolia'
    | 'ethereum'
    | 'sepolia'
    | 'polygon'
    | 'polygonAmoy'
    | 'arbitrum'
    | 'arbitrumSepolia'
    | 'optimism'
    | 'optimismSepolia'
    | 'base'
    | 'baseSepolia'
    | 'bsc'
    | 'bscTestnet'
    | 'avalanche'
    | 'avalancheFuji'
    | 'localhost';

@Injectable()
export class BlockchainService {
    private readonly logger = new Logger(BlockchainService.name);
    private providers: Map<string, ethers.JsonRpcProvider> = new Map();
    private wallets: Map<string, ethers.Wallet> = new Map();

    
    private readonly defaultRpcUrls: Record<SupportedChain, string> = {
        
        mantle: 'https://rpc.mantle.xyz',
        mantleSepolia: 'https://rpc.sepolia.mantle.xyz',
        
        ethereum: 'https://eth.llamarpc.com',
        sepolia: 'https://rpc.sepolia.org',
        
        polygon: 'https://polygon-rpc.com',
        polygonAmoy: 'https://rpc-amoy.polygon.technology',
        
        arbitrum: 'https://arb1.arbitrum.io/rpc',
        arbitrumSepolia: 'https://sepolia-rollup.arbitrum.io/rpc',
        
        optimism: 'https://mainnet.optimism.io',
        optimismSepolia: 'https://sepolia.optimism.io',
        
        base: 'https://mainnet.base.org',
        baseSepolia: 'https://sepolia.base.org',
        
        bsc: 'https://bsc-dataseed.binance.org',
        bscTestnet: 'https://data-seed-prebsc-1-s1.binance.org:8545',
        
        avalanche: 'https://api.avax.network/ext/bc/C/rpc',
        avalancheFuji: 'https://api.avax-test.network/ext/bc/C/rpc',
        
        localhost: 'http://localhost:8545',
    };

    
    private readonly chains: Record<SupportedChain, ChainConfig> = {
        
        mantle: {
            name: 'Mantle',
            chainId: 5000,
            rpcUrl: this.defaultRpcUrls.mantle,
            explorerUrl: 'https://explorer.mantle.xyz',
            nativeCurrency: { name: 'Mantle', symbol: 'MNT', decimals: 18 },
            isTestnet: false,
        },
        mantleSepolia: {
            name: 'Mantle Sepolia',
            chainId: 5003,
            rpcUrl: this.defaultRpcUrls.mantleSepolia,
            explorerUrl: 'https://sepolia.mantlescan.xyz',
            nativeCurrency: { name: 'Mantle', symbol: 'MNT', decimals: 18 },
            isTestnet: true,
        },
        
        ethereum: {
            name: 'Ethereum',
            chainId: 1,
            rpcUrl: this.defaultRpcUrls.ethereum,
            explorerUrl: 'https://etherscan.io',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            isTestnet: false,
        },
        sepolia: {
            name: 'Sepolia',
            chainId: 11155111,
            rpcUrl: this.defaultRpcUrls.sepolia,
            explorerUrl: 'https://sepolia.etherscan.io',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            isTestnet: true,
        },
        
        polygon: {
            name: 'Polygon',
            chainId: 137,
            rpcUrl: this.defaultRpcUrls.polygon,
            explorerUrl: 'https://polygonscan.com',
            nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
            isTestnet: false,
        },
        polygonAmoy: {
            name: 'Polygon Amoy',
            chainId: 80002,
            rpcUrl: this.defaultRpcUrls.polygonAmoy,
            explorerUrl: 'https://amoy.polygonscan.com',
            nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
            isTestnet: true,
        },
        
        arbitrum: {
            name: 'Arbitrum One',
            chainId: 42161,
            rpcUrl: this.defaultRpcUrls.arbitrum,
            explorerUrl: 'https://arbiscan.io',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            isTestnet: false,
        },
        arbitrumSepolia: {
            name: 'Arbitrum Sepolia',
            chainId: 421614,
            rpcUrl: this.defaultRpcUrls.arbitrumSepolia,
            explorerUrl: 'https://sepolia.arbiscan.io',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            isTestnet: true,
        },
        
        optimism: {
            name: 'Optimism',
            chainId: 10,
            rpcUrl: this.defaultRpcUrls.optimism,
            explorerUrl: 'https://optimistic.etherscan.io',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            isTestnet: false,
        },
        optimismSepolia: {
            name: 'Optimism Sepolia',
            chainId: 11155420,
            rpcUrl: this.defaultRpcUrls.optimismSepolia,
            explorerUrl: 'https://sepolia-optimism.etherscan.io',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            isTestnet: true,
        },
        
        base: {
            name: 'Base',
            chainId: 8453,
            rpcUrl: this.defaultRpcUrls.base,
            explorerUrl: 'https://basescan.org',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            isTestnet: false,
        },
        baseSepolia: {
            name: 'Base Sepolia',
            chainId: 84532,
            rpcUrl: this.defaultRpcUrls.baseSepolia,
            explorerUrl: 'https://sepolia.basescan.org',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            isTestnet: true,
        },
        
        bsc: {
            name: 'BNB Smart Chain',
            chainId: 56,
            rpcUrl: this.defaultRpcUrls.bsc,
            explorerUrl: 'https://bscscan.com',
            nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
            isTestnet: false,
        },
        bscTestnet: {
            name: 'BSC Testnet',
            chainId: 97,
            rpcUrl: this.defaultRpcUrls.bscTestnet,
            explorerUrl: 'https://testnet.bscscan.com',
            nativeCurrency: { name: 'BNB', symbol: 'tBNB', decimals: 18 },
            isTestnet: true,
        },
        
        avalanche: {
            name: 'Avalanche C-Chain',
            chainId: 43114,
            rpcUrl: this.defaultRpcUrls.avalanche,
            explorerUrl: 'https://snowtrace.io',
            nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
            isTestnet: false,
        },
        avalancheFuji: {
            name: 'Avalanche Fuji',
            chainId: 43113,
            rpcUrl: this.defaultRpcUrls.avalancheFuji,
            explorerUrl: 'https://testnet.snowtrace.io',
            nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
            isTestnet: true,
        },
        
        localhost: {
            name: 'Localhost',
            chainId: 31337,
            rpcUrl: this.defaultRpcUrls.localhost,
            explorerUrl: '',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            isTestnet: true,
        },
    };

    
    private readonly envVarMapping: Record<SupportedChain, string> = {
        mantle: 'MANTLE_RPC_URL',
        mantleSepolia: 'MANTLE_SEPOLIA_RPC_URL',
        ethereum: 'ETHEREUM_RPC_URL',
        sepolia: 'SEPOLIA_RPC_URL',
        polygon: 'POLYGON_RPC_URL',
        polygonAmoy: 'POLYGON_AMOY_RPC_URL',
        arbitrum: 'ARBITRUM_RPC_URL',
        arbitrumSepolia: 'ARBITRUM_SEPOLIA_RPC_URL',
        optimism: 'OPTIMISM_RPC_URL',
        optimismSepolia: 'OPTIMISM_SEPOLIA_RPC_URL',
        base: 'BASE_RPC_URL',
        baseSepolia: 'BASE_SEPOLIA_RPC_URL',
        bsc: 'BSC_RPC_URL',
        bscTestnet: 'BSC_TESTNET_RPC_URL',
        avalanche: 'AVALANCHE_RPC_URL',
        avalancheFuji: 'AVALANCHE_FUJI_RPC_URL',
        localhost: 'LOCALHOST_RPC_URL',
    };

    constructor(private readonly configService: ConfigService) {
        this.initializeProviders();
    }

    private initializeProviders(): void {
        const privateKey = this.configService.get<string>('PRIVATE_KEY');

        
        for (const [chainKey, chainConfig] of Object.entries(this.chains)) {
            const envVar = this.envVarMapping[chainKey as SupportedChain];
            const rpcUrl = this.configService.get<string>(envVar, chainConfig.rpcUrl);

            try {
                const provider = new ethers.JsonRpcProvider(rpcUrl);
                this.providers.set(chainKey, provider);

                
                if (privateKey) {
                    this.wallets.set(chainKey, new ethers.Wallet(privateKey, provider));
                }

                this.logger.debug(`Initialized provider for ${chainConfig.name} at ${rpcUrl}`);
            } catch (error) {
                this.logger.warn(`Failed to initialize provider for ${chainConfig.name}: ${error}`);
            }
        }

        this.logger.log(`Initialized ${this.providers.size} chain providers`);
        if (privateKey) {
            this.logger.log(`Wallets initialized for ${this.wallets.size} chains`);
        } else {
            this.logger.warn('PRIVATE_KEY not set - wallets not initialized');
        }
    }

    
    getSupportedChains(): ChainConfig[] {
        return Object.values(this.chains);
    }

    
    getTestnetChains(): ChainConfig[] {
        return Object.values(this.chains).filter(c => c.isTestnet);
    }

    
    getMainnetChains(): ChainConfig[] {
        return Object.values(this.chains).filter(c => !c.isTestnet);
    }

    
    getProvider(chain: SupportedChain = 'mantleSepolia'): ethers.JsonRpcProvider {
        const provider = this.providers.get(chain);
        if (!provider) {
            throw new Error(`Provider not found for chain: ${chain}`);
        }
        return provider;
    }

    
    getWallet(chain: SupportedChain = 'mantleSepolia'): ethers.Wallet {
        const wallet = this.wallets.get(chain);
        if (!wallet) {
            throw new Error(`Wallet not found for chain: ${chain}. Is PRIVATE_KEY set?`);
        }
        return wallet;
    }

    
    getChainConfig(chain: SupportedChain): ChainConfig {
        const config = this.chains[chain];
        if (!config) {
            throw new Error(`Chain config not found: ${chain}`);
        }
        return config;
    }

    
    getChainByChainId(chainId: number): { key: SupportedChain; config: ChainConfig } | null {
        for (const [key, config] of Object.entries(this.chains)) {
            if (config.chainId === chainId) {
                return { key: key as SupportedChain, config };
            }
        }
        return null;
    }

    
    async getBalance(address: string, chain: SupportedChain = 'mantleSepolia'): Promise<string> {
        const provider = this.getProvider(chain);
        const balance = await provider.getBalance(address);
        return ethers.formatEther(balance);
    }

    
    async getBlockNumber(chain: SupportedChain = 'mantleSepolia'): Promise<number> {
        const provider = this.getProvider(chain);
        return provider.getBlockNumber();
    }

    
    async getGasPrice(chain: SupportedChain = 'mantleSepolia'): Promise<string> {
        const provider = this.getProvider(chain);
        const feeData = await provider.getFeeData();
        return ethers.formatUnits(feeData.gasPrice || 0, 'gwei');
    }

    
    getContract(
        address: string,
        abi: ethers.InterfaceAbi,
        chain: SupportedChain = 'mantleSepolia',
        useSigner: boolean = false
    ): ethers.Contract {
        const provider = this.getProvider(chain);
        if (useSigner) {
            const wallet = this.getWallet(chain);
            return new ethers.Contract(address, abi, wallet);
        }
        return new ethers.Contract(address, abi, provider);
    }

    
    async sendTransaction(
        to: string,
        value: string,
        data: string = '0x',
        chain: SupportedChain = 'mantleSepolia'
    ): Promise<ethers.TransactionResponse> {
        const wallet = this.getWallet(chain);
        const tx = await wallet.sendTransaction({
            to,
            value: ethers.parseEther(value),
            data,
        });
        this.logger.log(`Transaction sent on ${chain}: ${tx.hash}`);
        return tx;
    }

    
    async waitForTransaction(
        txHash: string,
        chain: SupportedChain = 'mantleSepolia',
        confirmations: number = 1
    ): Promise<ethers.TransactionReceipt | null> {
        const provider = this.getProvider(chain);
        return provider.waitForTransaction(txHash, confirmations);
    }

    
    async isChainHealthy(chain: SupportedChain): Promise<boolean> {
        try {
            const provider = this.getProvider(chain);
            await provider.getBlockNumber();
            return true;
        } catch {
            return false;
        }
    }

    
    async getAllChainsHealth(): Promise<Record<string, boolean>> {
        const health: Record<string, boolean> = {};
        for (const chain of Object.keys(this.chains) as SupportedChain[]) {
            health[chain] = await this.isChainHealthy(chain);
        }
        return health;
    }
}
