import { describe, it, expect, beforeEach } from 'vitest';
import { createAccount, getAccount, disableAccount, createTransaction } from './ledger';
import { storage } from './storage';
import { DIRECTION } from '@constants';

beforeEach(() => {
  // Clear storage before each test
  storage['accounts'].clear();
  storage['transactions'].clear();
});

describe('createAccount', () => {
  it('should create account with generated id', () => {
    const account = createAccount({
      name: 'Cash',
      direction: DIRECTION.DEBIT,
      balance: 100,
    });

    expect(account).toMatchObject({
      name: 'Cash',
      direction: DIRECTION.DEBIT,
      balance: 100,
      disabled: false,
    });
    expect(account.id).toBeDefined();
    expect(typeof account.id).toBe('string');
  });

  it('should create account with provided id', () => {
    const account = createAccount({
      id: 'custom-id',
      name: 'Bank',
      direction: DIRECTION.CREDIT,
      balance: 500,
    });

    expect(account.id).toBe('custom-id');
    expect(account.name).toBe('Bank');
    expect(account.direction).toBe(DIRECTION.CREDIT);
    expect(account.balance).toBe(500);
  });

  it('should create account with default balance of 0', () => {
    const account = createAccount({
      name: 'Assets',
      direction: DIRECTION.DEBIT,
    });

    expect(account.balance).toBe(0);
  });

  it('should create account without name', () => {
    const account = createAccount({
      direction: DIRECTION.CREDIT,
    });

    expect(account.name).toBeUndefined();
    expect(account.direction).toBe(DIRECTION.CREDIT);
  });
});

describe('getAccount', () => {
  it('should retrieve existing account', () => {
    const created = createAccount({
      id: 'test-account',
      name: 'Test',
      direction: DIRECTION.DEBIT,
    });

    const retrieved = getAccount('test-account');

    expect(retrieved).toEqual(created);
  });

  it('should return undefined for non-existent account', () => {
    const account = getAccount('non-existent');

    expect(account).toBeUndefined();
  });

  it('should return undefined for disabled account', () => {
    createAccount({
      id: 'disabled-account',
      direction: DIRECTION.DEBIT,
    });

    disableAccount('disabled-account');

    const account = getAccount('disabled-account');

    expect(account).toBeUndefined();
  });
});

describe('disableAccount', () => {
  it('should disable existing account', () => {
    createAccount({
      id: 'account-to-disable',
      direction: DIRECTION.DEBIT,
    });

    const result = disableAccount('account-to-disable');

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return error for non-existent account', () => {
    const result = disableAccount('non-existent');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Account not found');
  });

  it('should return error for already disabled account', () => {
    createAccount({
      id: 'already-disabled',
      direction: DIRECTION.DEBIT,
    });

    disableAccount('already-disabled');
    const result = disableAccount('already-disabled');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Account already disabled');
  });
});

describe('createTransaction', () => {
  beforeEach(() => {
    // Create test accounts
    createAccount({
      id: 'debit-account',
      direction: DIRECTION.DEBIT,
      balance: 100,
    });

    createAccount({
      id: 'credit-account',
      direction: DIRECTION.CREDIT,
      balance: 50,
    });
  });

  it('should create transaction with generated id', () => {
    const result = createTransaction({
      name: 'Test Transaction',
      entries: [
        { direction: DIRECTION.DEBIT, account_id: 'debit-account', amount: 100 },
        { direction: DIRECTION.CREDIT, account_id: 'credit-account', amount: 100 },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.transaction).toBeDefined();
    expect(result.transaction!.id).toBeDefined();
    expect(typeof result.transaction!.id).toBe('string');
    expect(result.transaction!.name).toBe('Test Transaction');
    expect(result.transaction!.entries).toHaveLength(2);
  });

  it('should create transaction with provided id', () => {
    const result = createTransaction({
      id: 'custom-transaction-id',
      name: 'Custom ID Transaction',
      entries: [
        { direction: DIRECTION.DEBIT, account_id: 'debit-account', amount: 50 },
        { direction: DIRECTION.CREDIT, account_id: 'credit-account', amount: 50 },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.transaction!.id).toBe('custom-transaction-id');
  });

  it('should generate unique ids for entries', () => {
    const result = createTransaction({
      entries: [
        { direction: DIRECTION.DEBIT, account_id: 'debit-account', amount: 25 },
        { direction: DIRECTION.CREDIT, account_id: 'credit-account', amount: 25 },
      ],
    });

    expect(result.success).toBe(true);
    const ids = result.transaction!.entries.map((e) => e.id);
    expect(ids[0]).toBeDefined();
    expect(ids[1]).toBeDefined();
    expect(ids[0]).not.toBe(ids[1]);
  });

  it('should reject unbalanced transaction', () => {
    const result = createTransaction({
      entries: [
        { direction: DIRECTION.DEBIT, account_id: 'debit-account', amount: 100 },
        { direction: DIRECTION.CREDIT, account_id: 'credit-account', amount: 50 },
      ],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Transaction not balanced');
    expect(result.error).toContain('debits=100');
    expect(result.error).toContain('credits=50');
  });

  it('should reject transaction with non-existent account', () => {
    const result = createTransaction({
      entries: [
        { direction: DIRECTION.DEBIT, account_id: 'non-existent', amount: 100 },
        { direction: DIRECTION.CREDIT, account_id: 'credit-account', amount: 100 },
      ],
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Account not found: non-existent');
  });

  it('should reject transaction with disabled account', () => {
    disableAccount('debit-account');

    const result = createTransaction({
      entries: [
        { direction: DIRECTION.DEBIT, account_id: 'debit-account', amount: 100 },
        { direction: DIRECTION.CREDIT, account_id: 'credit-account', amount: 100 },
      ],
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Account is disabled: debit-account');
  });

  describe('balance calculations', () => {
    it('should increase debit account with debit entry', () => {
      createTransaction({
        entries: [
          { direction: DIRECTION.DEBIT, account_id: 'debit-account', amount: 50 },
          { direction: DIRECTION.CREDIT, account_id: 'credit-account', amount: 50 },
        ],
      });

      const account = storage.getAccount('debit-account');
      expect(account!.balance).toBe(150); // 100 + 50
    });

    it('should decrease debit account with credit entry', () => {
      createTransaction({
        entries: [
          { direction: DIRECTION.CREDIT, account_id: 'debit-account', amount: 30 },
          { direction: DIRECTION.DEBIT, account_id: 'credit-account', amount: 30 },
        ],
      });

      const account = storage.getAccount('debit-account');
      expect(account!.balance).toBe(70); // 100 - 30
    });

    it('should increase credit account with credit entry', () => {
      createTransaction({
        entries: [
          { direction: DIRECTION.DEBIT, account_id: 'debit-account', amount: 25 },
          { direction: DIRECTION.CREDIT, account_id: 'credit-account', amount: 25 },
        ],
      });

      const account = storage.getAccount('credit-account');
      expect(account!.balance).toBe(75); // 50 + 25
    });

    it('should decrease credit account with debit entry', () => {
      createTransaction({
        entries: [
          { direction: DIRECTION.CREDIT, account_id: 'debit-account', amount: 20 },
          { direction: DIRECTION.DEBIT, account_id: 'credit-account', amount: 20 },
        ],
      });

      const account = storage.getAccount('credit-account');
      expect(account!.balance).toBe(30); // 50 - 20
    });

    it('should handle multiple entries on same account', () => {
      const result = createTransaction({
        entries: [
          { direction: DIRECTION.DEBIT, account_id: 'debit-account', amount: 60 },
          { direction: DIRECTION.CREDIT, account_id: 'debit-account', amount: 40 },
          { direction: DIRECTION.CREDIT, account_id: 'credit-account', amount: 20 },
        ],
      });

      expect(result.success).toBe(true);
      const account = storage.getAccount('debit-account');
      // 100 + 60 - 40 = 120
      expect(account!.balance).toBe(120);
    });

    it('should handle complex multi-entry transaction', () => {
      createAccount({
        id: 'account-3',
        direction: DIRECTION.DEBIT,
        balance: 200,
      });

      createTransaction({
        entries: [
          { direction: DIRECTION.DEBIT, account_id: 'debit-account', amount: 100 },
          { direction: DIRECTION.DEBIT, account_id: 'account-3', amount: 50 },
          { direction: DIRECTION.CREDIT, account_id: 'credit-account', amount: 150 },
        ],
      });

      expect(storage.getAccount('debit-account')!.balance).toBe(200); // 100 + 100
      expect(storage.getAccount('account-3')!.balance).toBe(250); // 200 + 50
      expect(storage.getAccount('credit-account')!.balance).toBe(200); // 50 + 150
    });
  });

  it('should allow transaction with zero amounts', () => {
    const result = createTransaction({
      entries: [
        { direction: DIRECTION.DEBIT, account_id: 'debit-account', amount: 0 },
        { direction: DIRECTION.CREDIT, account_id: 'credit-account', amount: 0 },
      ],
    });

    expect(result.success).toBe(true);
    expect(storage.getAccount('debit-account')!.balance).toBe(100);
    expect(storage.getAccount('credit-account')!.balance).toBe(50);
  });

  it('should store transaction in storage', () => {
    const result = createTransaction({
      id: 'stored-transaction',
      entries: [
        { direction: DIRECTION.DEBIT, account_id: 'debit-account', amount: 10 },
        { direction: DIRECTION.CREDIT, account_id: 'credit-account', amount: 10 },
      ],
    });

    const stored = storage.getTransaction('stored-transaction');
    expect(stored).toEqual(result.transaction);
  });
});
