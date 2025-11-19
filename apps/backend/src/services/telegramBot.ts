import { Telegraf, Context, Scenes } from 'telegraf';
import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';
import { loanService } from './loanService';
import { flashLoanService } from './flashLoanService';
import { riskEngine } from './riskEngine';
import { getSystemHealthMonitor } from './systemHealthMonitor';
import { aiValidationEngine } from './aiValidationEngine';

const prisma = new PrismaClient();

const botToken = process.env.TELEGRAM_BOT_TOKEN || '8081365044:AAHWyJWuvNGM2xn9MkgALiT35rJNSc17o8U';

if (!botToken) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

const bot = new Telegraf(botToken);

// Scenes for multi-step conversations
const onboardingScene = new Scenes.WizardScene(
  'onboarding',
  async (ctx: Context) => {
    await ctx.reply('Welcome to LYNQ Telegram Bot! Please enter your wallet address to link your account:');
    return ctx.wizard.next();
  },
  async (ctx: Context) => {
    const walletAddress = (ctx.message as any)?.text?.trim();
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      await ctx.reply('Invalid wallet address. Please enter a valid Ethereum address:');
      return;
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() }
    });

    if (!user) {
      await ctx.reply('User not found. Please register on the platform first.');
      return ctx.scene.leave();
    }

    // Update notification settings
    await prisma.notificationSettings.upsert({
      where: { userId: user.id },
      update: {
        telegramEnabled: true,
        telegramChatId: ctx.chat!.id.toString()
      },
      create: {
        userId: user.id,
        telegramEnabled: true,
        telegramChatId: ctx.chat!.id.toString()
      }
    });

    await ctx.reply(`✅ Account linked successfully! Welcome, ${user.name || 'User'}.`);
    return ctx.scene.leave();
  }
);

const flashLoanScene = new Scenes.WizardScene(
  'flashloan',
  async (ctx: Context) => {
    await ctx.reply('Enter the amount for flash loan (in ETH):');
    return ctx.wizard.next();
  },
  async (ctx: Context) => {
    const amount = parseFloat((ctx.message as any)?.text?.trim());
    if (isNaN(amount) || amount <= 0) {
      await ctx.reply('Invalid amount. Please enter a positive number:');
      return;
    }

    const chatId = ctx.chat!.id.toString();
    const settings = await prisma.notificationSettings.findFirst({
      where: { telegramChatId: chatId, telegramEnabled: true }
    });

    if (!settings) {
      await ctx.reply('Please link your account first with /start');
      return ctx.scene.leave();
    }

    try {
      // Execute flash loan
      const result = await flashLoanService.executeFlashLoan(
        settings.userId,
        '0x0000000000000000000000000000000000000000', // dummy receiver
        ['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'], // WETH
        [ethers.parseEther(amount.toString()).toString()],
        '0x'
      );

      await ctx.reply(`✅ Flash loan executed!\nAmount: ${amount} ETH\nTx Hash: ${result.transactionHash}`);
    } catch (error) {
      await ctx.reply(`❌ Flash loan failed: ${(error as Error).message}`);
    }

    return ctx.scene.leave();
  }
);

const aiScene = new Scenes.WizardScene(
  'ai',
  async (ctx: Context) => {
    await ctx.reply('🤖 Ask me anything about finance! What\'s your question?');
    return ctx.wizard.next();
  },
  async (ctx: Context) => {
    const question = (ctx.message as any)?.text?.trim();
    if (!question) {
      await ctx.reply('Please provide a question.');
      return;
    }

    try {
      const response = await aiValidationEngine.askAI(question);
      await ctx.reply(`🤖 ${response}`);
    } catch (error) {
      await ctx.reply(`❌ AI Error: ${(error as Error).message}`);
    }

    return ctx.scene.leave();
  }
);

const stage = new Scenes.Stage([onboardingScene, flashLoanScene, aiScene]);
bot.use(stage.middleware());

// Commands
bot.start(async (ctx) => {
  const chatId = ctx.chat!.id.toString();
  const existing = await prisma.notificationSettings.findFirst({
    where: { telegramChatId: chatId, telegramEnabled: true }
  });

  if (existing) {
    await ctx.reply('Welcome back! Use /help to see available commands.');
  } else {
    await ctx.scene.enter('onboarding');
  }
});

bot.command('help', async (ctx) => {
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

bot.command('status', async (ctx) => {
  const chatId = ctx.chat!.id.toString();
  const settings = await prisma.notificationSettings.findFirst({
    where: { telegramChatId: chatId, telegramEnabled: true }
  });

  if (!settings) {
    await ctx.reply('Please link your account first with /start');
    return;
  }

  const loans = await prisma.loan.findMany({
    where: { borrowerId: settings.userId },
    include: { repayments: true }
  });

  if (loans.length === 0) {
    await ctx.reply('No active loans found.');
    return;
  }

  let message = '📊 Your Loan Status:\n\n';
  loans.forEach(loan => {
    const remaining = Number(loan.remainingPrincipal) / 1e18;
    const interest = Number(loan.interestAccrued) / 1e18;
    message += `Loan ID: ${loan.id}\nAmount: ${remaining.toFixed(4)} ETH\nInterest: ${interest.toFixed(4)} ETH\nStatus: ${loan.status}\nDue: ${loan.dueDate.toDateString()}\n\n`;
  });

  await ctx.reply(message);
});

bot.command('portfolio', async (ctx) => {
  const chatId = ctx.chat!.id.toString();
  const settings = await prisma.notificationSettings.findFirst({
    where: { telegramChatId: chatId, telegramEnabled: true },
    include: { user: true }
  });

  if (!settings) {
    await ctx.reply('Please link your account first with /start');
    return;
  }

  const trustScore = await prisma.trustScore.findUnique({
    where: { userId: settings.userId }
  });

  const loans = await prisma.loan.findMany({
    where: { borrowerId: settings.userId }
  });

  const message = `
📈 Portfolio Overview:

Trust Score: ${trustScore?.score || 500}
Active Loans: ${loans.filter(l => l.status === 'ACTIVE').length}
Total Borrowed: ${loans.reduce((sum, l) => sum + Number(l.principalAmount), 0) / 1e18} ETH
  `;

  await ctx.reply(message);
});

bot.command('flashloan', async (ctx) => {
  await ctx.scene.enter('flashloan');
});

bot.command('reminders', async (ctx) => {
  const chatId = ctx.chat!.id.toString();
  const settings = await prisma.notificationSettings.findFirst({
    where: { telegramChatId: chatId, telegramEnabled: true }
  });

  if (!settings) {
    await ctx.reply('Please link your account first with /start');
    return;
  }

  // Get upcoming repayments
  const repayments = await prisma.repayment.findMany({
    where: {
      loan: { borrowerId: settings.userId },
      status: 'PENDING',
      dueDate: { gte: new Date() }
    },
    include: { loan: true },
    orderBy: { dueDate: 'asc' },
    take: 5
  });

  if (repayments.length === 0) {
    await ctx.reply('No upcoming repayments.');
    return;
  }

  let message = '⏰ Upcoming Repayment Reminders:\n\n';
  repayments.forEach(r => {
    message += `Loan ${r.loanId}: ${(Number(r.amount) / 1e18).toFixed(4)} ETH due ${r.dueDate.toDateString()}\n`;
  });

  await ctx.reply(message);
});

bot.command('alerts', async (ctx) => {
  const chatId = ctx.chat!.id.toString();
  const settings = await prisma.notificationSettings.findFirst({
    where: { telegramChatId: chatId, telegramEnabled: true }
  });

  if (!settings) {
    await ctx.reply('Please link your account first with /start');
    return;
  }

  // Get risk alerts
  const alerts = await riskEngine.getRiskAlerts(settings.userId);

  if (alerts.length === 0) {
    await ctx.reply('No risk alerts at this time.');
    return;
  }

  let message = '⚠️ Risk Alerts:\n\n';
  alerts.forEach(alert => {
    message += `• ${alert.message}\n`;
  });

  await ctx.reply(message);
});

bot.command('ai', async (ctx) => {
  await ctx.scene.enter('ai');
});

bot.command('admin', async (ctx) => {
  // Check if admin (simplified)
  const chatId = ctx.chat!.id.toString();
  // Assume admin check here

  const systemHealthMonitor = getSystemHealthMonitor();
  const health = systemHealthMonitor.getHealthStatus();
  const stats = await prisma.platformStats.findFirst();

  const message = `
🔧 System Health:
Status: ${health.status}
Uptime: ${health.uptime}ms

📊 Platform Stats:
Total Loans: ${stats?.totalLoans || 0}
Active Loans: ${stats?.activeLoans || 0}
Total Users: ${stats?.totalUsers || 0}
  `;

  await ctx.reply(message);
});

bot.command('cancel', async (ctx) => {
  await ctx.scene.leave();
  await ctx.reply('Operation cancelled.');
});

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('An error occurred. Please try again.');
});

// Start bot
export const startTelegramBot = () => {
  console.log('Starting Telegram Bot...');
  bot.launch();
  console.log('Telegram Bot started');
};

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

export { bot };