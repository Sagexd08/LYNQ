import { Test, TestingModule } from '@nestjs/testing';
import { ReputationService } from './reputation.service';
import { PrismaService } from '../prisma/prisma.service';
import { RepaymentClassification } from '../repayments/classification';

describe('ReputationService', () => {
  let service: ReputationService;
  let prisma: {
    reputation: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };

  const mockReputation = {
    userId: 'user-1',
    score: 50,
    consecutiveLateCount: 0,
    cleanCycleCount: 0,
    maxScoreBeforeLastPenalty: null,
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      reputation: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
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
    it('should add +12 for EARLY repayment', async () => {
      prisma.reputation.findUnique.mockResolvedValue({ ...mockReputation });
      prisma.reputation.update.mockResolvedValue({});

      await service.applyRepaymentOutcome('user-1', RepaymentClassification.EARLY, 0);

      expect(prisma.reputation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            score: 62,
            cleanCycleCount: 1,
            consecutiveLateCount: 0,
          }),
        })
      );
    });

    it('should add +10 for ON_TIME repayment', async () => {
      prisma.reputation.findUnique.mockResolvedValue({ ...mockReputation });
      prisma.reputation.update.mockResolvedValue({});

      await service.applyRepaymentOutcome('user-1', RepaymentClassification.ON_TIME, 0);

      expect(prisma.reputation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            score: 60,
            cleanCycleCount: 1,
          }),
        })
      );
    });

    it('should not change score for PARTIAL', async () => {
      prisma.reputation.findUnique.mockResolvedValue({ ...mockReputation });
      prisma.reputation.update.mockResolvedValue({});

      await service.applyRepaymentOutcome('user-1', RepaymentClassification.PARTIAL, 0);

      expect(prisma.reputation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            score: 50,
          }),
        })
      );
    });

    it('should subtract -5 for 1-day LATE', async () => {
      prisma.reputation.findUnique.mockResolvedValue({ ...mockReputation });
      prisma.reputation.update.mockResolvedValue({});
      prisma.user.update.mockResolvedValue({});

      await service.applyRepaymentOutcome('user-1', RepaymentClassification.LATE, 1);

      expect(prisma.reputation.update).toHaveBeenCalledWith(
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
      prisma.reputation.findUnique.mockResolvedValue(reputationWithOneLate);
      prisma.reputation.update.mockResolvedValue({});
      prisma.user.update.mockResolvedValue({});

      const result = await service.applyRepaymentOutcome('user-1', RepaymentClassification.LATE, 1);

      expect(result.blocked).toBe(true);
      expect(prisma.reputation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            score: 30,
            consecutiveLateCount: 2,
            maxScoreBeforeLastPenalty: 50,
          }),
        })
      );
      expect(prisma.user.update).toHaveBeenCalledWith(
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
      prisma.reputation.findUnique.mockResolvedValue(reputationWithLateHistory);
      prisma.reputation.update.mockResolvedValue({});

      await service.applyRepaymentOutcome('user-1', RepaymentClassification.ON_TIME, 0);

      expect(prisma.reputation.update).toHaveBeenCalledWith(
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
      prisma.reputation.findUnique.mockResolvedValue(reputationWithCap);
      prisma.reputation.update.mockResolvedValue({});

      await service.applyRepaymentOutcome('user-1', RepaymentClassification.EARLY, 0);

      const updateCall = prisma.reputation.update.mock.calls[0][0];
      expect(updateCall.data.score).toBeLessThanOrEqual(55);
    });

    it('should clamp score to 100 max', async () => {
      const highScoreReputation = {
        ...mockReputation,
        score: 95,
      };
      prisma.reputation.findUnique.mockResolvedValue(highScoreReputation);
      prisma.reputation.update.mockResolvedValue({});

      await service.applyRepaymentOutcome('user-1', RepaymentClassification.EARLY, 0);

      expect(prisma.reputation.update).toHaveBeenCalledWith(
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
      prisma.reputation.findUnique.mockResolvedValue(lowScoreReputation);
      prisma.reputation.update.mockResolvedValue({});
      prisma.user.update.mockResolvedValue({});

      await service.applyRepaymentOutcome('user-1', RepaymentClassification.LATE, 1);

      expect(prisma.reputation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            score: 0,
          }),
        })
      );
    });
  });
});
