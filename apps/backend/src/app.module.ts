import { Module } from '@nestjs/common';
import { IndexerModule } from './modules/indexer/indexer.module';
import { ConfigModule, ConfigService } from '@nestjs/config';


import { validate } from './config/env.validation';

// Entities
import { User } from './modules/user/entities/user.entity';
import { Loan } from './modules/loan/entities/loan.entity';
import { Repayment } from './modules/loan/entities/repayment.entity';

// Modules
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
import { MLModule } from './modules/ml/ml.module';
import { SupabaseModule } from './modules/supabase/supabase.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
            validate,
        }),
        // TypeOrmModule removed as per request
        // Entities are now managed via SupabaseService or raw SQL if needed.
        // Core Modules
        UserModule,
        AuthModule,
        LoanModule,
        CollateralModule,
        MLModule,
        // Scheduling & Throttling
        ScheduleModule.forRoot(),
        ThrottlerModule.forRoot({ ttl: 60, limit: 30 }),
        AuditModule,
        // Infrastructure Modules
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
