import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RepayLoanDto {
  @ApiProperty({ example: '500.00' })
  @IsString()
  @IsNotEmpty()
  amount!: string;

  @ApiProperty({ example: '0x...' })
  @IsString()
  @IsNotEmpty()
  transactionHash!: string;
}
