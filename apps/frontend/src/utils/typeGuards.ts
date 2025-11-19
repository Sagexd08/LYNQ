import type { ActiveLoan, LoanRequest, TrustScore, TransactionResult } from '../types/loan';
import { 
  TrustScoreSchema, 
  LoanRequestSchema, 
  ActiveLoanSchema, 
  TransactionResultSchema 
} from '../types/schemas';

export function isTrustScore(value: unknown): value is TrustScore {
  return TrustScoreSchema.safeParse(value).success;
}

export function isLoanRequest(value: unknown): value is LoanRequest {
  return LoanRequestSchema.safeParse(value).success;
}

export function isActiveLoan(value: unknown): value is ActiveLoan {
  return ActiveLoanSchema.safeParse(value).success;
}

export function isTransactionResult(value: unknown): value is TransactionResult {
  return TransactionResultSchema.safeParse(value).success;
}

export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isValidChainId(chainId: string): boolean {
  return /^0x[a-fA-F0-9]+$/.test(chainId);
}

export function isValidTxHash(txHash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(txHash);
}

export function isValidAptosAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(address);
}

export function isValidFlowAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{16}$/.test(address);
}

export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && value > 0 && !isNaN(value);
}

export function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && value >= 0 && !isNaN(value);
}

export function hasProperty<T extends string>(
  obj: unknown,
  prop: T
): obj is Record<T, unknown> {
  return typeof obj === 'object' && obj !== null && prop in obj;
}

export function isLoanStatus(
  value: unknown
): value is ActiveLoan['status'] | LoanRequest['status'] {
  const validStatuses = ['pending', 'approved', 'active', 'repaid', 'defaulted', 'rejected', 'overdue', 'grace_period'];
  return typeof value === 'string' && validStatuses.includes(value);
}

