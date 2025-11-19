import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CreditScoringService } from '../services/credit-scoring.service';
import { FraudDetectionService } from '../services/fraud-detection.service';
import { RiskAssessmentService } from '../services/risk-assessment.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Machine Learning')
@Controller('ml')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MLController {
  constructor(
    private readonly creditScoringService: CreditScoringService,
    private readonly fraudDetectionService: FraudDetectionService,
    private readonly riskAssessmentService: RiskAssessmentService,
  ) {}

  @Get('credit-score/:userId')
  @ApiOperation({ summary: 'Calculate credit score for user' })
  async getCreditScore(@Param('userId') userId: string): Promise<any> {
    return this.creditScoringService.calculateScore(userId);
  }

  @Post('fraud-check')
  @ApiOperation({ summary: 'Check transaction for fraud' })
  async checkFraud(@Body() data: any): Promise<any> {
    return this.fraudDetectionService.analyzeTransaction(data);
  }

  @Get('risk-assessment/:loanId')
  @ApiOperation({ summary: 'Assess loan risk' })
  async assessRisk(@Param('loanId') loanId: string): Promise<any> {
    return this.riskAssessmentService.assessLoan(loanId);
  }

  @Post('predict-default')
  @ApiOperation({ summary: 'Predict loan default probability' })
  async predictDefault(@Body() data: any): Promise<any> {
    return this.riskAssessmentService.predictDefault(data);
  }
}
