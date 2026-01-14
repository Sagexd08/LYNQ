import { IsString, IsOptional, IsObject, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NotificationType {
  LOAN_APPROVED = 'LOAN_APPROVED',
  LOAN_REJECTED = 'LOAN_REJECTED',
  REPAYMENT_DUE = 'REPAYMENT_DUE',
  REPAYMENT_RECEIVED = 'REPAYMENT_RECEIVED',
  HIGH_RISK_DETECTED = 'HIGH_RISK_DETECTED',
  COLLATERAL_LOW = 'COLLATERAL_LOW',
  LOAN_DEFAULTED = 'LOAN_DEFAULTED',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
}

export class SendNotificationDto {
  @ApiProperty({ description: 'Profile ID to send notification to' })
  @IsString()
  profileId: string;

  @ApiProperty({ description: 'Notification type', enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: 'Notification title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Notification message' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Additional data' })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}
