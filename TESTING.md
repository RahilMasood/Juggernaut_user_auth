# 🧪 API Testing Guide

## Quick Health Check

### 1. Basic Health Check
```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-12-21T13:30:00.000Z"
  }
}
```

✅ If you see this, your API is running!

---

## Complete API Test Flow

### Step 1: Login as Admin

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "YOUR_PASSWORD_FROM_SEED"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "admin@example.com",
      "first_name": "Admin",
      "last_name": "User",
      "user_type": "AUDITOR",
      "designation": "Partner",
      "is_active": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "mustChangePassword": true
  }
}
```

**📝 Save the `accessToken`** - you'll need it for all subsequent requests!

---

### Step 2: Get Current User Info

Replace `YOUR_TOKEN` with the accessToken from Step 1:

```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "first_name": "Admin",
      "last_name": "User",
      "firm": {
        "id": "uuid",
        "name": "Example Audit Firm"
      },
      "roles": [
        {
          "id": "uuid",
          "name": "Partner",
          "permissions": [...]
        }
      ]
    }
  }
}
```

---

### Step 3: List Users

```bash
curl http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "admin@example.com",
        "first_name": "Admin",
        "last_name": "User",
        "user_type": "AUDITOR",
        "designation": "Partner"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

### Step 4: Create an Engagement

```bash
curl -X POST http://localhost:3000/api/v1/engagements \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Annual Audit 2024",
    "client_name": "ABC Corporation",
    "description": "Year-end financial audit",
    "start_date": "2024-01-01",
    "end_date": "2024-03-31"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "engagement": {
      "id": "uuid",
      "name": "Annual Audit 2024",
      "client_name": "ABC Corporation",
      "description": "Year-end financial audit",
      "start_date": "2024-01-01T00:00:00.000Z",
      "end_date": "2024-03-31T00:00:00.000Z",
      "status": "ACTIVE",
      "created_by": "uuid",
      "firm_id": "uuid"
    }
  }
}
```

**📝 Save the engagement `id`** for the next steps!

---

### Step 5: List Engagements

```bash
curl http://localhost:3000/api/v1/engagements \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "engagements": [
      {
        "id": "uuid",
        "name": "Annual Audit 2024",
        "client_name": "ABC Corporation",
        "status": "ACTIVE",
        "start_date": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

### Step 6: Get Engagement Details

Replace `ENGAGEMENT_ID` with the id from Step 4:

```bash
curl http://localhost:3000/api/v1/engagements/ENGAGEMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "engagement": {
      "id": "uuid",
      "name": "Annual Audit 2024",
      "client_name": "ABC Corporation",
      "description": "Year-end financial audit",
      "status": "ACTIVE",
      "firm": {
        "id": "uuid",
        "name": "Example Audit Firm"
      },
      "creator": {
        "id": "uuid",
        "email": "admin@example.com",
        "first_name": "Admin",
        "last_name": "User"
      },
      "teamMembers": [
        {
          "id": "uuid",
          "email": "admin@example.com",
          "first_name": "Admin",
          "last_name": "User",
          "engagement_users": {
            "role": "LEAD"
          }
        }
      ]
    }
  }
}
```

---

### Step 7: Create a Confirmation Request

Replace `ENGAGEMENT_ID`:

```bash
curl -X POST http://localhost:3000/api/v1/engagements/ENGAGEMENT_ID/confirmations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "party_type": "CLIENT",
    "party_email": "client@abccorp.com",
    "party_name": "John Smith",
    "confirmation_type": "bank",
    "description": "Bank balance confirmation as of Dec 31, 2023",
    "due_date": "2024-02-15"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "confirmation": {
      "id": "uuid",
      "engagement_id": "uuid",
      "party_type": "CLIENT",
      "confirmation_type": "bank",
      "description": "Bank balance confirmation as of Dec 31, 2023",
      "status": "PENDING",
      "due_date": "2024-02-15T00:00:00.000Z"
    },
    "isNewUser": true,
    "credentialsSent": true
  }
}
```

**✅ This creates a new user and sends them an email with login credentials!**

---

### Step 8: List Confirmations

```bash
curl http://localhost:3000/api/v1/engagements/ENGAGEMENT_ID/confirmations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "confirmations": [
      {
        "id": "uuid",
        "party_type": "CLIENT",
        "confirmation_type": "bank",
        "status": "PENDING",
        "partyUser": {
          "id": "uuid",
          "email": "client@abccorp.com",
          "first_name": "John",
          "last_name": "Smith"
        }
      }
    ]
  }
}
```

---

## 🎯 Interactive Testing with Postman

### Setup Postman Collection

1. **Open Postman**

2. **Create Environment:**
   - Name: `Audit API Local`
   - Variables:
     - `base_url`: `http://localhost:3000/api/v1`
     - `access_token`: (leave empty for now)

3. **Create Collection:** "Audit Software API"

4. **Add Login Request:**
   - Name: `Login`
   - Method: `POST`
   - URL: `{{base_url}}/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "admin@example.com",
       "password": "YOUR_PASSWORD"
     }
     ```
   - Tests (auto-save token):
     ```javascript
     if (pm.response.code === 200) {
         const response = pm.response.json();
         pm.environment.set("access_token", response.data.accessToken);
     }
     ```

5. **Add Other Requests:**
   - Use `{{base_url}}` for URL
   - Add header: `Authorization: Bearer {{access_token}}`

---

## 🔍 Check Database Directly

### Connect to PostgreSQL:
```bash
docker compose exec postgres psql -U postgres -d audit_software
```

### Useful Queries:

```sql
-- List all tables
\dt

-- Count users
SELECT COUNT(*) FROM users;

-- View all users
SELECT id, email, first_name, last_name, user_type, designation FROM users;

-- View engagements
SELECT id, name, client_name, status FROM engagements;

-- View confirmations
SELECT id, party_type, confirmation_type, status FROM confirmation_requests;

-- View permissions
SELECT name, description, category FROM permissions;

-- View audit logs
SELECT action, resource_type, status, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 10;

-- Exit
\q
```

---

## 📊 Check Docker Logs

### View API Logs:
```bash
docker compose logs -f api
```

**Look for:**
- `Server running on port 3000`
- `Database connection established successfully`
- Request logs: `GET /health`, `POST /api/v1/auth/login`

### View Database Logs:
```bash
docker compose logs -f postgres
```

---

## ✅ Success Checklist

Run through this checklist:

- [ ] Health check returns `"status": "healthy"`
- [ ] Login returns access token
- [ ] Can get current user info
- [ ] Can list users
- [ ] Can create engagement
- [ ] Can list engagements
- [ ] Can create confirmation request
- [ ] Can list confirmations
- [ ] Database has data (check with psql)
- [ ] Logs show no errors

---

## 🚨 Common Issues

### "Invalid credentials"
- Check the password from `seed-admin` output
- Password is case-sensitive

### "Unauthorized" or "Invalid token"
- Token expired (15 minutes)
- Get a new token by logging in again

### "Forbidden" or "Insufficient permissions"
- User doesn't have required permission
- Check user roles and permissions

### "Not found"
- Check the ID in the URL
- Make sure resource exists

---

## 🎨 Pretty Print JSON (Optional)

Add `| jq` to format JSON output:

```bash
curl http://localhost:3000/health | jq
```

Install jq:
```bash
brew install jq
```

---

## 📝 Save Your Token

To avoid copying the token every time:

```bash
# Login and save token
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"YOUR_PASSWORD"}' \
  | jq -r '.data.accessToken')

# Use the token
curl http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🎯 Quick Test Script

Create a file `test-api.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"
PASSWORD="YOUR_PASSWORD_HERE"

echo "1. Testing health..."
curl -s $BASE_URL/health | jq

echo -e "\n2. Logging in..."
TOKEN=$(curl -s -X POST $BASE_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@example.com\",\"password\":\"$PASSWORD\"}" \
  | jq -r '.data.accessToken')

echo "Token: ${TOKEN:0:20}..."

echo -e "\n3. Getting current user..."
curl -s $BASE_URL/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq

echo -e "\n4. Listing users..."
curl -s $BASE_URL/api/v1/users \
  -H "Authorization: Bearer $TOKEN" | jq

echo -e "\n5. Listing engagements..."
curl -s $BASE_URL/api/v1/engagements \
  -H "Authorization: Bearer $TOKEN" | jq

echo -e "\n✅ All tests complete!"
```

Run it:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## 🎉 You're All Set!

If all the tests above work, your API is fully functional and ready for development!

**Next Steps:**
1. Build your frontend application
2. Integrate with the API endpoints
3. Test the complete user flows
4. Deploy to production when ready

Need help? Check the main `README.md` for complete API documentation!



