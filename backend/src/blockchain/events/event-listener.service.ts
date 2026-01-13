import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers, JsonRpcProvider, Contract } from 'ethers';
import { PrismaService } from '../../prisma/prisma.service';

const LOAN_CORE_ABI = [
    "event LoanCreated(bytes32 indexed loanId, address indexed borrower, uint256 amount, uint256 interestRate, uint256 termDays, uint256 dueDate)",
    "event LoanActivated(bytes32 indexed loanId, uint256 timestamp)",
    "event LoanRepayment(bytes32 indexed loanId, address indexed borrower, uint256 amount, uint256 totalRepaid, bool isFullyRepaid)",
    "event LoanRepaid(bytes32 indexed loanId, uint256 timestamp)",
    "event LoanDefaulted(bytes32 indexed loanId, uint256 timestamp)",
    "event LoanLiquidated(bytes32 indexed loanId, uint256 timestamp)"
];

const COLLATERAL_VAULT_ABI = [
    "event CollateralLocked(bytes32 indexed loanId, address indexed depositor, address indexed token, uint256 amount, uint256 index)",
    "event CollateralUnlocked(bytes32 indexed loanId, address indexed recipient, address indexed token, uint256 amount)",
    "event CollateralSeized(bytes32 indexed loanId, address indexed token, uint256 amount, address recipient)"
];

@Injectable()
export class EventListenerService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(EventListenerService.name);
    private provider: JsonRpcProvider;
    private loanCoreContract: Contract;
    private collateralVaultContract: Contract;
    private isListening = false;

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
    ) { }

    async onModuleInit() {
        if (this.configService.get<string>('NODE_ENV') === 'production') {
            await this.startListening();
        } else {
            this.logger.log('Event listener disabled in development mode');
        }
    }

    async onModuleDestroy() {
        await this.stopListening();
    }

    private async startListening() {
        try {
            const rpcUrl = this.configService.get<string>('BLOCKCHAIN_RPC_URL');
            const loanCoreAddress = this.configService.get<string>('LOAN_CORE_ADDRESS');
            const vaultAddress = this.configService.get<string>('COLLATERAL_VAULT_ADDRESS');

            if (!rpcUrl || !loanCoreAddress || !vaultAddress) {
                this.logger.warn('Missing blockchain configuration, event listener not started');
                return;
            }

            this.provider = new JsonRpcProvider(rpcUrl);

            this.loanCoreContract = new ethers.Contract(
                loanCoreAddress,
                LOAN_CORE_ABI,
                this.provider,
            );

            this.collateralVaultContract = new ethers.Contract(
                vaultAddress,
                COLLATERAL_VAULT_ABI,
                this.provider,
            );

            this.setupLoanCoreListeners();
            this.setupCollateralVaultListeners();

            this.isListening = true;
            this.logger.log('Blockchain event listeners started');
        } catch (error) {
            this.logger.error(`Failed to start event listeners: ${error.message}`);
        }
    }

    private setupLoanCoreListeners() {
        this.loanCoreContract.on(
            'LoanCreated',
            async (loanId, borrower, amount, interestRate, termDays, dueDate, event) => {
                await this.handleLoanCreated({
                    loanId,
                    borrower,
                    amount: amount.toString(),
                    interestRate: Number(interestRate),
                    termDays: Number(termDays),
                    dueDate: Number(dueDate),
                    transactionHash: event.log.transactionHash,
                    blockNumber: event.log.blockNumber,
                });
            },
        );

        this.loanCoreContract.on('LoanRepaid', async (loanId, timestamp, event) => {
            await this.handleLoanRepaid({
                loanId,
                timestamp: Number(timestamp),
                transactionHash: event.log.transactionHash,
                blockNumber: event.log.blockNumber,
            });
        });

        this.loanCoreContract.on('LoanDefaulted', async (loanId, timestamp, event) => {
            await this.handleLoanDefaulted({
                loanId,
                timestamp: Number(timestamp),
                transactionHash: event.log.transactionHash,
                blockNumber: event.log.blockNumber,
            });
        });
    }

    private setupCollateralVaultListeners() {
        this.collateralVaultContract.on(
            'CollateralLocked',
            async (loanId, depositor, token, amount, index, event) => {
                await this.handleCollateralLocked({
                    loanId,
                    depositor,
                    token,
                    amount: amount.toString(),
                    index: Number(index),
                    transactionHash: event.log.transactionHash,
                    blockNumber: event.log.blockNumber,
                });
            },
        );

        this.collateralVaultContract.on(
            'CollateralSeized',
            async (loanId, token, amount, recipient, event) => {
                await this.handleCollateralSeized({
                    loanId,
                    token,
                    amount: amount.toString(),
                    recipient,
                    transactionHash: event.log.transactionHash,
                    blockNumber: event.log.blockNumber,
                });
            },
        );
    }

    private async handleLoanCreated(data: any) {
        this.logger.log(`LoanCreated event: ${data.loanId}`);

        await this.saveBlockchainEvent({
            chainId: await this.getChainId(),
            contractAddress: await this.loanCoreContract.getAddress(),
            eventName: 'LoanCreated',
            transactionHash: data.transactionHash,
            blockNumber: data.blockNumber,
            logIndex: 0,
            data,
        });
    }

    private async handleLoanRepaid(data: any) {
        this.logger.log(`LoanRepaid event: ${data.loanId}`);

        await this.saveBlockchainEvent({
            chainId: await this.getChainId(),
            contractAddress: await this.loanCoreContract.getAddress(),
            eventName: 'LoanRepaid',
            transactionHash: data.transactionHash,
            blockNumber: data.blockNumber,
            logIndex: 0,
            data,
        });
    }

    private async handleLoanDefaulted(data: any) {
        this.logger.log(`LoanDefaulted event: ${data.loanId}`);

        await this.saveBlockchainEvent({
            chainId: await this.getChainId(),
            contractAddress: await this.loanCoreContract.getAddress(),
            eventName: 'LoanDefaulted',
            transactionHash: data.transactionHash,
            blockNumber: data.blockNumber,
            logIndex: 0,
            data,
        });
    }

    private async handleCollateralLocked(data: any) {
        this.logger.log(`CollateralLocked event: ${data.loanId}`);

        await this.saveBlockchainEvent({
            chainId: await this.getChainId(),
            contractAddress: await this.collateralVaultContract.getAddress(),
            eventName: 'CollateralLocked',
            transactionHash: data.transactionHash,
            blockNumber: data.blockNumber,
            logIndex: 0,
            data,
        });
    }

    private async handleCollateralSeized(data: any) {
        this.logger.log(`CollateralSeized event: ${data.loanId}`);

        await this.saveBlockchainEvent({
            chainId: await this.getChainId(),
            contractAddress: await this.collateralVaultContract.getAddress(),
            eventName: 'CollateralSeized',
            transactionHash: data.transactionHash,
            blockNumber: data.blockNumber,
            logIndex: 0,
            data,
        });
    }

    private async saveBlockchainEvent(event: {
        chainId: number;
        contractAddress: string;
        eventName: string;
        transactionHash: string;
        blockNumber: number;
        logIndex: number;
        data: any;
    }) {
        try {
            await this.prisma.blockchainEvent.upsert({
                where: {
                    transactionHash_logIndex: {
                        transactionHash: event.transactionHash,
                        logIndex: event.logIndex,
                    },
                },
                update: {},
                create: {
                    chainId: event.chainId,
                    contractAddress: event.contractAddress,
                    eventName: event.eventName,
                    transactionHash: event.transactionHash,
                    blockNumber: BigInt(event.blockNumber),
                    logIndex: event.logIndex,
                    data: event.data,
                    processed: false,
                },
            });
        } catch (error) {
            this.logger.error(`Failed to save blockchain event: ${error.message}`);
        }
    }

    private async getChainId(): Promise<number> {
        const network = await this.provider.getNetwork();
        return Number(network.chainId);
    }

    private async stopListening() {
        if (this.isListening) {
            if (this.loanCoreContract) {
                await this.loanCoreContract.removeAllListeners();
            }
            if (this.collateralVaultContract) {
                await this.collateralVaultContract.removeAllListeners();
            }
            this.isListening = false;
            this.logger.log('Blockchain event listeners stopped');
        }
    }
}
