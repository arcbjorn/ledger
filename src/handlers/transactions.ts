import http from 'node:http';
import type { CreateTransactionRequest } from '@/types/index';
import { createTransaction } from '@services/ledger.ts';

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

export async function handleCreateTransaction(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  try {
    const body = await parseBody<CreateTransactionRequest>(req);

    if (!body.entries || !Array.isArray(body.entries) || body.entries.length === 0) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid entries' }));
      return;
    }

    const result = createTransaction(body);

    if (!result.success) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: result.error }));
      return;
    }

    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result.transaction));
  } catch (error) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Bad request' }));
  }
}
