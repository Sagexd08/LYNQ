import TelegramBot from 'node-telegram-bot-api';
import logger from '../utils/logger';

/**
 * Telegram Bot System for LYNQ
 * Provides conversational access to platform features via Telegram
 * 
 * Features:
 * - User onboarding and registration
 * - Loan status checking
 * - Repayment reminders
 * - Flash loan execution
 * - AI financial assistant
 * - Portfolio view
 * - Risk alerts
 * - Admin commands
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface TelegramUserProfile {
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  linkedWallet?: string;
  language: 'en' | 'es' | 'fr' | 'de';
  notificationsEnabled: boolean;
  joinedAt: number;
  lastActive: number;
  conversationState: 'idle' | 'onboarding' | 'active' | 'waiting_input';
}

export interface UserConversationContext {
  userId: string;
  state: string;
  data: Record<string, any>;
  timestamp: number;
  steps: string[];
}

export interface BotMessage {
  type: 'text' | 'keyboard' | 'inline' | 'alert' | 'menu';
  content: string;
  keyboard?: any;
  parseMode?: 'HTML' | 'Markdown';
  callbackData?: Record<string, string>;
}

export interface LoanStatus {
  loanId: string;
  amount: number;
  status: 'active' | 'repayment' | 'completed' | 'defaulted';
  interestRate: number;
  remainingBalance: number;
  dueDate: number;
  nextPaymentAmount: number;
}

export interface PortfolioSummary {
  totalLoansActive: number;
  totalLoanAmount: number;
  totalRepaid: number;
  portfolioValue: number;
  averageInterestRate: number;
  flashLoansExecuted: number;
}

// ============================================================================
// TELEGRAM BOT SERVICE
// ============================================================================

export class LynqTelegramBot {
  private bot: TelegramBot;
  private userSessions: Map<string, UserConversationContext> = new Map();
  private userProfiles: Map<string, TelegramUserProfile> = new Map();
  private inTestMode: boolean = false;

  constructor(token: string, testMode: boolean = false) {
    this.inTestMode = testMode;

    // Initialize bot with polling or webhook
    if (testMode) {
      this.bot = new TelegramBot(token, { polling: false });
    } else {
      this.bot = new TelegramBot(token, { polling: true });
    }

    this.setupHandlers();
  }

  /**
   * Setup command and message handlers
   */
  private setupHandlers(): void {
    // Start command - onboarding
    this.bot.onText(/\/start/, (msg: any) => this.handleStart(msg));

    // Help command
    this.bot.onText(/\/help/, (msg: any) => this.handleHelp(msg));

    // Loan status
    this.bot.onText(/\/loans?/, (msg: any) => this.handleLoanStatus(msg));

    // Portfolio
    this.bot.onText(/\/portfolio/, (msg: any) => this.handlePortfolio(msg));

    // Flash loan
    this.bot.onText(/\/flashloan/, (msg: any) => this.handleFlashLoan(msg));

    // Settings
    this.bot.onText(/\/settings/, (msg: any) => this.handleSettings(msg));

    // Admin commands (restricted)
    this.bot.onText(/\/admin/, (msg: any) => this.handleAdminCommand(msg));

    // General messages
    this.bot.on('message', (msg: any) => this.handleGeneralMessage(msg));

    // Callback queries (button clicks)
    this.bot.on('callback_query', (query: any) => this.handleCallbackQuery(query));

    logger.info('[Telegram Bot] Handlers configured');
  }

  /**
   * Start command - User onboarding
   */
  private async handleStart(msg: any): Promise<void> {
    const chatId = msg.chat.id;
    const userId = msg.from?.id.toString() || 'unknown';
    const firstName = msg.from?.first_name || 'User';

    // Initialize or get user profile
    if (!this.userProfiles.has(userId)) {
      this.userProfiles.set(userId, {
        telegramId: userId,
        username: msg.from?.username,
        firstName,
        lastName: msg.from?.last_name,
        language: 'en',
        notificationsEnabled: true,
        joinedAt: Date.now(),
        lastActive: Date.now(),
        conversationState: 'onboarding',
      });
    }

    // Update last active
    const profile = this.userProfiles.get(userId)!;
    profile.lastActive = Date.now();

    // Create conversation context
    this.userSessions.set(userId, {
      userId,
      state: 'onboarding',
      data: {},
      timestamp: Date.now(),
      steps: ['start'],
    });

    const welcomeMessage = `
👋 Welcome to **LYNQ**, ${firstName}!

I'm your AI-powered financial assistant. I can help you:

✅ Check loan status
✅ View your portfolio
✅ Execute flash loans
✅ Get financial insights
✅ Set repayment reminders
✅ Receive risk alerts

Let's get started! What would you like to do?
    `;

    const keyboard = {
      inline_keyboard: [
        [{ text: '🏦 Check Loans', callback_data: 'view_loans' }],
        [{ text: '💼 Portfolio', callback_data: 'view_portfolio' }],
        [{ text: '⚡ Flash Loan', callback_data: 'flash_loan_info' }],
        [{ text: '❓ Help', callback_data: 'show_help' }],
        [{ text: '⚙️ Settings', callback_data: 'settings' }],
      ],
    };

    try {
      await this.bot.sendMessage(chatId, welcomeMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });

      logger.info('[Telegram Bot] User started', { userId, firstName });
    } catch (error: any) {
      logger.error('[Telegram Bot] Error sending start message', { error: error.message });
    }
  }

  /**
   * Help command
   */
  private async handleHelp(msg: any): Promise<void> {
    const chatId = msg.chat.id;

    const helpText = `
📚 **LYNQ Bot Commands**

**Loan Management:**
/loans - Check all your loans
/status - Get current portfolio status

**Information:**
/portfolio - View detailed portfolio
/rates - Current interest rates
/help - Show this help message

**Financial Tools:**
/flashloan - Flash loan information
/calculator - Calculate loan payments

**Account:**
/settings - Adjust bot settings
/notifications - Manage alerts
/language - Change language

**Quick Actions:**
Click buttons below to get started quickly
    `;

    try {
      await this.bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
    } catch (error: any) {
      logger.error('[Telegram Bot] Error sending help', { error: error.message });
    }
  }

  /**
   * Loan status command
   */
  private async handleLoanStatus(msg: any): Promise<void> {
    const chatId = msg.chat.id;

    // Mock loan data - in production, fetch from database
    const loans: LoanStatus[] = [
      {
        loanId: 'LOAN-001',
        amount: 50000,
        status: 'active',
        interestRate: 5.5,
        remainingBalance: 45000,
        dueDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
        nextPaymentAmount: 1500,
      },
      {
        loanId: 'LOAN-002',
        amount: 25000,
        status: 'repayment',
        interestRate: 4.2,
        remainingBalance: 10000,
        dueDate: Date.now() + 60 * 24 * 60 * 60 * 1000,
        nextPaymentAmount: 500,
      },
    ];

    let loanText = '🏦 **Your Loans**\n\n';

    for (const loan of loans) {
      const daysUntilDue = Math.ceil((loan.dueDate - Date.now()) / (24 * 60 * 60 * 1000));
      loanText += `
**${loan.loanId}** - ${loan.status.toUpperCase()}
├ Loan Amount: $${loan.amount.toLocaleString()}
├ Remaining: $${loan.remainingBalance.toLocaleString()}
├ Rate: ${loan.interestRate}% APR
├ Next Payment: $${loan.nextPaymentAmount}
└ Due in: ${daysUntilDue} days

      `;
    }

    try {
      await this.bot.sendMessage(chatId, loanText, { parse_mode: 'Markdown' });
    } catch (error: any) {
      logger.error('[Telegram Bot] Error sending loans', { error: error.message });
    }
  }

  /**
   * Portfolio command
   */
  private async handlePortfolio(msg: any): Promise<void> {
    const chatId = msg.chat.id;

    // Mock portfolio data
    const portfolio: PortfolioSummary = {
      totalLoansActive: 2,
      totalLoanAmount: 75000,
      totalRepaid: 25000,
      portfolioValue: 125000,
      averageInterestRate: 4.85,
      flashLoansExecuted: 15,
    };

    const portfolioText = `
💼 **Your Portfolio**

📊 **Overview:**
├ Active Loans: ${portfolio.totalLoansActive}
├ Total Borrowed: $${portfolio.totalLoanAmount.toLocaleString()}
├ Total Repaid: $${portfolio.totalRepaid.toLocaleString()}
├ Portfolio Value: $${portfolio.portfolioValue.toLocaleString()}
└ Avg Interest Rate: ${portfolio.averageInterestRate}%

⚡ **Flash Loans:**
└ Executed: ${portfolio.flashLoansExecuted} transactions

📈 **Metrics:**
├ Loan-to-Value: ${(portfolio.totalLoanAmount / portfolio.portfolioValue * 100).toFixed(1)}%
├ Repayment Rate: ${(portfolio.totalRepaid / portfolio.totalLoanAmount * 100).toFixed(1)}%
└ Health Score: ✅ Excellent
    `;

    try {
      await this.bot.sendMessage(chatId, portfolioText, { parse_mode: 'Markdown' });
    } catch (error: any) {
      logger.error('[Telegram Bot] Error sending portfolio', { error: error.message });
    }
  }

  /**
   * Flash loan information and execution
   */
  private async handleFlashLoan(msg: any): Promise<void> {
    const chatId = msg.chat.id;

    const flashLoanText = `
⚡ **Flash Loan Information**

**What is a Flash Loan?**
A flash loan is an uncollateralized loan that must be repaid within the same transaction.

**Features:**
├ No collateral required
├ Instant access to funds
├ Must be repaid in same block
└ Interest: 0.05% of borrowed amount

**Current Available:**
$500,000 available for flash loans

**How to Execute:**
1. Choose amount
2. Select strategy
3. Confirm execution
4. Repay in same transaction

Would you like to execute a flash loan?
    `;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '10,000 USDC', callback_data: 'flash_10k' },
          { text: '50,000 USDC', callback_data: 'flash_50k' },
        ],
        [
          { text: '100,000 USDC', callback_data: 'flash_100k' },
          { text: 'Custom Amount', callback_data: 'flash_custom' },
        ],
        [{ text: '❌ Cancel', callback_data: 'cancel' }],
      ],
    };

    try {
      await this.bot.sendMessage(chatId, flashLoanText, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    } catch (error: any) {
      logger.error('[Telegram Bot] Error sending flash loan', { error: error.message });
    }
  }

  /**
   * Settings command
   */
  private async handleSettings(msg: any): Promise<void> {
    const chatId = msg.chat.id;
    const userId = msg.from?.id.toString() || 'unknown';

    const profile = this.userProfiles.get(userId);
    const notificationStatus = profile?.notificationsEnabled ? '✅ Enabled' : '❌ Disabled';
    const language = profile?.language || 'en';

    const settingsText = `
⚙️ **Bot Settings**

**Notifications**: ${notificationStatus}
**Language**: ${language.toUpperCase()}
**Auto-Repayment**: ❌ Disabled

Customize your preferences:
    `;

    const keyboard = {
      inline_keyboard: [
        [{ text: '🔔 Toggle Notifications', callback_data: 'toggle_notifications' }],
        [{ text: '🌐 Change Language', callback_data: 'change_language' }],
        [{ text: '💳 Link Wallet', callback_data: 'link_wallet' }],
        [{ text: '🔙 Back', callback_data: 'main_menu' }],
      ],
    };

    try {
      await this.bot.sendMessage(chatId, settingsText, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    } catch (error: any) {
      logger.error('[Telegram Bot] Error sending settings', { error: error.message });
    }
  }

  /**
   * Admin command (restricted)
   */
  private async handleAdminCommand(msg: any): Promise<void> {
    const chatId = msg.chat.id;
    const userId = msg.from?.id.toString() || 'unknown';

    // Check if user is admin (in production, verify against admin list)
    const isAdmin = this.isAdminUser(userId);

    if (!isAdmin) {
      await this.bot.sendMessage(chatId, '❌ You do not have permission to use admin commands.');
      return;
    }

    const adminText = `
👨‍💼 **Admin Dashboard**

**System Stats:**
├ Active Users: 1,245
├ Total Loans: 3,456
├ Platform TVL: $45.2M
├ Daily Transactions: 523
└ Uptime: 99.98%

**Quick Actions:**
    `;

    const keyboard = {
      inline_keyboard: [
        [{ text: '📊 View Metrics', callback_data: 'admin_metrics' }],
        [{ text: '⚠️ System Alerts', callback_data: 'admin_alerts' }],
        [{ text: '👥 User Management', callback_data: 'admin_users' }],
        [{ text: '🔐 Security', callback_data: 'admin_security' }],
      ],
    };

    try {
      await this.bot.sendMessage(chatId, adminText, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    } catch (error: any) {
      logger.error('[Telegram Bot] Error sending admin panel', { error: error.message });
    }
  }

  /**
   * Handle general messages (AI assistant)
   */
  private async handleGeneralMessage(msg: any): Promise<void> {
    const chatId = msg.chat.id;
    const text = msg.text || '';

    // Show typing indicator
    await this.bot.sendChatAction(chatId, 'typing');

    // Simulate AI processing (in production, integrate with AI service)
    const response = this.generateAIResponse(text);

    try {
      await this.bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    } catch (error: any) {
      logger.error('[Telegram Bot] Error sending message', { error: error.message });
    }
  }

  /**
   * Handle callback queries (inline button clicks)
   */
  private async handleCallbackQuery(query: any): Promise<void> {
    const chatId = query.message?.chat.id;
    const userId = query.from.id.toString();
    const data = query.data || '';

    if (!chatId) return;

    // Show notification
    await this.bot.answerCallbackQuery(query.id);

    switch (data) {
      case 'view_loans':
        await this.handleLoanStatus({
          chat: { id: chatId },
          from: query.from,
        } as any);
        break;

      case 'view_portfolio':
        await this.handlePortfolio({
          chat: { id: chatId },
          from: query.from,
        } as any);
        break;

      case 'flash_loan_info':
        await this.handleFlashLoan({
          chat: { id: chatId },
          from: query.from,
        } as any);
        break;

      case 'show_help':
        await this.handleHelp({
          chat: { id: chatId },
          from: query.from,
        } as any);
        break;

      case 'settings':
        await this.handleSettings({
          chat: { id: chatId },
          from: query.from,
        } as any);
        break;

      case 'toggle_notifications':
        this.toggleNotifications(userId);
        await this.bot.sendMessage(chatId, '✅ Notification settings updated');
        break;

      case 'flash_10k':
      case 'flash_50k':
      case 'flash_100k':
        await this.executeFlashLoan(chatId, data);
        break;

      case 'cancel':
        await this.bot.sendMessage(chatId, '❌ Operation cancelled');
        break;

      case 'main_menu':
        await this.handleStart({
          chat: { id: chatId },
          from: query.from,
        } as any);
        break;

      default:
        logger.warn('[Telegram Bot] Unknown callback data', { data });
    }
  }

  /**
   * Execute flash loan
   */
  private async executeFlashLoan(chatId: number, amountType: string): Promise<void> {
    const amountMap: Record<string, number> = {
      flash_10k: 10000,
      flash_50k: 50000,
      flash_100k: 100000,
    };

    const amount = amountMap[amountType];
    const interest = (amount * 0.0005).toFixed(2);

    const confirmText = `
⚡ **Flash Loan Execution**

**Amount**: $${amount.toLocaleString()}
**Interest Fee**: $${interest}
**Total to Repay**: $${(amount + parseFloat(interest)).toLocaleString()}

**Execution Steps**:
1️⃣ Approve transaction in wallet
2️⃣ Funds transferred
3️⃣ Execute strategy
4️⃣ Repay + interest

Please confirm in your wallet to proceed.
    `;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ Confirm', callback_data: `confirm_flash_${amount}` },
          { text: '❌ Cancel', callback_data: 'cancel' },
        ],
      ],
    };

    try {
      await this.bot.sendMessage(chatId, confirmText, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    } catch (error: any) {
      logger.error('[Telegram Bot] Error executing flash loan', { error: error.message });
    }
  }

  /**
   * Generate AI response (mock implementation)
   */
  private generateAIResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('loan')) {
      return 'You have 2 active loans totaling $75,000. Would you like me to show you more details?';
    } else if (lowerMessage.includes('flash')) {
      return 'Flash loans allow you to borrow instantly without collateral. Interested in executing one?';
    } else if (lowerMessage.includes('portfolio') || lowerMessage.includes('balance')) {
      return 'Your portfolio is worth $125,000 with an average interest rate of 4.85%. Your health score is Excellent ✅';
    } else if (lowerMessage.includes('rate') || lowerMessage.includes('interest')) {
      return 'Current rates: Standard loans 4-6%, Flash loans 0.05% fee. Rates vary based on market conditions.';
    } else if (lowerMessage.includes('help')) {
      return 'I can help you with: loans, portfolio, flash loans, payments, and market info. What would you like?';
    } else {
      return '💭 I\'m processing your request... In a production environment, I would connect to the AI service for advanced financial insights.';
    }
  }

  /**
   * Toggle notifications for user
   */
  private toggleNotifications(userId: string): void {
    const profile = this.userProfiles.get(userId);
    if (profile) {
      profile.notificationsEnabled = !profile.notificationsEnabled;
    }
  }

  /**
   * Check if user is admin
   */
  private isAdminUser(userId: string): boolean {
    // In production, check against actual admin list
    const adminIds = ['123456789']; // Replace with actual admin IDs
    return adminIds.includes(userId);
  }

  /**
   * Send repayment reminder to user
   */
  async sendRepaymentReminder(telegramId: string, loanId: string, amount: number, dueDate: number): Promise<void> {
    const reminderText = `
⏰ **Repayment Reminder**

Your loan **${loanId}** has a payment due!

**Amount**: $${amount.toLocaleString()}
**Due Date**: ${new Date(dueDate).toLocaleDateString()}

Please ensure payment is made on time to avoid penalties.
    `;

    try {
      await this.bot.sendMessage(telegramId, reminderText, { parse_mode: 'Markdown' });
      logger.info('[Telegram Bot] Reminder sent', { telegramId, loanId });
    } catch (error: any) {
      logger.error('[Telegram Bot] Error sending reminder', { error: error.message });
    }
  }

  /**
   * Send risk alert to user
   */
  async sendRiskAlert(telegramId: string, alertType: string, details: Record<string, any>): Promise<void> {
    let alertText = '⚠️ **Risk Alert**\n\n';

    switch (alertType) {
      case 'high_volatility':
        alertText += `Market volatility is high (${details.volatility}%). Consider reducing your exposure.`;
        break;

      case 'liquidation_risk':
        alertText += `Your position is at risk of liquidation. Current LTV: ${details.ltv}%`;
        break;

      case 'fraud_detected':
        alertText += `Unusual transaction detected on your account. Review it immediately.`;
        break;

      case 'payment_overdue':
        alertText += `Payment for loan ${details.loanId} is overdue. Please pay immediately.`;
        break;

      default:
        alertText += `Important alert: ${details.message}`;
    }

    try {
      await this.bot.sendMessage(telegramId, alertText, { parse_mode: 'Markdown' });
      logger.info('[Telegram Bot] Alert sent', { telegramId, alertType });
    } catch (error: any) {
      logger.error('[Telegram Bot] Error sending alert', { error: error.message });
    }
  }

  /**
   * Send market update to user
   */
  async sendMarketUpdate(telegramId: string, update: Record<string, any>): Promise<void> {
    const updateText = `
📊 **Market Update**

**Interest Rates**:
├ Short-term: ${update.shortRate}%
├ Mid-term: ${update.midRate}%
└ Long-term: ${update.longRate}%

**Market Sentiment**: ${update.sentiment}
**Volatility Index**: ${update.volatility}

Your portfolio impact: ${update.impact}
    `;

    try {
      await this.bot.sendMessage(telegramId, updateText, { parse_mode: 'Markdown' });
    } catch (error: any) {
      logger.error('[Telegram Bot] Error sending market update', { error: error.message });
    }
  }

  /**
   * Start bot polling
   */
  public async start(): Promise<void> {
    if (!this.inTestMode) {
      logger.info('[Telegram Bot] Bot started and listening for messages');
    }
  }

  /**
   * Stop bot polling
   */
  public async stop(): Promise<void> {
    if (this.bot) {
      this.bot.stopPolling();
      logger.info('[Telegram Bot] Bot stopped');
    }
  }

  /**
   * Test mode: Simulate message receipt
   */
  public async handleTestMessage(chatId: number, userId: number, text: string): Promise<void> {
    const mockMessage = {
      chat: { id: chatId },
      from: { id: userId, first_name: 'Test', is_bot: false },
      text,
      message_id: Date.now(),
    } as any;

    if (text.startsWith('/')) {
      if (text === '/start') await this.handleStart(mockMessage);
      else if (text === '/help') await this.handleHelp(mockMessage);
      else if (text === '/loans') await this.handleLoanStatus(mockMessage);
      else if (text === '/portfolio') await this.handlePortfolio(mockMessage);
      else if (text === '/flashloan') await this.handleFlashLoan(mockMessage);
      else if (text === '/settings') await this.handleSettings(mockMessage);
    } else {
      await this.handleGeneralMessage(mockMessage);
    }
  }

  /**
   * Get user profile
   */
  public getUserProfile(userId: string): TelegramUserProfile | undefined {
    return this.userProfiles.get(userId);
  }

  /**
   * Get all active users
   */
  public getActiveUsers(): TelegramUserProfile[] {
    return Array.from(this.userProfiles.values());
  }

  /**
   * Get conversation context
   */
  public getConversationContext(userId: string): UserConversationContext | undefined {
    return this.userSessions.get(userId);
  }

  /**
   * Clear session (user logout)
   */
  public clearSession(userId: string): void {
    this.userSessions.delete(userId);
    logger.info('[Telegram Bot] Session cleared', { userId });
  }

  /**
   * Get bot statistics
   */
  public getStatistics(): Record<string, any> {
    return {
      totalUsers: this.userProfiles.size,
      activeSessions: this.userSessions.size,
      users: Array.from(this.userProfiles.values()).map((u) => ({
        telegramId: u.telegramId,
        username: u.username,
        joinedAt: u.joinedAt,
        lastActive: u.lastActive,
      })),
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let botInstance: LynqTelegramBot | null = null;

export function initializeLynqBot(token: string, testMode: boolean = false): LynqTelegramBot {
  if (!botInstance) {
    botInstance = new LynqTelegramBot(token, testMode);
  }
  return botInstance;
}

export function getLynqBot(): LynqTelegramBot {
  if (!botInstance) {
    throw new Error('Bot not initialized. Call initializeLynqBot first.');
  }
  return botInstance;
}

export default LynqTelegramBot;
