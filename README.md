# Double-Entry Ledger API

A TypeScript implementation of a double-entry accounting ledger system with an HTTP/JSON API.

See [INSTRUCTIONS.md](./INSTRUCTIONS.md) for double-entry accounting rules and requirements.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Unit & Integration Testing](#unit--integration-testing)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Account Lifecycle](#account-lifecycle)
- [Concurrency Control](#concurrency-control)

## Installation

**Requirements:** Node.js >= 18, pnpm >= 8

```bash
pnpm install
```

## Usage

| Mode | Command | URL |
|------|---------|-----|
| **Development** | `pnpm dev` | http://localhost:5000 |
| **Production** | `pnpm build && pnpm start` | http://localhost:5000 |

## API Endpoints

### GET /openapi.json

Get the OpenAPI 3.1 specification for this API.

### POST /accounts

Create a new account.

**Request:**
```json
{
  "name": "Cash",
  "direction": "debit",
  "balance": 0,
  "id": "71cde2aa-b9bc-496a-a6f1-34964d05e6fd"
}
```

| Field     | Description                                               |
|-----------|-----------------------------------------------------------|
| id        | Optional. If not provided, generated on object creation. |
| name      | Optional label for the account.                           |
| balance   | Optional. Account's initial balance in USD (default: 0).  |
| direction | Required. Must be either "debit" or "credit".             |

**Response:**
```json
{
  "id": "71cde2aa-b9bc-496a-a6f1-34964d05e6fd",
  "name": "Cash",
  "balance": 0,
  "direction": "debit",
  "disabled": false
}
```

### GET /accounts/:id

Get account details.

**Response:**
```json
{
  "id": "71cde2aa-b9bc-496a-a6f1-34964d05e6fd",
  "name": "Cash",
  "balance": 100,
  "direction": "debit",
  "disabled": false
}
```

### DELETE /accounts/:id

Disable an account (soft delete).

**Response:** `204 No Content`

**Error Responses:**
- `400` - Account not found or already disabled
- `404` - Invalid account ID

### POST /transactions

Create a new transaction.

**Request:**
```json
{
  "name": "Transfer",
  "id": "3256dc3c-7b18-4a21-95c6-146747cf2971",
  "entries": [
    {
      "direction": "debit",
      "account_id": "account-1",
      "amount": 100
    },
    {
      "direction": "credit",
      "account_id": "account-2",
      "amount": 100
    }
  ]
}
```

| Field   | Description                                               |
|---------|-----------------------------------------------------------|
| id      | Optional. If not provided, generated on object creation. |
| name    | Optional label for the transaction.                       |
| entries | Required. Array of entry objects (debits must equal credits). |

**Entry fields:**

| Field      | Description                                   |
|------------|-----------------------------------------------|
| direction  | Required. Must be either "debit" or "credit". |
| account_id | Required. ID of the account to modify.        |
| amount     | Required. Amount in USD.                      |

**Response:**
```json
{
  "id": "3256dc3c-7b18-4a21-95c6-146747cf2971",
  "name": "Transfer",
  "entries": [
    {
      "id": "9f694f8c-9c4c-44cf-9ca9-0cb1a318f0a7",
      "direction": "debit",
      "account_id": "account-1",
      "amount": 100
    },
    {
      "id": "a5c1b7f0-e52e-4ab6-8f31-c380c2223efa",
      "direction": "credit",
      "account_id": "account-2",
      "amount": 100
    }
  ]
}
```

## Account Lifecycle

- **Creation**: Accounts are created with an initial balance and direction (disabled=false by default)
- **Modification**: Balances can only be modified through transactions
- **Disabling**: Accounts can be disabled to prevent future transactions while preserving transaction history
- **Deletion**: Accounts cannot be deleted once created to maintain ledger integrity

## Unit & Integration Testing

Run unit tests:

```bash
pnpm test
```

Run integration tests (requires `jq`):

```bash
./test.sh
```

Or test manually with curl:

```bash
# Create two accounts
curl -X POST http://localhost:5000/accounts \
  -H 'Content-Type: application/json' \
  -d '{"name":"Cash","direction":"debit","id":"acc-1"}'

curl -X POST http://localhost:5000/accounts \
  -H 'Content-Type: application/json' \
  -d '{"name":"Bank","direction":"credit","id":"acc-2"}'

# Create a transaction
curl -X POST http://localhost:5000/transactions \
  -H 'Content-Type: application/json' \
  -d '{
    "name":"Transfer",
    "entries":[
      {"direction":"debit","account_id":"acc-1","amount":100},
      {"direction":"credit","account_id":"acc-2","amount":100}
    ]
  }'

# Check balances
curl http://localhost:5000/accounts/acc-1
curl http://localhost:5000/accounts/acc-2
```

## Project Structure

```
ledger/
├── src/
│   ├── types/
│   │   ├── models.ts         # Domain types
│   │   ├── http.ts           # Request/response types
│   │   └── index.ts          # Type exports
│   ├── services/
│   │   ├── storage.ts        # In-memory data store
│   │   ├── storage.test.ts   # Storage unit tests
│   │   ├── ledger.ts         # Business logic
│   │   ├── ledger.test.ts    # Ledger unit tests
│   │   └── lock.ts           # Concurrency control (optional)
│   ├── handlers/
│   │   ├── router.ts         # HTTP routing
│   │   ├── router.test.ts    # Router unit tests
│   │   ├── routes.ts         # Route registration
│   │   ├── accounts.ts       # Account endpoints
│   │   ├── accounts.test.ts  # Account handler tests
│   │   ├── transactions.ts   # Transaction endpoints
│   │   └── transactions.test.ts # Transaction handler tests
│   ├── utils/
│   │   └── response.ts       # HTTP response helpers
│   ├── constants.ts          # Shared constants
│   ├── openapi.ts            # OpenAPI 3.1 specification
│   └── server.ts             # Entry point
├── vite.config.ts            # Vite configuration
├── vitest.config.ts          # Vitest configuration
├── tsconfig.json             # TypeScript configuration
├── test.sh                   # Integration test script
└── package.json
```

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Build Tool**: Vite
- **Dev Server**: vite-node
- **Package Manager**: pnpm

## Concurrency Control

The ledger includes an optional concurrency control mechanism using account-level locks. This is a future enhancement that prevents race conditions when adding async database operations. While databases typically handle concurrency at their level, this implementation provides application-level control.

**Enable concurrency control:**

```bash
git apply concurrency-control.patch
```

This adds mutex locks that ensure transactions modifying the same accounts execute sequentially, while allowing concurrent transactions on different accounts.

See `src/services/lock.ts` for the implementation.
