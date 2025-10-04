import type { Entry } from './models.ts';

export interface CreateAccountRequest {
  id?: string;
  name?: string;
  balance?: number;
  direction: 'debit' | 'credit';
}

export interface CreateTransactionRequest {
  id?: string;
  name?: string;
  entries: Omit<Entry, 'id'>[];
}

export interface TransactionValidationResult {
  valid: boolean;
  error: string;
}

export interface DisableAccountResult {
  success: boolean;
  error?: string;
}
