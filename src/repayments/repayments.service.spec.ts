import { Test, TestingModule } from '@nestjs/testing';
import { RepaymentsService } from './repayments.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReputationService } from '../reputation/reputation.service';

describe('RepaymentsService', () => {
  let service: RepaymentsService;

  const mockPrismaService = {
    loan: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    repayment: {
      create: jest.fn(),
    },
  };

  const mockReputationService = {
    applyRepaymentOutcome: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepaymentsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ReputationService, useValue: mockReputationService },
      ],
    }).compile();

    service = module.get<RepaymentsService>(RepaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
