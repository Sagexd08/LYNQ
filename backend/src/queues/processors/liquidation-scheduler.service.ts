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

    const batchSize = 100;
    let cursor: { id: string } | undefined = undefined;
    let totalProcessed = 0;
    const whereClause = {
      status: 'ACTIVE' as const,
      dueDate: {
        lt: new Date(),
      },
    };

    while (true) {
      const overdueLoans: Array<{ id: string }> =
        await this.prisma.loan.findMany({
          where: whereClause,
          select: { id: true },
          orderBy: { id: 'asc' },
          take: batchSize,
          ...(cursor && { cursor }),
          skip: cursor ? 1 : undefined,
        });

      if (overdueLoans.length === 0) {
        break;
      }

      this.logger.log(
        `Processing batch of ${overdueLoans.length} overdue loans (total: ${totalProcessed + overdueLoans.length})`,
      );

      for (const loan of overdueLoans) {
        await this.liquidationQueue.add(
          'check-liquidation',
          { loanId: loan.id },
          {
            jobId: `liquidation-${loan.id}`,
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
          },
        );
      }

      totalProcessed += overdueLoans.length;
      cursor = { id: overdueLoans[overdueLoans.length - 1].id };

      // If we got fewer results than batchSize, we've reached the end
      if (overdueLoans.length < batchSize) {
        break;
      }
    }

    this.logger.log(`Finished processing ${totalProcessed} overdue loans`);
  }
}
