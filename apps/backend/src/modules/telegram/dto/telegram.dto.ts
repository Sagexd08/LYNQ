import { IsString, IsOptional, IsBoolean, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterTelegramDto {
    @ApiProperty({ description: 'Telegram Chat ID' })
    @IsString()
    @IsNotEmpty()
    chatId: string;

    @ApiProperty({ description: 'User wallet address' })
    @IsString()
    @IsNotEmpty()
    walletAddress: string;

    @ApiPropertyOptional({ description: 'Telegram username' })
    @IsString()
    @IsOptional()
    username?: string;
}

export class UpdatePreferencesDto {
    @ApiPropertyOptional({ description: 'Receive loan alerts' })
    @IsBoolean()
    @IsOptional()
    loanAlerts?: boolean;

    @ApiPropertyOptional({ description: 'Receive health factor alerts' })
    @IsBoolean()
    @IsOptional()
    healthFactorAlerts?: boolean;

    @ApiPropertyOptional({ description: 'Receive credit score alerts' })
    @IsBoolean()
    @IsOptional()
    creditScoreAlerts?: boolean;

    @ApiPropertyOptional({ description: 'Receive transaction alerts' })
    @IsBoolean()
    @IsOptional()
    transactionAlerts?: boolean;

    @ApiPropertyOptional({ description: 'Receive daily summary' })
    @IsBoolean()
    @IsOptional()
    dailySummary?: boolean;

    @ApiPropertyOptional({ description: 'Receive price alerts' })
    @IsBoolean()
    @IsOptional()
    priceAlerts?: boolean;

    @ApiPropertyOptional({ description: 'Receive marketing messages' })
    @IsBoolean()
    @IsOptional()
    marketingMessages?: boolean;
}

export class SendTestNotificationDto {
    @ApiProperty({ description: 'Chat ID to send test message to' })
    @IsString()
    @IsNotEmpty()
    chatId: string;

    @ApiPropertyOptional({ description: 'Custom message to send' })
    @IsString()
    @IsOptional()
    message?: string;
}

export class WebhookUpdateDto {
    @ApiProperty({ description: 'Webhook URL for receiving Telegram updates' })
    @IsString()
    @IsNotEmpty()
    url: string;
}
