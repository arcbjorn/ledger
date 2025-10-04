import { router } from '@handlers/router.ts';
import { handleCreateAccount, handleGetAccount } from '@handlers/accounts.ts';
import { handleCreateTransaction } from '@handlers/transactions.ts';

router.post('/accounts', handleCreateAccount);
router.get('/accounts/:id', handleGetAccount);
router.post('/transactions', handleCreateTransaction);
