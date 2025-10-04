import type { Entry } from './models.ts';

export interface CreateAccountRequest {
  name?: string;
  balance?: number;
  direction: 'debit' | 'credit';
}

export interface CreateTransactionRequest {
  name?: string;
  entries: Omit<Entry, 'id'>[];
}

export interface TransactionValidationResult {
  valid: boolean;
  error: string;
}
