import type { Account, Transaction } from '@models/types.ts';

class Storage {
  private accounts: Map<string, Account> = new Map();
  private transactions: Map<string, Transaction> = new Map();

  // Account operations
  saveAccount(account: Account): void {
    this.accounts.set(account.id, account);
  }

  getAccount(id: string): Account | undefined {
    return this.accounts.get(id);
  }

  // Transaction operations
  saveTransaction(transaction: Transaction): void {
    this.transactions.set(transaction.id, transaction);
  }

  getTransaction(id: string): Transaction | undefined {
    return this.transactions.get(id);
  }
}

// Singleton instance
export const storage = new Storage();
