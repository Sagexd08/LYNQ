import { Module } from '@nestjs/common';
import { MLController } from './controllers/ml.controller';
import { CreditScoringService } from './services/credit-scoring.service';
import { FraudDetectionService } from './services/fraud-detection.service';
import { RiskAssessmentService } from './services/risk-assessment.service';
import { EnsembleModelsService } from './services/ensemble-models.service';
import { AnomalyDetectionService } from './services/anomaly-detection.service';
import { PredictiveAnalyticsService } from './services/predictive-analytics.service';
import { UserModule } from '../user/user.module';
import { LoanModule } from '../loan/loan.module';

@Module({
  imports: [UserModule, LoanModule],
  controllers: [MLController],
  providers: [
    CreditScoringService,
    FraudDetectionService,
    RiskAssessmentService,
    EnsembleModelsService,
    AnomalyDetectionService,
    PredictiveAnalyticsService,
  ],
  exports: [
    CreditScoringService,
    FraudDetectionService,
    RiskAssessmentService,
    EnsembleModelsService,
    AnomalyDetectionService,
    PredictiveAnalyticsService,
  ],
})
export class MLModule {}
