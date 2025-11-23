import { z } from 'zod';

const ethereumAddressSchema = z
  .string()
  .refine(addr => /^0x[a-fA-F0-9]{40}$/.test(addr), {
    message: 'Invalid Ethereum address',
  });

export const executeMultiWalletFlashLoanSchema = z.object({
  initiator: ethereumAddressSchema.describe('Address initiating the flash loan'),
  asset: ethereumAddressSchema.describe('Token address to borrow'),
  totalAmount: z
    .string()
    .refine(amount => BigInt(amount) > 0n, {
      message: 'Total amount must be greater than 0',
    })
    .describe('Total amount in wei'),
  recipients: z
    .array(ethereumAddressSchema)
    .min(1, 'At least one recipient is required')
    .max(20, 'Maximum 20 recipients allowed')
    .describe('Array of recipient wallet addresses'),
  allocations: z
    .array(
      z
        .string()
        .refine(amount => BigInt(amount) > 0n, {
          message: 'Each allocation must be greater than 0',
        })
    )
    .describe('Array of amounts per recipient in wei'),
  receiverContract: ethereumAddressSchema.describe('Contract that handles distribution'),
  params: z
    .string()
    .optional()
    .default('0x')
    .describe('Optional encoded parameters'),
});

export type ExecuteMultiWalletFlashLoanRequest = z.infer<
  typeof executeMultiWalletFlashLoanSchema
>;

export const executeMultiWalletFlashLoanResponseSchema = z.object({
  success: z.boolean().describe('Whether the operation succeeded'),
  data: z.object({
    batchId: z.string().describe('Unique batch identifier'),
    transactionHash: z.string().describe('Transaction hash'),
  }),
});

export type ExecuteMultiWalletFlashLoanResponse = z.infer<
  typeof executeMultiWalletFlashLoanResponseSchema
>;

export const getMultiWalletBatchSchema = z.object({
  batchId: z
    .string()
    .refine(id => !isNaN(parseInt(id, 10)), {
      message: 'Invalid batch ID',
    })
    .describe('Batch identifier'),
});

export type GetMultiWalletBatchRequest = z.infer<typeof getMultiWalletBatchSchema>;

export const multiWalletBatchResponseSchema = z.object({
  asset: ethereumAddressSchema.describe('Token borrowed'),
  totalAmount: z.string().describe('Total amount distributed in wei'),
  premium: z.string().describe('Fee collected in wei'),
  recipients: z.array(ethereumAddressSchema).describe('Recipient addresses'),
  allocations: z.array(z.string()).describe('Amount per recipient in wei'),
  initiator: ethereumAddressSchema.describe('User who initiated batch'),
  timestamp: z.number().describe('Block timestamp'),
  success: z.boolean().describe('Execution status'),
  failureReason: z.string().optional().describe('Reason if failed'),
});

export type MultiWalletBatchResponse = z.infer<typeof multiWalletBatchResponseSchema>;

export const getUserMultiWalletBatchesResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    batches: z.array(multiWalletBatchResponseSchema),
    totalCount: z.number(),
    userAddress: ethereumAddressSchema,
  }),
});

export type GetUserMultiWalletBatchesResponse = z.infer<
  typeof getUserMultiWalletBatchesResponseSchema
>;

export const getMultiWalletQuoteSchema = z.object({
  asset: ethereumAddressSchema.describe('Token address'),
  totalAmount: z
    .string()
    .refine(amount => BigInt(amount) > 0n, {
      message: 'Total amount must be greater than 0',
    })
    .describe('Total amount in wei'),
  recipientCount: z
    .number()
    .min(1, 'At least 1 recipient')
    .max(20, 'Maximum 20 recipients')
    .describe('Number of recipients for gas estimation'),
});

export type GetMultiWalletQuoteRequest = z.infer<typeof getMultiWalletQuoteSchema>;

export const multiWalletQuoteResponseSchema = z.object({
  premium: z.string().describe('Premium to be paid in wei'),
  feeBps: z.number().describe('Fee in basis points'),
  estimatedGas: z.string().describe('Estimated gas cost'),
  estimatedGasCost: z.string().describe('Estimated gas cost in wei'),
});

export type MultiWalletQuoteResponse = z.infer<typeof multiWalletQuoteResponseSchema>;

export const errorResponseSchema = z.object({
  error: z.string().describe('Error type'),
  message: z.string().optional().describe('Error message'),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

export const successResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });
