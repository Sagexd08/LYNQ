import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TelegramBot from 'node-telegram-bot-api';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from './dto/send-notification.dto';

interface NotificationPayload {
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
}

@Injectable()
export class TelegramService implements OnModuleInit {
    private readonly logger = new Logger(TelegramService.name);
    private bot: TelegramBot | null = null;
    private adminChatId: string;
    private isEnabled = false;

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
    ) { }

    async onModuleInit() {
        const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
        this.adminChatId = this.configService.get<string>('TELEGRAM_ADMIN_CHAT_ID') || '';

        if (!token) {
            this.logger.warn('Telegram bot token not configured, bot disabled');
            return;
        }

        try {
            // Use webhook mode in production, polling in development
            const useWebhook = this.configService.get<string>('NODE_ENV') === 'production';
            
            if (useWebhook) {
                this.bot = new TelegramBot(token, { polling: false });
                this.setupCommandHandlers();
                this.logger.log('Telegram bot initialized in webhook mode');
            } else {
                this.bot = new TelegramBot(token, { polling: true });
                this.setupCommandHandlers();
                this.logger.log('Telegram bot initialized in polling mode');
            }
            
            this.isEnabled = true;
        } catch (error) {
            this.logger.error(`Failed to initialize Telegram bot: ${error.message}`);
        }
    }

    private setupCommandHandlers() {
        if (!this.bot) return;

        this.bot.onText(/\/start/, async (msg) => {
            await this.handleStart(msg);
        });

        this.bot.onText(/\/status/, async (msg) => {
            await this.handleStatus(msg);
        });

        this.bot.onText(/\/loans/, async (msg) => {
            await this.handleLoans(msg);
        });

        this.bot.onText(/\/risk/, async (msg) => {
            await this.handleRisk(msg);
        });

        this.bot.onText(/\/help/, async (msg) => {
            await this.handleHelp(msg);
        });

        this.bot.onText(/\/link (.+)/, async (msg, match) => {
            await this.handleLink(msg, match?.[1]);
        });
    }

    private async handleStart(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const welcomeMessage = `
🔗 *Welcome to LYNQ Bot!*

I'm your DeFi lending assistant. Use me to:
• Check your loan status
• Get repayment reminders
• View risk assessments
• Receive important alerts

*Commands:*
/link <wallet_address> - Link your wallet
/status - Account overview
/loans - Your active loans
/risk - Your risk profile
/help - Show all commands

Get started by linking your wallet!
    `;

        await this.sendMessage(chatId.toString(), welcomeMessage, { parse_mode: 'Markdown' });
    }

    private async handleStatus(msg: TelegramBot.Message) {
        const chatId = msg.chat.id.toString();

        const subscription = await this.prisma.telegramSubscription.findFirst({
            where: { chatId: chatId },
            include: { user: true },
        });

        if (!subscription) {
            await this.sendMessage(chatId, '❌ No wallet linked. Use /link <wallet_address> first.');
            return;
        }

        const user = subscription.user;
        const metadata = (user.metadata as any) || {};
        const statusMessage = `
📊 *Account Status*

💰 Tier: ${user.reputationTier}
⭐ Reputation: ${user.reputationPoints}/100
📈 Total Loans: ${metadata.totalLoans || 0}
✅ Successful: ${metadata.successfulLoans || 0}
❌ Defaulted: ${metadata.defaultedLoans || 0}
💵 Total Borrowed: $${(metadata.totalBorrowed || 0).toFixed(2)}
💳 Total Repaid: $${(metadata.totalRepaid || 0).toFixed(2)}
    `;

        await this.sendMessage(chatId, statusMessage, { parse_mode: 'Markdown' });
    }

    private async handleLoans(msg: TelegramBot.Message) {
        const chatId = msg.chat.id.toString();

        const subscription = await this.prisma.telegramSubscription.findFirst({
            where: { chatId: chatId },
            include: {
                user: {
                    include: {
                        loans: {
                            where: { status: 'ACTIVE' },
                            take: 5,
                            orderBy: { createdAt: 'desc' },
                        },
                    },
                },
            },
        });

        if (!subscription) {
            await this.sendMessage(chatId, '❌ No wallet linked. Use /link <wallet_address> first.');
            return;
        }

        const loans = subscription.user.loans;

        if (loans.length === 0) {
            await this.sendMessage(chatId, '📭 No active loans found.');
            return;
        }

        let loansMessage = '📋 *Your Active Loans*\n\n';

        for (const loan of loans) {
            const dueDate = loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : 'N/A';
            loansMessage += `
💰 *Loan ${loan.id.slice(0, 8)}...*
Amount: $${loan.amount.toFixed(2)}
Interest: ${loan.interestRate}%
Due: ${dueDate}
Risk: ${loan.riskLevel || 'N/A'}
─────────────
      `;
        }

        await this.sendMessage(chatId, loansMessage, { parse_mode: 'Markdown' });
    }

    private async handleRisk(msg: TelegramBot.Message) {
        const chatId = msg.chat.id.toString();

        const subscription = await this.prisma.telegramSubscription.findFirst({
            where: { chatId: chatId },
            include: { user: true },
        });

        if (!subscription) {
            await this.sendMessage(chatId, '❌ No wallet linked. Use /link <wallet_address> first.');
            return;
        }

        const user = subscription.user;
        const metadata = (user.metadata as any) || {};
        const totalLoans = metadata.totalLoans || 0;
        const successfulLoans = metadata.successfulLoans || 0;
        const defaultedLoans = metadata.defaultedLoans || 0;

        let riskEmoji = '🟢';
        if (user.reputationPoints < 40) riskEmoji = '🔴';
        else if (user.reputationPoints < 60) riskEmoji = '🟡';

        const riskMessage = `
${riskEmoji} *Risk Profile*

📊 Reputation Score: ${user.reputationPoints}/100
🏆 Tier: ${user.reputationTier}

*Performance*
✅ Successful Loans: ${successfulLoans}
❌ Defaulted Loans: ${defaultedLoans}
${totalLoans > 0 ? `📈 Success Rate: ${((successfulLoans / totalLoans) * 100).toFixed(1)}%` : ''}

*Tips to improve:*
• Repay loans on time
• Maintain healthy collateral
• Build transaction history
    `;

        await this.sendMessage(chatId, riskMessage, { parse_mode: 'Markdown' });
    }

    private async handleHelp(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const helpMessage = `
📚 *LYNQ Bot Commands*

/start - Welcome message
/link <wallet> - Link your wallet
/status - Account overview
/loans - Your active loans
/risk - Risk assessment
/help - This help message

*Notifications:*
You'll automatically receive alerts for:
• Loan approvals/rejections
• Repayment reminders
• Risk level changes
• System alerts

Need help? Contact support at lynq.support
    `;

        await this.sendMessage(chatId.toString(), helpMessage, { parse_mode: 'Markdown' });
    }

    private async handleLink(msg: TelegramBot.Message, walletAddress?: string) {
        const chatId = msg.chat.id.toString();
        const userId = msg.from?.id.toString();
        const username = msg.from?.username;

        if (!walletAddress) {
            await this.sendMessage(chatId, '❌ Please provide a wallet address: /link 0x...');
            return;
        }

        if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
            await this.sendMessage(chatId, '❌ Invalid wallet address format.');
            return;
        }

        try {
            
            const userRows = await this.prisma.$queryRaw<Array<{ id: string }>>`
                SELECT id FROM users 
                WHERE "walletAddresses" @> ${JSON.stringify([walletAddress.toLowerCase()])}::jsonb
                LIMIT 1
            `;
            
            if (userRows.length === 0) {
                await this.sendMessage(chatId, '❌ Wallet not registered. Please register on the LYNQ platform first.');
                return;
            }
            
            const user = await this.prisma.user.findUnique({
                where: { id: userRows[0].id },
            });

            if (!user) {
                await this.sendMessage(chatId, '❌ Wallet not registered. Please register on the LYNQ platform first.');
                return;
            }

            await this.prisma.telegramSubscription.upsert({
                where: { userId: user.id },
                update: {
                    chatId: chatId,
                    username: username,
                    isActive: true,
                },
                create: {
                    userId: user.id,
                    chatId: chatId,
                    walletAddress: walletAddress.toLowerCase(),
                    username: username,
                    isActive: true,
                },
            });

            await this.sendMessage(
                chatId,
                `✅ Wallet linked successfully!\n\nAddress: ${walletAddress.slice(0, 10)}...${walletAddress.slice(-8)}\n\nUse /status to view your account.`,
            );
        } catch (error) {
            this.logger.error(`Failed to link wallet: ${error.message}`);
            await this.sendMessage(chatId, '❌ Failed to link wallet. Please try again.');
        }
    }

    async sendNotification(userId: string, notification: NotificationPayload): Promise<boolean> {
        if (!this.isEnabled) return false;

        try {
            const subscription = await this.prisma.telegramSubscription.findFirst({
                where: { userId, isActive: true },
            });

            if (!subscription) return false;

            const shouldNotify = this.shouldSendNotification(subscription, notification.type);
            if (!shouldNotify) return false;

            const icon = this.getNotificationIcon(notification.type);
            const message = `${icon} *${notification.title}*\n\n${notification.message}`;

            await this.sendMessage(subscription.chatId, message, { parse_mode: 'Markdown' });
            return true;
        } catch (error) {
            this.logger.error(`Failed to send notification: ${error.message}`);
            return false;
        }
    }

    async sendAdminAlert(message: string): Promise<boolean> {
        if (!this.isEnabled || !this.adminChatId) return false;

        try {
            await this.sendMessage(this.adminChatId, `🚨 *Admin Alert*\n\n${message}`, { parse_mode: 'Markdown' });
            return true;
        } catch (error) {
            this.logger.error(`Failed to send admin alert: ${error.message}`);
            return false;
        }
    }

    private shouldSendNotification(subscription: any, type: NotificationType): boolean {
        switch (type) {
            case NotificationType.LOAN_APPROVED:
            case NotificationType.LOAN_REJECTED:
                return subscription.notifyLoans;
            case NotificationType.REPAYMENT_DUE:
            case NotificationType.REPAYMENT_RECEIVED:
                return subscription.notifyRepayments;
            case NotificationType.HIGH_RISK_DETECTED:
            case NotificationType.COLLATERAL_LOW:
                return subscription.notifyRisk;
            case NotificationType.SYSTEM_ALERT:
                return subscription.notifyAlerts;
            default:
                return true;
        }
    }

    private getNotificationIcon(type: NotificationType): string {
        const icons: Record<NotificationType, string> = {
            [NotificationType.LOAN_APPROVED]: '✅',
            [NotificationType.LOAN_REJECTED]: '❌',
            [NotificationType.REPAYMENT_DUE]: '⏰',
            [NotificationType.REPAYMENT_RECEIVED]: '💰',
            [NotificationType.HIGH_RISK_DETECTED]: '⚠️',
            [NotificationType.COLLATERAL_LOW]: '📉',
            [NotificationType.LOAN_DEFAULTED]: '🔴',
            [NotificationType.SYSTEM_ALERT]: '🔔',
        };
        return icons[type] || '📢';
    }

    async processUpdate(update: any) {
        if (!this.bot) return;

        try {
            // Process the update manually when using webhook mode
            this.bot.processUpdate(update);
        } catch (error) {
            this.logger.error(`Failed to process update: ${error.message}`);
        }
    }

    private async sendMessage(chatId: string, text: string, options?: TelegramBot.SendMessageOptions) {
        if (!this.bot) return;

        try {
            await this.bot.sendMessage(chatId, text, options);
        } catch (error) {
            this.logger.error(`Failed to send message to ${chatId}: ${error.message}`);
        }
    }
}
