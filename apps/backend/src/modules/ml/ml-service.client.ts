import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface CreditScoreRequest {
  applicant_id: string;
  loan_amount: number;
  loan_term_months: number;
  collateral_amount: number;
  collateral_type: string;
  age?: number;
  annual_income?: number;
  credit_score?: number;
  total_portfolio_value?: number;
}

export interface CreditScoreResponse {
  applicant_id: string;
  credit_score: number;
  default_probability: number;
  risk_level: string;
  recommended_action: string;
  interest_rate: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  feature_importance: Record<string, number>;
  explanation: string;
  model_version: string;
  inference_time_ms: number;
}

@Injectable()
export class MLServiceClient {
  private readonly logger = new Logger(MLServiceClient.name);
  private readonly client: AxiosInstance;
  private readonly serviceUrl: string;
  private readonly enabled: boolean;

  constructor(private configService: ConfigService) {
    this.serviceUrl = this.configService.get<string>('ML_SERVICE_URL', 'http://localhost:8001');
    this.enabled = this.configService.get<boolean>('ML_SERVICE_ENABLED', true);
    
    this.client = axios.create({
      baseURL: this.serviceUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (this.enabled) {
      this.logger.log(`ML Service initialized at ${this.serviceUrl}`);
    } else {
      this.logger.warn('ML Service is disabled');
    }
  }

  async getCreditScore(request: CreditScoreRequest): Promise<CreditScoreResponse> {
    if (!this.enabled) {
      throw new HttpException('ML Service is disabled', HttpStatus.SERVICE_UNAVAILABLE);
    }

    try {
      this.logger.log(`Requesting credit score for applicant: ${request.applicant_id}`);
      
      const response = await this.client.post<CreditScoreResponse>(
        '/api/ml/credit-score',
        request
      );

      this.logger.log(
        `Credit score received: ${response.data.credit_score} (${response.data.risk_level})`
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get credit score: ${error.message}`, error.stack);
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new HttpException(
            error.response.data?.detail || 'ML Service returned an error',
            error.response.status
          );
        } else if (error.request) {
          throw new HttpException(
            'ML Service is not reachable',
            HttpStatus.SERVICE_UNAVAILABLE
          );
        }
      }
      
      throw new HttpException(
        'Failed to get credit score',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async batchCreditScore(applicantIds: string[]): Promise<any> {
    if (!this.enabled) {
      throw new HttpException('ML Service is disabled', HttpStatus.SERVICE_UNAVAILABLE);
    }

    try {
      const response = await this.client.post('/api/ml/batch-score', {
        applicant_ids: applicantIds,
        processing_mode: 'sync'
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to batch score: ${error.message}`);
      throw new HttpException(
        'Failed to batch score',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getModelInfo(): Promise<any> {
    try {
      const response = await this.client.get('/api/ml/model/info');
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get model info: ${error.message}`);
      throw new HttpException(
        'Failed to get model info',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/ml/health');
      return response.data.status === 'healthy';
    } catch (error) {
      this.logger.warn(`ML Service health check failed: ${error.message}`);
      return false;
    }
  }
}
