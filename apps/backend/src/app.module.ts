import { Module } from '@nestjs/common';
import { IndexerModule } from './modules/indexer/indexer.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validate } from './config/env.validation';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { LoanModule } from './modules/loan/loan.module';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { FlashLoanModule } from './modules/flashloan/flashloan.module';
import { HealthModule } from './modules/health/health.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AuditModule } from './modules/audit/audit.module';
import { MetricsController } from './common/metrics/metrics.controller';
import { CollateralModule } from './modules/collateral/collateral.module';
import { RiskScoringModule } from './modules/risk-scoring/risk-scoring.module';
import { EducationModule } from './modules/education/education.module';
import { SupabaseModule } from './modules/supabase/supabase.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
            validate,
        }),
        
        
        
        UserModule,
        AuthModule,
        LoanModule,
        CollateralModule,
        RiskScoringModule,
        EducationModule,
        
        ScheduleModule.forRoot(),
        ThrottlerModule.forRoot({ ttl: 60, limit: 30 }),
        AuditModule,
        
        BlockchainModule,
        FlashLoanModule,
        HealthModule,
        TelegramModule,
        IndexerModule,
        SupabaseModule,
    ],
    controllers: [MetricsController],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule { }
