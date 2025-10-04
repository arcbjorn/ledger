/**
 * Simple mutex lock implementation for account-level concurrency control
 */
class AccountLock {
  private locks: Map<string, Promise<void>> = new Map();

  /**
   * Execute a function with exclusive lock on an account
   */
  async withLock<T>(accountId: string, fn: () => Promise<T>): Promise<T> {
    // Wait for existing lock if present
    while (this.locks.has(accountId)) {
      await this.locks.get(accountId);
    }

    // Acquire lock
    let releaseLock: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    this.locks.set(accountId, lockPromise);

    try {
      return await fn();
    } finally {
      this.locks.delete(accountId);
      releaseLock!();
    }
  }

  /**
   * Execute a function with locks on multiple accounts
   * Locks are acquired in sorted order to prevent deadlocks
   */
  async withLocks<T>(
    accountIds: string[],
    fn: () => Promise<T>
  ): Promise<T> {
    // Sort account IDs to prevent deadlocks
    const sortedIds = [...accountIds].sort();

    // Acquire locks sequentially in sorted order
    const acquireLocks = async (
      ids: string[],
      index: number = 0
    ): Promise<T> => {
      if (index >= ids.length) {
        return await fn();
      }

      return await this.withLock(ids[index]!, async () => {
        return await acquireLocks(ids, index + 1);
      });
    };

    return await acquireLocks(sortedIds);
  }
}

export const accountLock = new AccountLock();
