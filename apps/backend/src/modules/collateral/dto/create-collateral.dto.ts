import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class CreateCollateralDto {
  @IsString()
  userId: string;

  @IsString()
  tokenAddress: string;

  @IsNumberString()
  amount: string;

  @IsOptional()
  @IsString()
  chain?: string;
}
