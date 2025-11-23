import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ethers } from 'ethers';

@Injectable()
export class LiquidationService implements OnModuleInit {
  private readonly logger = new Logger(LiquidationService.name);
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private loanCoreContract: ethers.Contract;

  // Minimal ABI for LoanCore
  private readonly abi = [
    "function loanCounter() view returns (uint256)",
    "function getLoan(uint256 loanId) view returns (tuple(address borrower, uint256 amount, uint256 collateralAmount, address collateralToken, uint256 interestRate, uint256 startTime, uint256 duration, uint256 outstandingAmount, uint8 status))",
    "function isLoanUndercollateralized(uint256 loanId) view returns (bool)",
    "function liquidateLoan(uint256 loanId) external",
    "event LoanLiquidated(uint256 indexed loanId)"
  ];

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const rpcUrl = this.configService.get<string>('RPC_URL');
    const contractAddress = this.configService.get<string>('LOAN_CORE_ADDRESS');
    const privateKey = this.configService.get<string>('LIQUIDATOR_PRIVATE_KEY');

    if (!rpcUrl || !contractAddress || !privateKey) {
      this.logger.warn('Missing configuration for LiquidationService. Service disabled.');
      return;
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.loanCoreContract = new ethers.Contract(contractAddress, this.abi, this.wallet);
    
    this.logger.log('LiquidationService initialized');
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkLoansForLiquidation() {
    if (!this.loanCoreContract) return;

    this.logger.log('Checking loans for liquidation...');

    try {
      const loanCount = await this.loanCoreContract.loanCounter();
      
      // Iterate through all loans (in production, this should be optimized, e.g., by indexing active loans in DB)
      for (let i = 0; i < loanCount; i++) {
        await this.checkLoan(i);
      }
    } catch (error) {
      this.logger.error(`Error checking loans: ${error.message}`);
    }
  }

  private async checkLoan(loanId: number) {
    try {
      const loan = await this.loanCoreContract.getLoan(loanId);
      
      // LoanStatus: 0=PENDING, 1=ACTIVE, 2=REPAID, 3=DEFAULTED, 4=LIQUIDATED
      if (loan.status !== 1) return;

      const isUndercollateralized = await this.loanCoreContract.isLoanUndercollateralized(loanId);
      const isOverdue = BigInt(Date.now() / 1000) > (BigInt(loan.startTime) + BigInt(loan.duration));

      if (isUndercollateralized || isOverdue) {
        this.logger.log(`Loan ${loanId} is eligible for liquidation. Undercollateralized: ${isUndercollateralized}, Overdue: ${isOverdue}`);
        await this.liquidateLoan(loanId);
      }
    } catch (error) {
      this.logger.error(`Error checking loan ${loanId}: ${error.message}`);
    }
  }

  private async liquidateLoan(loanId: number) {
    try {
      this.logger.log(`Attempting to liquidate loan ${loanId}...`);
      const tx = await this.loanCoreContract.liquidateLoan(loanId);
      this.logger.log(`Liquidation tx sent: ${tx.hash}`);
      await tx.wait();
      this.logger.log(`Loan ${loanId} liquidated successfully`);
    } catch (error) {
      this.logger.error(`Failed to liquidate loan ${loanId}: ${error.message}`);
    }
  }
}
