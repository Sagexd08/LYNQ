import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUE_NAMES } from '../queues.module';

@Injectable()
export class LiquidationSchedulerService implements OnModuleInit {
    private readonly logger = new Logger(LiquidationSchedulerService.name);

    constructor(
        @InjectQueue(QUEUE_NAMES.LIQUIDATION) private liquidationQueue: Queue,
        private readonly prisma: PrismaService,
    ) {}

    async onModuleInit() {
        this.logger.log('Liquidation scheduler initialized');
    }

    // Run every hour
    @Cron(CronExpression.EVERY_HOUR)
    async checkOverdueLoans() {
        this.logger.log('Checking for overdue loans...');

        const overdueLoans = await this.prisma.loan.findMany({
            where: {
                status: 'ACTIVE',
                dueDate: {
                    lt: new Date(),
                },
            },
            select: { id: true },
        });

        this.logger.log(`Found ${overdueLoans.length} overdue loans`);

        for (const loan of overdueLoans) {
            await this.liquidationQueue.add(
                'check-liquidation',
                { loanId: loan.id },
                {
                    jobId: `liquidation-${loan.id}-${Date.now()}`,
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 5000 },
                },
            );
        }
    }
}
