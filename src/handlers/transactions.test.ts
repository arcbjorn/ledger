import { describe, it, expect, vi, beforeEach } from 'vitest';
import http from 'node:http';
import { handleCreateTransaction } from './transactions';
import { HTTP_STATUS, ERROR_MESSAGES, DIRECTION } from '@constants';
import * as ledger from '@services/ledger';

// Mock the ledger module
vi.mock('@services/ledger', () => ({
  createTransaction: vi.fn(),
}));

describe('transactions handler', () => {
  let mockReq: http.IncomingMessage;
  let mockRes: http.ServerResponse;
  let writeHeadSpy: ReturnType<typeof vi.fn>;
  let endSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create mock request
    mockReq = new http.IncomingMessage(null as any);

    // Create mock response
    mockRes = new http.ServerResponse(mockReq);
    writeHeadSpy = vi.fn();
    endSpy = vi.fn();
    mockRes.writeHead = writeHeadSpy;
    mockRes.end = endSpy;
  });

  describe('handleCreateTransaction', () => {
    describe('request body parsing', () => {
      it('should parse valid JSON body', async () => {
        const requestBody = {
          name: 'Test Transaction',
          entries: [
            { direction: DIRECTION.DEBIT, account_id: 'acc-1', amount: 100 },
            { direction: DIRECTION.CREDIT, account_id: 'acc-2', amount: 100 },
          ],
        };

        vi.mocked(ledger.createTransaction).mockReturnValue({
          success: true,
          transaction: {
            id: 'txn-1',
            name: 'Test Transaction',
            entries: [
              { id: 'entry-1', direction: DIRECTION.DEBIT, account_id: 'acc-1', amount: 100 },
              { id: 'entry-2', direction: DIRECTION.CREDIT, account_id: 'acc-2', amount: 100 },
            ],
          },
        });

        const promise = handleCreateTransaction(mockReq, mockRes);

        mockReq.emit('data', JSON.stringify(requestBody));
        mockReq.emit('end');

        await promise;

        expect(ledger.createTransaction).toHaveBeenCalledWith(requestBody);
        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.CREATED, {
          'Content-Type': 'application/json',
        });
      });

      it('should handle invalid JSON', async () => {
        const promise = handleCreateTransaction(mockReq, mockRes);

        mockReq.emit('data', 'invalid json{');
        mockReq.emit('end');

        await promise;

        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST, {
          'Content-Type': 'application/json',
        });
        expect(endSpy).toHaveBeenCalledWith(
          JSON.stringify({ error: ERROR_MESSAGES.BAD_REQUEST })
        );
      });

      it('should handle stream error', async () => {
        const promise = handleCreateTransaction(mockReq, mockRes);

        mockReq.emit('error', new Error('Stream error'));

        await promise;

        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST, {
          'Content-Type': 'application/json',
        });
        expect(endSpy).toHaveBeenCalledWith(
          JSON.stringify({ error: ERROR_MESSAGES.BAD_REQUEST })
        );
      });

      it('should handle chunked data', async () => {
        const requestBody = {
          entries: [
            { direction: DIRECTION.DEBIT, account_id: 'acc-1', amount: 100 },
            { direction: DIRECTION.CREDIT, account_id: 'acc-2', amount: 100 },
          ],
        };

        vi.mocked(ledger.createTransaction).mockReturnValue({
          success: true,
          transaction: {
            id: 'txn-1',
            entries: [
              { id: 'entry-1', direction: DIRECTION.DEBIT, account_id: 'acc-1', amount: 100 },
              { id: 'entry-2', direction: DIRECTION.CREDIT, account_id: 'acc-2', amount: 100 },
            ],
          },
        });

        const promise = handleCreateTransaction(mockReq, mockRes);

        const jsonString = JSON.stringify(requestBody);
        const midpoint = Math.floor(jsonString.length / 2);

        mockReq.emit('data', jsonString.substring(0, midpoint));
        mockReq.emit('data', jsonString.substring(midpoint));
        mockReq.emit('end');

        await promise;

        expect(ledger.createTransaction).toHaveBeenCalledWith(requestBody);
        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.CREATED, {
          'Content-Type': 'application/json',
        });
      });

      it('should handle empty body', async () => {
        const promise = handleCreateTransaction(mockReq, mockRes);

        mockReq.emit('data', '{}');
        mockReq.emit('end');

        await promise;

        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST, {
          'Content-Type': 'application/json',
        });
        expect(endSpy).toHaveBeenCalledWith(
          JSON.stringify({ error: ERROR_MESSAGES.INVALID_ENTRIES })
        );
      });
    });

    describe('entries validation', () => {
      it('should reject missing entries field', async () => {
        const promise = handleCreateTransaction(mockReq, mockRes);

        mockReq.emit('data', JSON.stringify({ name: 'Test' }));
        mockReq.emit('end');

        await promise;

        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST, {
          'Content-Type': 'application/json',
        });
        expect(endSpy).toHaveBeenCalledWith(
          JSON.stringify({ error: ERROR_MESSAGES.INVALID_ENTRIES })
        );
      });

      it('should reject entries that is not an array', async () => {
        const promise = handleCreateTransaction(mockReq, mockRes);

        mockReq.emit('data', JSON.stringify({ entries: 'not-an-array' }));
        mockReq.emit('end');

        await promise;

        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST, {
          'Content-Type': 'application/json',
        });
        expect(endSpy).toHaveBeenCalledWith(
          JSON.stringify({ error: ERROR_MESSAGES.INVALID_ENTRIES })
        );
      });

      it('should reject empty entries array', async () => {
        const promise = handleCreateTransaction(mockReq, mockRes);

        mockReq.emit('data', JSON.stringify({ entries: [] }));
        mockReq.emit('end');

        await promise;

        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST, {
          'Content-Type': 'application/json',
        });
        expect(endSpy).toHaveBeenCalledWith(
          JSON.stringify({ error: ERROR_MESSAGES.INVALID_ENTRIES })
        );
      });

      it('should accept valid entries array', async () => {
        const requestBody = {
          entries: [
            { direction: DIRECTION.DEBIT, account_id: 'acc-1', amount: 100 },
            { direction: DIRECTION.CREDIT, account_id: 'acc-2', amount: 100 },
          ],
        };

        vi.mocked(ledger.createTransaction).mockReturnValue({
          success: true,
          transaction: {
            id: 'txn-1',
            entries: [
              { id: 'entry-1', direction: DIRECTION.DEBIT, account_id: 'acc-1', amount: 100 },
              { id: 'entry-2', direction: DIRECTION.CREDIT, account_id: 'acc-2', amount: 100 },
            ],
          },
        });

        const promise = handleCreateTransaction(mockReq, mockRes);

        mockReq.emit('data', JSON.stringify(requestBody));
        mockReq.emit('end');

        await promise;

        expect(ledger.createTransaction).toHaveBeenCalledWith(requestBody);
        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.CREATED, {
          'Content-Type': 'application/json',
        });
      });
    });

    describe('createTransaction integration', () => {
      it('should return 201 on successful transaction creation', async () => {
        const requestBody = {
          name: 'Success Transaction',
          entries: [
            { direction: DIRECTION.DEBIT, account_id: 'acc-1', amount: 100 },
            { direction: DIRECTION.CREDIT, account_id: 'acc-2', amount: 100 },
          ],
        };

        const createdTransaction = {
          id: 'txn-success',
          name: 'Success Transaction',
          entries: [
            { id: 'entry-1', direction: DIRECTION.DEBIT, account_id: 'acc-1', amount: 100 },
            { id: 'entry-2', direction: DIRECTION.CREDIT, account_id: 'acc-2', amount: 100 },
          ],
        };

        vi.mocked(ledger.createTransaction).mockReturnValue({
          success: true,
          transaction: createdTransaction,
        });

        const promise = handleCreateTransaction(mockReq, mockRes);

        mockReq.emit('data', JSON.stringify(requestBody));
        mockReq.emit('end');

        await promise;

        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.CREATED, {
          'Content-Type': 'application/json',
        });
        expect(endSpy).toHaveBeenCalledWith(JSON.stringify(createdTransaction));
      });

      it('should return 400 when createTransaction fails', async () => {
        const requestBody = {
          entries: [
            { direction: DIRECTION.DEBIT, account_id: 'acc-1', amount: 100 },
            { direction: DIRECTION.CREDIT, account_id: 'acc-2', amount: 50 },
          ],
        };

        vi.mocked(ledger.createTransaction).mockReturnValue({
          success: false,
          error: 'Transaction not balanced: debits=100, credits=50',
        });

        const promise = handleCreateTransaction(mockReq, mockRes);

        mockReq.emit('data', JSON.stringify(requestBody));
        mockReq.emit('end');

        await promise;

        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST, {
          'Content-Type': 'application/json',
        });
        expect(endSpy).toHaveBeenCalledWith(
          JSON.stringify({ error: 'Transaction not balanced: debits=100, credits=50' })
        );
      });

      it('should handle account not found error', async () => {
        const requestBody = {
          entries: [
            { direction: DIRECTION.DEBIT, account_id: 'non-existent', amount: 100 },
            { direction: DIRECTION.CREDIT, account_id: 'acc-2', amount: 100 },
          ],
        };

        vi.mocked(ledger.createTransaction).mockReturnValue({
          success: false,
          error: 'Account not found: non-existent',
        });

        const promise = handleCreateTransaction(mockReq, mockRes);

        mockReq.emit('data', JSON.stringify(requestBody));
        mockReq.emit('end');

        await promise;

        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST, {
          'Content-Type': 'application/json',
        });
        expect(endSpy).toHaveBeenCalledWith(
          JSON.stringify({ error: 'Account not found: non-existent' })
        );
      });

      it('should handle disabled account error', async () => {
        const requestBody = {
          entries: [
            { direction: DIRECTION.DEBIT, account_id: 'disabled-acc', amount: 100 },
            { direction: DIRECTION.CREDIT, account_id: 'acc-2', amount: 100 },
          ],
        };

        vi.mocked(ledger.createTransaction).mockReturnValue({
          success: false,
          error: 'Account is disabled: disabled-acc',
        });

        const promise = handleCreateTransaction(mockReq, mockRes);

        mockReq.emit('data', JSON.stringify(requestBody));
        mockReq.emit('end');

        await promise;

        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST, {
          'Content-Type': 'application/json',
        });
        expect(endSpy).toHaveBeenCalledWith(
          JSON.stringify({ error: 'Account is disabled: disabled-acc' })
        );
      });
    });

    describe('optional fields', () => {
      it('should handle transaction with id', async () => {
        const requestBody = {
          id: 'custom-txn-id',
          name: 'Custom ID Transaction',
          entries: [
            { direction: DIRECTION.DEBIT, account_id: 'acc-1', amount: 100 },
            { direction: DIRECTION.CREDIT, account_id: 'acc-2', amount: 100 },
          ],
        };

        vi.mocked(ledger.createTransaction).mockReturnValue({
          success: true,
          transaction: {
            id: 'custom-txn-id',
            name: 'Custom ID Transaction',
            entries: [
              { id: 'entry-1', direction: DIRECTION.DEBIT, account_id: 'acc-1', amount: 100 },
              { id: 'entry-2', direction: DIRECTION.CREDIT, account_id: 'acc-2', amount: 100 },
            ],
          },
        });

        const promise = handleCreateTransaction(mockReq, mockRes);

        mockReq.emit('data', JSON.stringify(requestBody));
        mockReq.emit('end');

        await promise;

        expect(ledger.createTransaction).toHaveBeenCalledWith(requestBody);
        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.CREATED, {
          'Content-Type': 'application/json',
        });
      });

      it('should handle transaction without name', async () => {
        const requestBody = {
          entries: [
            { direction: DIRECTION.DEBIT, account_id: 'acc-1', amount: 100 },
            { direction: DIRECTION.CREDIT, account_id: 'acc-2', amount: 100 },
          ],
        };

        vi.mocked(ledger.createTransaction).mockReturnValue({
          success: true,
          transaction: {
            id: 'txn-1',
            entries: [
              { id: 'entry-1', direction: DIRECTION.DEBIT, account_id: 'acc-1', amount: 100 },
              { id: 'entry-2', direction: DIRECTION.CREDIT, account_id: 'acc-2', amount: 100 },
            ],
          },
        });

        const promise = handleCreateTransaction(mockReq, mockRes);

        mockReq.emit('data', JSON.stringify(requestBody));
        mockReq.emit('end');

        await promise;

        expect(ledger.createTransaction).toHaveBeenCalledWith(requestBody);
        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.CREATED, {
          'Content-Type': 'application/json',
        });
      });
    });

    describe('edge cases', () => {
      it('should handle single entry transaction', async () => {
        const requestBody = {
          entries: [{ direction: DIRECTION.DEBIT, account_id: 'acc-1', amount: 100 }],
        };

        vi.mocked(ledger.createTransaction).mockReturnValue({
          success: true,
          transaction: {
            id: 'txn-1',
            entries: [
              { id: 'entry-1', direction: DIRECTION.DEBIT, account_id: 'acc-1', amount: 100 },
            ],
          },
        });

        const promise = handleCreateTransaction(mockReq, mockRes);

        mockReq.emit('data', JSON.stringify(requestBody));
        mockReq.emit('end');

        await promise;

        expect(ledger.createTransaction).toHaveBeenCalledWith(requestBody);
        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.CREATED, {
          'Content-Type': 'application/json',
        });
      });

      it('should handle multiple entries', async () => {
        const requestBody = {
          entries: [
            { direction: DIRECTION.DEBIT, account_id: 'acc-1', amount: 100 },
            { direction: DIRECTION.DEBIT, account_id: 'acc-2', amount: 50 },
            { direction: DIRECTION.CREDIT, account_id: 'acc-3', amount: 150 },
          ],
        };

        vi.mocked(ledger.createTransaction).mockReturnValue({
          success: true,
          transaction: {
            id: 'txn-1',
            entries: [
              { id: 'entry-1', direction: DIRECTION.DEBIT, account_id: 'acc-1', amount: 100 },
              { id: 'entry-2', direction: DIRECTION.DEBIT, account_id: 'acc-2', amount: 50 },
              { id: 'entry-3', direction: DIRECTION.CREDIT, account_id: 'acc-3', amount: 150 },
            ],
          },
        });

        const promise = handleCreateTransaction(mockReq, mockRes);

        mockReq.emit('data', JSON.stringify(requestBody));
        mockReq.emit('end');

        await promise;

        expect(ledger.createTransaction).toHaveBeenCalledWith(requestBody);
        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.CREATED, {
          'Content-Type': 'application/json',
        });
      });

      it('should handle null entries', async () => {
        const promise = handleCreateTransaction(mockReq, mockRes);

        mockReq.emit('data', JSON.stringify({ entries: null }));
        mockReq.emit('end');

        await promise;

        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST, {
          'Content-Type': 'application/json',
        });
        expect(endSpy).toHaveBeenCalledWith(
          JSON.stringify({ error: ERROR_MESSAGES.INVALID_ENTRIES })
        );
      });

      it('should handle undefined entries', async () => {
        const promise = handleCreateTransaction(mockReq, mockRes);

        mockReq.emit('data', JSON.stringify({ entries: undefined }));
        mockReq.emit('end');

        await promise;

        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST, {
          'Content-Type': 'application/json',
        });
        expect(endSpy).toHaveBeenCalledWith(
          JSON.stringify({ error: ERROR_MESSAGES.INVALID_ENTRIES })
        );
      });
    });
  });
});
