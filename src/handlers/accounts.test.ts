import { describe, it, expect, vi, beforeEach } from 'vitest';
import http from 'node:http';
import { handleCreateAccount, handleGetAccount, handleDeleteAccount } from './accounts';
import { HTTP_STATUS, ERROR_MESSAGES, DIRECTION } from '@constants';
import * as ledger from '@services/ledger';

// Mock the ledger module
vi.mock('@services/ledger', () => ({
  createAccount: vi.fn(),
  getAccount: vi.fn(),
  disableAccount: vi.fn(),
}));

describe('accounts handler', () => {
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

  describe('handleCreateAccount', () => {
    describe('request body parsing', () => {
      it('should parse valid JSON body', async () => {
        const requestBody = {
          name: 'Cash Account',
          direction: DIRECTION.DEBIT,
          balance: 1000,
        };

        vi.mocked(ledger.createAccount).mockReturnValue({
          id: 'acc-1',
          name: 'Cash Account',
          direction: DIRECTION.DEBIT,
          balance: 1000,
          disabled: false,
        });

        const promise = handleCreateAccount(mockReq, mockRes);

        mockReq.emit('data', JSON.stringify(requestBody));
        mockReq.emit('end');

        await promise;

        expect(ledger.createAccount).toHaveBeenCalledWith(requestBody);
        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.CREATED, {
          'Content-Type': 'application/json',
        });
      });

      it('should handle invalid JSON', async () => {
        const promise = handleCreateAccount(mockReq, mockRes);

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
        const promise = handleCreateAccount(mockReq, mockRes);

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
          name: 'Bank Account',
          direction: DIRECTION.CREDIT,
          balance: 5000,
        };

        vi.mocked(ledger.createAccount).mockReturnValue({
          id: 'acc-2',
          name: 'Bank Account',
          direction: DIRECTION.CREDIT,
          balance: 5000,
          disabled: false,
        });

        const promise = handleCreateAccount(mockReq, mockRes);

        const jsonString = JSON.stringify(requestBody);
        const midpoint = Math.floor(jsonString.length / 2);

        mockReq.emit('data', jsonString.substring(0, midpoint));
        mockReq.emit('data', jsonString.substring(midpoint));
        mockReq.emit('end');

        await promise;

        expect(ledger.createAccount).toHaveBeenCalledWith(requestBody);
        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.CREATED, {
          'Content-Type': 'application/json',
        });
      });
    });

    describe('direction validation', () => {
      it('should reject missing direction', async () => {
        const promise = handleCreateAccount(mockReq, mockRes);

        mockReq.emit('data', JSON.stringify({ name: 'Test' }));
        mockReq.emit('end');

        await promise;

        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST, {
          'Content-Type': 'application/json',
        });
        expect(endSpy).toHaveBeenCalledWith(
          JSON.stringify({ error: ERROR_MESSAGES.INVALID_DIRECTION })
        );
      });

      it('should reject invalid direction value', async () => {
        const promise = handleCreateAccount(mockReq, mockRes);

        mockReq.emit('data', JSON.stringify({ direction: 'invalid' }));
        mockReq.emit('end');

        await promise;

        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST, {
          'Content-Type': 'application/json',
        });
        expect(endSpy).toHaveBeenCalledWith(
          JSON.stringify({ error: ERROR_MESSAGES.INVALID_DIRECTION })
        );
      });

      it('should accept debit direction', async () => {
        const requestBody = {
          name: 'Debit Account',
          direction: DIRECTION.DEBIT,
        };

        vi.mocked(ledger.createAccount).mockReturnValue({
          id: 'acc-3',
          name: 'Debit Account',
          direction: DIRECTION.DEBIT,
          balance: 0,
          disabled: false,
        });

        const promise = handleCreateAccount(mockReq, mockRes);

        mockReq.emit('data', JSON.stringify(requestBody));
        mockReq.emit('end');

        await promise;

        expect(ledger.createAccount).toHaveBeenCalledWith(requestBody);
        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.CREATED, {
          'Content-Type': 'application/json',
        });
      });

      it('should accept credit direction', async () => {
        const requestBody = {
          name: 'Credit Account',
          direction: DIRECTION.CREDIT,
        };

        vi.mocked(ledger.createAccount).mockReturnValue({
          id: 'acc-4',
          name: 'Credit Account',
          direction: DIRECTION.CREDIT,
          balance: 0,
          disabled: false,
        });

        const promise = handleCreateAccount(mockReq, mockRes);

        mockReq.emit('data', JSON.stringify(requestBody));
        mockReq.emit('end');

        await promise;

        expect(ledger.createAccount).toHaveBeenCalledWith(requestBody);
        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.CREATED, {
          'Content-Type': 'application/json',
        });
      });
    });

    describe('account creation', () => {
      it('should create account with all fields', async () => {
        const requestBody = {
          id: 'custom-id',
          name: 'Custom Account',
          direction: DIRECTION.DEBIT,
          balance: 2500,
        };

        const createdAccount = {
          id: 'custom-id',
          name: 'Custom Account',
          direction: DIRECTION.DEBIT,
          balance: 2500,
          disabled: false,
        };

        vi.mocked(ledger.createAccount).mockReturnValue(createdAccount);

        const promise = handleCreateAccount(mockReq, mockRes);

        mockReq.emit('data', JSON.stringify(requestBody));
        mockReq.emit('end');

        await promise;

        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.CREATED, {
          'Content-Type': 'application/json',
        });
        expect(endSpy).toHaveBeenCalledWith(JSON.stringify(createdAccount));
      });

      it('should create account without name', async () => {
        const requestBody = {
          direction: DIRECTION.DEBIT,
          balance: 100,
        };

        vi.mocked(ledger.createAccount).mockReturnValue({
          id: 'acc-5',
          direction: DIRECTION.DEBIT,
          balance: 100,
          disabled: false,
        });

        const promise = handleCreateAccount(mockReq, mockRes);

        mockReq.emit('data', JSON.stringify(requestBody));
        mockReq.emit('end');

        await promise;

        expect(ledger.createAccount).toHaveBeenCalledWith(requestBody);
        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.CREATED, {
          'Content-Type': 'application/json',
        });
      });

      it('should create account without balance', async () => {
        const requestBody = {
          name: 'Zero Balance',
          direction: DIRECTION.CREDIT,
        };

        vi.mocked(ledger.createAccount).mockReturnValue({
          id: 'acc-6',
          name: 'Zero Balance',
          direction: DIRECTION.CREDIT,
          balance: 0,
          disabled: false,
        });

        const promise = handleCreateAccount(mockReq, mockRes);

        mockReq.emit('data', JSON.stringify(requestBody));
        mockReq.emit('end');

        await promise;

        expect(ledger.createAccount).toHaveBeenCalledWith(requestBody);
        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.CREATED, {
          'Content-Type': 'application/json',
        });
      });

      it('should create account with zero balance', async () => {
        const requestBody = {
          name: 'Explicit Zero',
          direction: DIRECTION.DEBIT,
          balance: 0,
        };

        vi.mocked(ledger.createAccount).mockReturnValue({
          id: 'acc-7',
          name: 'Explicit Zero',
          direction: DIRECTION.DEBIT,
          balance: 0,
          disabled: false,
        });

        const promise = handleCreateAccount(mockReq, mockRes);

        mockReq.emit('data', JSON.stringify(requestBody));
        mockReq.emit('end');

        await promise;

        expect(ledger.createAccount).toHaveBeenCalledWith(requestBody);
        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.CREATED, {
          'Content-Type': 'application/json',
        });
      });

      it('should create account with negative balance', async () => {
        const requestBody = {
          name: 'Negative Balance',
          direction: DIRECTION.CREDIT,
          balance: -500,
        };

        vi.mocked(ledger.createAccount).mockReturnValue({
          id: 'acc-8',
          name: 'Negative Balance',
          direction: DIRECTION.CREDIT,
          balance: -500,
          disabled: false,
        });

        const promise = handleCreateAccount(mockReq, mockRes);

        mockReq.emit('data', JSON.stringify(requestBody));
        mockReq.emit('end');

        await promise;

        expect(ledger.createAccount).toHaveBeenCalledWith(requestBody);
        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.CREATED, {
          'Content-Type': 'application/json',
        });
      });
    });
  });

  describe('handleGetAccount', () => {
    describe('parameter validation', () => {
      it('should reject missing account id', async () => {
        await handleGetAccount(mockReq, mockRes, {});

        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST, {
          'Content-Type': 'application/json',
        });
        expect(endSpy).toHaveBeenCalledWith(
          JSON.stringify({ error: ERROR_MESSAGES.ACCOUNT_ID_REQUIRED })
        );
      });

      it('should reject empty account id', async () => {
        await handleGetAccount(mockReq, mockRes, { id: '' });

        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST, {
          'Content-Type': 'application/json',
        });
        expect(endSpy).toHaveBeenCalledWith(
          JSON.stringify({ error: ERROR_MESSAGES.ACCOUNT_ID_REQUIRED })
        );
      });
    });

    describe('account retrieval', () => {
      it('should return account when found', async () => {
        const account = {
          id: 'acc-1',
          name: 'Test Account',
          direction: DIRECTION.DEBIT,
          balance: 1000,
          disabled: false,
        };

        vi.mocked(ledger.getAccount).mockReturnValue(account);

        await handleGetAccount(mockReq, mockRes, { id: 'acc-1' });

        expect(ledger.getAccount).toHaveBeenCalledWith('acc-1');
        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.OK, {
          'Content-Type': 'application/json',
        });
        expect(endSpy).toHaveBeenCalledWith(JSON.stringify(account));
      });

      it('should return 404 when account not found', async () => {
        vi.mocked(ledger.getAccount).mockReturnValue(undefined);

        await handleGetAccount(mockReq, mockRes, { id: 'non-existent' });

        expect(ledger.getAccount).toHaveBeenCalledWith('non-existent');
        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND, {
          'Content-Type': 'application/json',
        });
        expect(endSpy).toHaveBeenCalledWith(
          JSON.stringify({ error: ERROR_MESSAGES.ACCOUNT_NOT_FOUND })
        );
      });

      it('should handle special characters in account id', async () => {
        const account = {
          id: 'acc-special_123!@#',
          name: 'Special ID',
          direction: DIRECTION.CREDIT,
          balance: 500,
          disabled: false,
        };

        vi.mocked(ledger.getAccount).mockReturnValue(account);

        await handleGetAccount(mockReq, mockRes, { id: 'acc-special_123!@#' });

        expect(ledger.getAccount).toHaveBeenCalledWith('acc-special_123!@#');
        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.OK, {
          'Content-Type': 'application/json',
        });
      });

      it('should return account without name', async () => {
        const account = {
          id: 'acc-2',
          direction: DIRECTION.DEBIT,
          balance: 200,
          disabled: false,
        };

        vi.mocked(ledger.getAccount).mockReturnValue(account);

        await handleGetAccount(mockReq, mockRes, { id: 'acc-2' });

        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.OK, {
          'Content-Type': 'application/json',
        });
        expect(endSpy).toHaveBeenCalledWith(JSON.stringify(account));
      });

      it('should return account with zero balance', async () => {
        const account = {
          id: 'acc-3',
          name: 'Zero Balance',
          direction: DIRECTION.CREDIT,
          balance: 0,
          disabled: false,
        };

        vi.mocked(ledger.getAccount).mockReturnValue(account);

        await handleGetAccount(mockReq, mockRes, { id: 'acc-3' });

        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.OK, {
          'Content-Type': 'application/json',
        });
        expect(endSpy).toHaveBeenCalledWith(JSON.stringify(account));
      });
    });
  });

  describe('handleDeleteAccount', () => {
    describe('parameter validation', () => {
      it('should reject missing account id', async () => {
        await handleDeleteAccount(mockReq, mockRes, {});

        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST, {
          'Content-Type': 'application/json',
        });
        expect(endSpy).toHaveBeenCalledWith(
          JSON.stringify({ error: ERROR_MESSAGES.ACCOUNT_ID_REQUIRED })
        );
      });

      it('should reject empty account id', async () => {
        await handleDeleteAccount(mockReq, mockRes, { id: '' });

        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST, {
          'Content-Type': 'application/json',
        });
        expect(endSpy).toHaveBeenCalledWith(
          JSON.stringify({ error: ERROR_MESSAGES.ACCOUNT_ID_REQUIRED })
        );
      });
    });

    describe('account deletion', () => {
      it('should successfully disable account', async () => {
        vi.mocked(ledger.disableAccount).mockReturnValue({ success: true });

        await handleDeleteAccount(mockReq, mockRes, { id: 'acc-1' });

        expect(ledger.disableAccount).toHaveBeenCalledWith('acc-1');
        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.NO_CONTENT);
        expect(endSpy).toHaveBeenCalled();
      });

      it('should return error when account not found', async () => {
        vi.mocked(ledger.disableAccount).mockReturnValue({
          success: false,
          error: ERROR_MESSAGES.ACCOUNT_NOT_FOUND,
        });

        await handleDeleteAccount(mockReq, mockRes, { id: 'non-existent' });

        expect(ledger.disableAccount).toHaveBeenCalledWith('non-existent');
        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST, {
          'Content-Type': 'application/json',
        });
        expect(endSpy).toHaveBeenCalledWith(
          JSON.stringify({ error: ERROR_MESSAGES.ACCOUNT_NOT_FOUND })
        );
      });

      it('should return error when account already disabled', async () => {
        vi.mocked(ledger.disableAccount).mockReturnValue({
          success: false,
          error: ERROR_MESSAGES.ACCOUNT_ALREADY_DISABLED,
        });

        await handleDeleteAccount(mockReq, mockRes, { id: 'acc-disabled' });

        expect(ledger.disableAccount).toHaveBeenCalledWith('acc-disabled');
        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST, {
          'Content-Type': 'application/json',
        });
        expect(endSpy).toHaveBeenCalledWith(
          JSON.stringify({ error: ERROR_MESSAGES.ACCOUNT_ALREADY_DISABLED })
        );
      });

      it('should handle special characters in account id', async () => {
        vi.mocked(ledger.disableAccount).mockReturnValue({ success: true });

        await handleDeleteAccount(mockReq, mockRes, { id: 'acc-special_123!@#' });

        expect(ledger.disableAccount).toHaveBeenCalledWith('acc-special_123!@#');
        expect(writeHeadSpy).toHaveBeenCalledWith(HTTP_STATUS.NO_CONTENT);
      });
    });
  });
});
