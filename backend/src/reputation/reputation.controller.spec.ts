import { Test, TestingModule } from '@nestjs/testing';
import { ReputationController } from './reputation.controller';
import { ReputationService } from './reputation.service';

describe('ReputationController', () => {
  let controller: ReputationController;

  const mockReputationService = {
    getScore: jest.fn(),
    getHistory: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReputationController],
      providers: [
        { provide: ReputationService, useValue: mockReputationService },
      ],
    }).compile();

    controller = module.get<ReputationController>(ReputationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
