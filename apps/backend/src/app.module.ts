import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { validate } from './config/env.validation';
import { buildTypeOrmOptions } from './config/database.config';

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
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AuditModule } from './modules/audit/audit.module';
import { MetricsController } from './common/metrics/metrics.controller';
import { CollateralModule } from './modules/collateral/collateral.module';
import { MLModule } from './modules/ml/ml.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
            validate,
        }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const env = {
                    NODE_ENV: configService.get<string>('NODE_ENV'),
                    DB_HOST: configService.get<string>('DB_HOST'),
                    DB_PORT: String(configService.get<number>('DB_PORT')),
                    DB_USER: configService.get<string>('DB_USER'),
                    DB_PASSWORD: configService.get<string>('DB_PASSWORD'),
                    DB_NAME: configService.get<string>('DB_NAME'),
                };

                return {
                    ...buildTypeOrmOptions(env),
                    // Ensure Nest knows about entities when synchronizing in dev
                    entities: [User, Loan, Repayment],
                    autoLoadEntities: true,
                    logging: configService.get('NODE_ENV') !== 'test',
                };
            },
        }),
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
    ],
    controllers: [MetricsController],
    providers: [],
})
export class AppModule { }
