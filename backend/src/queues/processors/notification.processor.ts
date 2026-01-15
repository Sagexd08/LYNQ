import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { TelegramService } from '../../telegram/telegram.service';
import { NotificationType } from '../../telegram/dto/send-notification.dto';
import { QUEUE_NAMES } from '../queue-names.const';

export interface NotificationJobData {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
}

@Processor(QUEUE_NAMES.NOTIFICATIONS)
export class NotificationProcessor extends WorkerHost {
    private readonly logger = new Logger(NotificationProcessor.name);

    constructor(private readonly telegramService: TelegramService) {
        super();
    }

    async process(job: Job<NotificationJobData>) {
        this.logger.log(`Processing notification job ${job.id} for user ${job.data.userId}`);

        try {
            const success = await this.telegramService.sendNotification(job.data.userId, {
                type: job.data.type,
                title: job.data.title,
                message: job.data.message,
                data: job.data.data,
            });

            if (success) {
                this.logger.log(`Notification sent to user ${job.data.userId}`);
            } else {
                this.logger.warn(`Notification not sent (user not subscribed or disabled)`);
            }

            return { success };
        } catch (error) {
            this.logger.error(`Notification failed for user ${job.data.userId}: ${error.message}`);
            throw error;
        }
    }
}
