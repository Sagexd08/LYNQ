import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers, JsonRpcProvider, Contract } from 'ethers';
import { PrismaService } from '../../prisma/prisma.service';

const LOAN_CORE_ABI = [
    "event LoanCreated(uint256 indexed loanId, address indexed borrower, uint256 amount, uint256 collateralAmount)",
    "event LoanRepaid(uint256 indexed loanId, uint256 amount)",
    "event LoanLiquidated(uint256 indexed loanId)"
];

const COLLATERAL_VAULT_ABI = [
    "event CollateralLocked(uint256 indexed collateralId, address indexed owner, address token, uint256 amount, uint256 loanId)",
    "event CollateralUnlocked(uint256 indexed collateralId)"
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
            async (loanId, borrower, amount, collateralAmount, event) => {
                await this.handleLoanCreated({
                    loanId: loanId.toString(),
                    borrower,
                    amount: amount.toString(),
                    collateralAmount: collateralAmount.toString(),
                    transactionHash: event.log.transactionHash,
                    blockNumber: event.log.blockNumber,
                });
            },
        );

        this.loanCoreContract.on('LoanRepaid', async (loanId, amount, event) => {
            await this.handleLoanRepaid({
                loanId: loanId.toString(),
                amount: amount.toString(),
                transactionHash: event.log.transactionHash,
                blockNumber: event.log.blockNumber,
            });
        });

        this.loanCoreContract.on('LoanLiquidated', async (loanId, event) => {
            await this.handleLoanLiquidated({
                loanId: loanId.toString(),
                transactionHash: event.log.transactionHash,
                blockNumber: event.log.blockNumber,
            });
        });
    }

    private setupCollateralVaultListeners() {
        this.collateralVaultContract.on(
            'CollateralLocked',
            async (collateralId, owner, token, amount, loanId, event) => {
                await this.handleCollateralLocked({
                    collateralId: collateralId.toString(),
                    loanId: loanId.toString(),
                    owner,
                    token,
                    amount: amount.toString(),
                    transactionHash: event.log.transactionHash,
                    blockNumber: event.log.blockNumber,
                });
            },
        );

        this.collateralVaultContract.on(
            'CollateralUnlocked',
            async (collateralId, event) => {
                await this.handleCollateralUnlocked({
                    collateralId: collateralId.toString(),
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

        try {
            const existingLoan = await this.prisma.loan.findFirst({
                where: { onChainLoanId: data.loanId },
            });

            if (!existingLoan) {
                this.logger.log(`No matching DB loan for on-chain loan ${data.loanId}, may be a direct contract call`);
            }
        } catch (error) {
            this.logger.error(`Error processing LoanCreated event: ${error.message}`);
        }
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

        try {
            const loan = await this.prisma.loan.findFirst({
                where: { onChainLoanId: data.loanId },
            });

            if (loan) {
                // Update outstanding amount and status if fully repaid
                const updateData: any = {};
                if (data.amount && loan.outstandingAmount) {
                    const repaidAmount = BigInt(data.amount);
                    const currentOutstanding = BigInt(loan.outstandingAmount.toString());
                    const newOutstanding = currentOutstanding > repaidAmount
                        ? (currentOutstanding - repaidAmount).toString()
                        : '0';
                    updateData.outstandingAmount = newOutstanding;

                    if (newOutstanding === '0') {
                        updateData.status = 'REPAID';
                        updateData.repaidDate = new Date();
                    }
                }

                if (Object.keys(updateData).length > 0) {
                    await this.prisma.loan.update({
                        where: { id: loan.id },
                        data: updateData,
                    });
                    this.logger.log(`Synced loan ${loan.id} repayment from on-chain event`);
                }
            }
        } catch (error) {
            this.logger.error(`Error syncing LoanRepaid event: ${error.message}`);
        }
    }

    private async handleLoanLiquidated(data: any) {
        this.logger.log(`LoanLiquidated event: ${data.loanId}`);

        await this.saveBlockchainEvent({
            chainId: await this.getChainId(),
            contractAddress: await this.loanCoreContract.getAddress(),
            eventName: 'LoanLiquidated',
            transactionHash: data.transactionHash,
            blockNumber: data.blockNumber,
            logIndex: 0,
            data,
        });

        try {
            const loan = await this.prisma.loan.findFirst({
                where: { onChainLoanId: data.loanId },
            });

            if (loan && loan.status !== 'LIQUIDATED') {
                await this.prisma.loan.update({
                    where: { id: loan.id },
                    data: {
                        status: 'LIQUIDATED',
                        defaultedAt: new Date(),
                    },
                });
                this.logger.log(`Synced loan ${loan.id} status to LIQUIDATED from on-chain event`);
            }
        } catch (error) {
            this.logger.error(`Error syncing LoanLiquidated event: ${error.message}`);
        }
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

    private async handleCollateralUnlocked(data: any) {
        this.logger.log(`CollateralUnlocked event: ${data.collateralId}`);

        await this.saveBlockchainEvent({
            chainId: await this.getChainId(),
            contractAddress: await this.collateralVaultContract.getAddress(),
            eventName: 'CollateralUnlocked',
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
