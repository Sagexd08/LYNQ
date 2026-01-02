import { Test, TestingModule } from '@nestjs/testing';
import { LoanService } from '../src/modules/loan/services/loan.service';
import { UserService } from '../src/modules/user/services/user.service';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from '../src/modules/telegram/services/telegram.service';
import { SupabaseService } from '../src/modules/supabase/supabase.service';
import { RiskScoringService } from '../src/modules/risk-scoring/risk-scoring.service';
import { LoanEligibilityService } from '../src/modules/loan/services/loan-eligibility.service';
import { TransactionValidator } from '../src/modules/validation/transaction-validator';
import { BlacklistService } from '../src/modules/compliance/blacklist.service';
import { LoanStatus } from '../src/common/types/database.types';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SupportedChain } from '../src/modules/loan/dto/create-loan.dto';

describe('LoanService', () => {
  let service: LoanService;
  let userService: jest.Mocked<UserService>;
  let supabaseService: jest.Mocked<SupabaseService>;
  let riskScoringService: jest.Mocked<RiskScoringService>;
  let loanEligibilityService: jest.Mocked<LoanEligibilityService>;
  let transactionValidator: jest.Mocked<TransactionValidator>;
  let blacklistService: jest.Mocked<BlacklistService>;
  let telegramService: jest.Mocked<TelegramService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    reputationPoints: 500,
    reputationTier: 'SILVER',
    walletAddresses: {
      evm: '0x1234567890123456789012345678901234567890',
    },
  };

  const mockLoan = {
    id: 'loan-123',
    userId: 'user-123',
    amount: '1000',
    outstandingAmount: '1100',
    collateralAmount: '2000',
    collateralTokenAddress: '0x1234567890123456789012345678901234567890',
    chain: 'evm',
    interestRate: '10.00',
    durationDays: 30,
    status: LoanStatus.ACTIVE,
    startDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
  };

  const mockSupabaseClient = {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    mockSupabaseClient.single.mockResolvedValue({ data: mockLoan, error: null });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoanService,
        {
          provide: UserService,
          useValue: {
            findById: jest.fn().mockResolvedValue(mockUser),
            updateReputationPoints: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-value'),
          },
        },
        {
          provide: TelegramService,
          useValue: {
            notifyLoanCreated: jest.fn(),
            notifyLoanRepaid: jest.fn(),
            notifyLoanLiquidated: jest.fn(),
          },
        },
        {
          provide: SupabaseService,
          useValue: {
            getClient: jest.fn().mockReturnValue(mockSupabaseClient),
          },
        },
        {
          provide: RiskScoringService,
          useValue: {
            detectFraudRisk: jest.fn().mockResolvedValue({
              recommendation: 'APPROVE',
              riskScore: 10,
              flags: [],
            }),
          },
        },
        {
          provide: LoanEligibilityService,
          useValue: {
            check: jest.fn().mockResolvedValue({ eligible: true }),
          },
        },
        {
          provide: TransactionValidator,
          useValue: {
            validateNumericString: jest.fn().mockReturnValue(true),
            validateAddress: jest.fn().mockReturnValue(true),
            validateCollateralAmount: jest.fn().mockReturnValue(true),
            validateTransactionHash: jest.fn().mockReturnValue(true),
          },
        },
        {
          provide: BlacklistService,
          useValue: {
            checkAddress: jest.fn().mockResolvedValue({
              isBlacklisted: false,
              source: 'none',
              checkedAt: new Date(),
            }),
          },
        },
      ],
    }).compile();

    service = module.get<LoanService>(LoanService);
    userService = module.get(UserService);
    supabaseService = module.get(SupabaseService);
    riskScoringService = module.get(RiskScoringService);
    loanEligibilityService = module.get(LoanEligibilityService);
    transactionValidator = module.get(TransactionValidator);
    blacklistService = module.get(BlacklistService);
    telegramService = module.get(TelegramService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createLoanDto = {
      amount: '1000',
      chain: SupportedChain.EVM,
      collateralTokenAddress: '0x1234567890123456789012345678901234567890',
      collateralAmount: '2000',
      durationDays: 30,
    };

    it('should create a loan successfully', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({ data: mockLoan, error: null });

      const result = await service.create('user-123', createLoanDto);

      expect(result).toBeDefined();
      expect(transactionValidator.validateNumericString).toHaveBeenCalledWith('1000', 'amount');
      expect(transactionValidator.validateAddress).toHaveBeenCalled();
      expect(loanEligibilityService.check).toHaveBeenCalled();
    });

    it('should validate collateral ratio', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({ data: mockLoan, error: null });

      await service.create('user-123', createLoanDto);

      expect(transactionValidator.validateCollateralAmount).toHaveBeenCalledWith(
        '2000',
        '1000',
        1.5
      );
    });

    it('should reject ineligible users', async () => {
      loanEligibilityService.check.mockResolvedValueOnce({
        eligible: false,
        message: 'Insufficient credit score',
      });

      await expect(service.create('user-123', createLoanDto)).rejects.toThrow(BadRequestException);
    });

    it('should flag compliance issues but still create loan', async () => {
      blacklistService.checkAddress.mockResolvedValueOnce({
        isBlacklisted: false,
        source: 'none',
        checkedAt: new Date(),
      });
      riskScoringService.detectFraudRisk.mockResolvedValueOnce({
        recommendation: 'REVIEW',
        riskScore: 40,
        flags: ['NEW_ACCOUNT'],
        timestamp: new Date(),
      });

      const createdLoan = {
        ...mockLoan,
        metadata: {
          complianceFlags: ['MANUAL_REVIEW_REQUIRED'],
        },
      };
      mockSupabaseClient.single.mockResolvedValueOnce({ data: createdLoan, error: null });

      const result = await service.create('user-123', createLoanDto);

      expect(result).toBeDefined();
    });

    it('should send telegram notification on loan creation', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({ data: mockLoan, error: null });

      await service.create('user-123', createLoanDto);

      expect(telegramService.notifyLoanCreated).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return loan by id', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({ data: mockLoan, error: null });

      const result = await service.findById('loan-123');

      expect(result).toEqual(mockLoan);
    });

    it('should throw NotFoundException for non-existent loan', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('repay', () => {
    const repayDto = {
      amount: '500',
      transactionHash: '0x1234567890123456789012345678901234567890123456789012345678901234',
    };

    it('should process partial repayment', async () => {
      mockSupabaseClient.single
        .mockResolvedValueOnce({ data: mockLoan, error: null })
        .mockResolvedValueOnce({ 
          data: { ...mockLoan, outstandingAmount: '600' }, 
          error: null 
        });

      const result = await service.repay('loan-123', repayDto);

      expect(result.outstandingAmount).toBe('600');
    });

    it('should mark loan as repaid when fully paid', async () => {
      const fullRepayDto = {
        amount: '1100',
        transactionHash: '0x1234567890123456789012345678901234567890123456789012345678901234',
      };

      mockSupabaseClient.single
        .mockResolvedValueOnce({ data: mockLoan, error: null })
        .mockResolvedValueOnce({ 
          data: { ...mockLoan, outstandingAmount: '0', status: LoanStatus.REPAID }, 
          error: null 
        });

      const result = await service.repay('loan-123', fullRepayDto);

      expect(result.status).toBe(LoanStatus.REPAID);
      expect(userService.updateReputationPoints).toHaveBeenCalledWith('user-123', 100);
    });

    it('should reject repayment exceeding outstanding amount', async () => {
      const excessiveRepayDto = {
        amount: '2000',
        transactionHash: '0x1234567890123456789012345678901234567890123456789012345678901234',
      };

      mockSupabaseClient.single.mockResolvedValueOnce({ data: mockLoan, error: null });

      await expect(service.repay('loan-123', excessiveRepayDto)).rejects.toThrow(BadRequestException);
    });

    it('should reject repayment on non-active loan', async () => {
      const repaidLoan = { ...mockLoan, status: LoanStatus.REPAID };
      mockSupabaseClient.single.mockResolvedValueOnce({ data: repaidLoan, error: null });

      await expect(service.repay('loan-123', repayDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('liquidate', () => {
    it('should liquidate active loan', async () => {
      mockSupabaseClient.single
        .mockResolvedValueOnce({ data: mockLoan, error: null })
        .mockResolvedValueOnce({ 
          data: { ...mockLoan, status: LoanStatus.LIQUIDATED }, 
          error: null 
        });

      const result = await service.liquidate('loan-123');

      expect(result.status).toBe(LoanStatus.LIQUIDATED);
      expect(userService.updateReputationPoints).toHaveBeenCalledWith('user-123', -200);
      expect(telegramService.notifyLoanLiquidated).toHaveBeenCalled();
    });

    it('should reject liquidation of non-active loan', async () => {
      const repaidLoan = { ...mockLoan, status: LoanStatus.REPAID };
      mockSupabaseClient.single.mockResolvedValueOnce({ data: repaidLoan, error: null });

      await expect(service.liquidate('loan-123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByUser', () => {
    it('should return paginated loans for user', async () => {
      const loans = [mockLoan, { ...mockLoan, id: 'loan-456' }];
      mockSupabaseClient.range.mockResolvedValueOnce({ 
        data: loans, 
        error: null, 
        count: 2 
      });

      const result = await service.findByUser('user-123', undefined, 1, 20);

      expect(result.data).toHaveLength(2);
      expect(result.count).toBe(2);
    });

    it('should filter by status', async () => {
      mockSupabaseClient.range.mockResolvedValueOnce({ 
        data: [mockLoan], 
        error: null, 
        count: 1 
      });

      const result = await service.findByUser('user-123', LoanStatus.ACTIVE, 1, 20);

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('status', LoanStatus.ACTIVE);
    });
  });
});
