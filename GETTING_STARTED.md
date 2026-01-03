# Getting Started with Audit Software API

This guide will walk you through setting up and running the Audit Software API for the first time.

## Quick Start

### 1. Prerequisites

Make sure you have the following installed:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **PostgreSQL 15+** - [Download here](https://www.postgresql.org/download/)
- **npm** (comes with Node.js)

Verify your installations:
```bash
node --version   # Should be 18.x or higher
npm --version
psql --version   # Should be 15.x or higher
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Interactive Setup

Run the interactive setup script:

```bash
npm run setup
```

This will prompt you for:
- Database connection details
- SMTP email configuration
- Application URLs

The script will generate secure secrets automatically and create your `.env` file.

### 4. Create Database

```bash
# Using psql
createdb audit_software

# Or using PostgreSQL command line
psql -U postgres
CREATE DATABASE audit_software;
\q
```

### 5. Run Migrations

This creates all database tables and seeds default permissions:

```bash
npm run migrate
```

### 6. Create Admin User

```bash
npm run seed-admin
```

**Important:** Save the generated admin password! You'll need it to login for the first time.

### 7. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The API will start on `http://localhost:3000` (or your configured port).

### 8. Test the API

#### Health Check
```bash
curl http://localhost:3000/health
```

#### Login as Admin
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "<password-from-seed-admin>"
  }'
```

Save the `accessToken` from the response for subsequent requests.

## Manual Setup (Alternative)

If you prefer manual configuration:

### 1. Copy Environment Template

```bash
cp .env.example .env
```

### 2. Edit .env File

Open `.env` and configure all values:

```bash
nano .env
# or
vim .env
# or use your preferred editor
```

**Important settings to change:**
- `DB_PASSWORD` - Your PostgreSQL password
- `JWT_ACCESS_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- `JWT_REFRESH_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- `ENCRYPTION_KEY` - Must be exactly 32 characters
- `SMTP_*` - Your email server settings
- `PAYROLL_WEBHOOK_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 3. Continue from Step 4 Above

Follow steps 4-8 from the Quick Start section.

## Directory Structure

```
vertiapi/
├── src/
│   ├── config/          # Configuration files (database, auth, email)
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware (auth, validation, etc.)
│   ├── models/          # Database models (Sequelize)
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic layer
│   ├── utils/           # Utility functions
│   ├── validators/      # Input validation schemas
│   └── app.js           # Express app configuration
├── migrations/          # Database migration scripts
├── scripts/             # Setup and utility scripts
├── tests/               # Test files
├── .env                 # Environment variables (DO NOT COMMIT)
├── .env.example         # Environment template
├── package.json         # Dependencies and scripts
├── server.js            # Application entry point
└── README.md            # Full documentation
```

## Next Steps

### 1. Create Your Firm

Update the firm details or create a new one:

```bash
# Connect to database
psql audit_software

# Update the example firm
UPDATE firms 
SET name = 'Your Audit Firm Name', 
    domain = 'yourdomain.com'
WHERE domain = 'example.com';
```

### 2. Create Roles

The system comes with default permissions. Create roles for your firm:

- Partner (highest level)
- Manager
- Senior Auditor
- Staff Auditor

You can create these through the API or directly in the database.

### 3. Configure Firm Policies

Update firm settings to define who can create engagements:

```sql
UPDATE firms 
SET settings = '{
  "create_engagement": {
    "allowed_roles": ["Partner", "Manager"],
    "custom_users": []
  },
  "access_confirmation_tool": {
    "allowed_roles": ["Partner", "Manager", "Senior Auditor"],
    "custom_users": []
  }
}'::jsonb
WHERE id = '<your-firm-id>';
```

### 4. Integrate with Payroll System

Configure your payroll system to send webhook updates to:

```
POST https://your-api-domain.com/api/v1/webhooks/payroll-sync
```

Include the `X-Webhook-Signature` header with HMAC-SHA256 signature using your `PAYROLL_WEBHOOK_SECRET`.

### 5. Build Frontend Applications

You'll need three frontend applications:

1. **Main Auditor Portal** - For internal audit staff
2. **Client Portal** - For clients to access confirmations
3. **Confirming Party Portal** - For external parties to respond

All three can authenticate against this API using the `/api/v1/auth/login` endpoint.

## Common Issues

### Database Connection Error

```
Unable to connect to the database: password authentication failed
```

**Solution:** Check your `DB_USER` and `DB_PASSWORD` in `.env`

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:** Change `PORT` in `.env` or stop the process using port 3000:
```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Email Not Sending

**Solution:** 
- Verify SMTP credentials
- Check if your SMTP server requires SSL (port 465) or TLS (port 587)
- Some email providers require "less secure app access" or "app passwords"

### JWT Token Invalid

**Solution:**
- Ensure `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are set
- Check that secrets are the same across server restarts
- Tokens expire after 15 minutes - refresh using `/api/v1/auth/refresh`

## Testing with Postman

1. Import the API endpoints into Postman
2. Set up environment variables:
   - `base_url`: `http://localhost:3000/api/v1`
   - `access_token`: (will be set after login)
3. Create a login request to get your access token
4. Use `{{access_token}}` in Authorization headers

## Development Tips

### Auto-reload on Changes

Use `npm run dev` to automatically restart the server when files change.

### Viewing Logs

Logs are output to the console in development mode. Check for:
- Database queries (when `NODE_ENV=development`)
- Authentication attempts
- API requests
- Errors with stack traces

### Testing APIs

Use tools like:
- **Postman** - GUI for API testing
- **curl** - Command-line HTTP client
- **Insomnia** - Alternative to Postman
- **Thunder Client** - VS Code extension

## Production Deployment

Before deploying to production:

1. ✅ Set `NODE_ENV=production`
2. ✅ Use strong, unique secrets (never reuse from example)
3. ✅ Set up HTTPS with valid SSL certificate
4. ✅ Configure CORS with specific origins
5. ✅ Use production-grade PostgreSQL instance
6. ✅ Set up log rotation
7. ✅ Configure backup strategy for database
8. ✅ Set up monitoring and alerts
9. ✅ Use environment variables (never hardcode secrets)
10. ✅ Test all critical flows before launch

## Need Help?

- Check the [README.md](README.md) for full API documentation
- Review the [API endpoints](#test-the-api) section
- Check database migrations in `migrations/` folder
- Review model definitions in `src/models/`

## Support

For technical support or questions about implementation, refer to the project documentation or contact your development team.

