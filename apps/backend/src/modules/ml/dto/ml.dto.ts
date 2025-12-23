import { IsNumber, IsBoolean, IsString, Min, Max, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CalculateCreditScoreDto {
    @ApiProperty({ example: 95, description: 'Percentage of on-time payments (0-100)' })
    @IsNumber()
    @Min(0)
    @Max(100)
    paymentHistory!: number;

    @ApiProperty({ example: 30, description: 'Credit utilization rate percentage (0-100)' })
    @IsNumber()
    @Min(0)
    @Max(100)
    utilizationRate!: number;

    @ApiProperty({ example: 365, description: 'Age of the account in days' })
    @IsNumber()
    @Min(0)
    accountAgeDays!: number;

    @ApiProperty({ example: 80, description: 'Reputation score (0-100)' })
    @IsNumber()
    @Min(0)
    @Max(100)
    reputationScore!: number;

    @ApiProperty({ example: 40, description: 'Diversification score (0-100)' })
    @IsNumber()
    @Min(0)
    @Max(100)
    diversificationScore!: number;
}

export class RunFraudDetectionDto {
    @ApiProperty({ example: 5000 })
    @IsNumber()
    @Min(0)
    loanAmount!: number;

    @ApiProperty({ example: 1000 })
    @IsNumber()
    @Min(0)
    medianUserLoanAmt!: number;

    @ApiProperty({ example: 2 })
    @IsNumber()
    @Min(0)
    loans24h!: number;

    @ApiProperty({ example: 120 })
    @IsNumber()
    @Min(0)
    accountAgeDays!: number;

    @ApiProperty({ example: false })
    @IsBoolean()
    isBlacklisted!: boolean;

    @ApiProperty({ example: false })
    @IsBoolean()
    suspiciousPatterns!: boolean;

    @ApiProperty({ example: 75 })
    @IsNumber()
    reputationScore!: number;
}

export class AssessLoanRiskDto {
    @ApiProperty({ example: 750 })
    @IsNumber()
    @Min(0)
    @Max(850) // Assuming standard credit score range
    creditScore!: number;

    @ApiProperty({ example: 2000 })
    @IsNumber()
    @Min(0)
    collateralValue!: number;

    @ApiProperty({ example: 1000 })
    @IsNumber()
    @Min(0)
    loanAmount!: number;

    @ApiProperty({ example: 0.5 })
    @IsNumber()
    @Min(0)
    debtRatio!: number;
}

export class EnsemblePredictionDto {
    @ApiProperty({ example: 700 })
    @IsNumber()
    creditScore!: number;

    @ApiProperty({ example: 0.4 })
    @IsNumber()
    debtRatio!: number;

    @ApiProperty({ example: 95 })
    @IsNumber()
    repaymentRate!: number;
}

export class AnomalyDetectionDto {
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsString()
    userId!: string;

    @ApiProperty({ example: 500 })
    @IsNumber()
    transactionAmount!: number;

    @ApiProperty({ example: 'US' })
    @IsString()
    location!: string;
}

// Generic/Placeholder DTOs for methods that used 'any' and ignored usage or just logged
export class BaseMlModelDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    modelId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    sampleSize?: number;
}
