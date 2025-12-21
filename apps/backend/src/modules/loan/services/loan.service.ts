import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan, LoanStatus } from '../entities/loan.entity';
import { CreateLoanDto } from '../dto/create-loan.dto';
import { RepayLoanDto } from '../dto/repay-loan.dto';
import { UserService } from '../../user/services/user.service';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

@Injectable()
export class LoanService {
  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) { }

  async create(userId: string, createLoanDto: CreateLoanDto): Promise<Loan> {
    const user = await this.userService.findById(userId);

    const interestRate = this.calculateInterestRate(user.reputationTier);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + createLoanDto.durationDays);

    const outstandingAmount = (
      parseFloat(createLoanDto.amount) *
      (1 + parseFloat(interestRate) / 100)
    ).toFixed(8);

    const loan = this.loanRepository.create({
      userId,
      amount: createLoanDto.amount,
      outstandingAmount,
      chain: createLoanDto.chain,
      collateralTokenAddress: createLoanDto.collateralTokenAddress,
      collateralAmount: createLoanDto.collateralAmount,
      interestRate,
      durationDays: createLoanDto.durationDays,
      startDate: new Date(),
      dueDate,
      status: LoanStatus.PENDING,
    });

    return this.loanRepository.save(loan);
  }

  async findById(id: string): Promise<Loan> {
    const loan = await this.loanRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    return loan;
  }

  async findByUser(userId: string, status?: string): Promise<Loan[]> {
    const query: any = { userId };
    if (status) {
      query.status = status;
    }

    return this.loanRepository.find({
      where: query,
      order: { createdAt: 'DESC' },
    });
  }

  async repay(loanId: string, repayLoanDto: RepayLoanDto): Promise<Loan> {
    const loan = await this.findById(loanId);

    if (loan.status !== LoanStatus.ACTIVE) {
      throw new BadRequestException('Loan is not active');
    }

    const repayAmount = parseFloat(repayLoanDto.amount);
    const outstanding = parseFloat(loan.outstandingAmount);

    if (repayAmount > outstanding) {
      throw new BadRequestException('Repayment amount exceeds outstanding amount');
    }

    loan.outstandingAmount = (outstanding - repayAmount).toFixed(8);
    loan.transactionHash = repayLoanDto.transactionHash;

    if (parseFloat(loan.outstandingAmount) === 0) {
      loan.status = LoanStatus.REPAID;
      loan.repaidDate = new Date();
      await this.userService.updateReputationPoints(loan.userId, 100);
    }

    return this.loanRepository.save(loan);
  }

  async liquidate(loanId: string): Promise<Loan> {
    const loan = await this.findById(loanId);

    if (loan.status !== LoanStatus.ACTIVE) {
      throw new BadRequestException('Loan is not active');
    }

    loan.status = LoanStatus.LIQUIDATED;
    await this.userService.updateReputationPoints(loan.userId, -200);

    return this.loanRepository.save(loan);
  }

  private calculateInterestRate(tier: string): string {
    const rates: Record<string, string> = {
      BRONZE: '15.00',
      SILVER: '10.00',
      GOLD: '7.50',
      PLATINUM: '5.00',
    };
    return rates[tier] || '15.00';
  }

  async updateStatus(loanId: string, status: LoanStatus): Promise<Loan> {
    const loan = await this.findById(loanId);
    loan.status = status;
    return this.loanRepository.save(loan);
  }

  async createRefinanceOffer(loanId: string, userId: string): Promise<any> {
    const loan = await this.findById(loanId);

    if (loan.userId !== userId) {
      throw new BadRequestException('Not authorized to refinance this loan');
    }

    if (loan.status !== LoanStatus.ACTIVE) {
      throw new BadRequestException('Loan is not active');
    }

    // Get current user tier
    const user = await this.userService.findById(userId);
    const newInterestRateStr = this.calculateInterestRate(user.reputationTier);
    const newInterestRate = parseFloat(newInterestRateStr);
    const currentInterestRate = parseFloat(loan.interestRate);

    // Check if new terms are better
    if (newInterestRate >= currentInterestRate) {
      throw new BadRequestException(`Current rate (${currentInterestRate}%) is already optimal or equal to new rate (${newInterestRate}%)`);
    }

    // Get On-Chain ID from metadata
    const onChainId = loan.metadata?.onChainId;
    if (!onChainId) {
      throw new BadRequestException('Loan does not have an on-chain ID linked yet');
    }

    // Prepare EIP-712 Signature
    const privateKey = this.configService.get<string>('PRIVATE_KEY');
    if (!privateKey) {
      throw new Error('PRIVATE_KEY not configured');
    }

    const verifierAddress = this.configService.get<string>('CREDIT_SCORE_VERIFIER_ADDRESS');
    if (!verifierAddress) {
      throw new Error('CREDIT_SCORE_VERIFIER_ADDRESS not configured');
    }

    const chainId = this.configService.get<number>('CHAIN_ID', 31337);
    const signer = new ethers.Wallet(privateKey);

    const domain = {
      name: 'LYNQ',
      version: '1',
      chainId: chainId,
      verifyingContract: verifierAddress,
    };

    const types = {
      RefinanceProposal: [
        { name: 'loanId', type: 'uint256' },
        { name: 'newInterestRate', type: 'uint256' },
        { name: 'newDuration', type: 'uint256' },
        { name: 'timestamp', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
      ],
    };

    // Check User Wallet Address
    const borrowerAddress = user.walletAddresses?.[loan.chain];
    if (!borrowerAddress) {
      throw new BadRequestException(`User does not have a connected wallet address for chain ${loan.chain}`);
    }

    // Fetch nonce from contract
    let nonce = 0;
    try {
      const rpcUrl = this.configService.get<string>('RPC_URL', 'http://localhost:8545');
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const verifierContract = new ethers.Contract(
        verifierAddress,
        ['function getNonce(address user) view returns (uint256)'],
        provider
      );
      nonce = Number(await verifierContract.getNonce(borrowerAddress));
    } catch (e) {
      throw new BadRequestException('Could not fetch nonce for verification: ' + (e instanceof Error ? e.message : String(e)));
    }

    const rateInBasisPoints = Math.round(newInterestRate * 100);
    const timestamp = Math.floor(Date.now() / 1000);

    const value = {
      loanId: onChainId,
      newInterestRate: rateInBasisPoints,
      newDuration: loan.durationDays * 24 * 3600, // Convert days to seconds
      timestamp,
      nonce,
    };

    const signature = await signer.signTypedData(domain, types, value);

    return {
      success: true,
      proposal: value,
      signature,
      betterTerms: {
        oldRate: currentInterestRate,
        newRate: newInterestRate,
        improvement: (currentInterestRate - newInterestRate).toFixed(2) + '%'
      }
    };
  }
}
