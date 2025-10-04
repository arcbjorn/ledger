export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const CONTENT_TYPE = {
  JSON: { 'Content-Type': 'application/json' },
} as const;

export const ERROR_MESSAGES = {
  INVALID_DIRECTION: 'Invalid direction',
  BAD_REQUEST: 'Bad request',
  ACCOUNT_ID_REQUIRED: 'Account ID required',
  ACCOUNT_NOT_FOUND: 'Account not found',
  ACCOUNT_DISABLED: 'Account is disabled',
  ACCOUNT_ALREADY_DISABLED: 'Account already disabled',
  INVALID_ENTRIES: 'Invalid entries',
  INVALID_JSON: 'Invalid JSON',
  NOT_FOUND: 'Not found',
  INTERNAL_SERVER_ERROR: 'Internal server error',
} as const;

export const SERVER_CONFIG = {
  PORT: 5000,
  HOST: 'localhost',
} as const;
