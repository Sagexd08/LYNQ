import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { Loan, LoanStatus } from '../loan/entities/loan.entity';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/services/user.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

@Injectable()
export class IndexerService implements OnModuleInit {
    private readonly logger = new Logger(IndexerService.name);
    private contract!: ethers.Contract;
    private isScanning = false;
    private lastProcessedBlock = 0;

    // Use Mantle Sepolia address by default
    private readonly LOAN_CORE_ADDRESS = '0x16fB626C9Ef59aa865366d086931FAcfDc70490F';

    private readonly ABI = [
        "event LoanCreated(uint256 indexed loanId, address indexed borrower, uint256 amount)",
        "event LoanRepaid(uint256 indexed loanId, uint256 amount, address indexed payer)",
        "event LoanLiquidated(uint256 indexed loanId, address indexed liquidator)",
        "function getLoan(uint256 loanId) external view returns (uint256 amount, uint256 collateral, uint256 interestRate, uint256 dueDate, uint8 status)"
    ];

    constructor(
        private readonly userService: UserService,
        private readonly blockchainService: BlockchainService,
        private readonly configService: ConfigService,
        private readonly supabaseService: SupabaseService,
    ) { }

    private get supabase() {
        return this.supabaseService.getClient();
    }

    async onModuleInit() {
        // Delay start slightly to ensure connections
        setTimeout(() => this.initializeListener(), 5000);
    }

    private initializeListener() {
        const address = this.configService.get('LOAN_CORE_ADDRESS') || this.LOAN_CORE_ADDRESS;

        try {
            // Check if chain healthy
            this.contract = this.blockchainService.getContract(address, this.ABI, 'mantleSepolia');
            this.logger.log(`Starting Blockchain Indexer for LoanCore at ${address}`);

            // Start polling loop - 10 seconds
            setInterval(() => this.scanBlocks(), 10000);
        } catch (e) {
            this.logger.error("Failed to initialize indexer contract", e);
        }
    }

    private async scanBlocks() {
        if (this.isScanning) return;
        this.isScanning = true;

        try {
            const provider = this.blockchainService.getProvider('mantleSepolia');
            const currentBlock = await provider.getBlockNumber();

            // Initialize last processed block if first run
            if (this.lastProcessedBlock === 0) {
                this.lastProcessedBlock = currentBlock - 1000; // Start looking some blocks back
            }

            const fromBlock = this.lastProcessedBlock + 1;
            const toBlock = currentBlock; // Can limit chunk size if needed

            if (fromBlock > toBlock) {
                this.isScanning = false;
                return;
            }

            this.logger.debug(`Scanning blocks ${fromBlock} to ${toBlock}`);

            // 1. Handle Repayments
            const repaymentEvents = await this.contract.queryFilter(this.contract.filters.LoanRepaid(), fromBlock, toBlock);
            for (const event of repaymentEvents) {
                await this.handleLoanRepaid(event);
            }

            // 2. Handle Liquidations
            // Note: Ensure ABI supports LoanLiquidated
            const liquidationEvents = await this.contract.queryFilter(this.contract.filters.LoanLiquidated(), fromBlock, toBlock);
            for (const event of liquidationEvents) {
                await this.handleLoanLiquidated(event);
            }

            // 3. Handle Creations
            const createdEvents = await this.contract.queryFilter(this.contract.filters.LoanCreated(), fromBlock, toBlock);
            for (const event of createdEvents) {
                await this.handleLoanCreated(event);
            }

            this.lastProcessedBlock = toBlock;

        } catch (e) {
            this.logger.error("Error scanning blocks", e);
        } finally {
            this.isScanning = false;
        }
    }

    private async handleLoanRepaid(event: any) {
        try {
            const args = (event as any).args;
            const loanId = args[0].toString();
            this.logger.log(`Indexer found Repayment for Loan ID: ${loanId}`);

            const loan = await this.findLoanByOnChainId(loanId);
            if (loan && loan.status !== LoanStatus.REPAID) {
                await this.supabase.from('loans').update({
                    status: LoanStatus.REPAID,
                    repaidDate: new Date(),
                    outstandingAmount: '0'
                }).eq('id', loan.id);

                this.logger.log(`Updated Loan ${loan.id} to REPAID via Indexer`);

                // Update user reputation
                await this.userService.updateReputationPoints(loan.userId, 100);
                this.logger.log(`Added 100 reputation points to user ${loan.userId}`);
            }
        } catch (e) {
            this.logger.error("Failed to process repayment event", e);
        }
    }

    private async handleLoanLiquidated(event: any) {
        try {
            const args = (event as any).args;
            const loanId = args[0].toString();
            this.logger.log(`Indexer found Liquidation for Loan ID: ${loanId}`);

            const loan = await this.findLoanByOnChainId(loanId);
            if (loan && loan.status !== LoanStatus.LIQUIDATED) {
                await this.supabase.from('loans').update({
                    status: LoanStatus.LIQUIDATED
                }).eq('id', loan.id);

                this.logger.log(`Updated Loan ${loan.id} to LIQUIDATED via Indexer`);

                // Slash reputation
                await this.userService.updateReputationPoints(loan.userId, -200);
                this.logger.log(`Slashed 200 reputation points from user ${loan.userId}`);
            }
        } catch (e) {
            this.logger.error("Failed to process liquidation event", e);
        }
    }

    private async handleLoanCreated(event: any) {
        // Optional: Implement if we want to capture loans created outside our API
    }

    private async findLoanByOnChainId(onChainId: string): Promise<Loan | null> {
        // Querying JSON metadata is database specific. 
        // Supabase/Postgres uses arrow operator ->> for JSON text extraction
        const { data, error } = await this.supabase
            .from('loans')
            .select('*')
            .eq('metadata->>onChainId', onChainId)
            .single();

        if (error || !data) return null;
        return data as Loan;
    }
}
