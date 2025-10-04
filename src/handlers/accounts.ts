import http from 'node:http';
import { CreateAccountRequest } from '@models/types.ts';
import { createAccount, getAccount } from '@services/ledger.ts';

async function parseBody<T>(req: http.IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error('Invalid JSON'));
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
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid direction' }));
      return;
    }

    const account = createAccount(body);

    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(account));
  } catch (error) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Bad request' }));
  }
}

export async function handleGetAccount(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  params: Record<string, string>
): Promise<void> {
  const account = getAccount(params.id);

  if (!account) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Account not found' }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(account));
}
