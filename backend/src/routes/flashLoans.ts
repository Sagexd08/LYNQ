import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { flashLoanController } from '../controllers/flashLoanController';
import { authenticate, requireRoles } from '../middleware/auth';

const router = Router();

// Validation helper
const validate = (schema: z.ZodTypeAny) => (req: any, res: any, next: any) => {
  const parsed = schema.safeParse({ body: req.body, params: req.params, query: req.query });
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.flatten() });
  }
  next();
};

// Rate limiters
const moderateLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });
const harshLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });

// Schemas
const quoteSchema = z.object({ body: z.object({
  userAddress: z.string(),
  assets: z.array(z.string()).nonempty(),
  amounts: z.array(z.string()).nonempty()
})});

const checkEligibilitySchema = z.object({ body: z.object({
  userAddress: z.string(),
  assets: z.array(z.string()).nonempty(),
  amounts: z.array(z.string()).nonempty()
})});

const simulateSchema = z.object({ body: z.object({
  userAddress: z.string(),
  receiverAddress: z.string(),
  assets: z.array(z.string()).nonempty(),
  amounts: z.array(z.string()).nonempty(),
  params: z.string().optional()
})});

const executeSchema = z.object({ body: z.object({
  userAddress: z.string(),
  receiverAddress: z.string(),
  assets: z.array(z.string()).nonempty(),
  amounts: z.array(z.string()).nonempty(),
  params: z.string().optional()
})});

const multiRiskSchema = z.object({ body: z.object({
  initiator: z.string(),
  asset: z.string(),
  totalAmount: z.string(),
  recipients: z.array(z.string()).nonempty(),
  allocations: z.array(z.string()).nonempty(),
  receiverContract: z.string(),
})});

const multiExecuteSchema = z.object({ body: z.object({
  initiator: z.string(),
  asset: z.string(),
  totalAmount: z.string(),
  recipients: z.array(z.string()).nonempty(),
  allocations: z.array(z.string()).nonempty(),
  receiverContract: z.string(),
  params: z.string().optional(),
  override: z.boolean().optional(),
})});

const multiQuoteSchema = z.object({ body: z.object({
  asset: z.string(),
  totalAmount: z.string(),
  recipientCount: z.number().int().min(1).max(20)
})});

/**
 * @route GET /api/flash-loans/quote
 * @desc Get flash loan quote
 */
router.post('/quote', moderateLimiter, validate(quoteSchema), flashLoanController.getQuote);

/**
 * @route POST /api/flash-loans/check-eligibility
 * @desc Check user eligibility for flash loan
 */
router.post('/check-eligibility', authenticate, requireRoles('user'), moderateLimiter, validate(checkEligibilitySchema), flashLoanController.checkEligibility);

/**
 * @route GET /api/flash-loans/user/:userAddress/stats
 * @desc Get user flash loan statistics
 */
router.get('/user/:userAddress/stats', flashLoanController.getUserStats);

/**
 * @route GET /api/flash-loans/liquidity
 * @desc Get available liquidity
 */
router.get('/liquidity', flashLoanController.getAvailableLiquidity);

/**
 * @route POST /api/flash-loans/simulate
 * @desc Simulate flash loan execution
 */
router.post('/simulate', authenticate, requireRoles('user'), moderateLimiter, validate(simulateSchema), flashLoanController.simulateFlashLoan);

/**
 * @route POST /api/flash-loans/execute
 * @desc Execute flash loan (prepare transaction)
 */
router.post('/execute', authenticate, requireRoles('user'), harshLimiter, validate(executeSchema), flashLoanController.executeFlashLoan);

/**
 * @route GET /api/flash-loans/user/:userAddress/history
 * @desc Get flash loan history for user
 */
router.get('/user/:userAddress/history', flashLoanController.getFlashLoanHistory);

/**
 * @route GET /api/flash-loans/user/:userAddress/risk-assessment
 * @desc Get risk assessment for user
 */
router.get('/user/:userAddress/risk-assessment', flashLoanController.getRiskAssessment);

/**
 * @route POST /api/flash-loans/multi/risk
 * @desc Assess risk for a proposed multi-wallet flash loan
 */
router.post('/multi/risk', authenticate, requireRoles('user'), moderateLimiter, validate(multiRiskSchema), flashLoanController.assessMultiWalletRisk);

/**
 * @route POST /api/flash-loans/multi
 * @desc Execute a multi-wallet flash loan
 */
router.post('/multi', authenticate, requireRoles('user'), harshLimiter, validate(multiExecuteSchema), flashLoanController.executeMultiWalletFlashLoan);

/**
 * @route GET /api/flash-loans/multi/:batchId
 * @desc Get multi-wallet batch details
 */
router.get('/multi/:batchId', flashLoanController.getMultiWalletBatch);

/**
 * @route GET /api/flash-loans/multi/user/:userAddress
 * @desc Get all multi-wallet batches for a user
 */
router.get('/multi/user/:userAddress', flashLoanController.getUserMultiWalletBatches);

/**
 * @route POST /api/flash-loans/multi/quote
 * @desc Get multi-wallet flash loan quote
 */
router.post('/multi/quote', moderateLimiter, validate(multiQuoteSchema), flashLoanController.getMultiWalletQuote);

export default router;
