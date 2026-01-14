import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FactorExplanation {
  @ApiProperty()
  feature: string;

  @ApiProperty()
  impact: string;

  @ApiProperty()
  value: number;

  @ApiProperty()
  contribution: number;
}

export class MlAssessmentResponseDto {
  @ApiProperty({ description: 'Credit score (0-1000)' })
  creditScore: number;

  @ApiProperty({ description: 'Fraud probability (0-1)' })
  fraudScore: number;

  @ApiProperty({ description: 'Anomaly score (0-1)' })
  anomalyScore: number;

  @ApiProperty({
    description: 'Risk level',
    enum: ['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'],
  })
  riskLevel: string;

  @ApiProperty({ description: 'Default probability (0-1)' })
  defaultProbability: number;

  @ApiProperty({
    description: 'Recommended action',
    enum: ['APPROVE', 'APPROVE_WITH_CONDITIONS', 'MANUAL_REVIEW', 'REJECT'],
  })
  recommendedAction: string;

  @ApiProperty({ description: 'Suggested interest rate %' })
  interestRateSuggestion: number;

  @ApiProperty({ description: 'Maximum recommended loan amount' })
  maxLoanAmount: number;

  @ApiPropertyOptional({ description: 'Model confidence score' })
  confidenceScore?: number;

  @ApiPropertyOptional({
    description: 'Top factors influencing decision',
    type: [FactorExplanation],
  })
  topFactors?: FactorExplanation[];

  @ApiPropertyOptional({ description: 'ML model version' })
  modelVersion?: string;

  @ApiPropertyOptional({ description: 'Processing time in milliseconds' })
  processingTimeMs?: number;

  @ApiProperty({ description: 'Whether fallback rules were used' })
  isFallback: boolean;
}
