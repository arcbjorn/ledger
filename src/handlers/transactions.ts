import http from 'node:http';
import type { CreateTransactionRequest } from '@/types/index';
import { createTransaction } from '@services/ledger.ts';
import { HTTP_STATUS, ERROR_MESSAGES } from '@constants';
import { respond } from '@utils/response';

async function parseBody<T>(req: http.IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error(ERROR_MESSAGES.INVALID_JSON));
      }
    });
    req.on('error', reject);
  });
}

export async function handleCreateTransaction(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  try {
    const body = await parseBody<CreateTransactionRequest>(req);

    if (!body.entries || !Array.isArray(body.entries) || body.entries.length === 0) {
      respond(res, HTTP_STATUS.BAD_REQUEST, { error: ERROR_MESSAGES.INVALID_ENTRIES });
      return;
    }

    const result = createTransaction(body);

    if (!result.success) {
      respond(res, HTTP_STATUS.BAD_REQUEST, { error: result.error! });
      return;
    }

    respond(res, HTTP_STATUS.CREATED, result.transaction);
  } catch (error) {
    respond(res, HTTP_STATUS.BAD_REQUEST, { error: ERROR_MESSAGES.BAD_REQUEST });
  }
}
