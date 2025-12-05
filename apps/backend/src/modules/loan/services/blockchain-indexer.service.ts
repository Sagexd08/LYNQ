import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ethers } from 'ethers';
import { Loan, LoanStatus } from '../entities/loan.entity';
import { UserService } from '../../user/services/user.service';

@Injectable()
export class BlockchainIndexerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BlockchainIndexerService.name);
  private providers: Map<string, ethers.JsonRpcProvider> = new Map();
  private contracts: Map<string, ethers.Contract> = new Map();
  private isRunning = false;

  private readonly LOAN_ABI = [
    "event LoanCreated(uint256 indexed loanId, address indexed borrower, uint256 amount, uint256 collateralAmount, address collateralToken, uint256 interestRate, uint256 duration)",
    "event LoanRepaid(uint256 indexed loanId, address indexed borrower, uint256 amount, uint256 interest)",
    "event LoanLiquidated(uint256 indexed loanId, address indexed borrower, address indexed liquidator, uint256 collateralSeized)",
    "event CollateralDeposited(uint256 indexed loanId, address indexed depositor, uint256 amount)",
    "function getLoan(uint256 loanId) view returns (tuple(address borrower, uint256 amount, uint256 collateralAmount, address collateralToken, uint256 interestRate, uint256 startTime, uint256 duration, uint256 outstandingAmount, uint8 status))",
    "function loanCounter() view returns (uint256)",
  ];

  private readonly NETWORKS = {
    ethereum: {
      chainId: 1,
      rpcUrl: '',
      contractAddress: '',
    },
    sepolia: {
      chainId: 11155111,
      rpcUrl: '',
      contractAddress: '',
    },
    mantle: {
      chainId: 5000,
      rpcUrl: 'https://rpc.mantle.xyz',
      contractAddress: '',
    },
    mantleSepolia: {
      chainId: 5003,
      rpcUrl: 'https://rpc.sepolia.mantle.xyz',
      contractAddress: '',
    },
  };

  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  async onModuleInit() {
    this.initializeNetworks();
    await this.startIndexing();
  }

  onModuleDestroy() {
    this.stopIndexing();
  }

  private initializeNetworks() {

    this.NETWORKS.ethereum.rpcUrl = this.configService.get('ETHEREUM_RPC_URL') || '';
    this.NETWORKS.ethereum.contractAddress = this.configService.get('LOAN_CORE_ADDRESS_ETHEREUM') || '';

    this.NETWORKS.sepolia.rpcUrl = this.configService.get('SEPOLIA_RPC_URL') || '';
    this.NETWORKS.sepolia.contractAddress = this.configService.get('LOAN_CORE_ADDRESS_SEPOLIA') || '';

    this.NETWORKS.mantle.rpcUrl = this.configService.get('MANTLE_RPC_URL') || 'https://rpc.mantle.xyz';
    this.NETWORKS.mantle.contractAddress = this.configService.get('LOAN_CORE_ADDRESS_MANTLE') || '';

    this.NETWORKS.mantleSepolia.rpcUrl = this.configService.get('MANTLE_SEPOLIA_RPC_URL') || 'https://rpc.sepolia.mantle.xyz';
    this.NETWORKS.mantleSepolia.contractAddress = this.configService.get('LOAN_CORE_ADDRESS_MANTLE_SEPOLIA') || '';
  }

  async startIndexing() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.logger.log('Starting blockchain indexer service...');

    for (const [networkName, config] of Object.entries(this.NETWORKS)) {
      if (!config.rpcUrl || !config.contractAddress) {
        this.logger.warn(`Skipping ${networkName}: missing RPC URL or contract address`);
        continue;
      }

      try {
        await this.setupNetworkListener(networkName, config);
        this.logger.log(`Listening to ${networkName} (chainId: ${config.chainId})`);
      } catch (error) {
        this.logger.error(`Failed to setup listener for ${networkName}:`, error);
      }
    }
  }

  stopIndexing() {
    this.isRunning = false;

    for (const contract of this.contracts.values()) {
      contract.removeAllListeners();
    }

    this.contracts.clear();
    this.providers.clear();
    this.logger.log('Blockchain indexer stopped');
  }

  private async setupNetworkListener(networkName: string, config: { rpcUrl: string; contractAddress: string; chainId: number }) {
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const contract = new ethers.Contract(config.contractAddress, this.LOAN_ABI, provider);

    this.providers.set(networkName, provider);
    this.contracts.set(networkName, contract);

    contract.on('LoanCreated', async (loanId, borrower, amount, collateralAmount, collateralToken, interestRate, duration, event) => {
      this.logger.log(`[${networkName}] LoanCreated event: loanId=${loanId}, borrower=${borrower}`);
      await this.handleLoanCreated(networkName, config.chainId, {
        loanId: loanId.toString(),
        borrower,
        amount: ethers.formatEther(amount),
        collateralAmount: ethers.formatEther(collateralAmount),
        collateralToken,
        interestRate: Number(interestRate),
        duration: Number(duration),
        transactionHash: event.log?.transactionHash || '',
      });
    });

    contract.on('LoanRepaid', async (loanId, borrower, amount, interest, event) => {
      this.logger.log(`[${networkName}] LoanRepaid event: loanId=${loanId}, borrower=${borrower}`);
      await this.handleLoanRepaid(networkName, {
        loanId: loanId.toString(),
        borrower,
        amount: ethers.formatEther(amount),
        interest: ethers.formatEther(interest),
        transactionHash: event.log?.transactionHash || '',
      });
    });

    contract.on('LoanLiquidated', async (loanId, borrower, liquidator, collateralSeized, event) => {
      this.logger.log(`[${networkName}] LoanLiquidated event: loanId=${loanId}`);
      await this.handleLoanLiquidated(networkName, {
        loanId: loanId.toString(),
        borrower,
        liquidator,
        collateralSeized: ethers.formatEther(collateralSeized),
        transactionHash: event.log?.transactionHash || '',
      });
    });

    await this.syncPastEvents(networkName, contract, provider);
  }

  private async syncPastEvents(networkName: string, contract: ethers.Contract, provider: ethers.JsonRpcProvider) {
    try {
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 1000);

      this.logger.log(`[${networkName}] Syncing past events from block ${fromBlock} to ${currentBlock}`);

      const loanCreatedFilter = contract.filters.LoanCreated();
      const loanCreatedEvents = await contract.queryFilter(loanCreatedFilter, fromBlock, currentBlock);

      for (const event of loanCreatedEvents) {
        if ('args' in event) {
          const [loanId, borrower, amount, collateralAmount, collateralToken, interestRate, duration] = event.args;
          await this.handleLoanCreated(networkName, this.NETWORKS[networkName as keyof typeof this.NETWORKS].chainId, {
            loanId: loanId.toString(),
            borrower,
            amount: ethers.formatEther(amount),
            collateralAmount: ethers.formatEther(collateralAmount),
            collateralToken,
            interestRate: Number(interestRate),
            duration: Number(duration),
            transactionHash: event.transactionHash,
          });
        }
      }

      const loanRepaidFilter = contract.filters.LoanRepaid();
      const loanRepaidEvents = await contract.queryFilter(loanRepaidFilter, fromBlock, currentBlock);

      for (const event of loanRepaidEvents) {
        if ('args' in event) {
          const [loanId, borrower, amount, interest] = event.args;
          await this.handleLoanRepaid(networkName, {
            loanId: loanId.toString(),
            borrower,
            amount: ethers.formatEther(amount),
            interest: ethers.formatEther(interest),
            transactionHash: event.transactionHash,
          });
        }
      }

      const loanLiquidatedFilter = contract.filters.LoanLiquidated();
      const loanLiquidatedEvents = await contract.queryFilter(loanLiquidatedFilter, fromBlock, currentBlock);

      for (const event of loanLiquidatedEvents) {
        if ('args' in event) {
          const [loanId, borrower, liquidator, collateralSeized] = event.args;
          await this.handleLoanLiquidated(networkName, {
            loanId: loanId.toString(),
            borrower,
            liquidator,
            collateralSeized: ethers.formatEther(collateralSeized),
            transactionHash: event.transactionHash,
          });
        }
      }

      this.logger.log(`[${networkName}] Synced ${loanCreatedEvents.length} created, ${loanRepaidEvents.length} repaid, ${loanLiquidatedEvents.length} liquidated events`);
    } catch (error) {
      this.logger.error(`[${networkName}] Error syncing past events:`, error);
    }
  }

  private async handleLoanCreated(
    networkName: string,
    chainId: number,
    data: {
      loanId: string;
      borrower: string;
      amount: string;
      collateralAmount: string;
      collateralToken: string;
      interestRate: number;
      duration: number;
      transactionHash: string;
    }
  ) {
    try {

      const existingLoan = await this.loanRepository.findOne({
        where: { transactionHash: data.transactionHash },
      });

      if (existingLoan) {
        this.logger.debug(`Loan with txHash ${data.transactionHash} already exists, skipping`);
        return;
      }

      let user = await this.userService.findByWalletAddress(data.borrower);
      if (!user) {
        this.logger.warn(`User not found for wallet ${data.borrower}, creating placeholder`);
        user = await this.userService.createFromWallet(data.borrower);
      }

      const durationDays = Math.ceil(data.duration / (24 * 60 * 60));
      const dueDate = new Date();
      dueDate.setSeconds(dueDate.getSeconds() + data.duration);

      const interestRate = data.interestRate > 100
        ? (data.interestRate / 100).toFixed(2)
        : data.interestRate.toFixed(2);

      const outstandingAmount = (
        parseFloat(data.amount) * (1 + parseFloat(interestRate) / 100)
      ).toFixed(8);

      const loan = this.loanRepository.create({
        userId: user.id,
        amount: data.amount,
        outstandingAmount,
        chain: this.getChainName(chainId),
        collateralTokenAddress: data.collateralToken,
        collateralAmount: data.collateralAmount,
        interestRate,
        durationDays,
        startDate: new Date(),
        dueDate,
        status: LoanStatus.ACTIVE,
        transactionHash: data.transactionHash,
        metadata: {
          onChainLoanId: data.loanId,
          network: networkName,
          chainId,
          indexedAt: new Date().toISOString(),
        },
      });

      await this.loanRepository.save(loan);
      this.logger.log(`Created loan ${loan.id} from on-chain event (loanId: ${data.loanId})`);
    } catch (error) {
      this.logger.error(`Error handling LoanCreated event:`, error);
    }
  }

  private async handleLoanRepaid(
    networkName: string,
    data: {
      loanId: string;
      borrower: string;
      amount: string;
      interest: string;
      transactionHash: string;
    }
  ) {
    try {

      const loan = await this.loanRepository
        .createQueryBuilder('loan')
        .where("loan.metadata->>'onChainLoanId' = :loanId", { loanId: data.loanId })
        .getOne();

      if (!loan) {
        this.logger.warn(`Loan with onChainLoanId ${data.loanId} not found in database`);
        return;
      }

      loan.status = LoanStatus.REPAID;
      loan.repaidDate = new Date();
      loan.outstandingAmount = '0';
      loan.transactionHash = data.transactionHash;

      await this.loanRepository.save(loan);

      await this.userService.updateReputationPoints(loan.userId, 100);

      this.logger.log(`Marked loan ${loan.id} as repaid from on-chain event`);
    } catch (error) {
      this.logger.error(`Error handling LoanRepaid event:`, error);
    }
  }

  private async handleLoanLiquidated(
    networkName: string,
    data: {
      loanId: string;
      borrower: string;
      liquidator: string;
      collateralSeized: string;
      transactionHash: string;
    }
  ) {
    try {

      const loan = await this.loanRepository
        .createQueryBuilder('loan')
        .where("loan.metadata->>'onChainLoanId' = :loanId", { loanId: data.loanId })
        .getOne();

      if (!loan) {
        this.logger.warn(`Loan with onChainLoanId ${data.loanId} not found in database`);
        return;
      }

      loan.status = LoanStatus.LIQUIDATED;
      loan.transactionHash = data.transactionHash;

      await this.loanRepository.save(loan);

      await this.userService.updateReputationPoints(loan.userId, -200);

      this.logger.log(`Marked loan ${loan.id} as liquidated from on-chain event`);
    } catch (error) {
      this.logger.error(`Error handling LoanLiquidated event:`, error);
    }
  }

  private getChainName(chainId: number): string {
    const chainNames: Record<number, string> = {
      1: 'ethereum',
      11155111: 'sepolia',
      5000: 'mantle',
      5003: 'mantle-sepolia',
      137: 'polygon',
      56: 'bsc',
    };
    return chainNames[chainId] || 'unknown';
  }

  async manualSync(networkName: string, fromBlock?: number) {
    const contract = this.contracts.get(networkName);
    const provider = this.providers.get(networkName);

    if (!contract || !provider) {
      throw new Error(`Network ${networkName} is not configured`);
    }

    const currentBlock = await provider.getBlockNumber();
    const startBlock = fromBlock || Math.max(0, currentBlock - 10000);

    this.logger.log(`Manual sync for ${networkName} from block ${startBlock}`);
    await this.syncPastEvents(networkName, contract, provider);
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      networks: Object.entries(this.NETWORKS).map(([name, config]) => ({
        name,
        chainId: config.chainId,
        isListening: this.contracts.has(name),
        hasContract: !!config.contractAddress,
        hasRpc: !!config.rpcUrl,
      })),
    };
  }
}
