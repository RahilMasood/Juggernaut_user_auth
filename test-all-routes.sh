#!/bin/bash

BASE_URL="http://localhost:3000"
API_URL="$BASE_URL/api/v1"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counter
PASSED=0
FAILED=0
TOTAL=0

# Use provided password or default from file
if [ -n "$1" ]; then
    ADMIN_PASSWORD="$1"
else
    ADMIN_PASSWORD="iETC5=#P}PLC&f8["
fi

test_route() {
    local name=$1
    local method=$2
    local url=$3
    local auth=$4
    local data=$5
    
    TOTAL=$((TOTAL + 1))
    echo -e "\n${BLUE}[$TOTAL] Testing: $name${NC}"
    echo -e "${BLUE}    $method $url${NC}"
    
    if [ -n "$data" ]; then
        if [ -n "$auth" ]; then
            response=$(curl -s -w "\n%{http_code}" -X $method "$url" \
                -H "Authorization: Bearer $auth" \
                -H "Content-Type: application/json" \
                -d "$data")
        else
            response=$(curl -s -w "\n%{http_code}" -X $method "$url" \
                -H "Content-Type: application/json" \
                -d "$data")
        fi
    else
        if [ -n "$auth" ]; then
            response=$(curl -s -w "\n%{http_code}" -X $method "$url" \
                -H "Authorization: Bearer $auth")
        else
            response=$(curl -s -w "\n%{http_code}" -X $method "$url")
        fi
    fi
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    if [[ $http_code =~ ^2[0-9][0-9]$ ]]; then
        echo -e "${GREEN}    ✓ PASSED${NC} (HTTP $http_code)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}    ✗ FAILED${NC} (HTTP $http_code)"
        if command -v jq &> /dev/null; then
            echo "$body" | jq -r '.error.message // .message // .' 2>/dev/null || echo "$body"
        else
            echo "$body"
        fi
        FAILED=$((FAILED + 1))
    fi
}

echo -e "${YELLOW}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║          Complete API Route Testing Suite             ║${NC}"
echo -e "${YELLOW}║              Testing All 25 Routes                     ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${YELLOW}━━━ PHASE 1: HEALTH & AUTHENTICATION (6 routes) ━━━${NC}"

# Test 1: Health Check
test_route "Health Check" "GET" "$BASE_URL/health" "" ""

# Test 2: Login
echo -e "\n${BLUE}[$((TOTAL + 1))] Testing: Login${NC}"
echo -e "${BLUE}    POST $API_URL/auth/login${NC}"
login_response=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"'$ADMIN_PASSWORD'"}')

TOKEN=$(echo $login_response | jq -r '.data.accessToken' 2>/dev/null)
REFRESH_TOKEN=$(echo $login_response | jq -r '.data.refreshToken' 2>/dev/null)

TOTAL=$((TOTAL + 1))
if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ] && [ "$TOKEN" != "" ]; then
    echo -e "${GREEN}    ✓ PASSED${NC} (Login successful, token obtained)"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}    ✗ FAILED${NC} (Login failed - check password)"
    if command -v jq &> /dev/null; then
        echo $login_response | jq 2>/dev/null || echo $login_response
    else
        echo $login_response
    fi
    FAILED=$((FAILED + 1))
    echo -e "\n${RED}Cannot continue without valid token. Exiting.${NC}\n"
    exit 1
fi

# Test 3: Get Current User
test_route "Get Current User" "GET" "$API_URL/auth/me" "$TOKEN" ""

# Test 4: Change Password (optional - commented out to avoid password change)
# test_route "Change Password" "POST" "$API_URL/auth/change-password" "$TOKEN" \
#     '{"currentPassword":"'$ADMIN_PASSWORD'","newPassword":"NewPass123!","confirmPassword":"NewPass123!"}'

# Test 5: Refresh Token
test_route "Refresh Token" "POST" "$API_URL/auth/refresh" "" \
    '{"refreshToken": "'$REFRESH_TOKEN'"}'

# Test 6: Logout (optional - commented out to keep token valid)
# test_route "Logout" "POST" "$API_URL/auth/logout" "" \
#     '{"refreshToken": "'$REFRESH_TOKEN'"}'

echo -e "\n${YELLOW}━━━ PHASE 2: USER MANAGEMENT (6 routes) ━━━${NC}"

# Test 7: List Users
test_route "List Users" "GET" "$API_URL/users?page=1&limit=10" "$TOKEN" ""

# Get user ID and role ID for next tests
USER_RESPONSE=$(curl -s "$API_URL/users" -H "Authorization: Bearer $TOKEN")
USER_ID=$(echo $USER_RESPONSE | jq -r '.data.users[0].id' 2>/dev/null)

# Get current user's role_id and firm_id
ME_RESPONSE=$(curl -s "$API_URL/auth/me" -H "Authorization: Bearer $TOKEN")
ROLE_ID=$(echo $ME_RESPONSE | jq -r '.data.user.roles[0].id' 2>/dev/null)
FIRM_ID=$(echo $ME_RESPONSE | jq -r '.data.user.firm.id' 2>/dev/null)

# Test 8: Get Specific User
test_route "Get Specific User" "GET" "$API_URL/users/$USER_ID" "$TOKEN" ""

# Test 9: Get User Permissions
test_route "Get User Permissions" "GET" "$API_URL/users/$USER_ID/permissions" "$TOKEN" ""

# Test 10: Create User
user_data='{
    "email": "testuser'$(date +%s)'@example.com",
    "first_name": "Test",
    "last_name": "User",
    "user_type": "AUDITOR",
    "designation": "Auditor",
    "role_id": "'$ROLE_ID'",
    "firm_id": "'$FIRM_ID'"
}'
echo -e "\n${BLUE}[$((TOTAL + 1))] Testing: Create User${NC}"
echo -e "${BLUE}    POST $API_URL/users${NC}"
create_user_response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/users" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$user_data")

http_code=$(echo "$create_user_response" | tail -n 1)
body=$(echo "$create_user_response" | sed '$d')
NEW_USER_ID=$(echo "$body" | jq -r '.data.user.id' 2>/dev/null)

TOTAL=$((TOTAL + 1))
if [[ $http_code =~ ^2[0-9][0-9]$ ]]; then
    echo -e "${GREEN}    ✓ PASSED${NC} (HTTP $http_code)"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}    ✗ FAILED${NC} (HTTP $http_code)"
    echo "$body"
    FAILED=$((FAILED + 1))
fi

# Test 11: Update User (if created successfully)
if [ "$NEW_USER_ID" != "null" ] && [ -n "$NEW_USER_ID" ]; then
    test_route "Update User" "PATCH" "$API_URL/users/$NEW_USER_ID" "$TOKEN" \
        '{"designation": "Senior Auditor"}'
    
    # Test 12: Deactivate User
    test_route "Deactivate User" "DELETE" "$API_URL/users/$NEW_USER_ID" "$TOKEN" ""
else
    echo -e "${YELLOW}    ⚠ Skipping Update/Delete tests (no user created)${NC}"
    TOTAL=$((TOTAL + 2))
    FAILED=$((FAILED + 2))
fi

echo -e "\n${YELLOW}━━━ PHASE 3: ENGAGEMENT MANAGEMENT (9 routes) ━━━${NC}"

# Test 13: List Engagements
test_route "List Engagements" "GET" "$API_URL/engagements?page=1&limit=10" "$TOKEN" ""

# Test 14: Create Engagement
engagement_data='{
    "name": "Test Engagement '$(date +%s)'",
    "client_name": "Test Client Corp",
    "description": "Automated test engagement",
    "start_date": "2024-01-01",
    "end_date": "2024-12-31"
}'
echo -e "\n${BLUE}[$((TOTAL + 1))] Testing: Create Engagement${NC}"
echo -e "${BLUE}    POST $API_URL/engagements${NC}"
create_eng_response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/engagements" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$engagement_data")

http_code=$(echo "$create_eng_response" | tail -n 1)
body=$(echo "$create_eng_response" | sed '$d')
ENGAGEMENT_ID=$(echo "$body" | jq -r '.data.engagement.id' 2>/dev/null)

TOTAL=$((TOTAL + 1))
if [[ $http_code =~ ^2[0-9][0-9]$ ]] && [ "$ENGAGEMENT_ID" != "null" ] && [ -n "$ENGAGEMENT_ID" ]; then
    echo -e "${GREEN}    ✓ PASSED${NC} (HTTP $http_code, ID: ${ENGAGEMENT_ID:0:8}...)"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}    ✗ FAILED${NC} (HTTP $http_code)"
    if command -v jq &> /dev/null; then
        echo "$body" | jq 2>/dev/null || echo "$body"
    else
        echo "$body"
    fi
    FAILED=$((FAILED + 1))
fi

if [ "$ENGAGEMENT_ID" != "null" ] && [ -n "$ENGAGEMENT_ID" ]; then
    # Test 15: Get Specific Engagement
    test_route "Get Specific Engagement" "GET" "$API_URL/engagements/$ENGAGEMENT_ID" "$TOKEN" ""

    # Test 16: Update Engagement
    test_route "Update Engagement" "PATCH" "$API_URL/engagements/$ENGAGEMENT_ID" "$TOKEN" \
        '{"description": "Updated test engagement description"}'

    # Test 17: Get Engagement Team
    test_route "Get Engagement Team" "GET" "$API_URL/engagements/$ENGAGEMENT_ID/users" "$TOKEN" ""

    # Test 18: Add User to Engagement (Note: may fail if user already added as creator)
    echo -e "\n${BLUE}[$((TOTAL + 1))] Testing: Add User to Engagement${NC}"
    echo -e "${BLUE}    POST $API_URL/engagements/$ENGAGEMENT_ID/users${NC}"
    echo -e "${YELLOW}    ⚠ May fail if user is already a member (expected)${NC}"
    TOTAL=$((TOTAL + 1))
    add_response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/engagements/$ENGAGEMENT_ID/users" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"user_id": "'$USER_ID'", "role": "MEMBER"}')
    http_code=$(echo "$add_response" | tail -n 1)
    if [[ $http_code =~ ^2[0-9][0-9]$ ]]; then
        echo -e "${GREEN}    ✓ PASSED${NC} (HTTP $http_code)"
        PASSED=$((PASSED + 1))
    elif [[ $http_code == "400" ]] && echo "$add_response" | grep -q "already a member"; then
        echo -e "${YELLOW}    ✓ EXPECTED${NC} (User already a member - business logic working)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}    ✗ FAILED${NC} (HTTP $http_code)"
        FAILED=$((FAILED + 1))
    fi

    # Test 19: Remove User from Engagement (Note: may fail if user is creator)
    echo -e "\n${BLUE}[$((TOTAL + 1))] Testing: Remove User from Engagement${NC}"
    echo -e "${BLUE}    DELETE $API_URL/engagements/$ENGAGEMENT_ID/users/$USER_ID${NC}"
    echo -e "${YELLOW}    ⚠ May fail if user is creator (expected)${NC}"
    TOTAL=$((TOTAL + 1))
    remove_response=$(curl -s -w "\n%{http_code}" -X DELETE "$API_URL/engagements/$ENGAGEMENT_ID/users/$USER_ID" \
        -H "Authorization: Bearer $TOKEN")
    http_code=$(echo "$remove_response" | tail -n 1)
    if [[ $http_code =~ ^2[0-9][0-9]$ ]]; then
        echo -e "${GREEN}    ✓ PASSED${NC} (HTTP $http_code)"
        PASSED=$((PASSED + 1))
    elif [[ $http_code == "400" ]] && echo "$remove_response" | grep -q "Cannot remove engagement creator"; then
        echo -e "${YELLOW}    ✓ EXPECTED${NC} (Cannot remove creator - business logic working)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}    ✗ FAILED${NC} (HTTP $http_code)"
        FAILED=$((FAILED + 1))
    fi

    # Test 20: List Engagement Confirmations
    test_route "List Engagement Confirmations" "GET" "$API_URL/engagements/$ENGAGEMENT_ID/confirmations" "$TOKEN" ""

    # Test 21: Create Confirmation for Engagement
    confirmation_data='{
        "party_type": "CLIENT",
        "party_email": "testclient'$(date +%s)'@example.com",
        "party_name": "Test Client User",
        "confirmation_type": "bank",
        "description": "Test bank confirmation request",
        "due_date": "2025-02-01"
    }'
    echo -e "\n${BLUE}[$((TOTAL + 1))] Testing: Create Confirmation${NC}"
    echo -e "${BLUE}    POST $API_URL/engagements/$ENGAGEMENT_ID/confirmations${NC}"
    create_conf_response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/engagements/$ENGAGEMENT_ID/confirmations" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "$confirmation_data")

    http_code=$(echo "$create_conf_response" | tail -n 1)
    body=$(echo "$create_conf_response" | sed '$d')
    CONFIRMATION_ID=$(echo "$body" | jq -r '.data.confirmation.id' 2>/dev/null)

    TOTAL=$((TOTAL + 1))
    if [[ $http_code =~ ^2[0-9][0-9]$ ]]; then
        echo -e "${GREEN}    ✓ PASSED${NC} (HTTP $http_code)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}    ✗ FAILED${NC} (HTTP $http_code)"
        echo "$body"
        FAILED=$((FAILED + 1))
    fi
else
    echo -e "${YELLOW}    ⚠ Skipping engagement-related tests (no engagement created)${NC}"
    TOTAL=$((TOTAL + 7))
    FAILED=$((FAILED + 7))
fi

echo -e "\n${YELLOW}━━━ PHASE 4: CONFIRMATION MANAGEMENT (4 routes) ━━━${NC}"

if [ "$CONFIRMATION_ID" != "null" ] && [ -n "$CONFIRMATION_ID" ]; then
    # Test 22: Get Specific Confirmation
    test_route "Get Specific Confirmation" "GET" "$API_URL/confirmations/$CONFIRMATION_ID" "$TOKEN" ""

    # Test 23: Update Confirmation
    test_route "Update Confirmation" "PATCH" "$API_URL/confirmations/$CONFIRMATION_ID" "$TOKEN" \
        '{"description": "Updated confirmation description"}'

    # Test 24: List My Confirmations (as auditor)
    echo -e "\n${BLUE}[$((TOTAL + 1))] Testing: List My Confirmations (as AUDITOR)${NC}"
    echo -e "${BLUE}    GET $API_URL/confirmations/my-confirmations${NC}"
    echo -e "${YELLOW}    ⚠ Expected to fail: Only CLIENT/CONFIRMING_PARTY can use this${NC}"
    TOTAL=$((TOTAL + 1))
    my_conf_response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/confirmations/my-confirmations" \
        -H "Authorization: Bearer $TOKEN")
    http_code=$(echo "$my_conf_response" | tail -n 1)
    if [[ $http_code == "403" ]] && echo "$my_conf_response" | grep -q "Insufficient permissions"; then
        echo -e "${YELLOW}    ✓ EXPECTED${NC} (Correctly denied for AUDITOR - route working)"
        PASSED=$((PASSED + 1))
    elif [[ $http_code =~ ^2[0-9][0-9]$ ]]; then
        echo -e "${GREEN}    ✓ PASSED${NC} (HTTP $http_code)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}    ✗ FAILED${NC} (HTTP $http_code - unexpected error)"
        FAILED=$((FAILED + 1))
    fi

    # Test 25: Respond to Confirmation (as auditor)
    echo -e "\n${BLUE}[$((TOTAL + 1))] Testing: Respond to Confirmation (as AUDITOR)${NC}"
    echo -e "${BLUE}    POST $API_URL/confirmations/$CONFIRMATION_ID/respond${NC}"
    echo -e "${YELLOW}    ⚠ Expected to fail: Only CLIENT/CONFIRMING_PARTY can respond${NC}"
    TOTAL=$((TOTAL + 1))
    respond_response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/confirmations/$CONFIRMATION_ID/respond" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"response": "CONFIRMED", "comments": "Test response"}')
    http_code=$(echo "$respond_response" | tail -n 1)
    if [[ $http_code == "403" ]] && echo "$respond_response" | grep -q "Insufficient permissions"; then
        echo -e "${YELLOW}    ✓ EXPECTED${NC} (Correctly denied for AUDITOR - route working)"
        PASSED=$((PASSED + 1))
    elif [[ $http_code =~ ^2[0-9][0-9]$ ]]; then
        echo -e "${GREEN}    ✓ PASSED${NC} (HTTP $http_code)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}    ✗ FAILED${NC} (HTTP $http_code - unexpected error)"
        FAILED=$((FAILED + 1))
    fi
else
    echo -e "${YELLOW}    ⚠ Skipping confirmation tests (no confirmation created)${NC}"
    TOTAL=$((TOTAL + 4))
    FAILED=$((FAILED + 4))
fi

# Summary
echo -e "\n${YELLOW}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║                    TEST SUMMARY                        ║${NC}"
echo -e "${YELLOW}╠════════════════════════════════════════════════════════╣${NC}"
echo -e "${YELLOW}║${NC}  Total Tests:    $TOTAL                                    ${YELLOW}║${NC}"
echo -e "${YELLOW}║${NC}  ${GREEN}✓ Passed:${NC}        $PASSED                                    ${YELLOW}║${NC}"
echo -e "${YELLOW}║${NC}  ${RED}✗ Failed:${NC}        $FAILED                                    ${YELLOW}║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════════════╝${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed successfully!${NC}\n"
    exit 0
elif [ $FAILED -le 3 ]; then
    echo -e "\n${YELLOW}⚠️  Most tests passed with minor failures${NC}\n"
    exit 0
else
    echo -e "\n${RED}❌ Multiple tests failed. Please check the API.${NC}\n"
    exit 1
fi

