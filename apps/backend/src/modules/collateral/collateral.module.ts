import { Module } from '@nestjs/common';

import { CollateralController } from './collateral.controller';
import { CollateralService } from './collateral.service';
import { Collateral } from './entities/collateral.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { CollateralScheduler } from './collateral.scheduler';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [ScheduleModule.forRoot(), AuditModule],
  controllers: [CollateralController],
  providers: [CollateralService, CollateralScheduler],
  exports: [CollateralService],
})
export class CollateralModule { }
