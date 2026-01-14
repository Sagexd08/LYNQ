import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MlService } from '../../ml/ml.service';
import { QUEUE_NAMES } from '../queues.module';

export interface MlAssessmentJobData {
  loanId: string;
  walletAddress: string;
  walletAgeDays: number;
  totalTransactions: number;
  totalVolumeUsd: number;
  defiInteractions: number;
  loanAmount: number;
  collateralValueUsd: number;
  termMonths: number;
  previousLoans: number;
  successfulRepayments: number;
  defaults: number;
  reputationScore: number;
}

@Processor(QUEUE_NAMES.ML_ASSESSMENT)
export class MlAssessmentProcessor extends WorkerHost {
  private readonly logger = new Logger(MlAssessmentProcessor.name);

  constructor(private readonly mlService: MlService) {
    super();
  }

  async process(job: Job<MlAssessmentJobData>) {
    this.logger.log(
      `Processing ML assessment job ${job.id} for loan ${job.data.loanId}`,
    );

    try {
      const result = await this.mlService.assessCreditRisk({
        walletAddress: job.data.walletAddress,
        walletAgeDays: job.data.walletAgeDays,
        totalTransactions: job.data.totalTransactions,
        totalVolumeUsd: job.data.totalVolumeUsd,
        defiInteractions: job.data.defiInteractions,
        loanAmount: job.data.loanAmount,
        collateralValueUsd: job.data.collateralValueUsd,
        termMonths: job.data.termMonths,
        previousLoans: job.data.previousLoans,
        successfulRepayments: job.data.successfulRepayments,
        defaults: job.data.defaults,
        reputationScore: job.data.reputationScore,
      });

      this.logger.log(
        `ML assessment completed for loan ${job.data.loanId}: score=${result.creditScore}`,
      );

      return {
        loanId: job.data.loanId,
        ...result,
      };
    } catch (error) {
      this.logger.error(
        `ML assessment failed for loan ${job.data.loanId}: ${error.message}`,
      );
      throw error;
    }
  }
}
