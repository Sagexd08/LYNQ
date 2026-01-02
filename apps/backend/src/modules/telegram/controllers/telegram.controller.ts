import {
    Controller,
    Post,
    Get,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { TelegramService } from '../services/telegram.service';
import {
    RegisterTelegramDto,
    UpdatePreferencesDto,
    SendTestNotificationDto,
    WebhookUpdateDto,
} from '../dto/telegram.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
@ApiTags('Telegram')
@Controller('telegram')
export class TelegramController {
    constructor(private readonly telegramService: TelegramService) { }
    @Get('status')
    @ApiOperation({ summary: 'Check Telegram bot status' })
    @ApiResponse({ status: 200, description: 'Bot status' })
    async getStatus() {
        const enabled = this.telegramService.isNotificationsEnabled();
        let botInfo = null;
        if (enabled) {
            const me = await this.telegramService.getMe();
            botInfo = me.ok ? me.result : null;
        }
        return {
            enabled,
            bot: botInfo,
            timestamp: new Date().toISOString(),
        };
    }
    @Post('register')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Register for Telegram notifications' })
    @ApiResponse({ status: 201, description: 'Successfully registered' })
    async register(
        @Request() req: any,
        @Body() dto: RegisterTelegramDto
    ) {
        const userId = req.user.id || req.user.sub;
        const user = this.telegramService.registerUser(
            userId,
            dto.chatId,
            dto.walletAddress,
            dto.username
        );
        await this.telegramService.sendWelcome(dto.chatId);
        return {
            success: true,
            message: 'Telegram notifications enabled',
            user: {
                id: user.id,
                chatId: user.chatId,
                preferences: user.preferences,
            },
        };
    }
    @Delete('unregister')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Unregister from Telegram notifications' })
    @ApiResponse({ status: 200, description: 'Successfully unregistered' })
    async unregister(@Request() req: any) {
        const userId = req.user.id || req.user.sub;
        const success = this.telegramService.unregisterUser(userId);
        return {
            success,
            message: success
                ? 'Telegram notifications disabled'
                : 'User not found',
        };
    }
    @Get('preferences')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get notification preferences' })
    @ApiResponse({ status: 200, description: 'User preferences' })
    async getPreferences(@Request() req: any) {
        const userId = req.user.id || req.user.sub;
        const user = this.telegramService.getUser(userId);
        if (!user) {
            return {
                registered: false,
                preferences: null,
            };
        }
        return {
            registered: true,
            chatId: user.chatId,
            preferences: user.preferences,
        };
    }
    @Put('preferences')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update notification preferences' })
    @ApiResponse({ status: 200, description: 'Preferences updated' })
    async updatePreferences(
        @Request() req: any,
        @Body() dto: UpdatePreferencesDto
    ) {
        const userId = req.user.id || req.user.sub;
        const success = this.telegramService.updatePreferences(userId, dto);
        if (!success) {
            return {
                success: false,
                message: 'User not registered for Telegram notifications',
            };
        }
        const user = this.telegramService.getUser(userId);
        return {
            success: true,
            message: 'Preferences updated successfully',
            preferences: user?.preferences,
        };
    }
    @Post('test')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Send a test notification' })
    @ApiResponse({ status: 200, description: 'Test message sent' })
    async sendTestNotification(
        @Request() req: any,
        @Body() dto: SendTestNotificationDto
    ) {
        const message = dto.message || '🧪 *Test Notification*\n\nThis is a test message from LYNQ\\. Your notifications are working correctly\\!';
        const result = await this.telegramService.sendMessage(dto.chatId, message);
        return {
            success: result.ok,
            message: result.ok
                ? 'Test notification sent successfully'
                : `Failed to send: ${result.description}`,
        };
    }
    @Post('webhook')
    @ApiOperation({ summary: 'Receive Telegram webhook updates' })
    @ApiResponse({ status: 200, description: 'Webhook processed' })
    @HttpCode(HttpStatus.OK)
    async handleWebhook(@Body() update: any) {
        if (update.message?.text) {
            const chatId = update.message.chat.id.toString();
            const text = update.message.text;
            const username = update.message.from?.username;
            if (text === '/start') {
                await this.telegramService.sendMessage(
                    chatId,
                    `👋 *Welcome to LYNQ Bot\\!*\n\nYour Chat ID is: \`${chatId}\`\n\nTo enable notifications:\n1\\. Copy your Chat ID above\n2\\. Go to LYNQ app settings\n3\\. Paste your Chat ID and connect\n\n_You'll then receive notifications for all your DeFi activities\\!_`
                );
            } else if (text === '/help') {
                await this.telegramService.sendMessage(
                    chatId,
                    `📚 *LYNQ Bot Help*\n\n*Available Commands:*\n├ /start \\- Get your Chat ID\n├ /help \\- Show this help message\n├ /status \\- Check connection status\n└ /stop \\- Disable notifications\n\n*Need help?*\nVisit [lynq\\.finance/support](https://lynq.finance/support)`
                );
            } else if (text === '/status') {
                await this.telegramService.sendMessage(
                    chatId,
                    `✅ *Connection Status*\n\nBot is active and ready to send notifications\\.\n\nChat ID: \`${chatId}\`\n${username ? `Username: @${username}` : ''}`
                );
            } else if (text === '/stop') {
                await this.telegramService.sendMessage(
                    chatId,
                    `🔕 *Notifications Disabled*\n\nTo re\\-enable notifications, go to your LYNQ app settings and reconnect your Telegram\\.`
                );
            }
        }
        return { ok: true };
    }
    @Post('webhook/set')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Set Telegram webhook URL (admin only)' })
    @ApiResponse({ status: 200, description: 'Webhook set' })
    async setWebhook(@Body() dto: WebhookUpdateDto) {
        const result = await this.telegramService.setWebhook(dto.url);
        return {
            success: result.ok,
            message: result.ok
                ? `Webhook set to ${dto.url}`
                : `Failed: ${result.description}`,
        };
    }
    @Delete('webhook')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete Telegram webhook (admin only)' })
    @ApiResponse({ status: 200, description: 'Webhook deleted' })
    async deleteWebhook() {
        const result = await this.telegramService.deleteWebhook();
        return {
            success: result.ok,
            message: result.ok ? 'Webhook deleted' : `Failed: ${result.description}`,
        };
    }
    @Get('webhook/info')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get Telegram webhook info' })
    @ApiResponse({ status: 200, description: 'Webhook info' })
    async getWebhookInfo() {
        const result = await this.telegramService.getWebhookInfo();
        return {
            success: result.ok,
            info: result.result,
        };
    }
}
