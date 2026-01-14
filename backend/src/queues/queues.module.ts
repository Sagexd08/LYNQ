import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MlAssessmentProcessor } from './processors/ml-assessment.processor';
import { NotificationProcessor } from './processors/notification.processor';
import { LiquidationProcessor } from './processors/liquidation.processor';
import { LiquidationSchedulerService } from './processors/liquidation-scheduler.service';
import { MlModule } from '../ml/ml.module';
import { TelegramModule } from '../telegram/telegram.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { ReputationModule } from '../reputation/reputation.module';
import { BlockchainSyncProcessor } from './processors/blockchain-sync.processor';

export const QUEUE_NAMES = {
  ML_ASSESSMENT: 'ml-assessment',
  NOTIFICATIONS: 'notifications',
  BLOCKCHAIN_SYNC: 'blockchain-sync',
  RISK_EVALUATION: 'risk-evaluation',
  LIQUIDATION: 'liquidation',
};

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>(
          'REDIS_URL',
          'redis://localhost:6379',
        );
        const url = new URL(redisUrl);
        const isTls = url.protocol === 'rediss:';

        const connection: any = {
          host: url.hostname,
          port: parseInt(url.port || '6379'),
        };

        if (url.username) {
          connection.username = url.username;
        }

        if (url.password) {
          connection.password = url.password;
        }

        if (isTls) {
          connection.tls = {
            rejectUnauthorized: true,
          };
        }

        return {
          connection,
          defaultJobOptions: {
            removeOnComplete: 1000,
            removeOnFail: 5000,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 1000,
            },
          },
        };
      },
    }),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.ML_ASSESSMENT },
      { name: QUEUE_NAMES.NOTIFICATIONS },
      { name: QUEUE_NAMES.BLOCKCHAIN_SYNC },
      { name: QUEUE_NAMES.RISK_EVALUATION },
      { name: QUEUE_NAMES.LIQUIDATION },
    ),
    MlModule,
    TelegramModule,
    BlockchainModule,
    ReputationModule,
  ],
  providers: [
    MlAssessmentProcessor,
    NotificationProcessor,
    LiquidationProcessor,
    LiquidationSchedulerService,
    BlockchainSyncProcessor,
  ],
  exports: [BullModule],
})
export class QueuesModule {}
