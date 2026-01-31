import { z } from 'zod';

export const TrustScoreSchema = z.object({
  score: z.number().min(0).max(1000),
  creditHistory: z.number().min(0),
  repaymentRecord: z.number().min(0).max(100),
  collateralValue: z.number().min(0),
  lastUpdated: z.string().datetime(),
});

export const LoanRequestSchema = z.object({
  id: z.string(),
  borrower: z.string(),
  amount: z.number().positive(),
  tokenType: z.string(),
  purpose: z.string().min(1),
  collateralAddress: z.string().optional(),
  status: z.enum(['pending', 'approved', 'active', 'repaid', 'defaulted', 'rejected']),
  createdAt: z.string().datetime(),
  approvedAt: z.string().datetime().optional(),
  interestRate: z.number().positive().optional(),
  dueDate: z.string().datetime().optional(),
  txHash: z.string().optional(),
});

export const RepaymentScheduleSchema = z.object({
  paymentNumber: z.number().int().positive(),
  dueDate: z.string().datetime(),
  amount: z.number().positive(),
  principal: z.number().min(0),
  interest: z.number().min(0),
  status: z.enum(['pending', 'paid', 'overdue']),
  paidDate: z.string().datetime().optional(),
  txHash: z.string().optional(),
});

export const ActiveLoanSchema = z.object({
  id: z.string(),
  borrower: z.string(),
  amount: z.number().positive(),
  remainingAmount: z.number().min(0),
  tokenType: z.string(),
  purpose: z.string(),
  collateralAddress: z.string().optional(),
  interestRate: z.number().positive(),
  status: z.enum(['active', 'overdue', 'grace_period', 'defaulted']),
  startDate: z.string().datetime(),
  dueDate: z.string().datetime(),
  nextPaymentDate: z.string().datetime(),
  nextPaymentAmount: z.number().min(0),
  totalPaid: z.number().min(0),
  txHash: z.string(),
  repaymentSchedule: z.array(RepaymentScheduleSchema),
});

export const WalletConnectionSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  chainId: z.string().optional(),
  walletType: z.string(),
  networkName: z.string().optional(),
});

export const CoinSchema = z.object({
  id: z.string(),
  name: z.string(),
  symbol: z.string(),
  image: z.string().url(),
  current_price: z.number(),
  market_cap: z.number(),
  market_cap_rank: z.number().int().positive(),
  total_volume: z.number(),
  price_change_percentage_24h: z.number(),
  circulating_supply: z.number(),
  total_supply: z.number().nullable().optional(),
  sparkline_in_7d: z.object({
    price: z.array(z.number()),
  }).optional(),
});

export const TransactionResultSchema = z.object({
  success: z.boolean(),
  txHash: z.string().optional(),
  error: z.string().optional(),
  blockNumber: z.number().optional(),
  gasUsed: z.number().optional(),
});

export const LoanSettingsSchema = z.object({
  maxLoanAmount: z.number().positive(),
  minLoanAmount: z.number().positive(),
  baseInterestRate: z.number().positive(),
  maxLoanTerm: z.number().int().positive(),
  minTrustScore: z.number().min(0).max(1000),
  collateralRatio: z.number().min(0).max(100),
  gracePeriod: z.number().int().nonnegative(),
});

export type TrustScoreType = z.infer<typeof TrustScoreSchema>;
export type LoanRequestType = z.infer<typeof LoanRequestSchema>;
export type RepaymentScheduleType = z.infer<typeof RepaymentScheduleSchema>;
export type ActiveLoanType = z.infer<typeof ActiveLoanSchema>;
export type WalletConnectionType = z.infer<typeof WalletConnectionSchema>;
export type CoinType = z.infer<typeof CoinSchema>;
export type TransactionResultType = z.infer<typeof TransactionResultSchema>;
export type LoanSettingsType = z.infer<typeof LoanSettingsSchema>;

