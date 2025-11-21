import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CreditScoringService } from '../services/credit-scoring.service';
import { FraudDetectionService } from '../services/fraud-detection.service';
import { RiskAssessmentService } from '../services/risk-assessment.service';
import { EnsembleModelsService } from '../services/ensemble-models.service';
import { AnomalyDetectionService } from '../services/anomaly-detection.service';
import { PredictiveAnalyticsService } from '../services/predictive-analytics.service';
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
    private readonly ensembleModelsService: EnsembleModelsService,
    private readonly anomalyDetectionService: AnomalyDetectionService,
    private readonly predictiveAnalyticsService: PredictiveAnalyticsService,
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

  @Post('ensemble-prediction')
  @ApiOperation({ summary: 'Get ensemble ML model prediction' })
  async getEnsemblePrediction(@Body() data: any): Promise<any> {
    return this.ensembleModelsService.predict(data);
  }

  @Post('ensemble-train')
  @ApiOperation({ summary: 'Train ensemble models with historical data' })
  async trainEnsemble(
    @Body() data: { inputs: any[]; outputs: number[] },
  ): Promise<{ message: string }> {
    this.ensembleModelsService.trainModels(data.inputs, data.outputs);
    return { message: 'Ensemble models trained successfully' };
  }

  @Get('feature-importance')
  @ApiOperation({ summary: 'Get feature importance scores' })
  async getFeatureImportance(): Promise<any> {
    return this.ensembleModelsService.getFeatureImportance();
  }

  @Post('cross-validate')
  @ApiOperation({ summary: 'Perform cross-validation on ensemble models' })
  async crossValidate(
    @Body() data: { inputs: any[]; outputs: number[]; folds?: number },
  ): Promise<any> {
    const scores = this.ensembleModelsService.crossValidate(
      data.inputs,
      data.outputs,
      data.folds || 5,
    );
    return { scores, meanScore: scores.reduce((a, b) => a + b, 0) / scores.length };
  }

  @Post('anomaly-detection')
  @ApiOperation({ summary: 'Detect anomalies in user behavior' })
  async detectAnomaly(@Body() data: any): Promise<any> {
    return this.anomalyDetectionService.detect(data);
  }

  @Post('train-anomaly-detector')
  @ApiOperation({ summary: 'Train anomaly detection with historical data' })
  async trainAnomalyDetector(@Body() data: { historicalData: number[][] }): Promise<any> {
    this.anomalyDetectionService.trainOnHistoricalData(data.historicalData);
    return { message: 'Anomaly detector trained successfully' };
  }

  @Get('anomaly-baseline')
  @ApiOperation({ summary: 'Get baseline statistics for anomaly detection' })
  async getAnomalyBaseline(): Promise<any> {
    return this.anomalyDetectionService.getBaselineStats();
  }

  @Post('forecast-timeseries')
  @ApiOperation({ summary: 'Forecast time series data' })
  async forecastTimeSeries(@Body() data: any): Promise<any> {
    return this.predictiveAnalyticsService.forecastTimeSeries(data);
  }

  @Post('predict-loan-default')
  @ApiOperation({ summary: 'Predict loan default probability (advanced)' })
  async predictLoanDefault(
    @Body()
    data: {
      paymentHistory: number;
      delinquencyCount: number;
      utilizationRatio: number;
      incomeStability: number;
      accountAge: number;
    },
  ): Promise<any> {
    return this.predictiveAnalyticsService.predictLoanDefault(
      data.paymentHistory,
      data.delinquencyCount,
      data.utilizationRatio,
      data.incomeStability,
      data.accountAge,
    );
  }

  @Post('predict-churn')
  @ApiOperation({ summary: 'Predict user churn probability' })
  async predictChurn(
    @Body()
    data: {
      accountAge: number;
      lastActivityDays: number;
      transactionFrequency: number;
      averageTransactionValue: number;
      supportTickets: number;
    },
  ): Promise<any> {
    return this.predictiveAnalyticsService.predictChurn(
      data.accountAge,
      data.lastActivityDays,
      data.transactionFrequency,
      data.averageTransactionValue,
      data.supportTickets,
    );
  }

  @Post('forecast-market')
  @ApiOperation({ summary: 'Forecast market trends' })
  async forecastMarket(
    @Body() data: { historicalPrices: number[]; marketVolume: number[]; horizon?: number },
  ): Promise<any> {
    return this.predictiveAnalyticsService.forecastMarketTrend(
      data.historicalPrices,
      data.marketVolume,
      data.horizon,
    );
  }
}
