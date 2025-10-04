import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { DirectionSchema, EntrySchema } from './models.ts';

extendZodWithOpenApi(z);

export const CreateAccountRequestSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  balance: z.number().optional(),
  direction: DirectionSchema,
}).openapi('CreateAccountRequest');

export const CreateEntryRequestSchema = z.object({
  direction: DirectionSchema,
  amount: z.number(),
  account_id: z.string(),
}).openapi('CreateEntryRequest');

export const CreateTransactionRequestSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  entries: z.array(CreateEntryRequestSchema).min(2),
}).openapi('CreateTransactionRequest');

export const TransactionValidationResultSchema = z.object({
  valid: z.boolean(),
  error: z.string(),
}).openapi('TransactionValidationResult');

export const DisableAccountResultSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
}).openapi('DisableAccountResult');

export const ErrorSchema = z.object({
  error: z.string(),
}).openapi('Error');

// Infer TypeScript types from Zod schemas
export type CreateAccountRequest = z.infer<typeof CreateAccountRequestSchema>;
export type CreateTransactionRequest = z.infer<typeof CreateTransactionRequestSchema>;
export type TransactionValidationResult = z.infer<typeof TransactionValidationResultSchema>;
export type DisableAccountResult = z.infer<typeof DisableAccountResultSchema>;
