import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RepayLoanDto {
  @ApiProperty({ description: 'Repayment amount in USD', example: 500 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ description: 'On-chain transaction hash' })
  @IsString()
  @IsOptional()
  txHash?: string;
}
