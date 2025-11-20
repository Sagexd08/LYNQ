/// <reference types="jest" />
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Repository } from 'typeorm';
import { LoanService } from './loan.service';
import { Loan, LoanStatus } from '../entities/loan.entity';
import { UserService } from '../../user/services/user.service';
import { User, ReputationTier } from '../../user/entities/user.entity';

describe('LoanService', () => {
  let service: LoanService;
  let loanRepository: Repository<Loan>;
  let userService: UserService;

  const mockLoanRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockUserService = {
    findById: jest.fn(),
    updateReputationPoints: jest.fn(),
  };

  beforeEach(() => {
    loanRepository = mockLoanRepository as unknown as Repository<Loan>;
    userService = mockUserService as unknown as UserService;
    service = new LoanService(loanRepository as any, userService as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a loan with calculated interest', async () => {
      const mockUser = {
        id: 'user-123',
        reputationTier: ReputationTier.SILVER,
      } as User;

      const createLoanDto = {
        amount: '1000',
        chain: 'evm',
        collateralTokenAddress: '0xcollateral',
        collateralAmount: '1500',
        durationDays: 30,
      } as any;

      (mockUserService.findById as unknown as jest.MockedFunction<any>).mockResolvedValue(mockUser);
      (mockLoanRepository.create as unknown as jest.MockedFunction<any>).mockReturnValue({
        ...createLoanDto,
        id: 'loan-123',
        status: LoanStatus.PENDING,
      });
      (mockLoanRepository.save as unknown as jest.MockedFunction<any>).mockResolvedValue({
        ...createLoanDto,
        id: 'loan-123',
        status: LoanStatus.PENDING,
      });

      const result = await service.create('user-123', createLoanDto);

      expect(mockUserService.findById).toHaveBeenCalledWith('user-123');
      expect(mockLoanRepository.create).toHaveBeenCalled();
      expect(mockLoanRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('findByUser', () => {
    it('should return all loans for a user', async () => {
      const mockLoans = [
        { id: 'loan-1', userId: 'user-123', amount: '1000' } as Loan,
        { id: 'loan-2', userId: 'user-123', amount: '2000' } as Loan,
      ];

      (mockLoanRepository.find as unknown as jest.MockedFunction<any>).mockResolvedValue(mockLoans);

      const result = await service.findByUser('user-123');

      expect(result).toEqual(mockLoans);
      expect(mockLoanRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        order: { createdAt: 'DESC' },
      });
    });
  });
});
