import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { MLService } from './ml.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('ML')
@Controller('ml')
export class MLController {
  constructor(private readonly service: MLService) { }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('my-score')
  getMyCreditScore(@Req() req: any) {
    return this.service.calculateUserCreditScore(req.user.id);
  }

  @Post('credit-score')
  calculateCreditScore(@Body() dto: any) {
    return this.service.calculateCreditScore(dto);
  }

  @Post('fraud-check')
  runFraudDetection(@Body() dto: any) {
    return this.service.runFraudDetection(dto);
  }

  @Post('risk-assessment')
  assessLoanRisk(@Body() dto: any) {
    return this.service.assessLoanRisk(dto);
  }

  @Post('ensemble-prediction')
  ensemblePrediction(@Body() dto: any) {
    return this.service.ensemblePrediction(dto);
  }

  @Post('ensemble-train')
  ensembleTrain(@Body() dto: any) {
    return this.service.ensembleTrain(dto);
  }

  @Get('feature-importance')
  getFeatureImportance() {
    return this.service.getFeatureImportance();
  }

  @Post('cross-validate')
  crossValidate(@Body() dto: any) {
    return this.service.crossValidate(dto);
  }

  @Post('anomaly-detection')
  anomalyDetection(@Body() dto: any) {
    return this.service.anomalyDetection(dto);
  }

  @Post('train-anomaly-detector')
  trainAnomalyDetector(@Body() dto: any) {
    return this.service.trainAnomalyDetector(dto);
  }

  @Get('anomaly-baseline')
  getAnomalyBaseline() {
    return this.service.getAnomalyBaseline();
  }

  @Post('forecast-timeseries')
  forecastTimeseries(@Body() dto: any) {
    return this.service.forecastTimeseries(dto);
  }

  @Post('predict-loan-default')
  predictLoanDefault(@Body() dto: any) {
    return this.service.predictLoanDefault(dto);
  }

  @Post('predict-churn')
  predictChurn(@Body() dto: any) {
    return this.service.predictChurn(dto);
  }

  @Post('forecast-market')
  forecastMarket(@Body() dto: any) {
    return this.service.forecastMarket(dto);
  }
}
