import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { Vouch } from './entities/vouch.entity';

@Injectable()
export class ReputationService implements OnModuleInit {
  private readonly logger = new Logger(ReputationService.name);
  private provider: ethers.JsonRpcProvider;
  private socialStakingContract: ethers.Contract;

  // ABI for SocialStaking events
  private readonly abi = [
    "event Staked(uint256 indexed loanId, address indexed staker, uint256 amount)",
    "event Unstaked(uint256 indexed loanId, address indexed staker, uint256 amount)",
    "event Slashed(uint256 indexed loanId, uint256 amount)"
  ];

  constructor(
    @InjectRepository(Vouch)
    private vouchRepository: Repository<Vouch>,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    this.initializeBlockchainListener();
  }

  private initializeBlockchainListener() {
    const rpcUrl = this.configService.get<string>('RPC_URL');
    const contractAddress = this.configService.get<string>('SOCIAL_STAKING_ADDRESS');

    if (!rpcUrl || !contractAddress) {
      this.logger.warn('RPC_URL or SOCIAL_STAKING_ADDRESS not configured. Blockchain listener disabled.');
      return;
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.socialStakingContract = new ethers.Contract(contractAddress, this.abi, this.provider);

    this.logger.log(`Listening for SocialStaking events at ${contractAddress}`);

    this.socialStakingContract.on('Staked', async (loanId, staker, amount, event) => {
      this.logger.log(`New Stake: Loan ${loanId}, Staker ${staker}, Amount ${amount}`);
      await this.handleStake(loanId, staker, amount, event.log.transactionHash);
    });

    this.socialStakingContract.on('Unstaked', async (loanId, staker, amount, event) => {
      this.logger.log(`Unstake: Loan ${loanId}, Staker ${staker}`);
      await this.handleUnstake(loanId, staker);
    });

    this.socialStakingContract.on('Slashed', async (loanId, amount, event) => {
      this.logger.log(`Slashed: Loan ${loanId}`);
      await this.handleSlash(loanId);
    });
  }

  async handleStake(loanId: bigint, staker: string, amount: bigint, txHash: string) {
    try {
      // In a real app, we might want to fetch the borrower address from the LoanCore contract
      // or assume we have it in our DB under 'loans' table.
      // For now, we'll leave borrowerAddress empty or fetch it if we had a LoanService dependency.
      
      const vouch = this.vouchRepository.create({
        loanId: loanId.toString(),
        stakerAddress: staker,
        borrowerAddress: "0x0000000000000000000000000000000000000000", // Placeholder
        amount: amount.toString(),
        transactionHash: txHash,
        status: 'ACTIVE'
      });
      
      await this.vouchRepository.save(vouch);
    } catch (error) {
      this.logger.error(`Error handling stake: ${error.message}`);
    }
  }

  async handleUnstake(loanId: bigint, staker: string) {
    try {
      const vouch = await this.vouchRepository.findOne({
        where: { 
          loanId: loanId.toString(),
          stakerAddress: staker,
          status: 'ACTIVE'
        }
      });

      if (vouch) {
        vouch.status = 'WITHDRAWN';
        await this.vouchRepository.save(vouch);
      }
    } catch (error) {
      this.logger.error(`Error handling unstake: ${error.message}`);
    }
  }

  async handleSlash(loanId: bigint) {
    try {
      const vouches = await this.vouchRepository.find({
        where: { 
          loanId: loanId.toString(),
          status: 'ACTIVE'
        }
      });

      for (const vouch of vouches) {
        vouch.status = 'SLASHED';
        await this.vouchRepository.save(vouch);
      }
    } catch (error) {
      this.logger.error(`Error handling slash: ${error.message}`);
    }
  }

  async getVouchesForUser(address: string) {
    return this.vouchRepository.find({ where: { stakerAddress: address } });
  }

  async getVouchesForLoan(loanId: string) {
    return this.vouchRepository.find({ where: { loanId } });
  }
}
