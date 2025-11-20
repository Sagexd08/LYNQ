import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramService } from './services/telegram.service';
import { FlashLoanModule } from '../flashloan/flashloan.module';
import { User } from '../user/entities/user.entity';
import { NotificationSettings } from '../user/entities/notification-settings.entity';
import { Loan } from '../loan/entities/loan.entity';
import { Repayment } from '../loan/entities/repayment.entity';
import { TrustScore } from '../user/entities/trust-score.entity';

@Module({
  imports: [
    ConfigModule,
    FlashLoanModule,
    TypeOrmModule.forFeature([User, NotificationSettings, Loan, Repayment, TrustScore]),
  ],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
