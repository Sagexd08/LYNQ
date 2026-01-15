import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BlockchainService } from '../../blockchain/blockchain.service';
import { QUEUE_NAMES } from '../queues.module';

interface CreateLoanJobData {
    loanId: string;
    amountWei: string;
    collateralAmountWei: string;
    collateralToken: string;
    interestRateBps: number;
    durationDays: number;
}

@Processor(QUEUE_NAMES.BLOCKCHAIN_SYNC)
export class BlockchainSyncProcessor extends WorkerHost {
    private readonly logger = new Logger(BlockchainSyncProcessor.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly blockchainService: BlockchainService,
    ) {
        super();
    }

    async process(job: Job<CreateLoanJobData, any, string>): Promise<any> {
        switch (job.name) {
            case 'create-loan':
                return this.handleCreateLoan(job);
            default:
                this.logger.warn(`Unknown job name: ${job.name}`);
        }
    }

    private async handleCreateLoan(job: Job<CreateLoanJobData>) {
        const { loanId, amountWei, collateralAmountWei, collateralToken, interestRateBps, durationDays } = job.data;

        const loan = await this.prisma.loan.findUnique({ where: { id: loanId } });
        if (!loan) {
            this.logger.warn(`Loan ${loanId} not found for on-chain sync`);
            return;
        }

        try {
            if (!this.blockchainService.isBlockchainConnected()) {
                throw new Error('Blockchain not connected');
            }

            const result = await this.blockchainService.createLoanOnChain(
                BigInt(amountWei),
                BigInt(collateralAmountWei),
                collateralToken,
                interestRateBps,
                durationDays,
            );

            await this.prisma.loan.update({
                where: { id: loanId },
                data: {
                    onChainLoanId: result.loanId,
                    transactionHash: result.txHash,
                    metadata: {
                        ...(loan.metadata as Record<string, unknown> | null),
                        onChainSync: {
                            status: 'CONFIRMED',
                            txHash: result.txHash,
                            loanId: result.loanId,
                            confirmedAt: new Date().toISOString(),
                        },
                    },
                },
            });

            this.logger.log(`Loan ${loanId} synced on-chain: loanId=${result.loanId}, tx=${result.txHash}`);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.error(`On-chain loan creation failed for ${loanId}: ${message}`);

            await this.prisma.loan.update({
                where: { id: loanId },
                data: {
                    metadata: {
                        ...(loan.metadata as Record<string, unknown> | null),
                        onChainSync: {
                            status: 'FAILED',
                            error: message,
                            failedAt: new Date().toISOString(),
                        },
                    },
                },
            });

            throw error;
        }
    }
}
