import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLoanDto {
    @ApiProperty({ description: 'Loan amount in USD', example: 1000 })
    @IsNumber()
    @Min(10)
    amount: number;

    @ApiProperty({ description: 'Loan term in months', example: 3 })
    @IsNumber()
    @Min(1)
    @Max(36)
    termMonths: number;

    @ApiPropertyOptional({ description: 'Collateral value in USD' })
    @IsNumber()
    @IsOptional()
    @Min(0)
    collateralValueUsd?: number;

    @ApiPropertyOptional({ description: 'Blockchain network', example: 'ethereum' })
    @IsOptional()
    chain?: string;

    @ApiPropertyOptional({ description: 'Collateral token address' })
    @IsOptional()
    collateralTokenAddress?: string;

    @ApiPropertyOptional({ description: 'Wallet age in days (for risk assessment)' })
    @IsNumber()
    @IsOptional()
    @Min(0)
    walletAgeDays?: number;

    @ApiPropertyOptional({ description: 'Total transactions count' })
    @IsNumber()
    @IsOptional()
    @Min(0)
    totalTransactions?: number;

    @ApiPropertyOptional({ description: 'Total volume in USD' })
    @IsNumber()
    @IsOptional()
    @Min(0)
    totalVolumeUsd?: number;

    @ApiPropertyOptional({ description: 'DeFi interactions count' })
    @IsNumber()
    @IsOptional()
    @Min(0)
    defiInteractions?: number;
}
