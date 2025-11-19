import { Module } from '@nestjs/common';
import { CollateralController } from './controllers/collateral.controller';
import { CollateralService } from './services/collateral.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Collateral } from './entities/collateral.entity';
import { UserModule } from '../user/user.module';
import { LoanModule } from '../loan/loan.module';

@Module({
  imports: [TypeOrmModule.forFeature([Collateral]), UserModule, LoanModule],
  controllers: [CollateralController],
  providers: [CollateralService],
  exports: [CollateralService],
})
export class CollateralModule {}
