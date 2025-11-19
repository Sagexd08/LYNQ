import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LoanStatus } from '../entities/loan.entity';

export class LoanStatusDto {
  @ApiProperty({ enum: LoanStatus })
  @IsEnum(LoanStatus)
  status!: LoanStatus;
}
