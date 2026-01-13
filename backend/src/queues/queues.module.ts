import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MlAssessmentProcessor } from './processors/ml-assessment.processor';
import { NotificationProcessor } from './processors/notification.processor';
import { MlModule } from '../ml/ml.module';
import { TelegramModule } from '../telegram/telegram.module';

export const QUEUE_NAMES = {
    ML_ASSESSMENT: 'ml-assessment',
    NOTIFICATIONS: 'notifications',
    BLOCKCHAIN_SYNC: 'blockchain-sync',
    RISK_EVALUATION: 'risk-evaluation',
};

@Module({
    imports: [
        BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                connection: {
                    host: new URL(configService.get<string>('REDIS_URL', 'redis:
                    port: parseInt(new URL(configService.get<string>('REDIS_URL', 'redis:
                },
                defaultJobOptions: {
                    removeOnComplete: 1000,
                    removeOnFail: 5000,
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 1000,
                    },
                },
            }),
        }),
        BullModule.registerQueue(
            { name: QUEUE_NAMES.ML_ASSESSMENT },
            { name: QUEUE_NAMES.NOTIFICATIONS },
            { name: QUEUE_NAMES.BLOCKCHAIN_SYNC },
            { name: QUEUE_NAMES.RISK_EVALUATION },
        ),
        MlModule,
        TelegramModule,
    ],
    providers: [MlAssessmentProcessor, NotificationProcessor],
    exports: [BullModule],
})
export class QueuesModule { }
