import { randomUUID } from 'node:crypto';
import type {
  Account,
  Transaction,
  Entry,
  CreateAccountRequest,
  CreateTransactionRequest,
  Direction,
  TransactionValidationResult,
} from '@/types/index';
import { storage } from '@services/storage.ts';

/**
 * Apply an entry to an account's balance
 * Rule: Same directions = add, opposite directions = subtract
 */
function applyEntryToBalance(
  accountBalance: number,
  accountDirection: Direction,
  entryDirection: Direction,
  entryAmount: number
): number {
  if (accountDirection === entryDirection) {
    return accountBalance + entryAmount;
  } else {
    return accountBalance - entryAmount;
  }
}

/**
 * Validate that transaction entries balance (sum of debits = sum of credits)
 */
function validateTransactionBalance(
  entries: Omit<Entry, 'id'>[]
): TransactionValidationResult {
  let totalDebits = 0;
  let totalCredits = 0;

  for (const entry of entries) {
    if (entry.direction === 'debit') {
      totalDebits += entry.amount;
    } else {
      totalCredits += entry.amount;
    }
  }

  if (totalDebits !== totalCredits) {
    return {
      valid: false,
      error: `Transaction not balanced: debits=${totalDebits}, credits=${totalCredits}`,
    };
  }

  return { valid: true, error: '' };
}

/**
 * Create a new account
 */
export function createAccount(request: CreateAccountRequest): Account {
  const account: Account = {
    id: randomUUID(),
    balance: request.balance ?? 0,
    direction: request.direction,
  };

  if (request.name !== undefined) {
    account.name = request.name;
  }

  storage.saveAccount(account);
  return account;
}

/**
 * Get an account by ID
 */
export function getAccount(id: string): Account | undefined {
  return storage.getAccount(id);
}

/**
 * Create a new transaction and apply it to all affected accounts
 */
export function createTransaction(
  request: CreateTransactionRequest
): { success: boolean; transaction?: Transaction; error?: string } {
  // Validate transaction balance
  const validation = validateTransactionBalance(request.entries);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Check that all accounts exist
  for (const entry of request.entries) {
    const account = storage.getAccount(entry.account_id);
    if (!account) {
      return {
        success: false,
        error: `Account not found: ${entry.account_id}`,
      };
    }
  }

  // Create entries with generated IDs
  const entries: Entry[] = request.entries.map((entry) => ({
    ...entry,
    id: randomUUID(),
  }));

  // Create transaction
  const transaction: Transaction = {
    id: randomUUID(),
    entries,
  };

  if (request.name !== undefined) {
    transaction.name = request.name;
  }

  // Apply transaction to all affected accounts
  for (const entry of entries) {
    const account = storage.getAccount(entry.account_id);
    if (!account) {
      // This shouldn't happen as we checked above, but TypeScript doesn't know that
      return {
        success: false,
        error: `Account not found: ${entry.account_id}`,
      };
    }

    // Update account balance
    account.balance = applyEntryToBalance(
      account.balance,
      account.direction,
      entry.direction,
      entry.amount
    );

    storage.saveAccount(account);
  }

  // Save transaction
  storage.saveTransaction(transaction);

  return { success: true, transaction };
}
