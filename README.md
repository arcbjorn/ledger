# Double-Entry Ledger API

A TypeScript implementation of a double-entry accounting ledger system with an HTTP/JSON API.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Double-Entry Accounting Rules](#double-entry-accounting-rules)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)

## Features

- **Double-entry accounting** - Every transaction balances debits and credits
- **Account management** - Create and track debit/credit accounts
- **Transaction validation** - Automatic balance verification
- **In-memory storage** - Fast, simple data persistence
- **RESTful API** - Clean HTTP/JSON endpoints

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

### Create Account

```bash
POST /accounts
```

**Request:**
```json
{
  "name": "Cash",
  "direction": "debit",
  "balance": 0
}
```

**Response:**
```json
{
  "id": "71cde2aa-b9bc-496a-a6f1-34964d05e6fd",
  "name": "Cash",
  "balance": 0,
  "direction": "debit"
}
```

### Get Account

```bash
GET /accounts/:id
```

**Response:**
```json
{
  "id": "71cde2aa-b9bc-496a-a6f1-34964d05e6fd",
  "name": "Cash",
  "balance": 100,
  "direction": "debit"
}
```

### Create Transaction

```bash
POST /transactions
```

**Request:**
```json
{
  "name": "Transfer",
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

## Double-Entry Accounting Rules

### Account Directions

Each account has a direction: **debit** or **credit**.

### Balance Calculation

When an entry is applied to an account:
- **Same directions** → Balance increases (add)
- **Opposite directions** → Balance decreases (subtract)

**Examples:**

| Account Direction | Entry Direction | Entry Amount | Result |
|-------------------|-----------------|--------------|--------|
| debit | debit | +100 | Balance +100 |
| credit | credit | +100 | Balance +100 |
| debit | credit | +100 | Balance -100 |
| credit | debit | +100 | Balance -100 |

### Transaction Validation

All transactions must balance:
- **Sum of debits = Sum of credits**

If debits ≠ credits, the transaction is rejected with a 400 error.

## Testing

Run the included test script:

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
│   │   └── ledger.ts         # Business logic
│   ├── handlers/
│   │   ├── router.ts         # HTTP routing
│   │   ├── routes.ts         # Route registration
│   │   ├── accounts.ts       # Account endpoints
│   │   └── transactions.ts   # Transaction endpoints
│   └── server.ts             # Entry point
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
└── package.json
```

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Build Tool**: Vite
- **Dev Server**: vite-node
- **Package Manager**: pnpm
