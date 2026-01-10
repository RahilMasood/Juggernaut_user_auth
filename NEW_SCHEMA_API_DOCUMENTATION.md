# New Schema API Documentation

## Overview

The API has been restructured to match the new normalized database schema with 3 distinct pages/functionalities:

1. **Page 1: Main Website (Admin Login + User CRUD)**
2. **Page 2: Client Onboarding**
3. **Page 3: Engagement Management**

---

## Database Schema

### Tables

#### `firms`
- `id` (UUID, PK)
- `tenant_id` (STRING, UNIQUE)
- `client_id` (STRING)
- `client_secret` (STRING)
- `admin_id` (STRING, UNIQUE)
- `admin_password` (STRING, hashed)

#### `users`
- `id` (UUID, PK)
- `firm_id` (UUID, FK → firms.id)
- `user_name` (STRING)
- `email` (STRING, UNIQUE)
- `password_hash` (STRING)
- `type` (ENUM: 'partner', 'manager', 'associate', 'article')
- `payroll_id` (STRING, nullable) - for webhook user replacement
- `is_active` (BOOLEAN)
- Other security fields (failed_login_attempts, locked_until, etc.)

#### `audit_clients`
- `id` (UUID, PK)
- `firm_id` (UUID, FK → firms.id)
- `client_name` (STRING)
- `status` (ENUM: 'Active', 'Archived')

#### `engagements`
- `id` (UUID, PK)
- `audit_client_id` (UUID, FK → audit_clients.id)
- `status` (ENUM: 'Active', 'Archived')

#### `engagement_users`
- `id` (UUID, PK)
- `engagement_id` (UUID, FK → engagements.id)
- `user_id` (UUID, FK → users.id)
- `role` (ENUM: 'engagement_partner', 'eqr_partner', 'engagement_manager', 'eqr_manager', 'associate', 'article')
- UNIQUE constraint on (engagement_id, user_id)

---

## API Endpoints

### Page 1: Main Website (Admin Login + User CRUD)

#### Admin Login
```
POST /api/v1/admin/login
Content-Type: application/json

{
  "admin_id": "admin123",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "firm": {
      "id": "uuid",
      "tenant_id": "tenant123",
      "admin_id": "admin123"
    },
    "accessToken": "jwt_token"
  }
}
```

#### Get Current Admin
```
GET /api/v1/admin/me
Authorization: Bearer <admin_access_token>

Response:
{
  "success": true,
  "data": {
    "firm": { ... }
  }
}
```

#### Create User
```
POST /api/v1/admin/users
Authorization: Bearer <admin_access_token>
Content-Type: application/json

{
  "user_name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "type": "partner",
  "payroll_id": "payroll123" // optional
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "user_name": "John Doe",
      "email": "john@example.com",
      "type": "partner",
      "payroll_id": "payroll123"
    },
    "message": "User created successfully"
  }
}
```

#### List Users
```
GET /api/v1/admin/users
Authorization: Bearer <admin_access_token>

Response:
{
  "success": true,
  "data": {
    "users": [ ... ]
  }
}
```

#### Get User
```
GET /api/v1/admin/users/:id
Authorization: Bearer <admin_access_token>
```

#### Update User
```
PATCH /api/v1/admin/users/:id
Authorization: Bearer <admin_access_token>
Content-Type: application/json

{
  "user_name": "John Updated",
  "email": "john.updated@example.com",
  "type": "manager",
  "payroll_id": "new_payroll_id"
}
```

#### Delete User
```
DELETE /api/v1/admin/users/:id
Authorization: Bearer <admin_access_token>
```

---

### Page 2: Client Onboarding

#### Create Audit Client (with default engagement)
```
POST /api/v1/admin/clients
Authorization: Bearer <admin_access_token>
Content-Type: application/json

{
  "client_name": "ABC Corporation",
  "engagement_partner_id": "user_uuid_1",
  "engagement_manager_id": "user_uuid_2"
}

Response:
{
  "success": true,
  "data": {
    "client": {
      "id": "uuid",
      "firm_id": "uuid",
      "client_name": "ABC Corporation",
      "status": "Active",
      "engagements": [
        {
          "id": "engagement_uuid",
          "status": "Active",
          "teamMembers": [
            {
              "id": "user_uuid_1",
              "user_name": "Partner Name",
              "email": "partner@example.com",
              "type": "partner"
            },
            {
              "id": "user_uuid_2",
              "user_name": "Manager Name",
              "email": "manager@example.com",
              "type": "manager"
            }
          ]
        }
      ]
    },
    "message": "Client created successfully with default engagement"
  }
}
```

#### List Audit Clients
```
GET /api/v1/admin/clients
Authorization: Bearer <admin_access_token>
```

#### Get Audit Client
```
GET /api/v1/admin/clients/:id
Authorization: Bearer <admin_access_token>
```

---

### Page 3: Engagement Management

#### Create Engagement
```
POST /api/v1/admin/clients/:clientId/engagements
Authorization: Bearer <admin_access_token>
Content-Type: application/json

{
  "engagement_partner_id": "user_uuid_1", // optional - will copy from previous engagement if not provided
  "engagement_manager_id": "user_uuid_2"   // optional - will copy from previous engagement if not provided
}

Response:
{
  "success": true,
  "data": {
    "engagement": {
      "id": "uuid",
      "audit_client_id": "uuid",
      "status": "Active",
      "teamMembers": [ ... ]
    },
    "message": "Engagement created successfully"
  }
}
```

#### List Engagements for Client
```
GET /api/v1/admin/clients/:clientId/engagements
Authorization: Bearer <admin_access_token>
```

#### Get Engagement
```
GET /api/v1/admin/engagements/:id
Authorization: Bearer <admin_access_token>
```

#### Add User to Engagement
```
POST /api/v1/admin/engagements/:id/users
Authorization: Bearer <admin_access_token>
Content-Type: application/json

{
  "user_id": "user_uuid",
  "role": "associate" // or 'engagement_partner', 'eqr_partner', 'engagement_manager', 'eqr_manager', 'article'
}

Response:
{
  "success": true,
  "data": {
    "engagementUser": {
      "id": "uuid",
      "engagement_id": "uuid",
      "user_id": "uuid",
      "role": "associate"
    },
    "message": "User added to engagement successfully"
  }
}
```

#### Remove User from Engagement
```
DELETE /api/v1/admin/engagements/:id/users/:userId
Authorization: Bearer <admin_access_token>
```

---

## User Login (Still Works)

Regular users can still log in using their email and password:

```
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

---

## Migration

To apply the new schema, run:

```bash
node migrations/migrate-new-schema.js
```

This will:
1. Update existing tables to match the new schema
2. Create new tables (audit_clients)
3. Migrate data where possible
4. Set up proper foreign keys and indexes

**Note:** Make sure to backup your database before running the migration!

---

## Key Changes

1. **Firm table**: Now stores admin credentials (admin_id, admin_password) instead of just firm info
2. **User table**: 
   - Changed from `first_name`/`last_name` to `user_name`
   - Changed from `user_type` to `type` (partner/manager/associate/article)
   - Removed role from user (roles are now engagement-specific)
   - Added `payroll_id` for webhook user replacement
3. **New AuditClient table**: Separates clients from engagements
4. **Engagement table**: Simplified - only has audit_client_id and status
5. **EngagementUser table**: 
   - Now has its own primary key (id)
   - Role enum updated to match engagement-specific roles

---

## Payroll ID Feature

The `payroll_id` field in the users table is reserved for future webhook functionality. When a user leaves the firm, the same `user_id` can be assigned to a different person using the `payroll_id` for identification. This allows user replacement without creating new user accounts, maintaining engagement history.

---

## Authentication

- **Admin routes**: Use `/api/v1/admin/*` and require admin authentication via `admin_id`/`admin_password`
- **User routes**: Use `/api/v1/auth/*` and `/api/v1/users/*` for regular user authentication
- All admin routes require the `Authorization: Bearer <admin_access_token>` header
- Admin tokens are generated separately from user tokens

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

Common error codes:
- `UNAUTHORIZED` - Invalid or missing authentication
- `VALIDATION_ERROR` - Request validation failed
- `NOT_FOUND` - Resource not found
- `FORBIDDEN` - Insufficient permissions

