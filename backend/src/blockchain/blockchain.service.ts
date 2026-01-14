import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers, Contract, Wallet, JsonRpcProvider } from 'ethers';
import { PrismaService } from '../prisma/prisma.service';

const LOAN_CORE_ABI = [
    "function createLoan(uint256 amount, uint256 collateralAmount, address collateralToken, uint256 interestRate, uint256 duration) external returns (uint256)",
    "function repayLoan(uint256 loanId, uint256 amount) external",
    "function liquidateLoan(uint256 loanId) external",
    "function getLoan(uint256 loanId) external view returns (tuple(address borrower, uint256 amount, uint256 collateralAmount, address collateralToken, uint256 collateralId, uint256 interestRate, uint256 startTime, uint256 duration, uint256 outstandingAmount, uint8 status))",
    "function getUserLoans(address user) external view returns (uint256[])",
    "function loanCounter() external view returns (uint256)",
    "function collateralVault() external view returns (address)",
    "function loanToken() external view returns (address)",
    "event LoanCreated(uint256 indexed loanId, address indexed borrower, uint256 amount, uint256 collateralAmount)",
    "event LoanRepaid(uint256 indexed loanId, uint256 amount)",
    "event LoanLiquidated(uint256 indexed loanId)"
];

const COLLATERAL_VAULT_ABI = [
    "function lockCollateral(address token, uint256 amount, uint256 loanId) external returns (uint256)",
    "function lockCollateralFor(address owner, address token, uint256 amount, uint256 loanId) external returns (uint256)",
    "function unlockCollateral(uint256 collateralId) external",
    "function getCollateralValue(uint256 collateralId) external view returns (uint256)",
    "function collaterals(uint256 collateralId) external view returns (tuple(address owner, address token, uint256 amount, uint256 loanId, bool locked))",
    "function userTokenBalance(address user, address token) external view returns (uint256)",
    "function loanCore() external view returns (address)",
    "event CollateralLocked(uint256 indexed collateralId, address indexed owner, address token, uint256 amount, uint256 loanId)",
    "event CollateralUnlocked(uint256 indexed collateralId)"
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
        collateralAmount: bigint,
        collateralToken: string,
        interestRateBps: number,
        duration: number,
    ): Promise<{ txHash: string; loanId: string }> {
        this.ensureConnected();

        const tx = await this.loanCoreContract.createLoan(
            amount,
            collateralAmount,
            collateralToken,
            interestRateBps,
            duration,
        );

        const receipt = await tx.wait();
        const loanCreatedEvent = receipt.logs.find(
            (log: any) => log.fragment?.name === 'LoanCreated',
        );

        // New contract returns uint256 loanId directly from the transaction
        let loanId: string;
        if (loanCreatedEvent?.args?.[0]) {
            loanId = loanCreatedEvent.args[0].toString();
        } else {
            // Fallback: get the latest loan counter
            const loanCounter = await this.loanCoreContract.loanCounter();
            loanId = (loanCounter - 1n).toString();
        }

        this.logger.log(`Loan created on-chain: ${loanId}, tx: ${receipt.hash}`);

        return {
            txHash: receipt.hash,
            loanId,
        };
    }

    async repayLoanOnChain(
        loanId: string,
        amount: bigint,
    ): Promise<string> {
        this.ensureConnected();

        const tx = await this.loanCoreContract.repayLoan(loanId, amount);
        const receipt = await tx.wait();

        this.logger.log(`Loan repayment on-chain: ${loanId}, tx: ${receipt.hash}`);

        return receipt.hash;
    }

    async getLoanFromChain(loanId: string): Promise<OnChainLoanInfo> {
        this.ensureConnected();

        const loan = await this.loanCoreContract.getLoan(loanId);

        return {
            loanId: loanId,
            borrower: loan.borrower,
            amount: loan.amount.toString(),
            interestRate: Number(loan.interestRate),
            termDays: Number(loan.duration),
            createdAt: Number(loan.startTime),
            dueDate: Number(loan.startTime) + Number(loan.duration),
            amountRepaid: (BigInt(loan.amount) + BigInt(loan.outstandingAmount) - BigInt(loan.outstandingAmount)).toString(), // Calculate from outstanding
            status: Number(loan.status),
        };
    }

    async isLoanOverdue(loanId: string): Promise<boolean> {
        this.ensureConnected();
        const loan = await this.loanCoreContract.getLoan(loanId);
        const currentTime = Math.floor(Date.now() / 1000);
        return currentTime > Number(loan.startTime) + Number(loan.duration) && loan.status === 1; // ACTIVE status
    }

    async lockCollateralOnChain(
        loanId: string,
        tokenAddress: string,
        amount: bigint,
    ): Promise<{ txHash: string; collateralId: string }> {
        this.ensureConnected();

        const tx = await this.collateralVaultContract.lockCollateral(
            tokenAddress,
            amount,
            loanId,
        );
        const receipt = await tx.wait();

        // Extract collateralId from event
        const collateralLockedEvent = receipt.logs.find(
            (log: any) => log.fragment?.name === 'CollateralLocked',
        );
        const collateralId = collateralLockedEvent?.args?.[0]?.toString() || '';

        this.logger.log(`Collateral locked on-chain: loanId=${loanId}, collateralId=${collateralId}, tx: ${receipt.hash}`);

        return {
            txHash: receipt.hash,
            collateralId,
        };
    }

    async unlockCollateralOnChain(collateralId: string): Promise<string> {
        this.ensureConnected();

        const tx = await this.collateralVaultContract.unlockCollateral(collateralId);
        const receipt = await tx.wait();

        this.logger.log(`Collateral unlocked on-chain: collateralId=${collateralId}, tx: ${receipt.hash}`);

        return receipt.hash;
    }

    // Note: New contract doesn't have seizeCollateral - liquidation handled via liquidateLoan
    async liquidateLoanOnChain(loanId: string): Promise<string> {
        this.ensureConnected();

        const tx = await this.loanCoreContract.liquidateLoan(loanId);
        const receipt = await tx.wait();

        this.logger.log(`Loan liquidated on-chain: ${loanId}, tx: ${receipt.hash}`);

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

    // Note: New contract uses liquidateLoan instead of markDefaulted
    async markLoanDefaulted(loanId: string): Promise<string> {
        return this.liquidateLoanOnChain(loanId);
    }

    // Note: New contract doesn't have seizeCollateral - use liquidateLoan instead
    async seizeCollateral(loanId: string): Promise<string> {
        return this.liquidateLoanOnChain(loanId);
    }

    private ensureConnected() {
        if (!this.isConnected) {
            throw new Error('Blockchain service is not connected');
        }
    }
}