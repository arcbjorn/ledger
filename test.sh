#!/bin/bash

echo "=== Creating accounts ==="
curl -s -X POST http://localhost:5000/accounts -H 'Content-Type: application/json' -d '{"name":"Cash","direction":"debit","id":"acc-1"}'
echo ""
curl -s -X POST http://localhost:5000/accounts -H 'Content-Type: application/json' -d '{"name":"Bank","direction":"credit","id":"acc-2"}'
echo ""

echo "=== Getting account acc-1 ==="
curl -s http://localhost:5000/accounts/acc-1
echo ""

echo "=== Creating transaction ==="
curl -s -X POST http://localhost:5000/transactions -H 'Content-Type: application/json' -d '{"name":"Transfer","entries":[{"direction":"debit","account_id":"acc-1","amount":100},{"direction":"credit","account_id":"acc-2","amount":100}]}'
echo ""

echo "=== Checking balances after transaction ==="
curl -s http://localhost:5000/accounts/acc-1
echo ""
curl -s http://localhost:5000/accounts/acc-2
echo ""
