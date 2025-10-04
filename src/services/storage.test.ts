import { describe, it, expect, beforeEach } from 'vitest';
import { Storage } from './storage';
import { DIRECTION } from '@constants';
import type { Account, Transaction } from '@/types/index';

describe('Storage', () => {
  let storage: Storage;

  beforeEach(() => {
    storage = new Storage();
  });

  describe('Account operations', () => {
    const mockAccount: Account = {
      id: 'acc-1',
      name: 'Cash',
      direction: DIRECTION.DEBIT,
      balance: 100,
      disabled: false,
    };

    describe('saveAccount', () => {
      it('should save account to storage', () => {
        storage.saveAccount(mockAccount);

        const retrieved = storage.getAccount('acc-1');
        expect(retrieved).toEqual(mockAccount);
      });

      it('should overwrite existing account with same id', () => {
        storage.saveAccount(mockAccount);

        const updated = { ...mockAccount, balance: 200, name: 'Updated Cash' };
        storage.saveAccount(updated);

        const retrieved = storage.getAccount('acc-1');
        expect(retrieved).toEqual(updated);
        expect(retrieved?.balance).toBe(200);
        expect(retrieved?.name).toBe('Updated Cash');
      });

      it('should save multiple accounts independently', () => {
        const account1: Account = {
          id: 'acc-1',
          name: 'Cash',
          direction: DIRECTION.DEBIT,
          balance: 100,
          disabled: false,
        };

        const account2: Account = {
          id: 'acc-2',
          name: 'Bank',
          direction: DIRECTION.CREDIT,
          balance: 500,
          disabled: false,
        };

        storage.saveAccount(account1);
        storage.saveAccount(account2);

        expect(storage.getAccount('acc-1')).toEqual(account1);
        expect(storage.getAccount('acc-2')).toEqual(account2);
      });

      it('should preserve account object references', () => {
        storage.saveAccount(mockAccount);

        const retrieved = storage.getAccount('acc-1');
        expect(retrieved).toBe(mockAccount);
      });

      it('should handle accounts with optional fields', () => {
        const minimalAccount: Account = {
          id: 'acc-minimal',
          direction: DIRECTION.DEBIT,
          balance: 0,
          disabled: false,
        };

        storage.saveAccount(minimalAccount);

        const retrieved = storage.getAccount('acc-minimal');
        expect(retrieved).toEqual(minimalAccount);
        expect(retrieved?.name).toBeUndefined();
      });

      it('should handle disabled accounts', () => {
        const disabledAccount: Account = {
          id: 'acc-disabled',
          name: 'Disabled Account',
          direction: DIRECTION.CREDIT,
          balance: 50,
          disabled: true,
        };

        storage.saveAccount(disabledAccount);

        const retrieved = storage.getAccount('acc-disabled');
        expect(retrieved?.disabled).toBe(true);
      });

      it('should handle accounts with zero balance', () => {
        const zeroBalanceAccount: Account = {
          id: 'acc-zero',
          name: 'Zero Balance',
          direction: DIRECTION.DEBIT,
          balance: 0,
          disabled: false,
        };

        storage.saveAccount(zeroBalanceAccount);

        const retrieved = storage.getAccount('acc-zero');
        expect(retrieved?.balance).toBe(0);
      });

      it('should handle accounts with negative balance', () => {
        const negativeBalanceAccount: Account = {
          id: 'acc-negative',
          name: 'Negative Balance',
          direction: DIRECTION.CREDIT,
          balance: -100,
          disabled: false,
        };

        storage.saveAccount(negativeBalanceAccount);

        const retrieved = storage.getAccount('acc-negative');
        expect(retrieved?.balance).toBe(-100);
      });
    });

    describe('getAccount', () => {
      it('should return undefined for non-existent account', () => {
        const retrieved = storage.getAccount('non-existent');
        expect(retrieved).toBeUndefined();
      });

      it('should retrieve previously saved account', () => {
        storage.saveAccount(mockAccount);

        const retrieved = storage.getAccount('acc-1');
        expect(retrieved).toEqual(mockAccount);
      });

      it('should handle special characters in account id', () => {
        const specialIdAccount: Account = {
          id: 'acc-with-special-chars_123!@#',
          name: 'Special',
          direction: DIRECTION.DEBIT,
          balance: 100,
          disabled: false,
        };

        storage.saveAccount(specialIdAccount);

        const retrieved = storage.getAccount('acc-with-special-chars_123!@#');
        expect(retrieved).toEqual(specialIdAccount);
      });

      it('should handle empty string as account id', () => {
        const emptyIdAccount: Account = {
          id: '',
          name: 'Empty ID',
          direction: DIRECTION.DEBIT,
          balance: 100,
          disabled: false,
        };

        storage.saveAccount(emptyIdAccount);

        const retrieved = storage.getAccount('');
        expect(retrieved).toEqual(emptyIdAccount);
      });

      it('should not interfere with other accounts', () => {
        const account1: Account = {
          id: 'acc-1',
          name: 'Account 1',
          direction: DIRECTION.DEBIT,
          balance: 100,
          disabled: false,
        };

        const account2: Account = {
          id: 'acc-2',
          name: 'Account 2',
          direction: DIRECTION.CREDIT,
          balance: 200,
          disabled: false,
        };

        storage.saveAccount(account1);
        storage.saveAccount(account2);

        const retrieved1 = storage.getAccount('acc-1');
        const retrieved2 = storage.getAccount('acc-2');

        expect(retrieved1).not.toEqual(retrieved2);
        expect(retrieved1?.id).toBe('acc-1');
        expect(retrieved2?.id).toBe('acc-2');
      });
    });
  });

  describe('Transaction operations', () => {
    const mockTransaction: Transaction = {
      id: 'txn-1',
      name: 'Test Transaction',
      entries: [
        { id: 'entry-1', direction: DIRECTION.DEBIT, amount: 100, account_id: 'acc-1' },
        { id: 'entry-2', direction: DIRECTION.CREDIT, amount: 100, account_id: 'acc-2' },
      ],
    };

    describe('saveTransaction', () => {
      it('should save transaction to storage', () => {
        storage.saveTransaction(mockTransaction);

        const retrieved = storage.getTransaction('txn-1');
        expect(retrieved).toEqual(mockTransaction);
      });

      it('should overwrite existing transaction with same id', () => {
        storage.saveTransaction(mockTransaction);

        const updated = {
          ...mockTransaction,
          name: 'Updated Transaction',
          entries: [
            { id: 'entry-3', direction: DIRECTION.DEBIT, amount: 200, account_id: 'acc-3' },
            { id: 'entry-4', direction: DIRECTION.CREDIT, amount: 200, account_id: 'acc-4' },
          ],
        };
        storage.saveTransaction(updated);

        const retrieved = storage.getTransaction('txn-1');
        expect(retrieved).toEqual(updated);
        expect(retrieved?.name).toBe('Updated Transaction');
        expect(retrieved?.entries).toHaveLength(2);
      });

      it('should save multiple transactions independently', () => {
        const transaction1: Transaction = {
          id: 'txn-1',
          name: 'Transaction 1',
          entries: [
            { id: 'entry-1', direction: DIRECTION.DEBIT, amount: 100, account_id: 'acc-1' },
            { id: 'entry-2', direction: DIRECTION.CREDIT, amount: 100, account_id: 'acc-2' },
          ],
        };

        const transaction2: Transaction = {
          id: 'txn-2',
          name: 'Transaction 2',
          entries: [
            { id: 'entry-3', direction: DIRECTION.DEBIT, amount: 200, account_id: 'acc-3' },
            { id: 'entry-4', direction: DIRECTION.CREDIT, amount: 200, account_id: 'acc-4' },
          ],
        };

        storage.saveTransaction(transaction1);
        storage.saveTransaction(transaction2);

        expect(storage.getTransaction('txn-1')).toEqual(transaction1);
        expect(storage.getTransaction('txn-2')).toEqual(transaction2);
      });

      it('should preserve transaction object references', () => {
        storage.saveTransaction(mockTransaction);

        const retrieved = storage.getTransaction('txn-1');
        expect(retrieved).toBe(mockTransaction);
      });

      it('should handle transactions with optional fields', () => {
        const minimalTransaction: Transaction = {
          id: 'txn-minimal',
          entries: [
            { id: 'entry-1', direction: DIRECTION.DEBIT, amount: 50, account_id: 'acc-1' },
            { id: 'entry-2', direction: DIRECTION.CREDIT, amount: 50, account_id: 'acc-2' },
          ],
        };

        storage.saveTransaction(minimalTransaction);

        const retrieved = storage.getTransaction('txn-minimal');
        expect(retrieved).toEqual(minimalTransaction);
        expect(retrieved?.name).toBeUndefined();
      });

      it('should handle transactions with single entry', () => {
        const singleEntryTransaction: Transaction = {
          id: 'txn-single',
          name: 'Single Entry',
          entries: [{ id: 'entry-1', direction: DIRECTION.DEBIT, amount: 100, account_id: 'acc-1' }],
        };

        storage.saveTransaction(singleEntryTransaction);

        const retrieved = storage.getTransaction('txn-single');
        expect(retrieved?.entries).toHaveLength(1);
      });

      it('should handle transactions with many entries', () => {
        const manyEntriesTransaction: Transaction = {
          id: 'txn-many',
          name: 'Many Entries',
          entries: [
            { id: 'entry-1', direction: DIRECTION.DEBIT, amount: 100, account_id: 'acc-1' },
            { id: 'entry-2', direction: DIRECTION.DEBIT, amount: 50, account_id: 'acc-2' },
            { id: 'entry-3', direction: DIRECTION.DEBIT, amount: 25, account_id: 'acc-3' },
            { id: 'entry-4', direction: DIRECTION.CREDIT, amount: 175, account_id: 'acc-4' },
          ],
        };

        storage.saveTransaction(manyEntriesTransaction);

        const retrieved = storage.getTransaction('txn-many');
        expect(retrieved?.entries).toHaveLength(4);
      });

      it('should handle transactions with zero amounts', () => {
        const zeroAmountTransaction: Transaction = {
          id: 'txn-zero',
          name: 'Zero Amount',
          entries: [
            { id: 'entry-1', direction: DIRECTION.DEBIT, amount: 0, account_id: 'acc-1' },
            { id: 'entry-2', direction: DIRECTION.CREDIT, amount: 0, account_id: 'acc-2' },
          ],
        };

        storage.saveTransaction(zeroAmountTransaction);

        const retrieved = storage.getTransaction('txn-zero');
        expect(retrieved?.entries[0]?.amount).toBe(0);
        expect(retrieved?.entries[1]?.amount).toBe(0);
      });
    });

    describe('getTransaction', () => {
      it('should return undefined for non-existent transaction', () => {
        const retrieved = storage.getTransaction('non-existent');
        expect(retrieved).toBeUndefined();
      });

      it('should retrieve previously saved transaction', () => {
        storage.saveTransaction(mockTransaction);

        const retrieved = storage.getTransaction('txn-1');
        expect(retrieved).toEqual(mockTransaction);
      });

      it('should handle special characters in transaction id', () => {
        const specialIdTransaction: Transaction = {
          id: 'txn-with-special-chars_123!@#',
          name: 'Special',
          entries: [
            { id: 'entry-1', direction: DIRECTION.DEBIT, amount: 100, account_id: 'acc-1' },
            { id: 'entry-2', direction: DIRECTION.CREDIT, amount: 100, account_id: 'acc-2' },
          ],
        };

        storage.saveTransaction(specialIdTransaction);

        const retrieved = storage.getTransaction('txn-with-special-chars_123!@#');
        expect(retrieved).toEqual(specialIdTransaction);
      });

      it('should handle empty string as transaction id', () => {
        const emptyIdTransaction: Transaction = {
          id: '',
          name: 'Empty ID',
          entries: [
            { id: 'entry-1', direction: DIRECTION.DEBIT, amount: 100, account_id: 'acc-1' },
            { id: 'entry-2', direction: DIRECTION.CREDIT, amount: 100, account_id: 'acc-2' },
          ],
        };

        storage.saveTransaction(emptyIdTransaction);

        const retrieved = storage.getTransaction('');
        expect(retrieved).toEqual(emptyIdTransaction);
      });

      it('should not interfere with other transactions', () => {
        const transaction1: Transaction = {
          id: 'txn-1',
          name: 'Transaction 1',
          entries: [
            { id: 'entry-1', direction: DIRECTION.DEBIT, amount: 100, account_id: 'acc-1' },
            { id: 'entry-2', direction: DIRECTION.CREDIT, amount: 100, account_id: 'acc-2' },
          ],
        };

        const transaction2: Transaction = {
          id: 'txn-2',
          name: 'Transaction 2',
          entries: [
            { id: 'entry-3', direction: DIRECTION.DEBIT, amount: 200, account_id: 'acc-3' },
            { id: 'entry-4', direction: DIRECTION.CREDIT, amount: 200, account_id: 'acc-4' },
          ],
        };

        storage.saveTransaction(transaction1);
        storage.saveTransaction(transaction2);

        const retrieved1 = storage.getTransaction('txn-1');
        const retrieved2 = storage.getTransaction('txn-2');

        expect(retrieved1).not.toEqual(retrieved2);
        expect(retrieved1?.id).toBe('txn-1');
        expect(retrieved2?.id).toBe('txn-2');
      });
    });
  });

  describe('Storage isolation', () => {
    it('should keep accounts and transactions separate', () => {
      const account: Account = {
        id: 'same-id',
        name: 'Account',
        direction: DIRECTION.DEBIT,
        balance: 100,
        disabled: false,
      };

      const transaction: Transaction = {
        id: 'same-id',
        name: 'Transaction',
        entries: [
          { id: 'entry-1', direction: DIRECTION.DEBIT, amount: 100, account_id: 'acc-1' },
          { id: 'entry-2', direction: DIRECTION.CREDIT, amount: 100, account_id: 'acc-2' },
        ],
      };

      storage.saveAccount(account);
      storage.saveTransaction(transaction);

      const retrievedAccount = storage.getAccount('same-id');
      const retrievedTransaction = storage.getTransaction('same-id');

      expect(retrievedAccount).toEqual(account);
      expect(retrievedTransaction).toEqual(transaction);
      expect(retrievedAccount).not.toEqual(retrievedTransaction);
    });
  });

  describe('Instance isolation', () => {
    it('should maintain separate state for different instances', () => {
      const storage1 = new Storage();
      const storage2 = new Storage();

      const account: Account = {
        id: 'acc-1',
        name: 'Account',
        direction: DIRECTION.DEBIT,
        balance: 100,
        disabled: false,
      };

      storage1.saveAccount(account);

      expect(storage1.getAccount('acc-1')).toEqual(account);
      expect(storage2.getAccount('acc-1')).toBeUndefined();
    });

    it('should not share transaction data between instances', () => {
      const storage1 = new Storage();
      const storage2 = new Storage();

      const transaction: Transaction = {
        id: 'txn-1',
        name: 'Transaction',
        entries: [
          { id: 'entry-1', direction: DIRECTION.DEBIT, amount: 100, account_id: 'acc-1' },
          { id: 'entry-2', direction: DIRECTION.CREDIT, amount: 100, account_id: 'acc-2' },
        ],
      };

      storage1.saveTransaction(transaction);

      expect(storage1.getTransaction('txn-1')).toEqual(transaction);
      expect(storage2.getTransaction('txn-1')).toBeUndefined();
    });
  });
});
