import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FlashLoanService } from './services/flash-loan.service';

@Module({
  imports: [ConfigModule],
  providers: [FlashLoanService],
  exports: [FlashLoanService],
})
export class FlashLoanModule {}
