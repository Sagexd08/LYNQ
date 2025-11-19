import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';
import { webSocketService } from './websocketService';

const prisma = new PrismaClient();

interface IndexerConfig {
  rpcUrl: string;
  contractAddress: string;
  abi: any[];
  startBlock?: number;
}

class BlockchainIndexer {
  private provider: ethers.JsonRpcProvider | null = null;
  private contract: ethers.Contract | null = null;
  private isIndexing: boolean = false;
  private config: IndexerConfig | null = null;
  private lastProcessedBlock: number = 0;

  async initialize(config: IndexerConfig) {
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.contract = new ethers.Contract(config.contractAddress, config.abi, this.provider);
    
    const lastIndexedBlock = await this.getLastIndexedBlock();
    this.lastProcessedBlock = lastIndexedBlock || config.startBlock || 0;
    
    logger.info('Blockchain indexer initialized', {
      contractAddress: config.contractAddress,
      startBlock: this.lastProcessedBlock,
    });
  }

  async startIndexing() {
    if (this.isIndexing) {
      logger.warn('Indexer already running');
      return;
    }

    this.isIndexing = true;
    logger.info('Starting blockchain indexer');

    while (this.isIndexing) {
      try {
        await this.processBlocks();
        await this.sleep(5000);
      } catch (error) {
        logger.error('Error in indexer loop', error);
        await this.sleep(10000);
      }
    }
  }

  stopIndexing() {
    this.isIndexing = false;
    logger.info('Blockchain indexer stopped');
  }

  private async processBlocks() {
    if (!this.provider || !this.contract) {
      throw new Error('Indexer not initialized');
    }

    const currentBlock = await this.provider.getBlockNumber();
    
    if (currentBlock <= this.lastProcessedBlock) {
      return;
    }

    const fromBlock = this.lastProcessedBlock + 1;
    const toBlock = Math.min(fromBlock + 100, currentBlock);

    logger.info('Processing blocks', { fromBlock, toBlock });

    const loanCreatedFilter = this.contract.filters.LoanCreated();
    const loanRepaidFilter = this.contract.filters.LoanRepaid();
    const loanDefaultedFilter = this.contract.filters.LoanDefaulted();

    const [createdEvents, repaidEvents, defaultedEvents] = await Promise.all([
      this.contract.queryFilter(loanCreatedFilter, fromBlock, toBlock),
      this.contract.queryFilter(loanRepaidFilter, fromBlock, toBlock),
      this.contract.queryFilter(loanDefaultedFilter, fromBlock, toBlock),
    ]);

    await this.processLoanCreatedEvents(createdEvents);
    await this.processLoanRepaidEvents(repaidEvents);
    await this.processLoanDefaultedEvents(defaultedEvents);

    this.lastProcessedBlock = toBlock;
    await this.saveLastIndexedBlock(toBlock);
  }

  private async processLoanCreatedEvents(events: ethers.EventLog[]) {
    for (const event of events) {
      try {
        const log = event as ethers.EventLog & {
          args: {
            loanId: bigint;
            borrower: string;
            amount: bigint;
            interestRateBps: bigint;
            dueDate: bigint;
          };
        };

        const loanId = log.args.loanId.toString();
        const borrower = log.args.borrower.toLowerCase();
        const amount = log.args.amount.toString();
        const interestRateBps = Number(log.args.interestRateBps);
        const dueDate = new Date(Number(log.args.dueDate) * 1000);

        let user = await prisma.user.findUnique({
          where: { walletAddress: borrower },
        });

        if (!user) {
          user = await prisma.user.create({
            data: { walletAddress: borrower },
          });
        }

        const loan = await prisma.loan.create({
          data: {
            borrowerId: user.id,
            principalAmount: BigInt(amount),
            remainingPrincipal: BigInt(amount),
            interestAccrued: BigInt(0),
            lateFee: BigInt(0),
            interestRateBps,
            dueDate,
            status: 'ACTIVE',
            tokenType: 'ETH',
            purpose: 'On-chain loan',
            chainId: '1',
            txHash: event.transactionHash,
          },
        });

        logger.info('Loan created indexed', { loanId, borrower });
        
        webSocketService.emitLoanUpdate(borrower, loan);
      } catch (error) {
        logger.error('Error processing loan created event', error);
      }
    }
  }

  private async processLoanRepaidEvents(events: ethers.EventLog[]) {
    for (const event of events) {
      try {
        const log = event as ethers.EventLog & {
          args: {
            loanId: bigint;
            borrower: string;
            principalPaid: bigint;
            interestPaid: bigint;
            lateFeePaid: bigint;
            fullyRepaid: boolean;
          };
        };

        const loanId = log.args.loanId.toString();
        const borrower = log.args.borrower.toLowerCase();
        const fullyRepaid = log.args.fullyRepaid;

        const loan = await prisma.loan.findFirst({
          where: {
            txHash: event.transactionHash,
            borrower: {
              walletAddress: borrower,
            },
          },
        });

        if (loan) {
          await prisma.loan.update({
            where: { id: loan.id },
            data: {
              status: fullyRepaid ? 'REPAID' : 'ACTIVE',
              remainingPrincipal: {
                decrement: BigInt(log.args.principalPaid.toString()),
              },
            },
          });

          if (fullyRepaid) {
            const trustScore = await prisma.trustScore.findUnique({
              where: { userId: loan.borrowerId },
            });

            if (trustScore) {
              await prisma.trustScore.update({
                where: { userId: loan.borrowerId },
                data: {
                  score: { increment: 10 },
                  repaymentRecord: { increment: 5 },
                },
              });
            }
          }

          logger.info('Loan repaid indexed', { loanId, borrower });
          webSocketService.emitPaymentReceived(borrower, loan);
        }
      } catch (error) {
        logger.error('Error processing loan repaid event', error);
      }
    }
  }

  private async processLoanDefaultedEvents(events: ethers.EventLog[]) {
    for (const event of events) {
      try {
        const log = event as ethers.EventLog & {
          args: {
            loanId: bigint;
            borrower: string;
            remainingAmount: bigint;
          };
        };

        const borrower = log.args.borrower.toLowerCase();

        const loan = await prisma.loan.findFirst({
          where: {
            txHash: event.transactionHash,
            borrower: {
              walletAddress: borrower,
            },
          },
        });

        if (loan) {
          await prisma.loan.update({
            where: { id: loan.id },
            data: { status: 'DEFAULTED' },
          });

          const trustScore = await prisma.trustScore.findUnique({
            where: { userId: loan.borrowerId },
          });

          if (trustScore) {
            await prisma.trustScore.update({
              where: { userId: loan.borrowerId },
              data: {
                score: { decrement: 50 },
                repaymentRecord: { decrement: 10 },
              },
            });
          }

          logger.info('Loan defaulted indexed', { borrower });
          webSocketService.emitLoanOverdue(borrower, loan);
        }
      } catch (error) {
        logger.error('Error processing loan defaulted event', error);
      }
    }
  }

  private async getLastIndexedBlock(): Promise<number | null> {
    try {
      const stats = await prisma.platformStats.findUnique({
        where: { id: 'indexer' },
      });
      return stats?.lastUpdated ? Number(stats.lastUpdated) : null;
    } catch {
      return null;
    }
  }

  private async saveLastIndexedBlock(blockNumber: number) {
    try {
      await prisma.platformStats.upsert({
        where: { id: 'indexer' },
        update: {
          lastUpdated: new Date(blockNumber * 1000),
        },
        create: {
          id: 'indexer',
          lastUpdated: new Date(blockNumber * 1000),
        },
      });
    } catch (error) {
      logger.error('Error saving last indexed block', error);
    }
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const blockchainIndexer = new BlockchainIndexer();

