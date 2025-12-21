import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collateral } from './entities/collateral.entity';

@Injectable()
export class CollateralService {
  constructor(@InjectRepository(Collateral) private readonly repo: Repository<Collateral>) {}

  async lockCollateral(dto: Partial<Collateral>) {
    const entity = this.repo.create({ ...dto, status: 'LOCKED' } as any);
    return this.repo.save(entity);
  }

  async listUserCollateral(): Promise<Collateral[]> {
    return this.repo.find();
  }

  async getCollateralDetails(id: string) {
    return this.repo.findOneBy({ id });
  }

  async unlockCollateral(id: string) {
    await this.repo.update({ id }, { status: 'UNLOCKED' } as any);
    return this.getCollateralDetails(id);
  }

  async getCollateralValue(id: string) {
    // Placeholder - in real implementation call price oracle/chain
    const entity = await this.getCollateralDetails(id);
    return { id, value: entity?.lastValuation ? Number(entity.lastValuation) : 1000 };
  }
}
