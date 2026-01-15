import { Module } from '@nestjs/common';
import { LoansService } from './loans.service';
import { LoansController } from './loans.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RiskModule } from '../risk/risk.module';
import { CollateralModule } from '../collateral/collateral.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { QueuesModule } from '../queues/queues.module';

@Module({
  imports: [PrismaModule, RiskModule, CollateralModule, BlockchainModule, QueuesModule],
  controllers: [LoansController],
  providers: [LoansService],
  exports: [LoansService],
})
export class LoansModule { }

