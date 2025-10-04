import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const DirectionSchema = z.enum(['debit', 'credit']).openapi({
  description: 'Transaction direction',
});

export const AccountSchema = z.object({
  id: z.string().openapi({ description: 'Account ID' }),
  name: z.string().optional().openapi({ description: 'Account name' }),
  balance: z.number().openapi({ description: 'Current balance' }),
  direction: DirectionSchema,
  disabled: z.boolean().openapi({ description: 'Whether account is disabled' }),
}).openapi('Account');

export const EntrySchema = z.object({
  id: z.string().openapi({ description: 'Entry ID' }),
  direction: DirectionSchema,
  amount: z.number().openapi({ description: 'Transaction amount' }),
  account_id: z.string().openapi({ description: 'Associated account ID' }),
}).openapi('Entry');

export const TransactionSchema = z.object({
  id: z.string().openapi({ description: 'Transaction ID' }),
  name: z.string().optional().openapi({ description: 'Transaction name' }),
  entries: z.array(EntrySchema),
}).openapi('Transaction');

// Infer TypeScript types from Zod schemas
export type Direction = z.infer<typeof DirectionSchema>;
export type Account = z.infer<typeof AccountSchema>;
export type Entry = z.infer<typeof EntrySchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
