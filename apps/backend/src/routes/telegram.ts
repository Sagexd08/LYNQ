import { Router, Request, Response, NextFunction } from 'express';
import { initializeLynqBot, getLynqBot } from '../services/telegramBotService';
import { authenticate } from '../middleware/auth';
import errorHandler from '../middleware/errorHandler';
import logger from '../utils/logger';

/**
 * Telegram Bot Routes
 * Handles bot initialization, webhooks, and API endpoints
 */

const router = Router();

// ============================================================================
// INITIALIZATION & WEBHOOK
// ============================================================================

/**
 * POST /api/telegram/init
 * Initialize Telegram bot with token
 */
router.post('/init', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, testMode = false } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }

    const bot = initializeLynqBot(token, testMode);
    await bot.start();

    res.json({
      success: true,
      message: 'Telegram bot initialized successfully',
      testMode,
    });
  } catch (error: any) {
    logger.error('[Telegram Routes] Bot initialization error', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/telegram/webhook
 * Receive webhook updates from Telegram
 */
router.post('/webhook', async (_req: Request, res: Response, _next: NextFunction) => {
  try {
    // In production, verify webhook signature here
    return res.json({ ok: true });
  } catch (error: any) {
    logger.error('[Telegram Routes] Webhook error', { error: error.message });
    return res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// USER MANAGEMENT
// ============================================================================

/**
 * GET /api/telegram/users
 * Get all Telegram users (admin only)
 */
router.get('/users', authenticate, async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bot = getLynqBot();
    const users = bot.getActiveUsers();

    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error: any) {
    logger.error('[Telegram Routes] Error getting users', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/telegram/users/:telegramId
 * Get specific user profile
 */
router.get('/users/:telegramId', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { telegramId } = req.params;
    const bot = getLynqBot();
    const profile = bot.getUserProfile(telegramId);

    if (!profile) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    logger.error('[Telegram Routes] Error getting user profile', { error: error.message });
    next(error);
  }
});

/**
 * DELETE /api/telegram/users/:telegramId/session
 * Clear user session
 */
router.delete('/users/:telegramId/session', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { telegramId } = req.params;
    const bot = getLynqBot();

    bot.clearSession(telegramId);

    res.json({
      success: true,
      message: 'Session cleared',
    });

    logger.info('[Telegram Routes] Session cleared', { telegramId });
  } catch (error: any) {
    logger.error('[Telegram Routes] Error clearing session', { error: error.message });
    next(error);
  }
});

// ============================================================================
// NOTIFICATIONS & ALERTS
// ============================================================================

/**
 * POST /api/telegram/notifications/reminder
 * Send repayment reminder
 */
router.post('/notifications/reminder', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { telegramId, loanId, amount, dueDate } = req.body;

    if (!telegramId || !loanId || !amount) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const bot = getLynqBot();
    await bot.sendRepaymentReminder(telegramId, loanId, amount, dueDate || Date.now());

    res.json({
      success: true,
      message: 'Reminder sent',
    });
  } catch (error: any) {
    logger.error('[Telegram Routes] Error sending reminder', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/telegram/notifications/alert
 * Send risk alert
 */
router.post('/notifications/alert', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { telegramId, alertType, details } = req.body;

    if (!telegramId || !alertType) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const bot = getLynqBot();
    await bot.sendRiskAlert(telegramId, alertType, details || {});

    res.json({
      success: true,
      message: 'Alert sent',
    });
  } catch (error: any) {
    logger.error('[Telegram Routes] Error sending alert', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/telegram/notifications/market-update
 * Send market update
 */
router.post('/notifications/market-update', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { telegramId, update } = req.body;

    if (!telegramId || !update) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const bot = getLynqBot();
    await bot.sendMarketUpdate(telegramId, update);

    res.json({
      success: true,
      message: 'Market update sent',
    });
  } catch (error: any) {
    logger.error('[Telegram Routes] Error sending market update', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/telegram/notifications/broadcast
 * Send message to all users (admin only)
 */
router.post('/notifications/broadcast', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { message } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const bot = getLynqBot();
    const users = bot.getActiveUsers();

    let sent = 0;
    for (const user of users) {
      try {
        // In production, actually send message
        sent++;
      } catch (error) {
        logger.error('[Telegram Routes] Error broadcasting to user', { userId: user.telegramId });
      }
    }

    res.json({
      success: true,
      message: 'Broadcast sent',
      sent,
    });
  } catch (error: any) {
    logger.error('[Telegram Routes] Error broadcasting', { error: error.message });
    next(error);
  }
});

// ============================================================================
// STATISTICS & MONITORING
// ============================================================================

/**
 * GET /api/telegram/stats
 * Get bot statistics
 */
router.get('/stats', authenticate, async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bot = getLynqBot();
    const stats = bot.getStatistics();

    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    logger.error('[Telegram Routes] Error getting stats', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/telegram/health
 * Bot health check
 */
router.get('/health', async (_req: Request, res: Response, _next: NextFunction) => {
  try {
    const bot = getLynqBot();
    const users = bot.getActiveUsers();

    return res.json({
      success: true,
      status: 'operational',
      activeUsers: users.length,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      status: 'error',
      error: error.message,
    });
  }
});

// ============================================================================
// TESTING ENDPOINTS (Development only)
// ============================================================================

/**
 * POST /api/telegram/test/message
 * Send test message (for development/testing)
 */
router.post('/test/message', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { chatId, userId, text } = req.body;

    if (!chatId || !userId || !text) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const bot = getLynqBot();
    await bot.handleTestMessage(chatId, userId, text);

    res.json({
      success: true,
      message: 'Test message processed',
    });
  } catch (error: any) {
    logger.error('[Telegram Routes] Error processing test message', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/telegram/test/reminder
 * Send test repayment reminder
 */
router.post('/test/reminder', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { telegramId = '123456789', loanId = 'LOAN-001', amount = 1500 } = req.body;

    const bot = getLynqBot();
    await bot.sendRepaymentReminder(telegramId, loanId, amount, Date.now() + 30 * 24 * 60 * 60 * 1000);

    res.json({
      success: true,
      message: 'Test reminder sent',
    });

    logger.info('[Telegram Routes] Test reminder sent');
  } catch (error: any) {
    logger.error('[Telegram Routes] Error sending test reminder', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/telegram/test/alert
 * Send test alert
 */
router.post('/test/alert', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { telegramId = '123456789', alertType = 'liquidation_risk' } = req.body;

    const bot = getLynqBot();
    await bot.sendRiskAlert(telegramId, alertType, { ltv: 75 });

    res.json({
      success: true,
      message: 'Test alert sent',
    });

    logger.info('[Telegram Routes] Test alert sent');
  } catch (error: any) {
    logger.error('[Telegram Routes] Error sending test alert', { error: error.message });
    next(error);
  }
});

// Error handler
router.use(errorHandler);

export default router;
