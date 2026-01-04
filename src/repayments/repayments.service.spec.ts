import { Test, TestingModule } from '@nestjs/testing';
import { RepaymentsService } from './repayments.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReputationService } from '../reputation/reputation.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RepaymentClassification } from './classification';

describe('RepaymentsService', () => {
  let service: RepaymentsService;
  let mockTx: any;
  let prisma: any;
  let reputationService: any;

  const NOW = new Date('2026-02-01T12:00:00Z');

  const mockLoan = {
    id: 'loan-1',
    userId: 'user-1',
    amount: 1000,
    issuedAt: new Date('2026-01-01'),
    dueAt: new Date('2026-02-01T12:30:00Z'),
    status: 'active',
    lateDays: 0,
    partialExtensionUsed: false,
    repayments: [],
    user: {
      id: 'user-1',
      phone: '1234567890',
      status: 'active',
      reputation: {
        userId: 'user-1',
        score: 50,
        consecutiveLateCount: 0,
        cleanCycleCount: 0,
        maxScoreBeforeLastPenalty: null,
      },
    },
  };

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);

    mockTx = {
      loan: {
        update: jest.fn().mockResolvedValue({}),
      },
      repayment: {
        create: jest.fn().mockResolvedValue({ id: 'repay-1' }),
      },
    };

    prisma = {
      loan: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn((callback: (tx: any) => Promise<any>) => callback(mockTx)),
    };

    reputationService = {
      applyRepaymentOutcome: jest.fn().mockResolvedValue({ blocked: false }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ReputationService, useValue: reputationService },
      ],
    }).compile();

    service = module.get<RepaymentsService>(RepaymentsService);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('STEP 3.1: Repayment Classification', () => {
    it('should classify PARTIAL when payment < outstanding amount', async () => {
      const loanWithRepayments = {
        ...mockLoan,
        repayments: [{ amount: 300 }],
      };
      prisma.loan.findUnique.mockResolvedValue(loanWithRepayments);

      await service.create({ loanId: 'loan-1', amount: 400 });

      expect(mockTx.loan.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            partialExtensionUsed: true,
          }),
        })
      );
      expect(reputationService.applyRepaymentOutcome).not.toHaveBeenCalled();
    });

    it('should classify EARLY when payment >= full amount and paid ≥24h before dueAt', async () => {
      const earlyLoan = {
        ...mockLoan,
        dueAt: new Date('2026-02-03T12:00:00Z'),
      };
      prisma.loan.findUnique.mockResolvedValue(earlyLoan);

      await service.create({ loanId: 'loan-1', amount: 1000 });

      expect(reputationService.applyRepaymentOutcome).toHaveBeenCalledWith(
        'user-1',
        RepaymentClassification.EARLY,
        0,
        'loan-1'
      );
    });

    it('should classify ON_TIME when payment >= full amount and paid on/before dueAt', async () => {
      prisma.loan.findUnique.mockResolvedValue(mockLoan);

      await service.create({ loanId: 'loan-1', amount: 1000 });

      expect(reputationService.applyRepaymentOutcome).toHaveBeenCalledWith(
        'user-1',
        RepaymentClassification.ON_TIME,
        0,
        'loan-1'
      );
    });

    it('should classify LATE when payment >= full amount and paid after dueAt', async () => {
      const lateLoan = {
        ...mockLoan,
        dueAt: new Date('2026-01-30T12:00:00Z'),
      };
      prisma.loan.findUnique.mockResolvedValue(lateLoan);

      await service.create({ loanId: 'loan-1', amount: 1000 });

      expect(reputationService.applyRepaymentOutcome).toHaveBeenCalledWith(
        'user-1',
        RepaymentClassification.LATE,
        expect.any(Number),
        'loan-1'
      );
    });
  });

  describe('STEP 3.2: Loan State Updates', () => {
    it('PARTIAL: should set partialExtensionUsed=true and extend dueAt by 3 days (first time)', async () => {
      const loanWithRepayments = {
        ...mockLoan,
        repayments: [{ amount: 700 }],
      };
      prisma.loan.findUnique.mockResolvedValue(loanWithRepayments);

      await service.create({ loanId: 'loan-1', amount: 200 });

      const updateCall = mockTx.loan.update.mock.calls[0][0];
      expect(updateCall.data.partialExtensionUsed).toBe(true);
      expect(updateCall.data.dueAt.getDate()).toBe(mockLoan.dueAt.getDate() + 3);
    });

    it('PARTIAL: second extension should mark as LATE with -1 penalty', async () => {
      const loanWithExtension = {
        ...mockLoan,
        partialExtensionUsed: true,
        repayments: [{ amount: 700 }],
      };
      prisma.loan.findUnique.mockResolvedValue(loanWithExtension);

      await service.create({ loanId: 'loan-1', amount: 200 });

      expect(reputationService.applyRepaymentOutcome).toHaveBeenCalledWith(
        'user-1',
        RepaymentClassification.LATE,
        1,
        'loan-1'
      );
    });

    it('ON_TIME: should set status=repaid and lateDays=0', async () => {
      prisma.loan.findUnique.mockResolvedValue(mockLoan);

      await service.create({ loanId: 'loan-1', amount: 1000 });

      expect(mockTx.loan.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'repaid',
            lateDays: 0,
          }),
        })
      );
    });

    it('LATE: should set status=repaid and calculate lateDays', async () => {
      const lateLoan = {
        ...mockLoan,
        dueAt: new Date('2026-01-30T12:00:00Z'),
      };
      prisma.loan.findUnique.mockResolvedValue(lateLoan);

      await service.create({ loanId: 'loan-1', amount: 1000 });

      const updateCall = mockTx.loan.update.mock.calls[0][0];
      expect(updateCall.data.status).toBe('repaid');
      expect(updateCall.data.lateDays).toBeGreaterThan(0);
    });
  });

  describe('STEP 3.3 & 3.4: Reputation Mutation & Recovery', () => {
    it('EARLY: should call reputation service with EARLY classification', async () => {
      const earlyLoan = {
        ...mockLoan,
        dueAt: new Date('2026-02-03T12:00:00Z'),
      };
      prisma.loan.findUnique.mockResolvedValue(earlyLoan);

      await service.create({ loanId: 'loan-1', amount: 1000 });

      expect(reputationService.applyRepaymentOutcome).toHaveBeenCalledWith(
        'user-1',
        RepaymentClassification.EARLY,
        0,
        'loan-1'
      );
    });

    it('PARTIAL: should NOT call reputation service', async () => {
      const loanWithRepayments = {
        ...mockLoan,
        repayments: [{ amount: 600 }],
      };
      prisma.loan.findUnique.mockResolvedValue(loanWithRepayments);

      await service.create({ loanId: 'loan-1', amount: 300 });

      expect(reputationService.applyRepaymentOutcome).not.toHaveBeenCalled();
    });

    it('1-day LATE: should call reputation service with LATE classification', async () => {
      const lateLoan = {
        ...mockLoan,
        dueAt: new Date('2026-01-31T12:00:00Z'),
      };
      prisma.loan.findUnique.mockResolvedValue(lateLoan);

      await service.create({ loanId: 'loan-1', amount: 1000 });

      expect(reputationService.applyRepaymentOutcome).toHaveBeenCalledWith(
        'user-1',
        RepaymentClassification.LATE,
        expect.any(Number),
        'loan-1'
      );
    });
  });

  describe('STEP 3.5: Blocking & Unblocking', () => {
    it('should handle blocked user response from reputation service', async () => {
      reputationService.applyRepaymentOutcome.mockResolvedValue({ blocked: true });
      prisma.loan.findUnique.mockResolvedValue(mockLoan);

      const result = await service.create({ loanId: 'loan-1', amount: 1000 });

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if loan not found', async () => {
      prisma.loan.findUnique.mockResolvedValue(null);

      await expect(service.create({ loanId: 'invalid', amount: 500 })).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException if loan already repaid', async () => {
      const repaidLoan = { ...mockLoan, status: 'repaid' };
      prisma.loan.findUnique.mockResolvedValue(repaidLoan);

      await expect(service.create({ loanId: 'loan-1', amount: 500 })).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('Edge Cases', () => {
    it('should allow only ONE partial extension', async () => {
      const loanFirstExtension = {
        ...mockLoan,
        partialExtensionUsed: false,
        repayments: [{ amount: 700 }],
      };
      prisma.loan.findUnique.mockResolvedValue(loanFirstExtension);

      await service.create({ loanId: 'loan-1', amount: 200 });

      expect(mockTx.loan.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            partialExtensionUsed: true,
          }),
        })
      );
    });

    it('should handle multiple repayments accumulation', async () => {
      const loanMultipleRepayments = {
        ...mockLoan,
        repayments: [{ amount: 300 }, { amount: 400 }, { amount: 200 }],
      };
      prisma.loan.findUnique.mockResolvedValue(loanMultipleRepayments);

      await service.create({ loanId: 'loan-1', amount: 100 });

      expect(mockTx.loan.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'repaid',
          }),
        })
      );
    });
  });
});
