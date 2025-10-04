import { router } from '@handlers/router.ts';
import {
  handleCreateAccount,
  handleGetAccount,
  handleDeleteAccount,
} from '@handlers/accounts.ts';
import { handleCreateTransaction } from '@handlers/transactions.ts';
import { openApiSpec } from '@/openapi.ts';
import { sendJson } from '@utils/response.ts';

router.get('/openapi.json', async (_req, res) => {
  sendJson(res, 200, openApiSpec);
});

router.post('/accounts', handleCreateAccount);
router.get('/accounts/:id', handleGetAccount);
router.delete('/accounts/:id', handleDeleteAccount);
router.post('/transactions', handleCreateTransaction);
