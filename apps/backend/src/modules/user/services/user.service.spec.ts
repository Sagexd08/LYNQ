/// <reference types="jest" />
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Repository } from 'typeorm';
import { User, ReputationTier } from '../entities/user.entity';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let repo: Repository<User>;

  const mockRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  } as unknown as Repository<User>;

  beforeEach(() => {
    repo = mockRepo as unknown as Repository<User>;
    service = new UserService(repo as any);
    jest.clearAllMocks();
  });

  it('increments reputation points and upgrades tiers appropriately', async () => {
    const user: User = {
      id: 'u1',
      email: 'test@example.com',
      reputationTier: ReputationTier.BRONZE,
      reputationPoints: 990,
      kycVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as User;

    (repo.findOne as any).mockResolvedValue(user);
    (repo.save as any).mockImplementation(async (u: User) => u);

    const updated = await service.updateReputationPoints('u1', 20);
    expect(updated.reputationPoints).toBe(1010);
    expect(updated.reputationTier).toBe(ReputationTier.SILVER);
  });
});
