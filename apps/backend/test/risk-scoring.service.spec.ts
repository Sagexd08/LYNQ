import { Test, TestingModule } from '@nestjs/testing';
import { RiskScoringService, RiskLevel, CreditScoreResult, FraudDetectionResult } from '../src/modules/risk-scoring/risk-scoring.service';
import { UserService } from '../src/modules/user/services/user.service';
import { LoanService } from '../src/modules/loan/services/loan.service';
import { SupabaseService } from '../src/modules/supabase/supabase.service';
import { BlacklistService } from '../src/modules/compliance/blacklist.service';
import { LoanStatus } from '../src/common/types/database.types';

describe('RiskScoringService', () => {
  let service: RiskScoringService;
  let userService: jest.Mocked<UserService>;
  let loanService: jest.Mocked<LoanService>;
  let supabaseService: jest.Mocked<SupabaseService>;
  let blacklistService: jest.Mocked<BlacklistService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    reputationPoints: 500,
    reputationTier: 'SILVER',
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    walletAddresses: {
      evm: '0x1234567890123456789012345678901234567890',
    },
  };

  const mockLoans = [
    {
      id: 'loan-1',
      userId: 'user-123',
      amount: '1000',
      outstandingAmount: '0',
      collateralAmount: '2000',
      status: LoanStatus.REPAID,
      chain: 'evm',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'loan-2',
      userId: 'user-123',
      amount: '500',
      outstandingAmount: '525',
      collateralAmount: '1000',
      status: LoanStatus.ACTIVE,
      chain: 'mantle',
      createdAt: new Date(),
    },
  ];

  const mockSupabaseClient = {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RiskScoringService,
        {
          provide: UserService,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: LoanService,
          useValue: {
            findAllByUser: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: SupabaseService,
          useValue: {
            getClient: jest.fn().mockReturnValue(mockSupabaseClient),
          },
        },
        {
          provide: BlacklistService,
          useValue: {
            checkAddress: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RiskScoringService>(RiskScoringService);
    userService = module.get(UserService);
    loanService = module.get(LoanService);
    supabaseService = module.get(SupabaseService);
    blacklistService = module.get(BlacklistService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateUserCreditScore', () => {
    it('should calculate credit score for user with loan history', async () => {
      userService.findById.mockResolvedValue(mockUser as any);
      loanService.findAllByUser.mockResolvedValue(mockLoans as any);

      const result = await service.calculateUserCreditScore('user-123');

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1000);
      expect(result.grade).toBeDefined();
      expect(result.breakdown).toBeDefined();
      expect(result.method).toBe('ALGORITHM_V1');
    });

    it('should return default score for new user with no loans', async () => {
      userService.findById.mockResolvedValue(mockUser as any);
      loanService.findAllByUser.mockResolvedValue([]);

      const result = await service.calculateUserCreditScore('user-123');

      expect(result.score).toBeGreaterThan(0);
      expect(result.breakdown.paymentHistory.score).toBe(50);
    });

    it('should give higher score for users with 100% repayment rate', async () => {
      const allRepaidLoans = [
        { ...mockLoans[0], status: LoanStatus.REPAID },
        { ...mockLoans[0], id: 'loan-3', status: LoanStatus.REPAID },
      ];
      userService.findById.mockResolvedValue(mockUser as any);
      loanService.findAllByUser.mockResolvedValue(allRepaidLoans as any);

      const result = await service.calculateUserCreditScore('user-123');

      expect(result.breakdown.paymentHistory.score).toBe(100);
    });

    it('should penalize users with defaults', async () => {
      const loansWithDefault = [
        { ...mockLoans[0], status: LoanStatus.REPAID },
        { ...mockLoans[0], id: 'loan-3', status: LoanStatus.DEFAULTED },
      ];
      userService.findById.mockResolvedValue(mockUser as any);
      loanService.findAllByUser.mockResolvedValue(loansWithDefault as any);

      const result = await service.calculateUserCreditScore('user-123');

      expect(result.breakdown.paymentHistory.score).toBe(50);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      userService.findById.mockResolvedValue(null as any);

      await expect(service.calculateUserCreditScore('non-existent')).rejects.toThrow();
    });

    it('should calculate correct grade based on score', async () => {
      userService.findById.mockResolvedValue({
        ...mockUser,
        reputationPoints: 1000,
        createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      } as any);
      loanService.findAllByUser.mockResolvedValue([
        { ...mockLoans[0], status: LoanStatus.REPAID },
        { ...mockLoans[0], id: 'loan-3', status: LoanStatus.REPAID, chain: 'mantle' },
        { ...mockLoans[0], id: 'loan-4', status: LoanStatus.REPAID, chain: 'aptos' },
      ] as any);

      const result = await service.calculateUserCreditScore('user-123');

      expect(['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D', 'F']).toContain(result.grade);
    });
  });

  describe('detectFraudRisk', () => {
    it('should return low risk for normal user', async () => {
      userService.findById.mockResolvedValue(mockUser as any);
      loanService.findAllByUser.mockResolvedValue(mockLoans as any);
      blacklistService.checkAddress.mockResolvedValue({
        isBlacklisted: false,
        source: 'none',
        checkedAt: new Date(),
      });

      const result = await service.detectFraudRisk('user-123', 1000);

      expect(result.recommendation).toBe('APPROVE');
      expect(result.riskScore).toBeLessThan(30);
      expect(result.flags).toEqual([]);
    });

    it('should flag unusual amount', async () => {
      userService.findById.mockResolvedValue(mockUser as any);
      loanService.findAllByUser.mockResolvedValue(mockLoans as any);
      blacklistService.checkAddress.mockResolvedValue({
        isBlacklisted: false,
        source: 'none',
        checkedAt: new Date(),
      });

      const result = await service.detectFraudRisk('user-123', 50000);

      expect(result.flags).toContain('UNUSUAL_AMOUNT');
      expect(result.riskScore).toBeGreaterThan(0);
    });

    it('should flag high velocity loans', async () => {
      const recentLoans = Array(6).fill(null).map((_, i) => ({
        ...mockLoans[0],
        id: `loan-${i}`,
        createdAt: new Date(),
      }));
      userService.findById.mockResolvedValue(mockUser as any);
      loanService.findAllByUser.mockResolvedValue(recentLoans as any);
      blacklistService.checkAddress.mockResolvedValue({
        isBlacklisted: false,
        source: 'none',
        checkedAt: new Date(),
      });

      const result = await service.detectFraudRisk('user-123', 1000);

      expect(result.flags).toContain('HIGH_VELOCITY');
    });

    it('should flag new accounts', async () => {
      const newUser = {
        ...mockUser,
        createdAt: new Date(),
      };
      userService.findById.mockResolvedValue(newUser as any);
      loanService.findAllByUser.mockResolvedValue([]);
      blacklistService.checkAddress.mockResolvedValue({
        isBlacklisted: false,
        source: 'none',
        checkedAt: new Date(),
      });

      const result = await service.detectFraudRisk('user-123', 1000);

      expect(result.flags).toContain('NEW_ACCOUNT');
    });

    it('should flag low reputation', async () => {
      const lowRepUser = {
        ...mockUser,
        reputationPoints: 50,
      };
      userService.findById.mockResolvedValue(lowRepUser as any);
      loanService.findAllByUser.mockResolvedValue([]);
      blacklistService.checkAddress.mockResolvedValue({
        isBlacklisted: false,
        source: 'none',
        checkedAt: new Date(),
      });

      const result = await service.detectFraudRisk('user-123', 1000);

      expect(result.flags).toContain('LOW_REPUTATION');
    });

    it('should reject blacklisted users', async () => {
      userService.findById.mockResolvedValue(mockUser as any);
      loanService.findAllByUser.mockResolvedValue([]);
      blacklistService.checkAddress.mockResolvedValue({
        isBlacklisted: true,
        reason: 'OFAC Sanctions',
        source: 'ofac',
        checkedAt: new Date(),
      });

      const result = await service.detectFraudRisk('user-123', 1000);

      expect(result.recommendation).toBe('REJECT');
      expect(result.riskScore).toBe(100);
      expect(result.flags).toContain('BLACKLISTED');
    });

    it('should recommend review for medium risk', async () => {
      const riskyUser = {
        ...mockUser,
        reputationPoints: 50,
        createdAt: new Date(),
      };
      userService.findById.mockResolvedValue(riskyUser as any);
      loanService.findAllByUser.mockResolvedValue([]);
      blacklistService.checkAddress.mockResolvedValue({
        isBlacklisted: false,
        source: 'none',
        checkedAt: new Date(),
      });

      const result = await service.detectFraudRisk('user-123', 1000);

      expect(['REVIEW', 'REJECT']).toContain(result.recommendation);
      expect(result.riskScore).toBeGreaterThanOrEqual(25);
    });
  });

  describe('assessLoanRisk', () => {
    it('should assess loan risk correctly', async () => {
      const activeLoan = {
        ...mockLoans[1],
        userId: 'user-123',
      };
      loanService.findById.mockResolvedValue(activeLoan as any);
      userService.findById.mockResolvedValue(mockUser as any);
      loanService.findAllByUser.mockResolvedValue(mockLoans as any);
      blacklistService.checkAddress.mockResolvedValue({
        isBlacklisted: false,
        source: 'none',
        checkedAt: new Date(),
      });

      const result = await service.assessLoanRisk('loan-2');

      expect(result.loanId).toBe('loan-2');
      expect(result.riskLevel).toBeDefined();
      expect(Object.values(RiskLevel)).toContain(result.riskLevel);
      expect(result.defaultProbability).toBeGreaterThanOrEqual(0);
      expect(result.defaultProbability).toBeLessThanOrEqual(100);
      expect(result.liquidationRisk).toBeDefined();
      expect(result.collateralHealth).toBeDefined();
      expect(result.recommendation).toBeDefined();
    });

    it('should flag critical risk for undercollateralized loans', async () => {
      const undercollateralizedLoan = {
        ...mockLoans[1],
        amount: '1000',
        collateralAmount: '500',
        outstandingAmount: '1050',
      };
      loanService.findById.mockResolvedValue(undercollateralizedLoan as any);
      userService.findById.mockResolvedValue(mockUser as any);
      loanService.findAllByUser.mockResolvedValue([undercollateralizedLoan] as any);
      blacklistService.checkAddress.mockResolvedValue({
        isBlacklisted: false,
        source: 'none',
        checkedAt: new Date(),
      });

      const result = await service.assessLoanRisk('loan-2');

      expect(result.liquidationRisk).toBeGreaterThan(100);
    });
  });
});
