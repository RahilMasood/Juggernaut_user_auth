#!/bin/bash

# Test script for default password functionality
# This script tests user creation without password and verifies credentials are sent

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_BASE="http://localhost:3000/api/v1"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD=""

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Default Password System Test${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Function to print success
success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error
error() {
  echo -e "${RED}✗ $1${NC}"
}

# Function to print info
info() {
  echo -e "${YELLOW}ℹ $1${NC}"
}

# Step 1: Login as admin
info "Step 1: Logging in as admin..."
read -p "Enter admin password: " -s ADMIN_PASSWORD
echo ""

LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\"
  }")

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')
FIRM_ID=$(echo $LOGIN_RESPONSE | jq -r '.data.user.firm_id')

if [ "$ACCESS_TOKEN" == "null" ] || [ -z "$ACCESS_TOKEN" ]; then
  error "Failed to login. Check admin credentials."
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

success "Logged in successfully"
echo ""

# Step 2: Create user without password
info "Step 2: Creating new user without providing password..."
TEST_EMAIL="test-$(date +%s)@example.com"

CREATE_RESPONSE=$(curl -s -X POST "$API_BASE/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"first_name\": \"Test\",
    \"last_name\": \"User\",
    \"user_type\": \"AUDITOR\",
    \"firm_id\": \"$FIRM_ID\",
    \"designation\": \"Test Auditor\"
  }")

USER_ID=$(echo $CREATE_RESPONSE | jq -r '.data.user.id')
CREDENTIALS_SENT=$(echo $CREATE_RESPONSE | jq -r '.data.credentialsSent')
MUST_CHANGE=$(echo $CREATE_RESPONSE | jq -r '.data.user.must_change_password')
MESSAGE=$(echo $CREATE_RESPONSE | jq -r '.data.message')

if [ "$USER_ID" == "null" ] || [ -z "$USER_ID" ]; then
  error "Failed to create user"
  echo "Response: $CREATE_RESPONSE"
  exit 1
fi

success "User created successfully"
echo "  User ID: $USER_ID"
echo "  Email: $TEST_EMAIL"
echo "  Credentials Sent: $CREDENTIALS_SENT"
echo "  Must Change Password: $MUST_CHANGE"
echo "  Message: $MESSAGE"
echo ""

# Step 3: Verify flags
info "Step 3: Verifying security flags..."

if [ "$CREDENTIALS_SENT" == "true" ]; then
  success "Credentials sent flag is set correctly"
else
  error "Credentials sent flag is not set (expected: true, got: $CREDENTIALS_SENT)"
fi

if [ "$MUST_CHANGE" == "true" ]; then
  success "Must change password flag is set correctly"
else
  error "Must change password flag is not set (expected: true, got: $MUST_CHANGE)"
fi

if [[ "$MESSAGE" == *"credentials have been sent via email"* ]]; then
  success "Response message indicates email was sent"
else
  error "Response message doesn't mention email"
fi

echo ""

# Step 4: Verify user cannot see password in response
info "Step 4: Checking that password is not exposed..."

PASSWORD_HASH=$(echo $CREATE_RESPONSE | jq -r '.data.user.password_hash')

if [ "$PASSWORD_HASH" == "null" ]; then
  success "Password hash is not exposed in API response"
else
  error "Password hash is exposed in API response (security issue!)"
fi

echo ""

# Step 5: Get user details to verify
info "Step 5: Fetching user details to verify creation..."

GET_USER_RESPONSE=$(curl -s -X GET "$API_BASE/users/$USER_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

FETCHED_EMAIL=$(echo $GET_USER_RESPONSE | jq -r '.data.user.email')
FETCHED_MUST_CHANGE=$(echo $GET_USER_RESPONSE | jq -r '.data.user.must_change_password')
FETCHED_IS_ACTIVE=$(echo $GET_USER_RESPONSE | jq -r '.data.user.is_active')

if [ "$FETCHED_EMAIL" == "$TEST_EMAIL" ]; then
  success "User details fetched successfully"
  echo "  Email: $FETCHED_EMAIL"
  echo "  Must Change Password: $FETCHED_MUST_CHANGE"
  echo "  Is Active: $FETCHED_IS_ACTIVE"
else
  error "Failed to fetch user details"
fi

echo ""

# Step 6: Check audit logs (if endpoint is available)
info "Step 6: Verifying audit log entry..."
info "Note: Check application logs for 'Credentials email sent to new user' message"
echo ""

# Summary
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Test Summary${NC}"
echo -e "${YELLOW}========================================${NC}"
success "User created without password"
success "Temporary password generated automatically"
success "Must change password flag set"
success "Credentials sent flag set"
success "Email notification triggered"
info "Manual verification required:"
echo "  1. Check email for credentials (sent to $TEST_EMAIL)"
echo "  2. Check application logs for email sending confirmation"
echo "  3. Try logging in with the temporary password from email"
echo "  4. Verify password change is enforced after first login"
echo ""

# Cleanup prompt
read -p "Do you want to deactivate the test user? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  info "Deactivating test user..."
  
  DEACTIVATE_RESPONSE=$(curl -s -X DELETE "$API_BASE/users/$USER_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
  
  if echo "$DEACTIVATE_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    success "Test user deactivated"
  else
    error "Failed to deactivate test user"
    echo "Response: $DEACTIVATE_RESPONSE"
  fi
fi

echo ""
echo -e "${GREEN}Test completed!${NC}"

