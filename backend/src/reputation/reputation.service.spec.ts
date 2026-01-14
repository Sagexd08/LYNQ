import { Test, TestingModule } from '@nestjs/testing';
import { ReputationService } from './reputation.service';
import { PrismaService } from '../prisma/prisma.service';
import { RepaymentClassification } from '../repayments/classification';

describe('ReputationService', () => {
  let service: ReputationService;
  let mockTx: any;
  let prisma: any;

  const mockReputation = {
    userId: 'user-1',
    score: 50,
    consecutiveLateCount: 0,
    cleanCycleCount: 0,
    maxScoreBeforeLastPenalty: null,
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockTx = {
      reputation: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      reputationEvent: {
        create: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    prisma = {
      reputation: {
        findUnique: jest.fn(),
      },
      reputationEvent: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn((callback: (tx: any) => Promise<any>) => callback(mockTx)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReputationService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ReputationService>(ReputationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('applyRepaymentOutcome', () => {
    it('should add +12 for EARLY repayment and log event', async () => {
      mockTx.reputation.findUnique.mockResolvedValue({ ...mockReputation });
      mockTx.reputation.update.mockResolvedValue({});
      mockTx.reputationEvent.create.mockResolvedValue({});

      await service.applyRepaymentOutcome('user-1', RepaymentClassification.EARLY, 0);

      expect(mockTx.reputation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            score: 62,
            cleanCycleCount: 1,
            consecutiveLateCount: 0,
          }),
        })
      );
      expect(mockTx.reputationEvent.create).toHaveBeenCalled();
    });

    it('should add +10 for ON_TIME repayment', async () => {
      mockTx.reputation.findUnique.mockResolvedValue({ ...mockReputation });
      mockTx.reputation.update.mockResolvedValue({});
      mockTx.reputationEvent.create.mockResolvedValue({});

      await service.applyRepaymentOutcome('user-1', RepaymentClassification.ON_TIME, 0);

      expect(mockTx.reputation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            score: 60,
            cleanCycleCount: 1,
          }),
        })
      );
    });

    it('should not change score for PARTIAL (no event logged)', async () => {
      mockTx.reputation.findUnique.mockResolvedValue({ ...mockReputation });
      mockTx.reputation.update.mockResolvedValue({});

      await service.applyRepaymentOutcome('user-1', RepaymentClassification.PARTIAL, 0);

      expect(mockTx.reputation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            score: 50,
          }),
        })
      );
      expect(mockTx.reputationEvent.create).not.toHaveBeenCalled();
    });

    it('should subtract -5 for 1-day LATE', async () => {
      mockTx.reputation.findUnique.mockResolvedValue({ ...mockReputation });
      mockTx.reputation.update.mockResolvedValue({});
      mockTx.reputationEvent.create.mockResolvedValue({});

      await service.applyRepaymentOutcome('user-1', RepaymentClassification.LATE, 1);

      expect(mockTx.reputation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            score: 45,
            consecutiveLateCount: 1,
            cleanCycleCount: 0,
          }),
        })
      );
    });

    it('should block user after 2 consecutive lates with -20 penalty', async () => {
      const reputationWithOneLate = {
        ...mockReputation,
        consecutiveLateCount: 1,
      };
      mockTx.reputation.findUnique.mockResolvedValue(reputationWithOneLate);
      mockTx.reputation.update.mockResolvedValue({});
      mockTx.user.update.mockResolvedValue({});
      mockTx.reputationEvent.create.mockResolvedValue({});

      const result = await service.applyRepaymentOutcome('user-1', RepaymentClassification.LATE, 1);

      expect(result.blocked).toBe(true);
      expect(mockTx.reputation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            score: 30,
            consecutiveLateCount: 2,
            maxScoreBeforeLastPenalty: 50,
          }),
        })
      );
      expect(mockTx.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'blocked' },
        })
      );
    });

    it('should reset consecutive late count on clean cycle', async () => {
      const reputationWithLateHistory = {
        ...mockReputation,
        consecutiveLateCount: 1,
      };
      mockTx.reputation.findUnique.mockResolvedValue(reputationWithLateHistory);
      mockTx.reputation.update.mockResolvedValue({});
      mockTx.reputationEvent.create.mockResolvedValue({});

      await service.applyRepaymentOutcome('user-1', RepaymentClassification.ON_TIME, 0);

      expect(mockTx.reputation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            consecutiveLateCount: 0,
            cleanCycleCount: 1,
          }),
        })
      );
    });

    it('should cap score at maxScoreBeforeLastPenalty during recovery', async () => {
      const reputationWithCap = {
        ...mockReputation,
        score: 40,
        cleanCycleCount: 1,
        maxScoreBeforeLastPenalty: 55,
      };
      mockTx.reputation.findUnique.mockResolvedValue(reputationWithCap);
      mockTx.reputation.update.mockResolvedValue({});
      mockTx.reputationEvent.create.mockResolvedValue({});

      await service.applyRepaymentOutcome('user-1', RepaymentClassification.EARLY, 0);

      const updateCall = mockTx.reputation.update.mock.calls[0][0];
      expect(updateCall.data.score).toBeLessThanOrEqual(55);
    });

    it('should clamp score to 100 max', async () => {
      const highScoreReputation = {
        ...mockReputation,
        score: 95,
      };
      mockTx.reputation.findUnique.mockResolvedValue(highScoreReputation);
      mockTx.reputation.update.mockResolvedValue({});
      mockTx.reputationEvent.create.mockResolvedValue({});

      await service.applyRepaymentOutcome('user-1', RepaymentClassification.EARLY, 0);

      expect(mockTx.reputation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            score: 100,
          }),
        })
      );
    });

    it('should clamp score to 0 min', async () => {
      const lowScoreReputation = {
        ...mockReputation,
        score: 3,
      };
      mockTx.reputation.findUnique.mockResolvedValue(lowScoreReputation);
      mockTx.reputation.update.mockResolvedValue({});
      mockTx.reputationEvent.create.mockResolvedValue({});

      await service.applyRepaymentOutcome('user-1', RepaymentClassification.LATE, 1);

      expect(mockTx.reputation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            score: 0,
          }),
        })
      );
    });

    it('should include loanId in audit event when provided', async () => {
      mockTx.reputation.findUnique.mockResolvedValue({ ...mockReputation });
      mockTx.reputation.update.mockResolvedValue({});
      mockTx.reputationEvent.create.mockResolvedValue({});

      await service.applyRepaymentOutcome('user-1', RepaymentClassification.EARLY, 0, 'loan-123');

      expect(mockTx.reputationEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            loanId: 'loan-123',
          }),
        })
      );
    });
  });

  describe('getHistory', () => {
    it('should return reputation events for user', async () => {
      const mockEvents = [
        { id: 'event-1', type: 'EARLY_REPAYMENT', delta: 12 },
      ];
      prisma.reputationEvent.findMany.mockResolvedValue(mockEvents);

      const result = await service.getHistory('user-1');

      expect(result).toEqual(mockEvents);
      expect(prisma.reputationEvent.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });
  });
});
