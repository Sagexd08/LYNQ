import { IsString, IsNumber, IsEnum, IsPositive, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum SupportedChain {
  EVM = 'evm',
  APTOS = 'aptos',
  FLOW = 'flow',
}

export class CreateLoanDto {
  @ApiProperty({ example: '1000.00' })
  @IsString()
  amount!: string;

  @ApiProperty({ enum: SupportedChain, example: SupportedChain.EVM })
  @IsEnum(SupportedChain)
  chain!: string;

  @ApiProperty({ example: '0x...' })
  @IsString()
  collateralTokenAddress!: string;

  @ApiProperty({ example: '2000.00' })
  @IsString()
  collateralAmount!: string;

  @ApiProperty({ example: 30, minimum: 7, maximum: 365 })
  @IsNumber()
  @IsPositive()
  @Min(7)
  @Max(365)
  durationDays!: number;
}
