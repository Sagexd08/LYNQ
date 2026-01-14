import {
  IsString,
  IsNumber,
  IsEthereumAddress,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RiskEvaluationDto {
  @ApiProperty({ description: 'Wallet address to evaluate' })
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

  @ApiProperty({ description: 'Requested loan amount in USD' })
  @IsNumber()
  @Min(0)
  loanAmount: number;

  @ApiProperty({ description: 'Total collateral value in USD' })
  @IsNumber()
  @Min(0)
  collateralValueUsd: number;

  @ApiProperty({ description: 'Loan term in months' })
  @IsNumber()
  @Min(1)
  @Max(36)
  termMonths: number;
}
