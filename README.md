# Audit Software API

A secure, production-ready Node.js REST API for audit software with user authentication, role-based access control, engagement management, confirmation tool, client onboarding, and independence declaration functionality.

## Features

- **JWT Authentication** with refresh token rotation
- **Role-Based Access Control (RBAC)** with custom permissions
- **Designation-Based Policy Engine** for firm-specific access rules
- **Engagement Management** with team-based access control
- **Confirmation Tool** with automated email notifications
- **Client Onboarding Tool** with designated partners and managers
- **Independence Tool** with declaration tracking and SharePoint integration
- **Audit Logging** for compliance and security
- **Payroll Integration** via secure webhooks
- **Multi-User Types**: Auditors, Clients, and Confirming Parties
- **Default Password System** with automatic credential delivery and forced password change

## Technology Stack

- **Node.js** 18+ LTS
- **Express.js** 4.x
- **PostgreSQL** 15+ (with Sequelize ORM)
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Nodemailer** for email notifications
- **Winston** for logging

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 15+ installed and running
- SMTP server credentials for email notifications

## Installation

1. **Clone the repository** (or start fresh in the project directory)

```bash
cd vertiapi
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` and configure the following:

- Database connection settings
- JWT secrets (generate secure random strings)
- SMTP email settings
- Webhook secrets
- Encryption keys

4. **Create PostgreSQL database**

```bash
createdb audit_software
```

5. **Run database migrations**

```bash
npm run migrate
```

This will create all tables and seed default permissions.

## Running the Application

### Development Mode

```bash
npm run dev
```

The API will start on `http://localhost:3000` (or your configured PORT).

### Production Mode

```bash
npm start
```

## API Documentation

### Base URL

```
http://localhost:3000/api/v1
```

### Authentication Endpoints

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "mustChangePassword": false
  }
}
```

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

#### Logout
```http
POST /auth/logout
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <accessToken>
```

#### Change Password
```http
POST /auth/change-password
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "old_password": "OldPassword123!",
  "new_password": "NewPassword456!"
}
```

### User Management Endpoints

#### List Users
```http
GET /users?page=1&limit=20&user_type=AUDITOR
Authorization: Bearer <accessToken>
```

#### Get User
```http
GET /users/:id
Authorization: Bearer <accessToken>
```

#### Create User (requires manage_users permission)
```http
POST /users
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "email": "newuser@firm.com",
  "first_name": "John",
  "last_name": "Doe",
  "user_type": "AUDITOR",
  "firm_id": "uuid",
  "designation": "Senior Auditor"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "credentialsSent": true,
    "message": "User created successfully. Login credentials have been sent via email."
  }
}
```

**Note:** When a user is created without providing a password, the system automatically:
- Generates a secure random password (16 characters, includes uppercase, lowercase, numbers, and special characters)
- Sends login credentials to the user's email address
- Sets `must_change_password` flag to `true`, requiring the user to change their password on first login

#### Update User (requires manage_users permission)
```http
PATCH /users/:id
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "designation": "Partner",
  "is_active": true
}
```

#### Get User Permissions
```http
GET /users/:id/permissions
Authorization: Bearer <accessToken>
```

### Engagement Endpoints

#### List Engagements
```http
GET /engagements?page=1&limit=20&status=ACTIVE
Authorization: Bearer <accessToken>
```

#### Get Engagement
```http
GET /engagements/:id
Authorization: Bearer <accessToken>
```

#### Create Engagement (policy-based permission)
```http
POST /engagements
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "name": "Annual Audit 2024",
  "client_name": "ABC Corporation",
  "description": "Year-end financial audit",
  "start_date": "2024-01-01",
  "end_date": "2024-03-31",
  "status": "ACTIVE"
}
```

#### Update Engagement
```http
PATCH /engagements/:id
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "status": "COMPLETED"
}
```

#### Get Engagement Team
```http
GET /engagements/:id/users
Authorization: Bearer <accessToken>
```

#### Add User to Engagement
```http
POST /engagements/:id/users
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "user_id": "uuid",
  "role": "MEMBER"
}
```

#### Remove User from Engagement
```http
DELETE /engagements/:id/users/:userId
Authorization: Bearer <accessToken>
```

### Confirmation Tool Endpoints

#### List Confirmations for Engagement
```http
GET /engagements/:id/confirmations?status=PENDING
Authorization: Bearer <accessToken>
```

#### Create Confirmation (auto-creates user if needed)
```http
POST /engagements/:id/confirmations
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "party_type": "CLIENT",
  "party_email": "client@company.com",
  "party_name": "Jane Smith",
  "confirmation_type": "bank",
  "description": "Bank balance confirmation",
  "due_date": "2024-02-15"
}
```

#### Get Confirmation
```http
GET /confirmations/:id
Authorization: Bearer <accessToken>
```

#### Update Confirmation (auditor only)
```http
PATCH /confirmations/:id
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "status": "COMPLETED",
  "notes": "Confirmation received and verified"
}
```

#### List My Confirmations (client/confirming party)
```http
GET /confirmations/my-confirmations
Authorization: Bearer <accessToken>
```

#### Respond to Confirmation (client/confirming party)
```http
POST /confirmations/:id/respond
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "response": "Balance confirmed as of date: $125,000.00",
  "attachments": ["url1", "url2"]
}
```

### Webhook Endpoints

#### Payroll Sync Webhook
```http
POST /webhooks/payroll-sync
X-Webhook-Signature: <hmac-sha256-signature>
Content-Type: application/json

{
  "firm_domain": "auditfirm.com",
  "users": [
    {
      "payroll_id": "EMP001",
      "email": "employee@firm.com",
      "first_name": "John",
      "last_name": "Doe",
      "designation": "Senior Auditor",
      "is_active": true
    }
  ]
}
```

## Security Features

### Password Requirements
- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Account Lockout
- 5 failed login attempts
- 30-minute lockout period

### Token Security
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Refresh token rotation on use
- All tokens invalidated on password change
- **Single Session Enforcement**: Only one active session per user at a time. If a user attempts to log in while already logged in on another system, the new login will be rejected with an error message. Users must log out from the existing session before logging in from a different system.

### Rate Limiting
- 100 requests per 15 minutes per IP address
- Configurable in environment variables

### Audit Logging
All sensitive operations are logged:
- Login attempts (success/failure)
- User creation/modification
- Engagement creation/modification
- Permission changes
- Confirmation requests

## Firm Policy Configuration

Firms can customize permissions in the `settings` JSONB field:

```json
{
  "create_engagement": {
    "allowed_roles": ["Partner", "Manager"],
    "custom_users": ["user-uuid-1", "user-uuid-2"]
  },
  "access_confirmation_tool": {
    "allowed_roles": ["Partner", "Manager", "Senior Auditor"],
    "custom_users": []
  }
}
```

## Default Permissions

The system includes these default permissions:

**Engagement Permissions:**
- `create_engagement` - Create new engagements
- `edit_engagement` - Edit engagement details
- `delete_engagement` - Delete engagements
- `view_engagement` - View engagement details
- `manage_engagement_team` - Add/remove users from engagement

**Tool Permissions:**
- `access_confirmation_tool` - Access confirmation tool
- `create_confirmation` - Create confirmation requests
- `view_confirmation` - View confirmation requests
- `respond_confirmation` - Respond to confirmation requests

**Admin Permissions:**
- `manage_users` - Manage user accounts
- `manage_roles` - Manage roles and permissions
- `view_audit_logs` - View audit logs
- `manage_firm_settings` - Manage firm settings

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": []
  }
}
```

**Error Codes:**
- `UNAUTHORIZED` - Invalid or missing authentication
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input data
- `POLICY_VIOLATION` - Firm policy violation
- `SERVER_ERROR` - Internal server error

## Health Check

```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

## Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

## Development

### Database Migrations

To reset and recreate the database:

```bash
npm run migrate
```

### Logging

Logs are output to console in development mode. In production, logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only

## Production Deployment

### Railway Deployment (Recommended)

For detailed step-by-step instructions on deploying to Railway, see:
- **[Railway Deployment Guide](RAILWAY_DEPLOYMENT_GUIDE.md)** - Complete deployment instructions
- **[Railway Quick Start](RAILWAY_QUICK_START.md)** - Quick reference guide

### General Production Checklist

1. Set `NODE_ENV=production` in environment variables
2. Use strong, random secrets for JWT and encryption keys (use `node scripts/generate-secrets.js`)
3. Configure HTTPS (Railway provides this automatically)
4. Set up proper CORS origins
5. Configure production database with proper credentials
6. Set up log rotation for production logs
7. Configure proper SMTP settings for email delivery

## Documentation

For detailed information on specific features:

- **[Railway Deployment Guide](RAILWAY_DEPLOYMENT_GUIDE.md)** - Complete Railway deployment instructions
- **[Railway Quick Start](RAILWAY_QUICK_START.md)** - Quick Railway deployment reference
- **[Default Password System](docs/DEFAULT_PASSWORD_SYSTEM.md)** - Automatic password generation and credential delivery
- **[Complete API Guide](COMPLETE_API_TEST_GUIDE.md)** - Full API testing examples
- **[Getting Started](GETTING_STARTED.md)** - Quick start guide
- **[Testing Guide](TESTING.md)** - Testing strategies and examples

## Support

For issues or questions, please refer to the project documentation or contact the development team.

## License

ISC

