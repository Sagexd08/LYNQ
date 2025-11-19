import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UnlockCollateralDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  transactionHash!: string;
}
