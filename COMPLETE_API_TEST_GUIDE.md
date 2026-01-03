# 🧪 Complete API Testing Guide - All 25 Routes

This guide will walk you through testing **ALL 25 API endpoints** systematically.

## 📋 Prerequisites

1. **Server Running**: `npm run docker:up` or `npm start`
2. **Database Seeded**: Run `npm run seed-admin` to get admin credentials
3. **Base URL**: `http://localhost:3000`
4. **Tool**: Use cURL, Postman, or Thunder Client

---

## 🎯 Testing Flow Overview

We'll test routes in this order:
1. ✅ Health Check (1 route)
2. 🔐 Authentication (5 routes)
3. 👥 User Management (6 routes)
4. 📋 Engagement Management (9 routes)
5. ✅ Confirmation Management (4 routes)

---

## 🚀 PHASE 1: Health & Authentication (6 Routes)

### Route 1: Health Check ✓
**No authentication required**

```bash
curl http://localhost:3000/health
```

**Expected:** `200 OK` with status "healthy"

---

### Route 2: Login (POST /api/v1/auth/login) ✓
**No authentication required**

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "YOUR_PASSWORD_FROM_SEED"
  }'
```

**Expected:** 
- `200 OK`
- Response includes `accessToken` and `refreshToken`
- **SAVE THE ACCESS TOKEN** for all subsequent requests

**Sample Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "user_type": "AUDITOR"
    },
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

---

### Route 3: Get Current User (GET /api/v1/auth/me) ✓
**Requires authentication**

```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected:** 
- `200 OK`
- Your user details with firm and roles

---

### Route 4: Change Password (POST /api/v1/auth/change-password) ✓
**Requires authentication**

```bash
curl -X POST http://localhost:3000/api/v1/auth/change-password \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "YOUR_CURRENT_PASSWORD",
    "newPassword": "NewSecure123!",
    "confirmPassword": "NewSecure123!"
  }'
```

**Expected:** 
- `200 OK`
- Message: "Password changed successfully"
- **Note:** You'll need to login again with the new password

---

### Route 5: Refresh Token (POST /api/v1/auth/refresh) ✓
**Requires refresh token**

```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

**Expected:** 
- `200 OK`
- New `accessToken` and `refreshToken`

---

### Route 6: Logout (POST /api/v1/auth/logout) ✓
**Optional refresh token**

```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

**Expected:** 
- `200 OK`
- Message: "Logged out successfully"

---

## 👥 PHASE 2: User Management (6 Routes)

**Note:** All user routes require authentication. Get a fresh token by logging in first.

### Route 7: List Users (GET /api/v1/users) ✓
**Requires authentication**

```bash
curl "http://localhost:3000/api/v1/users?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected:** 
- `200 OK`
- List of users with pagination

---

### Route 8: Get Specific User (GET /api/v1/users/:id) ✓
**Requires authentication**

```bash
curl http://localhost:3000/api/v1/users/USER_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected:** 
- `200 OK`
- User details including roles and permissions

---

### Route 9: Get User Permissions (GET /api/v1/users/:id/permissions) ✓
**Requires authentication**

```bash
curl http://localhost:3000/api/v1/users/USER_ID/permissions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected:** 
- `200 OK`
- List of permissions for that user

---

### Route 10: Create User (POST /api/v1/users) ✓
**Requires authentication + manage_users permission**

```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "user_type": "AUDITOR",
    "designation": "Senior Auditor",
    "role_id": "ROLE_UUID_HERE"
  }'
```

**Expected:** 
- `201 Created`
- New user details
- Auto-generated password sent to email

---

### Route 11: Update User (PATCH /api/v1/users/:id) ✓
**Requires authentication + manage_users permission**

```bash
curl -X PATCH http://localhost:3000/api/v1/users/USER_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "designation": "Manager"
  }'
```

**Expected:** 
- `200 OK`
- Updated user details

---

### Route 12: Deactivate User (DELETE /api/v1/users/:id) ✓
**Requires authentication + manage_users permission**

```bash
curl -X DELETE http://localhost:3000/api/v1/users/USER_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected:** 
- `200 OK`
- Message: "User deactivated successfully"

---

## 📋 PHASE 3: Engagement Management (9 Routes)

**Note:** All engagement routes require authentication + AUDITOR user type.

### Route 13: List Engagements (GET /api/v1/engagements) ✓
**Requires authentication + AUDITOR**

```bash
curl "http://localhost:3000/api/v1/engagements?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected:** 
- `200 OK`
- List of engagements with pagination

---

### Route 14: Get Specific Engagement (GET /api/v1/engagements/:id) ✓
**Requires authentication + AUDITOR**

```bash
curl http://localhost:3000/api/v1/engagements/ENGAGEMENT_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected:** 
- `200 OK`
- Engagement details with team members

---

### Route 15: Create Engagement (POST /api/v1/engagements) ✓
**Requires authentication + AUDITOR**

```bash
curl -X POST http://localhost:3000/api/v1/engagements \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Q4 2024 Audit",
    "client_name": "Tech Corp Inc",
    "description": "Quarterly financial audit",
    "start_date": "2024-10-01",
    "end_date": "2024-12-31"
  }'
```

**Expected:** 
- `201 Created`
- New engagement details
- **SAVE THE ENGAGEMENT_ID** for next tests

---

### Route 16: Update Engagement (PATCH /api/v1/engagements/:id) ✓
**Requires authentication + AUDITOR**

```bash
curl -X PATCH http://localhost:3000/api/v1/engagements/ENGAGEMENT_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated quarterly financial audit",
    "status": "IN_PROGRESS"
  }'
```

**Expected:** 
- `200 OK`
- Updated engagement details

---

### Route 17: Get Engagement Team (GET /api/v1/engagements/:id/users) ✓
**Requires authentication + AUDITOR**

```bash
curl http://localhost:3000/api/v1/engagements/ENGAGEMENT_ID/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected:** 
- `200 OK`
- List of team members with their roles

---

### Route 18: Add User to Engagement (POST /api/v1/engagements/:id/users) ✓
**Requires authentication + AUDITOR**

```bash
curl -X POST http://localhost:3000/api/v1/engagements/ENGAGEMENT_ID/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USER_UUID",
    "role": "MEMBER"
  }'
```

**Expected:** 
- `201 Created`
- Message: "User added to engagement successfully"

**Role Options:** `LEAD`, `MEMBER`

---

### Route 19: Remove User from Engagement (DELETE /api/v1/engagements/:id/users/:userId) ✓
**Requires authentication + AUDITOR**

```bash
curl -X DELETE http://localhost:3000/api/v1/engagements/ENGAGEMENT_ID/users/USER_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected:** 
- `200 OK`
- Message: "User removed from engagement successfully"

---

### Route 20: List Engagement Confirmations (GET /api/v1/engagements/:id/confirmations) ✓
**Requires authentication + AUDITOR**

```bash
curl http://localhost:3000/api/v1/engagements/ENGAGEMENT_ID/confirmations \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected:** 
- `200 OK`
- List of confirmations for this engagement

---

### Route 21: Create Confirmation for Engagement (POST /api/v1/engagements/:id/confirmations) ✓
**Requires authentication + AUDITOR**

```bash
curl -X POST http://localhost:3000/api/v1/engagements/ENGAGEMENT_ID/confirmations \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "party_type": "CLIENT",
    "party_email": "client@techcorp.com",
    "party_name": "Sarah Johnson",
    "confirmation_type": "bank",
    "description": "Bank balance confirmation as of Dec 31, 2024",
    "due_date": "2025-01-15"
  }'
```

**Expected:** 
- `201 Created`
- New confirmation details
- If new user: email sent with credentials
- **SAVE CONFIRMATION_ID** for next tests

**Confirmation Types:** `bank`, `accounts_receivable`, `accounts_payable`, `inventory`, `legal`, `other`

---

## ✅ PHASE 4: Confirmation Management (4 Routes)

### Route 22: List My Confirmations (GET /api/v1/confirmations/my-confirmations) ✓
**Requires authentication + CLIENT or CONFIRMING_PARTY user type**

```bash
curl http://localhost:3000/api/v1/confirmations/my-confirmations \
  -H "Authorization: Bearer CLIENT_ACCESS_TOKEN"
```

**Expected:** 
- `200 OK`
- List of confirmations assigned to the logged-in user

**Note:** You need to login as a CLIENT or CONFIRMING_PARTY user. Use the credentials sent to the email when you created a confirmation.

---

### Route 23: Get Specific Confirmation (GET /api/v1/confirmations/:id) ✓
**Requires authentication**

```bash
curl http://localhost:3000/api/v1/confirmations/CONFIRMATION_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected:** 
- `200 OK`
- Confirmation details with engagement info

---

### Route 24: Update Confirmation (PATCH /api/v1/confirmations/:id) ✓
**Requires authentication + AUDITOR**

```bash
curl -X PATCH http://localhost:3000/api/v1/confirmations/CONFIRMATION_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated bank balance confirmation",
    "due_date": "2025-01-20"
  }'
```

**Expected:** 
- `200 OK`
- Updated confirmation details

---

### Route 25: Respond to Confirmation (POST /api/v1/confirmations/:id/respond) ✓
**Requires authentication + CLIENT or CONFIRMING_PARTY**

```bash
curl -X POST http://localhost:3000/api/v1/confirmations/CONFIRMATION_ID/respond \
  -H "Authorization: Bearer CLIENT_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "response": "CONFIRMED",
    "comments": "Balance confirmed as accurate"
  }'
```

**Expected:** 
- `200 OK`
- Updated confirmation with response

**Response Options:** `CONFIRMED`, `DISPUTED`, `PENDING`

---

## 🔗 BONUS: Webhook Route (Not typically tested manually)

### Route 26: Payroll Sync Webhook (POST /api/v1/webhooks/payroll-sync)
**No authentication - signature verified**

This is typically called by external systems, not manually tested.

---

## 🎯 Quick Test Script

Here's a bash script to test all routes automatically:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"
API_URL="$BASE_URL/api/v1"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter
PASSED=0
FAILED=0

test_route() {
    local name=$1
    local method=$2
    local url=$3
    local auth=$4
    local data=$5
    
    echo -e "\n${YELLOW}Testing: $name${NC}"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$url" \
            -H "Authorization: Bearer $auth" \
            -H "Content-Type: application/json" \
            -d "$data")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$url" \
            -H "Authorization: Bearer $auth")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [[ $http_code =~ ^2[0-9][0-9]$ ]]; then
        echo -e "${GREEN}✓ PASSED${NC} ($http_code)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ FAILED${NC} ($http_code)"
        echo "$body" | jq -r '.error.message // .message // .'
        FAILED=$((FAILED + 1))
    fi
}

# Test 1: Health Check
test_route "Health Check" "GET" "$BASE_URL/health" "" ""

# Test 2: Login
echo -e "\n${YELLOW}Logging in...${NC}"
login_response=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"'$1'"}')

TOKEN=$(echo $login_response | jq -r '.data.accessToken')
REFRESH_TOKEN=$(echo $login_response | jq -r '.data.refreshToken')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✓ Login successful${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ Login failed${NC}"
    echo $login_response | jq
    FAILED=$((FAILED + 1))
    exit 1
fi

# Test 3: Get Current User
test_route "Get Current User" "GET" "$API_URL/auth/me" "$TOKEN" ""

# Test 4: List Users
test_route "List Users" "GET" "$API_URL/users?page=1&limit=10" "$TOKEN" ""

# Get user ID for next tests
USER_ID=$(curl -s "$API_URL/users" -H "Authorization: Bearer $TOKEN" | jq -r '.data.users[0].id')

# Test 5: Get Specific User
test_route "Get Specific User" "GET" "$API_URL/users/$USER_ID" "$TOKEN" ""

# Test 6: Get User Permissions
test_route "Get User Permissions" "GET" "$API_URL/users/$USER_ID/permissions" "$TOKEN" ""

# Test 7: List Engagements
test_route "List Engagements" "GET" "$API_URL/engagements?page=1&limit=10" "$TOKEN" ""

# Test 8: Create Engagement
engagement_data='{
    "name": "Test Engagement '$(date +%s)'",
    "client_name": "Test Client Corp",
    "description": "Automated test engagement",
    "start_date": "2024-01-01",
    "end_date": "2024-12-31"
}'
create_response=$(curl -s -X POST "$API_URL/engagements" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$engagement_data")

ENGAGEMENT_ID=$(echo $create_response | jq -r '.data.engagement.id')

if [ "$ENGAGEMENT_ID" != "null" ] && [ -n "$ENGAGEMENT_ID" ]; then
    echo -e "${GREEN}✓ Create Engagement${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ Create Engagement failed${NC}"
    FAILED=$((FAILED + 1))
fi

# Test 9: Get Specific Engagement
test_route "Get Specific Engagement" "GET" "$API_URL/engagements/$ENGAGEMENT_ID" "$TOKEN" ""

# Test 10: Update Engagement
test_route "Update Engagement" "PATCH" "$API_URL/engagements/$ENGAGEMENT_ID" "$TOKEN" \
    '{"description": "Updated description"}'

# Test 11: Get Engagement Team
test_route "Get Engagement Team" "GET" "$API_URL/engagements/$ENGAGEMENT_ID/users" "$TOKEN" ""

# Test 12: List Engagement Confirmations
test_route "List Engagement Confirmations" "GET" "$API_URL/engagements/$ENGAGEMENT_ID/confirmations" "$TOKEN" ""

# Test 13: Create Confirmation
confirmation_data='{
    "party_type": "CLIENT",
    "party_email": "testclient'$(date +%s)'@example.com",
    "party_name": "Test Client",
    "confirmation_type": "bank",
    "description": "Test confirmation",
    "due_date": "2025-02-01"
}'
create_conf_response=$(curl -s -X POST "$API_URL/engagements/$ENGAGEMENT_ID/confirmations" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$confirmation_data")

CONFIRMATION_ID=$(echo $create_conf_response | jq -r '.data.confirmation.id')

if [ "$CONFIRMATION_ID" != "null" ] && [ -n "$CONFIRMATION_ID" ]; then
    echo -e "${GREEN}✓ Create Confirmation${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ Create Confirmation failed${NC}"
    FAILED=$((FAILED + 1))
fi

# Test 14: Get Specific Confirmation
test_route "Get Specific Confirmation" "GET" "$API_URL/confirmations/$CONFIRMATION_ID" "$TOKEN" ""

# Test 15: Update Confirmation
test_route "Update Confirmation" "PATCH" "$API_URL/confirmations/$CONFIRMATION_ID" "$TOKEN" \
    '{"description": "Updated confirmation"}'

# Test 16: Refresh Token
test_route "Refresh Token" "POST" "$API_URL/auth/refresh" "" \
    '{"refreshToken": "'$REFRESH_TOKEN'"}'

# Summary
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ PASSED: $PASSED${NC}"
echo -e "${RED}✗ FAILED: $FAILED${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed!${NC}\n"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed${NC}\n"
    exit 1
fi
```

**Save as:** `test-all-routes.sh`

**Run:**
```bash
chmod +x test-all-routes.sh
./test-all-routes.sh YOUR_ADMIN_PASSWORD
```

---

## 📊 Testing Checklist

Track your progress:

### Phase 1: Health & Auth (6)
- [ ] Route 1: GET /health
- [ ] Route 2: POST /auth/login
- [ ] Route 3: GET /auth/me
- [ ] Route 4: POST /auth/change-password
- [ ] Route 5: POST /auth/refresh
- [ ] Route 6: POST /auth/logout

### Phase 2: Users (6)
- [ ] Route 7: GET /users
- [ ] Route 8: GET /users/:id
- [ ] Route 9: GET /users/:id/permissions
- [ ] Route 10: POST /users
- [ ] Route 11: PATCH /users/:id
- [ ] Route 12: DELETE /users/:id

### Phase 3: Engagements (9)
- [ ] Route 13: GET /engagements
- [ ] Route 14: GET /engagements/:id
- [ ] Route 15: POST /engagements
- [ ] Route 16: PATCH /engagements/:id
- [ ] Route 17: GET /engagements/:id/users
- [ ] Route 18: POST /engagements/:id/users
- [ ] Route 19: DELETE /engagements/:id/users/:userId
- [ ] Route 20: GET /engagements/:id/confirmations
- [ ] Route 21: POST /engagements/:id/confirmations

### Phase 4: Confirmations (4)
- [ ] Route 22: GET /confirmations/my-confirmations
- [ ] Route 23: GET /confirmations/:id
- [ ] Route 24: PATCH /confirmations/:id
- [ ] Route 25: POST /confirmations/:id/respond

---

## 🎉 Success!

If you've completed all 25 route tests, you've fully validated your API! 🚀

**Next Steps:**
1. Create a Postman collection for repeated testing
2. Set up automated integration tests
3. Test error scenarios (invalid data, unauthorized access, etc.)
4. Load testing with multiple concurrent requests


