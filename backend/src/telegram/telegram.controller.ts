import { Controller, Post, Body, Headers, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from './telegram.service';
import { SendNotificationDto, NotificationType } from './dto/send-notification.dto';

@ApiTags('Telegram')
@Controller('telegram')
export class TelegramController {
    constructor(
        private readonly telegramService: TelegramService,
        private readonly configService: ConfigService,
    ) { }

    @Post('webhook')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Telegram webhook endpoint' })
    @ApiHeader({ name: 'X-Telegram-Bot-Api-Secret-Token', required: true })
    async handleWebhook(
        @Body() body: any,
        @Headers('X-Telegram-Bot-Api-Secret-Token') secretToken: string,
    ) {
        const expectedSecret = this.configService.get<string>('TELEGRAM_WEBHOOK_SECRET');

        if (expectedSecret && secretToken !== expectedSecret) {
            throw new UnauthorizedException('Invalid webhook secret');
        }

        return { ok: true };
    }

    @Post('notify')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Send notification to user' })
    @ApiResponse({ status: 200, description: 'Notification sent' })
    async sendNotification(@Body() dto: SendNotificationDto) {
        // profileId maps to userId in the service
        const success = await this.telegramService.sendNotification(dto.profileId, {
            type: dto.type,
            title: dto.title,
            message: dto.message,
            data: dto.data,
        });

        return { success };
    }

    @Post('admin-alert')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Send admin alert' })
    @ApiResponse({ status: 200, description: 'Alert sent' })
    async sendAdminAlert(@Body() body: { message: string }) {
        const success = await this.telegramService.sendAdminAlert(body.message);
        return { success };
    }
}
