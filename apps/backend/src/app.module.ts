import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { validate } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { LoanModule } from './modules/loan/loan.module';
import { CollateralModule } from './modules/collateral/collateral.module';
import { MLModule } from './modules/ml/ml.module';
import { HealthModule } from './modules/health/health.module';
import { FlashLoanModule } from './modules/flashloan/flashloan.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { ReputationModule } from './modules/reputation/reputation.module';
import { User } from './modules/user/entities/user.entity';
import { Loan } from './modules/loan/entities/loan.entity';
import { Collateral } from './modules/collateral/entities/collateral.entity';
import { Repayment } from './modules/loan/entities/repayment.entity';
import { NotificationSettings } from './modules/user/entities/notification-settings.entity';
import { TrustScore } from './modules/user/entities/trust-score.entity';
import { PlatformStats } from './modules/system/entities/platform-stats.entity';
import { Vouch } from './modules/reputation/entities/vouch.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USER', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_NAME', 'lynq'),
        entities: [User, Loan, Collateral, Repayment, NotificationSettings, TrustScore, PlatformStats, Vouch],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    HealthModule,
    AuthModule,
    UserModule,
    LoanModule,
    CollateralModule,
    MLModule,
    FlashLoanModule,
    TelegramModule,
    ReputationModule,
  ],
})
export class AppModule {}
