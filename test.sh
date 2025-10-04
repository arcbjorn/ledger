#!/bin/bash

set -e

BASE_URL="http://localhost:5000"
FAILED=0

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_test() {
  echo -e "${YELLOW}=== $1 ===${NC}"
}

print_pass() {
  echo -e "${GREEN}✓ PASS${NC}"
}

print_fail() {
  echo -e "${RED}✗ FAIL: $1${NC}"
  FAILED=$((FAILED + 1))
}

# Test OpenAPI endpoint
print_test "Getting OpenAPI spec"
RESPONSE=$(curl -s $BASE_URL/openapi.json)
if echo "$RESPONSE" | jq -e '.openapi == "3.1.0"' > /dev/null 2>&1; then
  print_pass
else
  print_fail "OpenAPI spec missing or invalid"
fi
echo ""

# Create accounts
print_test "Creating debit account (Cash)"
RESPONSE=$(curl -s -X POST $BASE_URL/accounts -H 'Content-Type: application/json' -d '{"name":"Cash","direction":"debit","id":"acc-1"}')
echo "$RESPONSE" | jq .
if echo "$RESPONSE" | jq -e '.id == "acc-1" and .direction == "debit" and .balance == 0 and .disabled == false' > /dev/null; then
  print_pass
else
  print_fail "Account creation failed"
fi
echo ""

print_test "Creating credit account (Bank)"
RESPONSE=$(curl -s -X POST $BASE_URL/accounts -H 'Content-Type: application/json' -d '{"name":"Bank","direction":"credit","id":"acc-2"}')
echo "$RESPONSE" | jq .
if echo "$RESPONSE" | jq -e '.id == "acc-2" and .direction == "credit"' > /dev/null; then
  print_pass
else
  print_fail "Account creation failed"
fi
echo ""

print_test "Creating account with initial balance"
RESPONSE=$(curl -s -X POST $BASE_URL/accounts -H 'Content-Type: application/json' -d '{"name":"Revenue","direction":"credit","balance":500,"id":"acc-3"}')
echo "$RESPONSE" | jq .
if echo "$RESPONSE" | jq -e '.balance == 500' > /dev/null; then
  print_pass
else
  print_fail "Account with initial balance failed"
fi
echo ""

# Get account
print_test "Getting account acc-1"
RESPONSE=$(curl -s $BASE_URL/accounts/acc-1)
echo "$RESPONSE" | jq .
if echo "$RESPONSE" | jq -e '.id == "acc-1"' > /dev/null; then
  print_pass
else
  print_fail "Get account failed"
fi
echo ""

# Create transactions
print_test "Creating balanced transaction"
RESPONSE=$(curl -s -X POST $BASE_URL/transactions -H 'Content-Type: application/json' -d '{"name":"Transfer","entries":[{"direction":"debit","account_id":"acc-1","amount":100},{"direction":"credit","account_id":"acc-2","amount":100}]}')
echo "$RESPONSE" | jq .
if echo "$RESPONSE" | jq -e '.id and (.entries | length) == 2' > /dev/null; then
  print_pass
else
  print_fail "Transaction creation failed"
fi
echo ""

print_test "Verifying balances after transaction"
BALANCE_1=$(curl -s $BASE_URL/accounts/acc-1 | jq -r '.balance')
BALANCE_2=$(curl -s $BASE_URL/accounts/acc-2 | jq -r '.balance')
echo "acc-1 balance: $BALANCE_1 (expected: 100)"
echo "acc-2 balance: $BALANCE_2 (expected: 100)"
if [ "$BALANCE_1" == "100" ] && [ "$BALANCE_2" == "100" ]; then
  print_pass
else
  print_fail "Balances incorrect after transaction"
fi
echo ""

print_test "Creating multi-entry transaction"
RESPONSE=$(curl -s -X POST $BASE_URL/transactions -H 'Content-Type: application/json' -d '{"name":"Complex","entries":[{"direction":"debit","account_id":"acc-1","amount":50},{"direction":"debit","account_id":"acc-3","amount":50},{"direction":"credit","account_id":"acc-2","amount":100}]}')
echo "$RESPONSE" | jq .
if echo "$RESPONSE" | jq -e '.entries | length == 3' > /dev/null; then
  print_pass
else
  print_fail "Multi-entry transaction failed"
fi
echo ""

# Test error cases
print_test "Testing unbalanced transaction (should fail)"
RESPONSE=$(curl -s -X POST $BASE_URL/transactions -H 'Content-Type: application/json' -d '{"entries":[{"direction":"debit","account_id":"acc-1","amount":100},{"direction":"credit","account_id":"acc-2","amount":50}]}')
echo "$RESPONSE" | jq .
if echo "$RESPONSE" | jq -e '.error | contains("not balanced")' > /dev/null; then
  print_pass
else
  print_fail "Should reject unbalanced transaction"
fi
echo ""

print_test "Testing non-existent account (should fail)"
RESPONSE=$(curl -s -X POST $BASE_URL/transactions -H 'Content-Type: application/json' -d '{"entries":[{"direction":"debit","account_id":"non-existent","amount":100},{"direction":"credit","account_id":"acc-2","amount":100}]}')
echo "$RESPONSE" | jq .
if echo "$RESPONSE" | jq -e '.error | contains("not found")' > /dev/null; then
  print_pass
else
  print_fail "Should reject non-existent account"
fi
echo ""

# Test disable account
print_test "Disabling account acc-1"
RESPONSE=$(curl -s -X DELETE $BASE_URL/accounts/acc-1)
if [ -z "$RESPONSE" ] || echo "$RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
  print_pass
else
  print_fail "Account disable failed"
fi
echo ""

print_test "Verifying disabled account returns 404"
RESPONSE=$(curl -s $BASE_URL/accounts/acc-1)
echo "$RESPONSE" | jq .
if echo "$RESPONSE" | jq -e '.error | contains("not found")' > /dev/null; then
  print_pass
else
  print_fail "Should return 404 for disabled account"
fi
echo ""

print_test "Testing transaction with disabled account (should fail)"
RESPONSE=$(curl -s -X POST $BASE_URL/transactions -H 'Content-Type: application/json' -d '{"entries":[{"direction":"debit","account_id":"acc-1","amount":100},{"direction":"credit","account_id":"acc-2","amount":100}]}')
echo "$RESPONSE" | jq .
if echo "$RESPONSE" | jq -e '.error | contains("disabled")' > /dev/null; then
  print_pass
else
  print_fail "Should reject transaction with disabled account"
fi
echo ""

# Summary
echo ""
echo "================================"
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}$FAILED test(s) failed${NC}"
  exit 1
fi
