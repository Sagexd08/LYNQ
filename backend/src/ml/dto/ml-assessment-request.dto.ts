import { IsString, IsNumber, IsOptional, Min, Max, IsEthereumAddress } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MlAssessmentRequestDto {
    @ApiProperty({ description: 'Wallet address' })
    @IsString()
    @IsEthereumAddress()
    walletAddress: string;

    @ApiProperty({ description: 'Wallet age in days' })
    @IsNumber()
    @Min(0)
    walletAgeDays: number;

    @ApiProperty({ description: 'Total transactions count' })
    @IsNumber()
    @Min(0)
    totalTransactions: number;

    @ApiProperty({ description: 'Total volume in USD' })
    @IsNumber()
    @Min(0)
    totalVolumeUsd: number;

    @ApiProperty({ description: 'DeFi interactions count' })
    @IsNumber()
    @Min(0)
    defiInteractions: number;

    @ApiProperty({ description: 'Loan amount in USD' })
    @IsNumber()
    @Min(0)
    loanAmount: number;

    @ApiProperty({ description: 'Collateral value in USD' })
    @IsNumber()
    @Min(0)
    collateralValueUsd: number;

    @ApiProperty({ description: 'Loan term in months' })
    @IsNumber()
    @Min(1)
    @Max(36)
    termMonths: number;

    @ApiProperty({ description: 'Previous loans count', required: false })
    @IsNumber()
    @IsOptional()
    @Min(0)
    previousLoans?: number = 0;

    @ApiProperty({ description: 'Successful repayments count', required: false })
    @IsNumber()
    @IsOptional()
    @Min(0)
    successfulRepayments?: number = 0;

    @ApiProperty({ description: 'Defaults count', required: false })
    @IsNumber()
    @IsOptional()
    @Min(0)
    defaults?: number = 0;

    @ApiProperty({ description: 'Reputation score', required: false })
    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(100)
    reputationScore?: number = 50;
}
