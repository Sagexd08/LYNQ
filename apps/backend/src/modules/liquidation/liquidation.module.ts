import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LiquidationController } from './controllers/liquidation.controller';
import { LiquidatorProtocolService } from './services/liquidator-protocol.service';
import { LiquidationService } from '../loan/services/liquidation.service';
import {
  Liquidator,
  LiquidationAuction,
  LiquidatorBid,
  LiquidationEvent,
} from './entities/liquidation.entity';
import { SystemModule } from '../system/system.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Liquidator,
      LiquidationAuction,
      LiquidatorBid,
      LiquidationEvent,
    ]),
    SystemModule,
  ],
  controllers: [LiquidationController],
  providers: [LiquidatorProtocolService, LiquidationService],
  exports: [LiquidatorProtocolService, LiquidationService],
})
export class LiquidationModule {}
