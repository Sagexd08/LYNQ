import { Injectable } from '@nestjs/common';
import logger from '../../../utils/logger';

/**
 * Predictive Analytics Service
 * Forecasts future behavior and trends using time series and regression models
 */

export interface PredictionInput {
  historicalValues: number[];
  timeSeriesData: Array<{ timestamp: number; value: number }>;
  externalFactors?: Record<string, number>;
  horizon: number; // Number of periods to forecast
}

export interface Prediction {
  forecast: number[];
  confidence: number;
  trend: 'INCREASING' | 'DECREASING' | 'STABLE';
  changeRate: number; // Percentage change
  model: string;
  upperBound: number[];
  lowerBound: number[];
}

export interface LoanDefaultPrediction {
  defaultProbability: number; // 0-100
  riskFactors: string[];
  timeToDefault?: number; // Months until potential default
  recommendedAction: 'MONITOR' | 'INTERVENE' | 'ALERT_LENDER';
}

export interface ChurnPrediction {
  churnProbability: number; // 0-100
  churnRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  retentionFactors: string[];
  recommendedRetentionStrategy: string;
}

/**
 * ARIMA-like time series forecasting
 */
class ARIMAForecaster {
  private order: { p: number; d: number; q: number } = { p: 1, d: 1, q: 1 };
  private differences: number[] = [];
  private arParams: number[] = [];
  private maParams: number[] = [];

  forecast(data: number[], steps: number): { forecast: number[]; confidence: number[] } {
    // Differencing
    const differenced = this.differenceData(data, this.order.d);

    // Estimate AR and MA parameters
    this.estimateParameters(differenced);

    // Generate forecast
    const forecast: number[] = [];
    const confidence: number[] = [];

    let lastValue = data[data.length - 1];
    const std = this.calculateStdDev(differenced);

    for (let i = 0; i < steps; i++) {
      // AR component
      let arPart = 0;
      for (let j = 0; j < this.arParams.length && j < differenced.length; j++) {
        arPart += this.arParams[j] * (differenced[differenced.length - 1 - j] || 0);
      }

      // MA component (simplified)
      let maPart = 0;
      for (let j = 0; j < this.maParams.length; j++) {
        maPart += this.maParams[j] * (Math.random() - 0.5);
      }

      const change = arPart + maPart;
      lastValue += change;
      forecast.push(lastValue);

      // Confidence interval widens with forecast horizon
      const conf = Math.max(50, 95 - (i * 5));
      confidence.push(conf);
    }

    return { forecast, confidence };
  }

  private differenceData(data: number[], d: number): number[] {
    let result = [...data];
    for (let i = 0; i < d; i++) {
      result = result.slice(1).map((val, idx) => val - result[idx]);
    }
    return result;
  }

  private estimateParameters(data: number[]): void {
    // Simplified parameter estimation
    this.arParams = [
      (data[data.length - 1] - data[0]) / data.length,
      (data[data.length - 1] - data[Math.max(0, data.length - 2)]) / 2,
    ];
    this.maParams = [0.1, 0.05];
  }

  private calculateStdDev(data: number[]): number {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    return Math.sqrt(variance);
  }
}

/**
 * Exponential Smoothing forecaster
 */
class ExponentialSmoothingForecaster {
  private alpha: number = 0.3; // Smoothing factor
  private beta: number = 0.1; // Trend smoothing
  private gamma: number = 0.1; // Seasonality smoothing

  forecast(data: number[], steps: number): number[] {
    if (data.length === 0) return Array(steps).fill(0);

    let level = data[0];
    let trend = data.length > 1 ? data[1] - data[0] : 0;
    const forecast: number[] = [];

    for (const value of data) {
      const lastLevel = level;
      level = this.alpha * value + (1 - this.alpha) * (level + trend);
      trend = this.beta * (level - lastLevel) + (1 - this.beta) * trend;
    }

    for (let i = 1; i <= steps; i++) {
      forecast.push(level + i * trend);
    }

    return forecast;
  }
}

/**
 * Gradient Boosted Regression for predictions
 */
class GradientBoostedRegressor {
  private estimators: SimpleRegressor[] = [];
  private learningRate: number = 0.1;
  private numEstimators: number = 50;

  train(X: number[][], y: number[]): void {
    let residuals = [...y];

    for (let i = 0; i < this.numEstimators; i++) {
      const estimator = new SimpleRegressor();
      estimator.train(X, residuals);
      this.estimators.push(estimator);

      // Update residuals
      const predictions = X.map(x => this.learningRate * estimator.predict(x));
      residuals = residuals.map((r, idx) => r - predictions[idx]);
    }
  }

  predict(X: number[]): number {
    let prediction = 0;
    for (const estimator of this.estimators) {
      prediction += this.learningRate * estimator.predict(X);
    }
    return prediction;
  }
}

/**
 * Simple linear regressor
 */
class SimpleRegressor {
  private coefficients: number[] = [];
  private intercept: number = 0;

  train(X: number[][], y: number[]): void {
    if (X.length === 0 || X[0].length === 0) return;

    const numFeatures = X[0].length;
    this.coefficients = Array(numFeatures).fill(0);

    // Simplified gradient descent
    const learningRate = 0.001;
    const epochs = 100;

    for (let epoch = 0; epoch < epochs; epoch++) {
      for (let i = 0; i < X.length; i++) {
        const x = X[i];
        let prediction = this.intercept;
        for (let j = 0; j < x.length; j++) {
          prediction += this.coefficients[j] * x[j];
        }

        const error = y[i] - prediction;

        this.intercept += learningRate * error;
        for (let j = 0; j < x.length; j++) {
          this.coefficients[j] += learningRate * error * x[j];
        }
      }
    }
  }

  predict(X: number[]): number {
    let result = this.intercept;
    for (let i = 0; i < Math.min(X.length, this.coefficients.length); i++) {
      result += this.coefficients[i] * X[i];
    }
    return result;
  }
}

@Injectable()
export class PredictiveAnalyticsService {
  private arimaForecaster: ARIMAForecaster;
  private exponentialSmoothing: ExponentialSmoothingForecaster;
  private gbRegressor: GradientBoostedRegressor;

  constructor() {
    this.arimaForecaster = new ARIMAForecaster();
    this.exponentialSmoothing = new ExponentialSmoothingForecaster();
    this.gbRegressor = new GradientBoostedRegressor();

    logger.info('Predictive Analytics Service initialized');
  }

  /**
   * Forecast time series data
   */
  forecastTimeSeries(input: PredictionInput): Prediction {
    const arimaResult = this.arimaForecaster.forecast(input.historicalValues, input.horizon);
    const expSmooResult = this.exponentialSmoothing.forecast(input.historicalValues, input.horizon);

    // Ensemble prediction
    const forecast = arimaResult.forecast.map((v, i) => (v + expSmooResult[i]) / 2);

    // Calculate trend
    const recentValues = input.historicalValues.slice(-10);
    const avgRecent = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    const avgOlder = input.historicalValues
      .slice(0, Math.max(1, input.historicalValues.length - 10))
      .reduce((a, b) => a + b, 0) / Math.max(1, input.historicalValues.length - 10);

    let trend: 'INCREASING' | 'DECREASING' | 'STABLE';
    const changeRate = avgOlder > 0 ? ((avgRecent - avgOlder) / avgOlder) * 100 : 0;

    if (changeRate > 5) {
      trend = 'INCREASING';
    } else if (changeRate < -5) {
      trend = 'DECREASING';
    } else {
      trend = 'STABLE';
    }

    // Calculate bounds
    const stdDev = this.calculateStdDev(input.historicalValues);
    const upperBound = forecast.map(v => v + 1.96 * stdDev);
    const lowerBound = forecast.map(v => Math.max(0, v - 1.96 * stdDev));

    // Average confidence
    const avgConfidence =
      arimaResult.confidence.reduce((a, b) => a + b, 0) / arimaResult.confidence.length;

    return {
      forecast,
      confidence: Math.round(avgConfidence),
      trend,
      changeRate: Math.round(changeRate * 10) / 10,
      model: 'ARIMA-Exponential Smoothing Ensemble',
      upperBound,
      lowerBound,
    };
  }

  /**
   * Predict loan default probability
   */
  predictLoanDefault(
    paymentHistory: number,
    delinquencyCount: number,
    utilizationRatio: number,
    incomeStability: number,
    accountAge: number,
  ): LoanDefaultPrediction {
    // Risk factors
    const factors: string[] = [];
    let riskScore = 0;

    if (paymentHistory < 50) {
      riskScore += 25;
      factors.push('Poor payment history');
    }

    if (delinquencyCount > 2) {
      riskScore += 30;
      factors.push('Multiple delinquencies');
    }

    if (utilizationRatio > 0.8) {
      riskScore += 15;
      factors.push('High debt utilization');
    }

    if (incomeStability < 40) {
      riskScore += 20;
      factors.push('Unstable income');
    }

    if (accountAge < 12) {
      riskScore += 10;
      factors.push('New account');
    }

    // Estimate time to default
    let timeToDefault: number | undefined;
    if (riskScore > 60) {
      // Predict potential default within months
      timeToDefault = Math.max(1, Math.min(24, Math.round(100 - riskScore) / 2));
    }

    // Recommended action
    let recommendedAction: 'MONITOR' | 'INTERVENE' | 'ALERT_LENDER';
    if (riskScore < 30) {
      recommendedAction = 'MONITOR';
    } else if (riskScore < 70) {
      recommendedAction = 'INTERVENE';
    } else {
      recommendedAction = 'ALERT_LENDER';
    }

    return {
      defaultProbability: Math.min(100, Math.max(0, riskScore)),
      riskFactors: factors,
      timeToDefault,
      recommendedAction,
    };
  }

  /**
   * Predict user churn probability
   */
  predictChurn(
    accountAge: number,
    lastActivityDays: number,
    transactionFrequency: number,
    averageTransactionValue: number,
    supportTickets: number,
  ): ChurnPrediction {
    let churnScore = 0;
    const factors: string[] = [];

    // Inactive accounts have high churn
    if (lastActivityDays > 90) {
      churnScore += 35;
      factors.push('No recent activity');
    } else if (lastActivityDays > 30) {
      churnScore += 15;
      factors.push('Reduced activity');
    }

    // New accounts may churn
    if (accountAge < 6) {
      churnScore += 20;
      factors.push('New user');
    }

    // Low transaction frequency
    if (transactionFrequency < 2) {
      churnScore += 20;
      factors.push('Low engagement');
    }

    // Support issues increase churn
    if (supportTickets > 3) {
      churnScore += 15;
      factors.push('Multiple support issues');
    }

    // High transaction value indicates commitment
    if (averageTransactionValue > 5000) {
      churnScore = Math.max(0, churnScore - 10);
    }

    // Determine risk level
    let churnRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    if (churnScore < 30) {
      churnRisk = 'LOW';
    } else if (churnScore < 60) {
      churnRisk = 'MEDIUM';
    } else {
      churnRisk = 'HIGH';
    }

    // Retention strategy
    let strategy = 'Standard monitoring';
    if (churnRisk === 'HIGH') {
      if (lastActivityDays > 90) {
        strategy = 'Re-engagement campaign via email/push';
      } else {
        strategy = 'Proactive support outreach + special offer';
      }
    } else if (churnRisk === 'MEDIUM') {
      strategy = 'Increase engagement touchpoints';
    }

    return {
      churnProbability: Math.min(100, Math.max(0, churnScore)),
      churnRisk,
      retentionFactors: factors,
      recommendedRetentionStrategy: strategy,
    };
  }

  /**
   * Forecast market trends
   */
  forecastMarketTrend(
    historicalPrices: number[],
    marketVolume: number[],
    horizon: number = 30,
  ): {
    priceForecast: number[];
    volatilityForecast: number[];
    trend: string;
  } {
    const priceForecast = this.exponentialSmoothing.forecast(historicalPrices, horizon);

    // Volatility forecast (simplified)
    const volatilityForecast = marketVolume
      .slice(-horizon)
      .map(v => v * (0.8 + Math.random() * 0.4));

    // Trend analysis
    const currentPrice = historicalPrices[historicalPrices.length - 1];
    const forecastedPrice = priceForecast[priceForecast.length - 1];
    const trend = forecastedPrice > currentPrice ? 'BULLISH' : 'BEARISH';

    return {
      priceForecast,
      volatilityForecast,
      trend,
    };
  }

  private calculateStdDev(data: number[]): number {
    if (data.length === 0) return 0;
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    return Math.sqrt(variance);
  }
}
