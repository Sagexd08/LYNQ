import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan, LoanStatus } from '../entities/loan.entity';
import { CreateLoanDto } from '../dto/create-loan.dto';
import { RepayLoanDto } from '../dto/repay-loan.dto';
import { UserService } from '../../user/services/user.service';

@Injectable()
export class LoanService {
  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    private readonly userService: UserService,
  ) {}

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
}
