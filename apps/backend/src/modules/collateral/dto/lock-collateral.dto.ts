import { IsString, IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LockCollateralDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  loanId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  chain!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tokenAddress!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tokenSymbol!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  amount!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  valueUSD!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  transactionHash!: string;
}
