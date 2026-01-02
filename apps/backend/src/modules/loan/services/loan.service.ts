import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef, Logger, InternalServerErrorException } from '@nestjs/common';
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
import { TransactionValidator } from '../../validation/transaction-validator';
import { DecimalUtil } from '../../../common/utils/decimal.util';
import { BlacklistService } from '../../compliance/blacklist.service';

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
    private readonly transactionValidator: TransactionValidator,
    @Inject(forwardRef(() => BlacklistService))
    private readonly blacklistService: BlacklistService,
  ) { }
  
  private get supabase() {
    return this.supabaseService.getClient();
  }
  
  async create(userId: string, createLoanDto: CreateLoanDto): Promise<Loan> {
    try {
      const user = await this.userService.findById(userId);
      this.transactionValidator.validateNumericString(createLoanDto.amount, 'amount');
      this.transactionValidator.validateNumericString(createLoanDto.collateralAmount, 'collateralAmount');
      this.transactionValidator.validateAddress(createLoanDto.collateralTokenAddress);
      this.transactionValidator.validateCollateralAmount(
        createLoanDto.collateralAmount,
        createLoanDto.amount,
        1.5 
      );
      if (createLoanDto.transactionHash) {
        this.transactionValidator.validateTransactionHash(createLoanDto.transactionHash, createLoanDto.chain);
      }
      const interestRate = this.calculateInterestRate(user.reputationTier);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + createLoanDto.durationDays);
      const loanAmount = DecimalUtil.fromString(createLoanDto.amount);
      const interestRateDecimal = DecimalUtil.fromString(interestRate);
      const interestMultiplier = DecimalUtil.add('1', DecimalUtil.divide(interestRateDecimal, '100'));
      const outstandingAmount = DecimalUtil.toFixed(DecimalUtil.multiply(loanAmount, interestMultiplier), 8);
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
      const eligibilityCheck = await this.loanEligibilityService.check(userId, DecimalUtil.toNumber(loanAmount)).catch((error) => {
        this.logger.error(`Eligibility check failed: ${error.message}`);
        throw new BadRequestException(`Eligibility check failed: ${error.message}`);
      });
      if (!eligibilityCheck.eligible) {
        throw new BadRequestException(eligibilityCheck.message);
      }
      const complianceCheck = await this.checkComplianceDeep(userId, createLoanDto.collateralTokenAddress, createLoanDto.chain, DecimalUtil.toNumber(loanAmount)).catch((error) => {
        this.logger.warn(`Compliance check failed (non-fatal): ${error.message}`);
        return { passed: false, reason: error.message };
      });
      if (!complianceCheck.passed) {
        loanData.metadata = {
          ...(loanData.metadata || {}),
          complianceFlags: ['MANUAL_REVIEW_REQUIRED'],
          complianceIssue: complianceCheck.reason,
        };
      }
      const { data: savedLoan, error } = await this.supabase
        .from('loans')
        .insert(loanData)
        .select()
        .single();
      if (error || !savedLoan) {
        this.logger.error(`Database error creating loan: ${error?.message}`);
        throw new InternalServerErrorException(`Failed to create loan: ${error?.message}`);
      }
      this.logger.log(`Loan created: ${savedLoan.id} for user ${userId}`);
      await this.telegramService.notifyLoanCreated(userId, savedLoan).catch((error) => {
        this.logger.warn(`Failed to send telegram notification: ${error.message}`);
      });
      return savedLoan as Loan;
    } catch (error) {
      this.logger.error(`Loan creation failed: ${error.message}`, error.stack);
      throw error;
    }
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
    const repayAmount = DecimalUtil.fromString(repayLoanDto.amount);
    const outstanding = DecimalUtil.fromString(loan.outstandingAmount);
    if (DecimalUtil.greaterThan(repayAmount, outstanding)) {
      throw new BadRequestException('Repayment amount exceeds outstanding amount');
    }
    const newOutstanding = DecimalUtil.toFixed(DecimalUtil.subtract(outstanding, repayAmount), 8);
    let newStatus: LoanStatus = loan.status;
    let repaidDate = loan.repaidDate;
    if (DecimalUtil.isZero(newOutstanding)) {
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
    const newInterestRate = DecimalUtil.fromString(newInterestRateStr);
    const currentInterestRate = DecimalUtil.fromString(loan.interestRate);
    if (DecimalUtil.greaterThanOrEqual(newInterestRate, currentInterestRate)) {
      throw new BadRequestException(`Current rate (${DecimalUtil.toFixed(currentInterestRate, 2)}%) is already optimal or equal`);
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
    const rateInBasisPoints = Math.round(DecimalUtil.toNumber(DecimalUtil.multiply(newInterestRate, '100')));
    const timestamp = Math.floor(Date.now() / 1000);
    const value = {
      loanId: onChainId,
      newInterestRate: rateInBasisPoints,
      newDuration: loan.durationDays * 24 * 3600,
      timestamp,
      nonce,
    };
    const signature = await signer.signTypedData(domain, types, value);
    const improvement = DecimalUtil.subtract(currentInterestRate, newInterestRate);
    return {
      success: true,
      proposal: value,
      signature,
      betterTerms: {
        oldRate: DecimalUtil.toNumber(currentInterestRate),
        newRate: DecimalUtil.toNumber(newInterestRate),
        improvement: DecimalUtil.toFixed(improvement, 2) + '%'
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
  
  private async checkComplianceDeep(userId: string, tokenAddress: string, chain: string, loanAmount: number): Promise<{ passed: boolean; reason?: string; flags?: string[] }> {
    const flags: string[] = [];
    try {
      const user = await this.userService.findById(userId);
      if (!user.walletAddresses || Object.keys(user.walletAddresses).length === 0) {
        return { passed: false, reason: 'No verified wallet addresses', flags: ['NO_WALLET'] };
      }
      const walletAddresses = Object.entries(user.walletAddresses);
      for (const [walletChain, address] of walletAddresses) {
        if (typeof address === 'string' && address.startsWith('0x')) {
          try {
            this.transactionValidator.validateAddress(address);
          } catch (error) {
            return { passed: false, reason: `Invalid wallet address: ${error.message}`, flags: ['INVALID_ADDRESS'] };
          }
          const blacklistResult = await this.blacklistService.checkAddress(address, walletChain);
          if (blacklistResult.isBlacklisted) {
            this.logger.warn(`Address ${address} is blacklisted: ${blacklistResult.reason}`);
            return { 
              passed: false, 
              reason: `Wallet address is blacklisted: ${blacklistResult.reason}`,
              flags: ['BLACKLISTED', blacklistResult.source.toUpperCase()]
            };
          }
        }
      }
      this.transactionValidator.validateAddress(tokenAddress);
      const tokenBlacklistResult = await this.blacklistService.checkAddress(tokenAddress, chain);
      if (tokenBlacklistResult.isBlacklisted) {
        return { 
          passed: false, 
          reason: `Collateral token is blacklisted: ${tokenBlacklistResult.reason}`,
          flags: ['BLACKLISTED_TOKEN']
        };
      }
      const fraudResult = await this.riskScoringService.detectFraudRisk(userId, loanAmount);
      if (fraudResult.recommendation === 'REJECT') {
        return { 
          passed: false, 
          reason: `Fraud risk detected: ${fraudResult.flags.join(', ')}`,
          flags: fraudResult.flags
        };
      }
      if (fraudResult.recommendation === 'REVIEW') {
        flags.push(...fraudResult.flags);
      }
      return { passed: true, flags };
    } catch (error) {
      this.logger.error(`Compliance check error: ${error.message}`);
      return { passed: false, reason: error.message, flags: ['CHECK_ERROR'] };
    }
  }
}
