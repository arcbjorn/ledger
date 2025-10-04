import http from 'node:http';
import type { CreateAccountRequest } from '@/types/index';
import { createAccount, getAccount, disableAccount } from '@services/ledger.ts';
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

export async function handleCreateAccount(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  try {
    const body = await parseBody<CreateAccountRequest>(req);

    if (!body.direction || !['debit', 'credit'].includes(body.direction)) {
      res.writeHead(HTTP_STATUS.BAD_REQUEST, CONTENT_TYPE.JSON);
      res.end(JSON.stringify({ error: ERROR_MESSAGES.INVALID_DIRECTION }));
      return;
    }

    const account = createAccount(body);

    res.writeHead(HTTP_STATUS.CREATED, CONTENT_TYPE.JSON);
    res.end(JSON.stringify(account));
  } catch (error) {
    res.writeHead(HTTP_STATUS.BAD_REQUEST, CONTENT_TYPE.JSON);
    res.end(JSON.stringify({ error: ERROR_MESSAGES.BAD_REQUEST }));
  }
}

export async function handleGetAccount(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  params: Record<string, string>
): Promise<void> {
  const id = params.id;
  if (!id) {
    res.writeHead(HTTP_STATUS.BAD_REQUEST, CONTENT_TYPE.JSON);
    res.end(JSON.stringify({ error: ERROR_MESSAGES.ACCOUNT_ID_REQUIRED }));
    return;
  }

  const account = getAccount(id);

  if (!account) {
    res.writeHead(HTTP_STATUS.NOT_FOUND, CONTENT_TYPE.JSON);
    res.end(JSON.stringify({ error: ERROR_MESSAGES.ACCOUNT_NOT_FOUND }));
    return;
  }

  res.writeHead(HTTP_STATUS.OK, CONTENT_TYPE.JSON);
  res.end(JSON.stringify(account));
}

export async function handleDeleteAccount(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  params: Record<string, string>
): Promise<void> {
  const id = params.id;
  if (!id) {
    res.writeHead(HTTP_STATUS.BAD_REQUEST, CONTENT_TYPE.JSON);
    res.end(JSON.stringify({ error: ERROR_MESSAGES.ACCOUNT_ID_REQUIRED }));
    return;
  }

  const result = disableAccount(id);

  if (!result.success) {
    res.writeHead(HTTP_STATUS.BAD_REQUEST, CONTENT_TYPE.JSON);
    res.end(JSON.stringify({ error: result.error }));
    return;
  }

  res.writeHead(HTTP_STATUS.NO_CONTENT);
  res.end();
}
