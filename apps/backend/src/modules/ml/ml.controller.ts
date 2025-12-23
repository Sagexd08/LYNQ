import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { MLService } from './ml.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  CalculateCreditScoreDto,
  RunFraudDetectionDto,
  AssessLoanRiskDto,
  EnsemblePredictionDto,
  AnomalyDetectionDto,
  BaseMlModelDto
} from './dto/ml.dto';

@ApiTags('ML')
@Controller('ml')
export class MLController {
  constructor(private readonly service: MLService) { }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('my-score')
  @ApiOperation({ summary: 'Calculate credit score for the authenticated user' })
  getMyCreditScore(@Req() req: any) {
    return this.service.calculateUserCreditScore(req.user.id);
  }

  @Post('credit-score')
  @ApiOperation({ summary: 'Calculate credit score based on provided data' })
  calculateCreditScore(@Body() dto: CalculateCreditScoreDto) {
    return this.service.calculateCreditScore(dto);
  }

  @Post('fraud-check')
  @ApiOperation({ summary: 'Run fraud detection analysis' })
  runFraudDetection(@Body() dto: RunFraudDetectionDto) {
    return this.service.runFraudDetection(dto);
  }

  @Post('risk-assessment')
  @ApiOperation({ summary: 'Assess loan risk' })
  assessLoanRisk(@Body() dto: AssessLoanRiskDto) {
    return this.service.assessLoanRisk(dto);
  }

  @Post('ensemble-prediction')
  @ApiOperation({ summary: 'Run ensemble model prediction' })
  ensemblePrediction(@Body() dto: EnsemblePredictionDto) {
    return this.service.ensemblePrediction(dto);
  }

  @Post('ensemble-train')
  @ApiOperation({ summary: 'Trigger ensemble model training' })
  ensembleTrain(@Body() dto: BaseMlModelDto) {
    return this.service.ensembleTrain(dto);
  }

  @Get('feature-importance')
  @ApiOperation({ summary: 'Get feature importance rankings' })
  getFeatureImportance() {
    return this.service.getFeatureImportance();
  }

  @Post('cross-validate')
  @ApiOperation({ summary: 'Perform cross-validation' })
  crossValidate(@Body() dto: BaseMlModelDto) {
    return this.service.crossValidate(dto);
  }

  @Post('anomaly-detection')
  @ApiOperation({ summary: 'Detect anomalies in transaction' })
  anomalyDetection(@Body() dto: AnomalyDetectionDto) {
    return this.service.anomalyDetection(dto);
  }

  @Post('train-anomaly-detector')
  @ApiOperation({ summary: 'Train anomaly detection model' })
  trainAnomalyDetector(@Body() dto: BaseMlModelDto) {
    return this.service.trainAnomalyDetector(dto);
  }

  @Get('anomaly-baseline')
  @ApiOperation({ summary: 'Get anomaly detection baseline stats' })
  getAnomalyBaseline() {
    return this.service.getAnomalyBaseline();
  }

  @Post('forecast-timeseries')
  @ApiOperation({ summary: 'Forecast time series data' })
  forecastTimeseries(@Body() dto: BaseMlModelDto) {
    return this.service.forecastTimeseries(dto);
  }

  @Post('predict-loan-default')
  @ApiOperation({ summary: 'Predict loan default probability' })
  predictLoanDefault(@Body() dto: BaseMlModelDto) {
    return this.service.predictLoanDefault(dto);
  }

  @Post('predict-churn')
  @ApiOperation({ summary: 'Predict user churn' })
  predictChurn(@Body() dto: BaseMlModelDto) {
    return this.service.predictChurn(dto);
  }

  @Post('forecast-market')
  @ApiOperation({ summary: 'Forecast market trends' })
  forecastMarket(@Body() dto: BaseMlModelDto) {
    return this.service.forecastMarket(dto);
  }
}
