import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers, Contract, Wallet, JsonRpcProvider } from 'ethers';
import { PrismaService } from '../prisma/prisma.service';

const LOAN_CORE_ABI = [
    "function createLoan(uint256 amount, uint256 interestRate, uint256 termDays) external returns (bytes32)",
    "function activateLoan(bytes32 loanId) external",
    "function repay(bytes32 loanId) external payable",
    "function markDefaulted(bytes32 loanId) external",
    "function liquidate(bytes32 loanId) external",
    "function calculateTotalOwed(bytes32 loanId) external view returns (uint256)",
    "function getLoan(bytes32 loanId) external view returns (tuple(bytes32 loanId, address borrower, uint256 amount, uint256 interestRate, uint256 termDays, uint256 createdAt, uint256 dueDate, uint256 amountRepaid, uint8 status))",
    "function isOverdue(bytes32 loanId) external view returns (bool)",
    "event LoanCreated(bytes32 indexed loanId, address indexed borrower, uint256 amount, uint256 interestRate, uint256 termDays, uint256 dueDate)",
    "event LoanActivated(bytes32 indexed loanId, uint256 timestamp)",
    "event LoanRepayment(bytes32 indexed loanId, address indexed borrower, uint256 amount, uint256 totalRepaid, bool isFullyRepaid)",
    "event LoanRepaid(bytes32 indexed loanId, uint256 timestamp)",
    "event LoanDefaulted(bytes32 indexed loanId, uint256 timestamp)",
    "event LoanLiquidated(bytes32 indexed loanId, uint256 timestamp)"
];

const COLLATERAL_VAULT_ABI = [
    "function lockCollateral(bytes32 loanId, address token, uint256 amount) external",
    "function unlockCollateral(bytes32 loanId) external",
    "function seizeCollateral(bytes32 loanId, address recipient) external",
    "function getCollateral(bytes32 loanId) external view returns (tuple(bytes32 loanId, address depositor, address token, uint256 amount, bool isLocked)[])",
    "function getLockedAmount(bytes32 loanId, address token) external view returns (uint256)",
    "event CollateralLocked(bytes32 indexed loanId, address indexed depositor, address indexed token, uint256 amount, uint256 index)",
    "event CollateralUnlocked(bytes32 indexed loanId, address indexed recipient, address indexed token, uint256 amount)",
    "event CollateralSeized(bytes32 indexed loanId, address indexed token, uint256 amount, address recipient)"
];

const ERC20_ABI = [
    "function decimals() external view returns (uint8)"
];

export interface OnChainLoanInfo {
    loanId: string;
    borrower: string;
    amount: string;
    interestRate: number;
    termDays: number;
    createdAt: number;
    dueDate: number;
    amountRepaid: string;
    status: number;
}

@Injectable()
export class BlockchainService implements OnModuleInit {
    private readonly logger = new Logger(BlockchainService.name);
    private provider: JsonRpcProvider;
    private wallet: Wallet;
    private loanCoreContract: Contract;
    private collateralVaultContract: Contract;
    private isConnected = false;
    private tokenDecimalsCache = new Map<string, number>();

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
    ) { }

    async onModuleInit() {
        try {
            await this.initialize();
        } catch (error) {
            this.logger.warn(`Blockchain initialization failed: ${error.message}`);
            this.logger.warn('Blockchain features will be disabled');
        }
    }

    private async initialize() {
        const mantleRpcUrl = this.configService.get<string>('MANTLE_SEPOLIA_RPC_URL');
        const defaultRpcUrl = this.configService.get<string>('BLOCKCHAIN_RPC_URL');
        const rpcUrl = mantleRpcUrl || defaultRpcUrl;
        
        const privateKey = this.configService.get<string>('PRIVATE_KEY');
        const loanCoreAddress = this.configService.get<string>('LOAN_CORE_ADDRESS');
        const vaultAddress = this.configService.get<string>('COLLATERAL_VAULT_ADDRESS');

        if (!rpcUrl || !privateKey || !loanCoreAddress || !vaultAddress) {
            throw new Error('Missing blockchain configuration');
        }

        this.provider = new JsonRpcProvider(rpcUrl);
        this.wallet = new Wallet(privateKey, this.provider);

        this.loanCoreContract = new ethers.Contract(
            loanCoreAddress,
            LOAN_CORE_ABI,
            this.wallet,
        );

        this.collateralVaultContract = new ethers.Contract(
            vaultAddress,
            COLLATERAL_VAULT_ABI,
            this.wallet,
        );

        const network = await this.provider.getNetwork();
        this.logger.log(`Connected to network: ${network.name} (chainId: ${network.chainId})`);
        this.isConnected = true;
    }

    isBlockchainConnected(): boolean {
        return this.isConnected;
    }

    async createLoanOnChain(
        amount: bigint,
        interestRateBps: number,
        termDays: number,
    ): Promise<{ txHash: string; loanId: string }> {
        this.ensureConnected();

        const tx = await this.loanCoreContract.createLoan(
            amount,
            interestRateBps,
            termDays,
        );

        const receipt = await tx.wait();
        const loanCreatedEvent = receipt.logs.find(
            (log: any) => log.fragment?.name === 'LoanCreated',
        );

        const loanId = loanCreatedEvent?.args?.[0] || '';

        this.logger.log(`Loan created on-chain: ${loanId}, tx: ${receipt.hash}`);

        return {
            txHash: receipt.hash,
            loanId,
        };
    }

    async activateLoanOnChain(onChainLoanId: string): Promise<string> {
        this.ensureConnected();

        const tx = await this.loanCoreContract.activateLoan(onChainLoanId);
        const receipt = await tx.wait();

        this.logger.log(`Loan activated on-chain: ${onChainLoanId}, tx: ${receipt.hash}`);

        return receipt.hash;
    }

    async repayLoanOnChain(
        onChainLoanId: string,
        amount: bigint,
    ): Promise<string> {
        this.ensureConnected();

        const tx = await this.loanCoreContract.repay(onChainLoanId, { value: amount });
        const receipt = await tx.wait();

        this.logger.log(`Loan repayment on-chain: ${onChainLoanId}, tx: ${receipt.hash}`);

        return receipt.hash;
    }

    async getLoanFromChain(onChainLoanId: string): Promise<OnChainLoanInfo> {
        this.ensureConnected();

        const loan = await this.loanCoreContract.getLoan(onChainLoanId);

        return {
            loanId: loan.loanId,
            borrower: loan.borrower,
            amount: loan.amount.toString(),
            interestRate: Number(loan.interestRate),
            termDays: Number(loan.termDays),
            createdAt: Number(loan.createdAt),
            dueDate: Number(loan.dueDate),
            amountRepaid: loan.amountRepaid.toString(),
            status: Number(loan.status),
        };
    }

    async isLoanOverdue(onChainLoanId: string): Promise<boolean> {
        this.ensureConnected();
        return await this.loanCoreContract.isOverdue(onChainLoanId);
    }

    async lockCollateralOnChain(
        onChainLoanId: string,
        tokenAddress: string,
        amount: bigint,
    ): Promise<string> {
        this.ensureConnected();

        const tx = await this.collateralVaultContract.lockCollateral(
            onChainLoanId,
            tokenAddress,
            amount,
        );
        const receipt = await tx.wait();

        this.logger.log(`Collateral locked on-chain: ${onChainLoanId}, tx: ${receipt.hash}`);

        return receipt.hash;
    }

    async unlockCollateralOnChain(onChainLoanId: string): Promise<string> {
        this.ensureConnected();

        const tx = await this.collateralVaultContract.unlockCollateral(onChainLoanId);
        const receipt = await tx.wait();

        this.logger.log(`Collateral unlocked on-chain: ${onChainLoanId}, tx: ${receipt.hash}`);

        return receipt.hash;
    }

    async seizeCollateralOnChain(
        onChainLoanId: string,
        recipient: string,
    ): Promise<string> {
        this.ensureConnected();

        const tx = await this.collateralVaultContract.seizeCollateral(
            onChainLoanId,
            recipient,
        );
        const receipt = await tx.wait();

        this.logger.log(`Collateral seized on-chain: ${onChainLoanId}, tx: ${receipt.hash}`);

        return receipt.hash;
    }

    async getBalance(address: string): Promise<string> {
        this.ensureConnected();
        const balance = await this.provider.getBalance(address);
        return ethers.formatEther(balance);
    }

    async getCurrentBlockNumber(): Promise<number> {
        this.ensureConnected();
        return await this.provider.getBlockNumber();
    }

    private async getTokenDecimals(tokenAddress: string): Promise<number> {
        const normalizedAddress = tokenAddress.toLowerCase();
        
        // Check cache first
        if (this.tokenDecimalsCache.has(normalizedAddress)) {
            return this.tokenDecimalsCache.get(normalizedAddress)!;
        }

        try {
            const tokenContract = new ethers.Contract(
                tokenAddress,
                ERC20_ABI,
                this.provider,
            );
            const decimals = await tokenContract.decimals();
            const decimalsNumber = Number(decimals);
            
            // Cache the result
            this.tokenDecimalsCache.set(normalizedAddress, decimalsNumber);
            
            return decimalsNumber;
        } catch (error) {
            this.logger.warn(`Failed to fetch decimals for token ${tokenAddress}, defaulting to 18: ${error.message}`);
            // Default to 18 decimals if fetch fails
            const defaultDecimals = 18;
            this.tokenDecimalsCache.set(normalizedAddress, defaultDecimals);
            return defaultDecimals;
        }
    }

    async verifyCollateralDeposit(
        txHash: string,
        expectedLoanId: string | null,
        expectedToken: string,
        expectedAmount: number,
    ): Promise<boolean> {
        this.ensureConnected();

        try {
            const receipt = await this.provider.getTransactionReceipt(txHash);
            if (!receipt || receipt.status !== 1) {
                this.logger.warn(`Transaction ${txHash} failed or not found`);
                return false;
            }

            // Parse CollateralLocked events from the vault contract
            for (const log of receipt.logs) {
                try {
                    const parsed = this.collateralVaultContract.interface.parseLog({
                        topics: log.topics as string[],
                        data: log.data,
                    });

                    if (parsed?.name === 'CollateralLocked') {
                        const [loanId, depositor, token, amount] = parsed.args;
                        
                        // Verify the event matches expected values
                        if (
                            (!expectedLoanId || loanId === expectedLoanId) &&
                            token.toLowerCase() === expectedToken.toLowerCase()
                        ) {
                            // Fetch token decimals and compare using formatUnits
                            const decimals = await this.getTokenDecimals(token);
                            const formattedAmount = Number(ethers.formatUnits(amount, decimals));
                            
                            if (formattedAmount >= expectedAmount * 0.99) { // 1% tolerance
                                this.logger.log(`Verified collateral deposit: ${formattedAmount} of ${token} (decimals: ${decimals})`);
                                return true;
                            }
                        }
                    }
                } catch {
                    // Not a CollateralLocked event, skip
                }
            }

            return false;
        } catch (error) {
            this.logger.error(`Failed to verify collateral: ${error.message}`);
            return false;
        }
    }

    async verifyRepayment(
        txHash: string,
        expectedLoanId: string,
        expectedAmount: number,
    ): Promise<boolean> {
        this.ensureConnected();

        try {
            const receipt = await this.provider.getTransactionReceipt(txHash);
            if (!receipt || receipt.status !== 1) {
                return false;
            }

            for (const log of receipt.logs) {
                try {
                    const parsed = this.loanCoreContract.interface.parseLog({
                        topics: log.topics as string[],
                        data: log.data,
                    });

                    if (parsed?.name === 'LoanRepayment') {
                        const [loanId, borrower, amount] = parsed.args;
                        
                        if (
                            loanId === expectedLoanId &&
                            Number(ethers.formatEther(amount)) >= expectedAmount * 0.99
                        ) {
                            return true;
                        }
                    }
                } catch {
                    // Skip non-matching logs
                }
            }

            return false;
        } catch (error) {
            this.logger.error(`Failed to verify repayment: ${error.message}`);
            return false;
        }
    }

    async markLoanDefaulted(onChainLoanId: string): Promise<string> {
        this.ensureConnected();

        const tx = await this.loanCoreContract.markDefaulted(onChainLoanId);
        const receipt = await tx.wait();

        this.logger.log(`Loan marked as defaulted on-chain: ${onChainLoanId}, tx: ${receipt.hash}`);

        return receipt.hash;
    }

    async seizeCollateral(onChainLoanId: string): Promise<string> {
        this.ensureConnected();

        // Get the wallet address as the recipient for seized collateral
        const recipient = await this.wallet.getAddress();

        const tx = await this.collateralVaultContract.seizeCollateral(
            onChainLoanId,
            recipient,
        );
        const receipt = await tx.wait();

        this.logger.log(`Collateral seized on-chain: ${onChainLoanId}, tx: ${receipt.hash}`);

        return receipt.hash;
    }

    private ensureConnected() {
        if (!this.isConnected) {
            throw new Error('Blockchain service is not connected');
        }
    }
}
