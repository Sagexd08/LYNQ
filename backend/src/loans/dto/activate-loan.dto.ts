import {
  IsString,
  IsNumberString,
  IsEthereumAddress,
  IsInt,
  Min,
  IsPositive,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ActivateLoanDto {
  @ApiProperty({ description: 'Token contract address' })
  @IsString()
  @IsEthereumAddress()
  tokenAddress: string;

  @ApiProperty({ description: 'Token symbol (e.g., MNT, ETH)' })
  @IsString()
  tokenSymbol: string;

  @ApiProperty({
    description: 'Amount of tokens deposited as collateral',
    type: 'string',
  })
  @IsNumberString({}, { message: 'Amount must be a valid number string' })
  amount: string;

  @ApiProperty({ description: 'Chain ID where collateral is locked' })
  @IsInt()
  @IsPositive()
  chainId: number;

  @ApiProperty({ description: 'Transaction hash of the collateral deposit' })
  @IsString()
  txHash: string;
}
