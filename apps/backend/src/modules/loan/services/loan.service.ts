import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { Loan, LoanStatus } from '../../../common/types/database.types';
import { CreateLoanDto } from '../dto/create-loan.dto';
import { RepayLoanDto } from '../dto/repay-loan.dto';
import { UserService } from '../../user/services/user.service';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { TelegramService } from '../../telegram/services/telegram.service';
import { RiskScoringService } from '../../risk-scoring/risk-scoring.service';
import { LoanEligibilityService } from './loan-eligibility.service';

@Injectable()
export class LoanService {
  private readonly logger = new Logger(LoanService.name);

  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly telegramService: TelegramService,
    private readonly supabaseService: SupabaseService,
    @Inject(forwardRef(() => RiskScoringService))
    private readonly riskScoringService: RiskScoringService,
    private readonly loanEligibilityService: LoanEligibilityService,
  ) { }

  private get supabase() {
    return this.supabaseService.getClient();
  }

  async create(userId: string, createLoanDto: CreateLoanDto): Promise<Loan> {
    const user = await this.userService.findById(userId);

    const interestRate = this.calculateInterestRate(user.reputationTier);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + createLoanDto.durationDays);

    const outstandingAmount = (
      parseFloat(createLoanDto.amount) *
      (1 + parseFloat(interestRate) / 100)
    ).toFixed(8);

    const loanData: Partial<Loan> = {
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
      status: createLoanDto.transactionHash ? LoanStatus.ACTIVE : LoanStatus.PENDING,
      transactionHash: createLoanDto.transactionHash,
      metadata: createLoanDto.onChainId ? { onChainId: createLoanDto.onChainId } : {},
    };

    const eligibilityCheck = await this.loanEligibilityService.check(userId, parseFloat(createLoanDto.amount));
    if (!eligibilityCheck.eligible) {
      throw new BadRequestException(eligibilityCheck.message);
    }

    const eligibility = await this.checkEligibility(userId, parseFloat(createLoanDto.amount)).catch(() => ({ eligible: false, flags: ['CHECK_FAILED'] }));

    if (!eligibility.eligible) {
      if (!eligibility.eligible) {
        loanData.metadata = {
          ...(loanData.metadata || {}),
          riskFlags: ['MANUAL_REVIEW_REQUIRED', ...eligibility.flags]
        };
      }
    }

    const { data: savedLoan, error } = await this.supabase
      .from('loans')
      .insert(loanData)
      .select()
      .single();

    if (error || !savedLoan) {
      throw new Error(`Failed to create loan: ${error?.message}`);
    }

    
    await this.telegramService.notifyLoanCreated(userId, savedLoan);

    return savedLoan as Loan;
  }

  async findById(id: string): Promise<Loan> {
    const { data, error } = await this.supabase
      .from('loans')
      .select('*, user:users(*)')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Loan not found');
    }

    
    
    return data as Loan;
  }

  async findByUser(userId: string, status?: string, page: number = 1, limit: number = 20): Promise<{ data: Loan[]; count: number }> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = this.supabase
      .from('loans')
      .select('*', { count: 'exact' })
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
      .range(from, to);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      this.logger.error(`Failed to fetch user loans: ${error.message}`);
      throw new Error(`Failed to fetch loans: ${error.message}`);
    }

    return { data: data as Loan[], count: count || 0 };
  }

  
  async findAllByUser(userId: string): Promise<Loan[]> {
    const { data, error } = await this.supabase
      .from('loans')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    if (error) {
      this.logger.error(`Failed to fetch all user loans: ${error.message}`);
      throw new Error(`Failed to fetch loans: ${error.message}`);
    }

    return data as Loan[];
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

    const newOutstanding = (outstanding - repayAmount).toFixed(8);
    let newStatus: LoanStatus = loan.status;
    let repaidDate = loan.repaidDate;

    if (parseFloat(newOutstanding) === 0) {
      newStatus = LoanStatus.REPAID;
      repaidDate = new Date();
      await this.userService.updateReputationPoints(loan.userId, 100);
    }

    const { data: savedLoan, error } = await this.supabase
      .from('loans')
      .update({
        outstandingAmount: newOutstanding,
        transactionHash: repayLoanDto.transactionHash,
        status: newStatus,
        repaidDate
      })
      .eq('id', loanId)
      .select()
      .single();

    if (error || !savedLoan) {
      throw new Error('Failed to update loan repayment');
    }

    
    if (savedLoan.status === LoanStatus.REPAID) {
      await this.telegramService.notifyLoanRepaid(loan.userId, {
        ...savedLoan,
        transactionHash: repayLoanDto.transactionHash,
      });
    }

    return savedLoan as Loan;
  }

  async liquidate(loanId: string): Promise<Loan> {
    const loan = await this.findById(loanId);

    if (loan.status !== LoanStatus.ACTIVE) {
      throw new BadRequestException('Loan is not active');
    }

    await this.userService.updateReputationPoints(loan.userId, -200);

    const { data: savedLoan, error } = await this.supabase
      .from('loans')
      .update({ status: LoanStatus.LIQUIDATED })
      .eq('id', loanId)
      .select()
      .single();

    if (error || !savedLoan) throw new Error('Liquidation update failed');

    
    await this.telegramService.notifyLoanLiquidated(loan.userId, savedLoan);

    return savedLoan as Loan;
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
    const { data, error } = await this.supabase
      .from('loans')
      .update({ status })
      .eq('id', loanId)
      .select()
      .single();

    if (error) throw new Error('Update status failed');
    return data as Loan;
  }

  async createRefinanceOffer(loanId: string, userId: string): Promise<any> {
    const loan = await this.findById(loanId);

    if (loan.userId !== userId) {
      throw new BadRequestException('Not authorized to refinance this loan');
    }

    if (loan.status !== LoanStatus.ACTIVE) {
      throw new BadRequestException('Loan is not active');
    }

    const user = await this.userService.findById(userId);
    const newInterestRateStr = this.calculateInterestRate(user.reputationTier);
    const newInterestRate = parseFloat(newInterestRateStr);
    const currentInterestRate = parseFloat(loan.interestRate);

    if (newInterestRate >= currentInterestRate) {
      throw new BadRequestException(`Current rate (${currentInterestRate}%) is already optimal or equal`);
    }

    const onChainId = loan.metadata?.onChainId;
    if (!onChainId) {
      throw new BadRequestException('Loan does not have an on-chain ID');
    }

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

    const borrowerAddress = user.walletAddresses?.[loan.chain];
    if (!borrowerAddress) {
      throw new BadRequestException(`User missing wallet for chain ${loan.chain}`);
    }

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
      throw new BadRequestException('Could not fetch nonce');
    }

    const rateInBasisPoints = Math.round(newInterestRate * 100);
    const timestamp = Math.floor(Date.now() / 1000);

    const value = {
      loanId: onChainId,
      newInterestRate: rateInBasisPoints,
      newDuration: loan.durationDays * 24 * 3600,
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

  async checkEligibility(userId: string, amount: number): Promise<any> {
    const user = await this.userService.findById(userId);
    const fraudResult = await this.riskScoringService.detectFraudRisk(userId, amount);

    if (fraudResult.recommendation === 'REJECT') {
      throw new BadRequestException(`Loan eligibility failed: ${fraudResult.flags.join(', ')}`);
    }

    return { eligible: true, riskScore: fraudResult.riskScore, flags: fraudResult.flags };
  }
}
