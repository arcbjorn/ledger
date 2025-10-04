import http from 'node:http';
import type { CreateAccountRequest } from '@/types/index';
import { createAccount, getAccount, disableAccount } from '@services/ledger.ts';
import { HTTP_STATUS, ERROR_MESSAGES, ACCOUNT_DIRECTION } from '@constants';
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

export async function handleCreateAccount(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  try {
    const body = await parseBody<CreateAccountRequest>(req);

    if (!body.direction || ![ACCOUNT_DIRECTION.DEBIT, ACCOUNT_DIRECTION.CREDIT].includes(body.direction)) {
      respond(res, HTTP_STATUS.BAD_REQUEST, { error: ERROR_MESSAGES.INVALID_DIRECTION });
      return;
    }

    const account = createAccount(body);
    respond(res, HTTP_STATUS.CREATED, account);
  } catch (error) {
    respond(res, HTTP_STATUS.BAD_REQUEST, { error: ERROR_MESSAGES.BAD_REQUEST });
  }
}

export async function handleGetAccount(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  params: Record<string, string>
): Promise<void> {
  const id = params.id;
  if (!id) {
    respond(res, HTTP_STATUS.BAD_REQUEST, { error: ERROR_MESSAGES.ACCOUNT_ID_REQUIRED });
    return;
  }

  const account = getAccount(id);

  if (!account) {
    respond(res, HTTP_STATUS.NOT_FOUND, { error: ERROR_MESSAGES.ACCOUNT_NOT_FOUND });
    return;
  }

  respond(res, HTTP_STATUS.OK, account);
}

export async function handleDeleteAccount(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  params: Record<string, string>
): Promise<void> {
  const id = params.id;
  if (!id) {
    respond(res, HTTP_STATUS.BAD_REQUEST, { error: ERROR_MESSAGES.ACCOUNT_ID_REQUIRED });
    return;
  }

  const result = disableAccount(id);

  if (!result.success) {
    respond(res, HTTP_STATUS.BAD_REQUEST, { error: result.error! });
    return;
  }

  respond(res, HTTP_STATUS.NO_CONTENT);
}
