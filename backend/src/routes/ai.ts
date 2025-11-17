import express, { Request, Response } from 'express';
import { z } from 'zod';
import RiskEngine, { FlashLoanContext, RiskLevel, RiskLevelLabel } from '../services/riskEngine';
import logger from '../utils/logger';

const router = express.Router();

// Schema for incoming risk request
const riskSchema = z.object({
  type: z.enum(['flashloan', 'loan']).default('flashloan'),
  context: z.object({
    asset: z.string(),
    totalAmount: z.string(), // bigint as string
    premium: z.string(), // bigint as string
    recipientCount: z.number().int().nonnegative(),
    recipients: z.array(z.string()),
    allocations: z.array(z.string()),
    initiator: z.string(),
    receiverContract: z.string(),
    timestamp: z.number().int(),

    // optional risk features
    availableLiquidity: z.string().optional(),
    expectedSlippageBps: z.number().int().optional(),
    gasGwei: z.number().optional(),
    gasVolatilityIndex: z.number().optional(),
    counterpartyAlerts: z.array(z.string()).optional(),
    walletHealth: z.number().optional(),
  }),
  walletHistories: z.record(z.string(), z.object({
    address: z.string(),
    totalTransactions: z.number().int().nonnegative(),
    totalVolume: z.string(),
    avgTransactionSize: z.string(),
    firstSeenTimestamp: z.number().int(),
    lastSeenTimestamp: z.number().int(),
    isContract: z.boolean(),
    tokenBalances: z.record(z.string(), z.string()).optional(),
    trustScore: z.number().int().optional(),
  })).default({}),
  // loan-specific credit risk inputs
  loan: z.object({
    monthlyIncome: z.number().nonnegative().optional(),
    proposedEmi: z.number().nonnegative().optional(),
    onTimeRepaymentRatio: z.number().min(0).max(1).optional(),
    priorDefaults: z.number().int().min(0).optional(),
    behaviorAnomalies: z.array(z.string()).optional(),
  }).optional(),
});

router.post('/risk', async (req: Request, res: Response) => {
  const parse = riskSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ success: false, error: parse.error.flatten() });
  }

  const { type, context, walletHistories, loan } = parse.data;

  // Build wallet history map
  const historyMap = new Map<string, any>();
  Object.values(walletHistories).forEach((w) => {
    historyMap.set(w.address, {
      ...w,
      totalVolume: BigInt(w.totalVolume),
      avgTransactionSize: BigInt(w.avgTransactionSize),
      tokenBalances: new Map(Object.entries(w.tokenBalances || {}).map(([k,v]) => [k, BigInt(v as string)])),
    });
  });

  const ctx: FlashLoanContext = {
    asset: context.asset,
    totalAmount: BigInt(context.totalAmount),
    premium: BigInt(context.premium),
    recipientCount: context.recipientCount,
    recipients: context.recipients,
    allocations: context.allocations.map(BigInt),
    initiator: context.initiator,
    receiverContract: context.receiverContract,
    timestamp: context.timestamp,
    availableLiquidity: context.availableLiquidity ? BigInt(context.availableLiquidity) : undefined,
    expectedSlippageBps: context.expectedSlippageBps,
    gasGwei: context.gasGwei,
    gasVolatilityIndex: context.gasVolatilityIndex,
    counterpartyAlerts: context.counterpartyAlerts,
    walletHealth: context.walletHealth,
  };

  try {
    if (type === 'loan' && loan) {
      const credit = RiskEngine.assessCreditRisk({
        monthlyIncome: loan.monthlyIncome || 0,
        proposedEmi: loan.proposedEmi || 0,
        onTimeRepaymentRatio: loan.onTimeRepaymentRatio,
        priorDefaults: loan.priorDefaults,
        behaviorAnomalies: loan.behaviorAnomalies,
      });
      const payload = {
        score: credit.riskScore,
        level: RiskLevelLabel[credit.riskLevel],
        reasons: credit.reasons,
        suggestions: credit.suggestions || [],
        safeParams: credit.safeParams || {},
        flags: credit.flags,
        recommendation: credit.recommendation,
        confidence: credit.confidence,
        type,
      };
      logger.audit?.({ action: 'AI_RISK_API', outcome: credit.recommendation, resource: 'ai:risk:loan', metadata: payload });
      return res.json({ success: true, data: payload });
    }

    const result = await RiskEngine.assessRisk(ctx, historyMap);

    const payload = {
      score: result.riskScore,
      level: RiskLevelLabel[result.riskLevel],
      reasons: result.reasons,
      suggestions: result.suggestions || [],
      safeParams: result.safeParams || {},
      flags: result.flags,
      recommendation: result.recommendation,
      confidence: result.confidence,
      type,
    };

    logger.audit?.({
      action: 'AI_RISK_API',
      outcome: result.recommendation,
      resource: type === 'flashloan' ? 'ai:risk:flashloan' : 'ai:risk:loan',
      metadata: payload,
    });

    return res.json({ success: true, data: payload });
  } catch (e: any) {
    logger.error('AI risk endpoint error', { error: e?.message, stack: e?.stack });
    return res.status(500).json({ success: false, error: { message: 'Internal error' } });
  }
});

export default router;
