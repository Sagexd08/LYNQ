import { Module } from '@nestjs/common';
import { MLController } from './controllers/ml.controller';
import { CreditScoringService } from './services/credit-scoring.service';
import { FraudDetectionService } from './services/fraud-detection.service';
import { RiskAssessmentService } from './services/risk-assessment.service';
import { UserModule } from '../user/user.module';
import { LoanModule } from '../loan/loan.module';

@Module({
  imports: [UserModule, LoanModule],
  controllers: [MLController],
  providers: [CreditScoringService, FraudDetectionService, RiskAssessmentService],
  exports: [CreditScoringService, FraudDetectionService, RiskAssessmentService],
})
export class MLModule {}
