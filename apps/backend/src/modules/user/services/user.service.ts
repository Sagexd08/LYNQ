import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['loans'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByWallet(chain: string, address: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { walletAddresses: { [chain]: address } },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async updateReputationPoints(userId: string, points: number): Promise<User> {
    const user = await this.findById(userId);
    user.reputationPoints += points;

    if (user.reputationPoints >= 1000 && user.reputationTier === 'BRONZE') {
      user.reputationTier = 'SILVER';
    } else if (user.reputationPoints >= 5000 && user.reputationTier === 'SILVER') {
      user.reputationTier = 'GOLD';
    } else if (user.reputationPoints >= 15000 && user.reputationTier === 'GOLD') {
      user.reputationTier = 'PLATINUM';
    }

    return this.userRepository.save(user);
  }
}
