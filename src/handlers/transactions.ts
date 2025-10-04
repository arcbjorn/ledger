import http from 'node:http';
import type { CreateTransactionRequest } from '@/types/index';
import { createTransaction } from '@services/ledger.ts';
import { HTTP_STATUS, CONTENT_TYPE, ERROR_MESSAGES } from '@constants';

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
      res.writeHead(HTTP_STATUS.BAD_REQUEST, CONTENT_TYPE.JSON);
      res.end(JSON.stringify({ error: ERROR_MESSAGES.INVALID_ENTRIES }));
      return;
    }

    const result = createTransaction(body);

    if (!result.success) {
      res.writeHead(HTTP_STATUS.BAD_REQUEST, CONTENT_TYPE.JSON);
      res.end(JSON.stringify({ error: result.error }));
      return;
    }

    res.writeHead(HTTP_STATUS.CREATED, CONTENT_TYPE.JSON);
    res.end(JSON.stringify(result.transaction));
  } catch (error) {
    res.writeHead(HTTP_STATUS.BAD_REQUEST, CONTENT_TYPE.JSON);
    res.end(JSON.stringify({ error: ERROR_MESSAGES.BAD_REQUEST }));
  }
}
