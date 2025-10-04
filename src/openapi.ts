import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import type { oas31 } from 'openapi3-ts';
import { AccountSchema, TransactionSchema } from '@/types/models.ts';
import {
  CreateAccountRequestSchema,
  CreateTransactionRequestSchema,
  ErrorSchema,
} from '@/types/http.ts';
import { SERVER_CONFIG } from '@constants';

const registry = new OpenAPIRegistry();

// Register schemas
registry.register('Account', AccountSchema);
registry.register('CreateAccountRequest', CreateAccountRequestSchema);
registry.register('Transaction', TransactionSchema);
registry.register('CreateTransactionRequest', CreateTransactionRequestSchema);
registry.register('Error', ErrorSchema);

// Register paths
registry.registerPath({
  method: 'post',
  path: '/accounts',
  tags: ['Accounts'],
  summary: 'Create a new account',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateAccountRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Account created successfully',
      content: {
        'application/json': {
          schema: AccountSchema,
        },
      },
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/accounts/{id}',
  tags: ['Accounts'],
  summary: 'Get account by ID',
  responses: {
    200: {
      description: 'Account retrieved successfully',
      content: {
        'application/json': {
          schema: AccountSchema,
        },
      },
    },
    404: {
      description: 'Account not found',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/accounts/{id}',
  tags: ['Accounts'],
  summary: 'Delete (disable) account by ID',
  responses: {
    200: {
      description: 'Account disabled successfully',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    404: {
      description: 'Account not found',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/transactions',
  tags: ['Transactions'],
  summary: 'Create a new transaction',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateTransactionRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Transaction created successfully',
      content: {
        'application/json': {
          schema: TransactionSchema,
        },
      },
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

const generator = new OpenApiGeneratorV31(registry.definitions);

export const openApiSpec: oas31.OpenAPIObject = generator.generateDocument({
  openapi: '3.1.0',
  info: {
    title: 'Ledger API',
    version: '1.0.0',
    description: 'Double-entry accounting ledger API',
  },
  servers: [
    {
      url: `http://${SERVER_CONFIG.HOST}:${SERVER_CONFIG.PORT}`,
      description: 'Development server',
    },
  ],
});
