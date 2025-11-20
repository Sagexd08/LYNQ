import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Telegraf, Context, Scenes } from 'telegraf';
import { ethers } from 'ethers';
import { FlashLoanService } from '../../flashloan/services/flash-loan.service';
import { User } from '../../../modules/user/entities/user.entity';
import { NotificationSettings } from '../../../modules/user/entities/notification-settings.entity';
import { Loan, LoanStatus } from '../../../modules/loan/entities/loan.entity';
import { Repayment, RepaymentStatus } from '../../../modules/loan/entities/repayment.entity';
import { TrustScore } from '../../../modules/user/entities/trust-score.entity';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private bot: Telegraf<Context>;
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private configService: ConfigService,
    private flashLoanService: FlashLoanService,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(NotificationSettings) private notifRepo: Repository<NotificationSettings>,
    @InjectRepository(Loan) private loanRepo: Repository<Loan>,
    @InjectRepository(Repayment) private repaymentRepo: Repository<Repayment>,
    @InjectRepository(TrustScore) private trustRepo: Repository<TrustScore>,
  ) {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (token) {
      this.bot = new Telegraf(token);
    } else {
      this.logger.warn('TELEGRAM_BOT_TOKEN is not set. Telegram bot will not start.');
    }
  }

  onModuleInit() {
    if (this.bot) {
      this.setupScenes();
      this.setupCommands();
      this.bot.launch().catch(err => this.logger.error('Failed to launch Telegram bot', err));
      this.logger.log('Telegram Bot started');
    }
  }

  onModuleDestroy() {
    if (this.bot) {
      this.bot.stop('SIGTERM');
    }
  }

  private setupScenes() {
    const onboardingScene = new Scenes.WizardScene<any>(
      'onboarding',
      async (ctx) => {
        await ctx.reply('Welcome to LYNQ Telegram Bot! Please enter your wallet address to link your account:');
        return ctx.wizard.next();
      },
      async (ctx) => {
        const walletAddress = (ctx.message as any)?.text?.trim();
        if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
          await ctx.reply('Invalid wallet address. Please enter a valid Ethereum address:');
          return;
        }

        const user = await this.userRepo
          .createQueryBuilder('user')
          .where("user.walletAddresses @> :filter", { filter: JSON.stringify({ evm: walletAddress.toLowerCase() }) })
          .getOne();

        if (!user) {
          await ctx.reply('User not found. Please register on the platform first.');
          return ctx.scene.leave();
        }

        let settings = await this.notifRepo.findOne({ where: { userId: user.id } });
        if (!settings) {
          settings = this.notifRepo.create({ userId: user.id, telegramEnabled: true, telegramChatId: ctx.chat!.id.toString() });
        } else {
          settings.telegramEnabled = true;
          settings.telegramChatId = ctx.chat!.id.toString();
        }
        await this.notifRepo.save(settings);

        await ctx.reply(`✅ Account linked successfully! Welcome, ${user.email || 'User'}.`);
        return ctx.scene.leave();
      }
    );

    const flashLoanScene = new Scenes.WizardScene<any>(
      'flashloan',
      async (ctx) => {
        await ctx.reply('Enter the amount for flash loan (in ETH):');
        return ctx.wizard.next();
      },
      async (ctx) => {
        const amount = parseFloat((ctx.message as any)?.text?.trim());
        if (isNaN(amount) || amount <= 0) {
          await ctx.reply('Invalid amount. Please enter a positive number:');
          return;
        }

        const chatId = ctx.chat!.id.toString();
        const settings = await this.notifRepo.findOne({
          where: { telegramChatId: chatId, telegramEnabled: true }
        });

        if (!settings) {
          await ctx.reply('Please link your account first with /start');
          return ctx.scene.leave();
        }

        try {
          // Assuming getFlashLoanQuote is available in FlashLoanService
          const result = await this.flashLoanService.getFlashLoanQuote(
             '0x0000000000000000000000000000000000000000', // dummy
             ['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'],
             [ethers.parseEther(amount.toString()).toString()]
          );
          
          await ctx.reply(`✅ Flash loan quote received (Execution disabled in refactor)`);

        } catch (error) {
          await ctx.reply(`❌ Flash loan failed: ${(error as Error).message}`);
        }

        return ctx.scene.leave();
      }
    );

    const stage = new Scenes.Stage([onboardingScene, flashLoanScene]);
    this.bot.use(stage.middleware());
  }

  private setupCommands() {
    this.bot.start(async (ctx) => {
      const chatId = ctx.chat!.id.toString();
      const existing = await this.notifRepo.findOne({ where: { telegramChatId: chatId, telegramEnabled: true } });

      if (existing) {
        await ctx.reply('Welcome back! Use /help to see available commands.');
      } else {
        // await ctx.scene.enter('onboarding'); // TODO: Implement scenes
      }
    });

    this.bot.command('help', async (ctx) => {
      const helpText = `
🤖 LYNQ Telegram Bot Commands:

/start - Link your account or welcome back
/status - Check your loan status
/portfolio - View your portfolio
/flashloan - Execute a flash loan
/reminders - Manage repayment reminders
/alerts - View transaction risk alerts
/ai - Ask AI financial assistant
/admin - Admin commands (if admin)

/cancel - Cancel current operation
      `;
      await ctx.reply(helpText);
    });

    this.bot.command('status', async (ctx) => {
      const chatId = ctx.chat!.id.toString();
      const settings = await this.notifRepo.findOne({ where: { telegramChatId: chatId, telegramEnabled: true } });

      if (!settings) {
        await ctx.reply('Please link your account first with /start');
        return;
      }

      const loans = await this.loanRepo.find({ where: { userId: settings.userId } });

      if (loans.length === 0) {
        await ctx.reply('No active loans found.');
        return;
      }

      let message = '📊 Your Loan Status:\n\n';
      loans.forEach(loan => {
        const remaining = Number(loan.outstandingAmount);
        const interestRate = Number(loan.interestRate);
        const due = loan.dueDate ? new Date(loan.dueDate) : null;
        message += `Loan ID: ${loan.id}\nOutstanding: ${remaining.toFixed(4)}\nAPR: ${interestRate.toFixed(2)}%\nStatus: ${loan.status}\nDue: ${due ? due.toDateString() : 'N/A'}\n\n`;
      });

      await ctx.reply(message);
    });

    this.bot.command('portfolio', async (ctx) => {
      const chatId = ctx.chat!.id.toString();
      const settings = await this.notifRepo.findOne({ where: { telegramChatId: chatId, telegramEnabled: true } });

      if (!settings) {
        await ctx.reply('Please link your account first with /start');
        return;
      }

      const trustScore = await this.trustRepo.findOne({ where: { userId: settings.userId } });
      const loans = await this.loanRepo.find({ where: { userId: settings.userId } });

      const message = `
📈 Portfolio Overview:

Trust Score: ${trustScore?.score || 500}
Active Loans: ${loans.filter(l => l.status === 'ACTIVE').length}
Total Borrowed: ${loans.reduce((sum, l) => sum + Number(l.amount), 0)} (units)
      `;

      await ctx.reply(message);
    });

    this.bot.command('flashloan', async (ctx) => {
      // await ctx.scene.enter('flashloan'); // TODO: Implement scenes
    });

    this.bot.command('reminders', async (ctx) => {
      const chatId = ctx.chat!.id.toString();
      const settings = await this.notifRepo.findOne({ where: { telegramChatId: chatId, telegramEnabled: true } });

      if (!settings) {
        await ctx.reply('Please link your account first with /start');
        return;
      }

      const repayments = await this.repaymentRepo.find({
        where: {
          status: RepaymentStatus.PENDING,
          dueDate: MoreThanOrEqual(new Date()),
        },
        order: { dueDate: 'ASC' },
        take: 5,
      });

      if (repayments.length === 0) {
        await ctx.reply('No upcoming repayments.');
        return;
      }

      let message = '⏰ Upcoming Repayment Reminders:\n\n';
      repayments.forEach(r => {
        const due = new Date(r.dueDate);
        message += `Loan ${r.loanId}: ${Number(r.amount).toFixed(4)} due ${due.toDateString()}\n`;
      });

      await ctx.reply(message);
    });

    this.bot.command('cancel', async (ctx) => {
      // await ctx.scene.leave(); // TODO: Implement scenes
      await ctx.reply('Operation cancelled.');
    });

    this.bot.catch((err, ctx) => {
      this.logger.error('Bot error:', err);
      ctx.reply('An error occurred. Please try again.');
    });
  }
}
