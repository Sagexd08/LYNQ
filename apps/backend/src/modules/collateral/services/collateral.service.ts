import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collateral, CollateralStatus } from '../entities/collateral.entity';
import { LockCollateralDto } from '../dto/lock-collateral.dto';
import { UnlockCollateralDto } from '../dto/unlock-collateral.dto';

@Injectable()
export class CollateralService {
  constructor(
    @InjectRepository(Collateral)
    private readonly collateralRepository: Repository<Collateral>,
  ) {}

  async lock(userId: string, lockCollateralDto: LockCollateralDto): Promise<Collateral> {
    const collateral = this.collateralRepository.create({
      userId,
      loanId: lockCollateralDto.loanId,
      chain: lockCollateralDto.chain,
      tokenAddress: lockCollateralDto.tokenAddress,
      tokenSymbol: lockCollateralDto.tokenSymbol,
      amount: lockCollateralDto.amount,
      valueUSD: lockCollateralDto.valueUSD,
      status: CollateralStatus.LOCKED,
      transactionHash: lockCollateralDto.transactionHash,
      lockedAt: new Date(),
    });

    return this.collateralRepository.save(collateral);
  }

  async unlock(id: string, unlockCollateralDto: UnlockCollateralDto): Promise<Collateral> {
    const collateral = await this.findById(id);

    if (collateral.status !== CollateralStatus.LOCKED) {
      throw new BadRequestException('Collateral is not locked');
    }

    collateral.status = CollateralStatus.UNLOCKED;
    collateral.unlockedAt = new Date();
    collateral.transactionHash = unlockCollateralDto.transactionHash;

    return this.collateralRepository.save(collateral);
  }

  async findById(id: string): Promise<Collateral> {
    const collateral = await this.collateralRepository.findOne({
      where: { id },
      relations: ['user', 'loan'],
    });

    if (!collateral) {
      throw new NotFoundException('Collateral not found');
    }

    return collateral;
  }

  async findByUser(userId: string): Promise<Collateral[]> {
    return this.collateralRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByLoan(loanId: string): Promise<Collateral[]> {
    return this.collateralRepository.find({
      where: { loanId },
    });
  }

  async getCurrentValue(id: string): Promise<{ valueUSD: string; healthFactor: number }> {
    const collateral = await this.findById(id);
    return {
      valueUSD: collateral.valueUSD,
      healthFactor: 1.5,
    };
  }

  async liquidate(id: string): Promise<Collateral> {
    const collateral = await this.findById(id);
    collateral.status = CollateralStatus.LIQUIDATED;
    return this.collateralRepository.save(collateral);
  }
}
