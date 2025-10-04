# Future Enhancements

## Concurrency Control

### The Problem: Race Conditions

When multiple transactions attempt to modify the same account simultaneously, race conditions can occur:

1. Transaction A reads balance: $100
2. Transaction B reads balance: $100 (at the same time)
3. Transaction A writes: $100 + $50 = $150
4. Transaction B writes: $100 - $30 = $70
5. **Result: $70** (should be $120)

### Solution Options

#### 1. Mutex/Lock (Simplest approach)
- Lock individual accounts during updates
- Other transactions wait for lock release
- Simple implementation with in-memory Map of locks per account
- Allows concurrent transactions on different accounts

#### 2. Transaction Queue
- All transactions processed through a single queue
- Guaranteed sequential processing

#### 3. Optimistic Locking
- Track version number on each account
- Detect conflicts and retry on version mismatch
- For distributed systems

### Current Implementation

The current implementation does **not** handle concurrency because:
- Node.js is single-threaded by default (event loop)
- In-memory storage implies single-process

### Implementation Example (if needed)

Simple mutex approach:

```typescript
const accountLocks = new Map<string, Promise<void>>();

async function withLock<T>(accountId: string, fn: () => T): Promise<T> {
  // Wait for existing lock if present
  while (accountLocks.has(accountId)) {
    await accountLocks.get(accountId);
  }

  // Acquire lock
  let releaseLock: () => void;
  const lockPromise = new Promise<void>(resolve => {
    releaseLock = resolve;
  });
  accountLocks.set(accountId, lockPromise);

  try {
    return fn();
  } finally {
    accountLocks.delete(accountId);
    releaseLock!();
  }
}

// Usage in transaction application
await withLock(accountId, () => {
  // Update account balance
});
```

### When to Implement

- Adding async/await operations in transaction processing (database queries)
