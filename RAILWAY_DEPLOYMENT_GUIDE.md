# Railway Deployment Guide - Verity User Auth API

This guide provides detailed step-by-step instructions for deploying your Verity User Authentication API on Railway, making it accessible for other websites to use.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Railway Account Setup](#railway-account-setup)
3. [Preparing Your Code](#preparing-your-code)
4. [Deploying the Application](#deploying-the-application)
5. [Setting Up PostgreSQL Database](#setting-up-postgresql-database)
6. [Configuring Environment Variables](#configuring-environment-variables)
7. [Running Database Migrations](#running-database-migrations)
8. [Creating Admin User](#creating-admin-user)
9. [Verifying Deployment](#verifying-deployment)
10. [Using the API from Other Websites](#using-the-api-from-other-websites)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- ✅ A Railway account (sign up at [railway.app](https://railway.app))
- ✅ Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
- ✅ Node.js 18+ installed locally (for generating secrets)
- ✅ Basic understanding of environment variables
- ✅ Access to an SMTP email service (Gmail, SendGrid, Mailgun, etc.)

---

## Railway Account Setup

### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Click **"Start a New Project"** or **"Login"**
3. Sign up using GitHub, GitLab, or email
4. Complete the account setup

### Step 2: Install Railway CLI (Optional but Recommended)

While you can deploy via the web dashboard, the CLI is useful for migrations and admin tasks:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login
```

---

## Preparing Your Code

### Step 1: Ensure Your Code is Git-Ready

Make sure your code is committed and pushed to a Git repository:

```bash
# Check git status
git status

# If you have uncommitted changes, commit them
git add .
git commit -m "Prepare for Railway deployment"

# Push to your repository
git push origin main
```

### Step 2: Verify Dockerfile Exists

Your project already has a `Dockerfile` which Railway will use. Verify it exists and is correct:

```bash
# Check Dockerfile
cat Dockerfile
```

The Dockerfile should:
- Use Node.js 18+
- Install dependencies
- Copy application code
- Expose port 3000 (or your configured PORT)
- Start the application with `node server.js`

---

## Deploying the Application

### Method 1: Deploy via Railway Dashboard (Recommended for First Time)

#### Step 1: Create New Project

1. Log in to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"** (or GitLab/Bitbucket)
4. Choose your repository: `Verity_User_Auth`
5. Railway will automatically detect it's a Node.js project

#### Step 2: Configure Build Settings

Railway should auto-detect your Node.js app, but verify:

1. Go to your project settings
2. Under **"Settings"** → **"Build"**:
   - **Build Command**: Leave empty (Railway will run `npm install` automatically)
   - **Start Command**: `npm start` (or Railway will auto-detect from `package.json`)
   - **Root Directory**: `/` (root of your repository)

#### Step 3: Set Port (Important!)

1. Go to **"Settings"** → **"Networking"**
2. Railway will automatically assign a `PORT` environment variable
3. Your `server.js` already uses `process.env.PORT || 3000`, so this will work automatically
4. Railway will expose your service on a public URL

---

### Method 2: Deploy via Railway CLI

```bash
# Initialize Railway in your project
railway init

# Link to existing project (or create new)
railway link

# Deploy
railway up
```

---

## Deploying Multiple Services on Railway

Since you'll be hosting your frontend websites (Client Portal and Confirming Party Portal) on Railway as well, here's how to set up multiple services in the same Railway project.

### Step 1: Deploy Your API Service First

Follow the steps in the [Deploying the Application](#deploying-the-application) section to deploy your API service. This will be your main authentication API.

**Note the API URL**: After deployment, Railway will assign a URL like:
```
https://verity-api.up.railway.app
```

### Step 2: Deploy Client Portal (Frontend Website 1)

1. **In the same Railway project**, click **"+ New"** → **"GitHub Repo"** (or your Git provider)
2. Select your **Client Portal repository**
3. Railway will detect it's a frontend app (React, Vue, etc.)
4. Configure build settings if needed:
   - **Build Command**: `npm run build` (or your build command)
   - **Start Command**: `npm start` (or your start command for production)
   - **Output Directory**: `dist` or `build` (depending on your framework)

5. **Get the Client Portal URL**:
   - Go to Client Portal service → **Settings** → **Networking**
   - Copy the **Public Domain** (e.g., `client-portal.up.railway.app`)

### Step 3: Deploy Confirming Party Portal (Frontend Website 2)

1. **In the same Railway project**, click **"+ New"** → **"GitHub Repo"**
2. Select your **Confirming Party Portal repository**
3. Configure build settings similar to Client Portal
4. **Get the Confirming Party Portal URL**:
   - Go to Confirming Party Portal service → **Settings** → **Networking**
   - Copy the **Public Domain** (e.g., `confirming-party.up.railway.app`)

### Step 4: Configure Frontend Services to Use API

For each frontend service, add environment variables:

#### Client Portal Environment Variables:
```
VITE_API_URL=https://verity-api.up.railway.app/api/v1
# or
REACT_APP_API_URL=https://verity-api.up.railway.app/api/v1
# (depending on your framework)
```

#### Confirming Party Portal Environment Variables:
```
VITE_API_URL=https://verity-api.up.railway.app/api/v1
# or
REACT_APP_API_URL=https://verity-api.up.railway.app/api/v1
```

**Note**: Replace `verity-api.up.railway.app` with your actual API service URL.

### Step 5: Using Railway Service References (Recommended)

Railway allows services to reference each other using internal service names. However, for frontend apps that run in the browser, you'll need to use the public URLs.

**For API service** (backend-to-backend communication, if needed):
- You can use Railway's internal service references
- But for CORS, you need public URLs

**For Frontend services** (browser-to-API):
- Must use public HTTPS URLs (Railway provides these automatically)
- These URLs are what you'll configure in CORS

### Railway Project Structure

Your Railway project will look like this:

```
Railway Project: "Verity Platform"
├── PostgreSQL Database
├── API Service (verity-api)
│   └── URL: https://verity-api.up.railway.app
├── Client Portal Service
│   └── URL: https://client-portal.up.railway.app
└── Confirming Party Portal Service
    └── URL: https://confirming-party.up.railway.app
```

All services share the same project, making it easy to:
- Manage all services together
- Share environment variables (if needed)
- Monitor all services in one dashboard
- Manage costs in one place

---

## Setting Up PostgreSQL Database

### Step 1: Add PostgreSQL Service

1. In your Railway project dashboard, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will create a PostgreSQL database instance
4. Wait for it to provision (usually 1-2 minutes)

### Step 2: Get Database Connection Details

1. Click on the **PostgreSQL service** in your project
2. Go to the **"Variables"** tab
3. You'll see these environment variables automatically created:
   - `PGHOST` - Database host
   - `PGPORT` - Database port (usually 5432)
   - `PGDATABASE` - Database name
   - `PGUSER` - Database user
   - `PGPASSWORD` - Database password

**Important**: Railway uses different variable names than your app expects. You'll need to map them.

### Step 3: Connect Database to Your API Service

1. In your Railway project, click on your **API service** (the Node.js app)
2. Go to **"Variables"** tab
3. You'll need to add the database connection variables (see next section)

---

## Configuring Environment Variables

### Step 1: Access Environment Variables

1. In Railway dashboard, click on your **API service** (Node.js app)
2. Go to **"Variables"** tab
3. Click **"+ New Variable"** to add each variable

### Step 2: Add Database Variables

Add these variables, using the values from your PostgreSQL service:

```
DB_HOST=<PGHOST value from PostgreSQL service>
DB_PORT=5432
DB_NAME=<PGDATABASE value from PostgreSQL service>
DB_USER=<PGUSER value from PostgreSQL service>
DB_PASSWORD=<PGPASSWORD value from PostgreSQL service>
```

**Alternative**: Railway allows you to reference variables from other services. You can use:
- Click **"Reference Variable"** when adding a variable
- Select your PostgreSQL service
- Select the variable (e.g., `PGHOST`)
- Railway will automatically sync it

### Step 3: Generate and Add JWT Secrets

Generate secure JWT secrets locally:

```bash
# Generate JWT Access Secret (64+ characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate JWT Refresh Secret (64+ characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Add to Railway:
```
JWT_ACCESS_SECRET=<paste the generated access secret>
JWT_REFRESH_SECRET=<paste the generated refresh secret>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

### Step 4: Generate and Add Encryption Key

Generate a 32-character encryption key:

```bash
# Generate Encryption Key (exactly 32 characters)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Add to Railway:
```
ENCRYPTION_KEY=<paste the generated 32-character key>
```

### Step 5: Add Webhook Secret

```bash
# Generate Webhook Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add to Railway:
```
PAYROLL_WEBHOOK_SECRET=<paste the generated webhook secret>
```

### Step 6: Configure Email Settings

Add your SMTP email configuration:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourfirm.com
```

**For Gmail:**
- Use an [App Password](https://support.google.com/accounts/answer/185833) (not your regular password)
- Enable "Less secure app access" or use OAuth2

**For SendGrid:**
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<your-sendgrid-api-key>
```

**For Mailgun:**
```
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=<your-mailgun-username>
SMTP_PASS=<your-mailgun-password>
```

### Step 7: Add Application URLs (Railway Services)

Since you're hosting all services on Railway, you need to get the URLs for each service:

#### Get API Service URL:
1. Go to your **API service** in Railway
2. Click **"Settings"** → **"Networking"**
3. Copy the **"Public Domain"** (e.g., `verity-api.up.railway.app`)
4. Your API base URL will be: `https://verity-api.up.railway.app/api/v1`

#### Get Client Portal URL:
1. Go to your **Client Portal service** in Railway
2. Click **"Settings"** → **"Networking"**
3. Copy the **"Public Domain"** (e.g., `client-portal.up.railway.app`)

#### Get Confirming Party Portal URL:
1. Go to your **Confirming Party Portal service** in Railway
2. Click **"Settings"** → **"Networking"**
3. Copy the **"Public Domain"** (e.g., `confirming-party.up.railway.app`)

#### Add to API Service Environment Variables:

In your **API service** → **Variables** tab, add:

```
NODE_ENV=production
PORT=3000
CLIENT_PORTAL_URL=https://client-portal.up.railway.app
CONFIRMING_PARTY_PORTAL_URL=https://confirming-party.up.railway.app
```

**Important**: 
- Replace the URLs above with your actual Railway service URLs
- Use `https://` (Railway provides HTTPS automatically)
- These URLs are used for:
  - CORS configuration (allowing frontend to call API)
  - Email links (sending portal URLs in credential emails)

**Note**: If you haven't deployed the frontend services yet, you can:
1. Deploy the API first with placeholder URLs
2. Deploy frontend services
3. Update the API environment variables with the actual frontend URLs
4. Redeploy the API service (or Railway will auto-redeploy if you have auto-deploy enabled)

### Step 8: Add Optional Configuration

```
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Complete Environment Variables Checklist

Here's the complete list of variables you need:

```bash
# Database (from PostgreSQL service)
DB_HOST=<from PostgreSQL service>
DB_PORT=5432
DB_NAME=<from PostgreSQL service>
DB_USER=<from PostgreSQL service>
DB_PASSWORD=<from PostgreSQL service>

# JWT
JWT_ACCESS_SECRET=<64+ character random string>
JWT_REFRESH_SECRET=<64+ character random string>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Encryption
ENCRYPTION_KEY=<32 character random string>

# Webhook
PAYROLL_WEBHOOK_SECRET=<32+ character random string>

# Email
SMTP_HOST=<your-smtp-host>
SMTP_PORT=587
SMTP_USER=<your-smtp-user>
SMTP_PASS=<your-smtp-password>
EMAIL_FROM=noreply@yourfirm.com

# Application
NODE_ENV=production
PORT=3000
CLIENT_PORTAL_URL=<your-frontend-url>
CONFIRMING_PARTY_PORTAL_URL=<your-confirming-party-url>

# Optional
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Running Database Migrations

### Method 1: Using Railway CLI (Recommended)

```bash
# Install Railway CLI if not already installed
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
railway run npm run migrate
```

### Method 2: Using Railway Web Console

1. Go to your API service in Railway dashboard
2. Click **"Deployments"** tab
3. Click on the latest deployment
4. Click **"View Logs"**
5. You can't directly run commands, but you can trigger a new deployment

**Better approach**: Add a migration script to run on deployment (see below)

### Method 3: Add Migration to Build Process

Create a `railway.json` file in your project root:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install"
  },
  "deploy": {
    "startCommand": "npm run migrate && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**However**, this runs migrations on every deployment. A better approach is to run migrations manually the first time, then only when needed.

### Step-by-Step Migration Process

1. **First, ensure your app is deployed and environment variables are set**

2. **Run migrations using Railway CLI:**
   ```bash
   railway run npm run migrate
   ```

3. **Verify migrations succeeded:**
   - Check Railway logs for any errors
   - The migration script should create all tables

---

## Creating Admin User

After migrations are complete, create your admin user:

### Method 1: Using Railway CLI

```bash
# Run the seed-admin script
railway run npm run seed-admin
```

This will prompt you for:
- Firm name
- Admin email
- Admin password
- Other firm details

### Method 2: Using API Endpoint (After Deployment)

Once your API is running, you can create an admin user via API:

```bash
# Get your Railway API URL
# Format: https://your-app-name.up.railway.app

# Create admin user via API (if you have a create-admin endpoint)
curl -X POST https://your-app-name.up.railway.app/api/v1/admin/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourfirm.com",
    "password": "SecurePassword123!",
    "first_name": "Admin",
    "last_name": "User",
    "user_type": "AUDITOR"
  }'
```

**Note**: Check your API documentation for the exact endpoint to create the first admin user.

---

## Verifying Deployment

### Step 1: Check Health Endpoint

```bash
# Replace with your Railway URL
curl https://your-app-name.up.railway.app/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### Step 2: Test Login Endpoint

```bash
curl -X POST https://your-app-name.up.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourfirm.com",
    "password": "YourAdminPassword"
  }'
```

Expected response:
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

### Step 3: Check Railway Logs

1. Go to Railway dashboard
2. Click on your API service
3. Click **"Deployments"** → Latest deployment → **"View Logs"**
4. Look for:
   - "Database connection established successfully"
   - "Server running on port 3000"
   - No error messages

---

## Using the API from Railway-Hosted Websites

Since you're hosting all your services on Railway, here's how to configure everything to work together.

### Step 1: Get Your Service URLs

After deploying all services on Railway, you'll have:

1. **API Service URL**: `https://verity-api.up.railway.app`
   - API Base URL: `https://verity-api.up.railway.app/api/v1`

2. **Client Portal URL**: `https://client-portal.up.railway.app`

3. **Confirming Party Portal URL**: `https://confirming-party.up.railway.app`

**Note**: Replace with your actual Railway service URLs.

### Step 2: Configure Frontend Services

For each frontend service (Client Portal and Confirming Party Portal), add environment variables:

#### In Client Portal Service (Railway):
```
VITE_API_URL=https://verity-api.up.railway.app/api/v1
# or for Create React App:
REACT_APP_API_URL=https://verity-api.up.railway.app/api/v1
# or for Next.js:
NEXT_PUBLIC_API_URL=https://verity-api.up.railway.app/api/v1
```

#### In Confirming Party Portal Service (Railway):
```
VITE_API_URL=https://verity-api.up.railway.app/api/v1
# (use the appropriate prefix for your framework)
```

**Important**: 
- Replace `verity-api.up.railway.app` with your actual API service URL
- The environment variable name depends on your frontend framework:
  - **Vite**: `VITE_API_URL`
  - **Create React App**: `REACT_APP_API_URL`
  - **Next.js**: `NEXT_PUBLIC_API_URL`
  - **Vue CLI**: `VUE_APP_API_URL`

### Step 3: Configure CORS in API Service

Your API already handles CORS. Make sure these environment variables are set in your **API service**:

```
CLIENT_PORTAL_URL=https://client-portal.up.railway.app
CONFIRMING_PARTY_PORTAL_URL=https://confirming-party.up.railway.app
```

**Important**: 
- These must match your actual Railway frontend service URLs exactly
- Use `https://` (Railway provides HTTPS automatically)
- These URLs are used for:
  - CORS configuration (allowing frontend to call API)
  - Email links (sending portal URLs in credential emails)

### Step 4: Verify CORS is Working

After configuring, test that CORS works:

1. Open your Client Portal in a browser: `https://client-portal.up.railway.app`
2. Open browser DevTools → Network tab
3. Try to log in or make an API call
4. Check the request headers - you should see:
   - `Origin: https://client-portal.up.railway.app`
   - Response should include `Access-Control-Allow-Origin: https://client-portal.up.railway.app`

If you see CORS errors, verify:
- The URLs in `CLIENT_PORTAL_URL` and `CONFIRMING_PARTY_PORTAL_URL` match exactly
- Both services are using HTTPS
- The API service has been redeployed after updating environment variables

### Step 5: Example Integration Code for Railway-Hosted Frontends

#### JavaScript/TypeScript (Frontend - Vite/React/Vue)

```javascript
// config.js or .env file
// For Vite: VITE_API_URL=https://verity-api.up.railway.app/api/v1
// For CRA: REACT_APP_API_URL=https://verity-api.up.railway.app/api/v1

// In your code:
const API_BASE_URL = import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL || 'https://verity-api.up.railway.app/api/v1';

// auth.js
async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important for cookies if using them
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) {
    throw new Error('Login failed');
  }
  
  const data = await response.json();
  
  // Store tokens
  localStorage.setItem('accessToken', data.data.accessToken);
  localStorage.setItem('refreshToken', data.data.refreshToken);
  
  return data;
}

// Make authenticated requests
async function getEngagements() {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch(`${API_BASE_URL}/engagements`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      // Token expired, refresh it
      await refreshToken();
      return getEngagements(); // Retry
    }
    throw new Error('Failed to fetch engagements');
  }
  
  return response.json();
}

// Refresh token
async function refreshToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });
  
  const data = await response.json();
  localStorage.setItem('accessToken', data.data.accessToken);
  localStorage.setItem('refreshToken', data.data.refreshToken);
}
```

#### Python (Backend Integration)

```python
import requests

API_BASE_URL = 'https://your-app-name.up.railway.app/api/v1'

def login(email, password):
    response = requests.post(
        f'{API_BASE_URL}/auth/login',
        json={'email': email, 'password': password}
    )
    response.raise_for_status()
    data = response.json()
    return data['data']['accessToken'], data['data']['refreshToken']

def get_engagements(access_token):
    response = requests.get(
        f'{API_BASE_URL}/engagements',
        headers={'Authorization': f'Bearer {access_token}'}
    )
    response.raise_for_status()
    return response.json()
```

#### cURL Examples

```bash
# Login
curl -X POST https://your-app-name.up.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get engagements (replace TOKEN with actual token)
curl https://your-app-name.up.railway.app/api/v1/engagements \
  -H "Authorization: Bearer TOKEN"

# Create user
curl -X POST https://your-app-name.up.railway.app/api/v1/users \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@firm.com",
    "first_name": "John",
    "last_name": "Doe",
    "user_type": "AUDITOR",
    "firm_id": "firm-uuid"
  }'
```

### Step 4: API Documentation

Share these endpoints with other developers:

**Base URL**: `https://your-app-name.up.railway.app/api/v1`

**Key Endpoints**:
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user
- `GET /users` - List users
- `POST /users` - Create user
- `GET /engagements` - List engagements
- `POST /engagements` - Create engagement
- `GET /health` - Health check

**Full API Documentation**: See `README.md` or `API_ENDPOINTS.md` in your repository.

---

## Troubleshooting

### Issue: Application Won't Start

**Symptoms**: Deployment fails or app crashes immediately

**Solutions**:
1. Check Railway logs for error messages
2. Verify all required environment variables are set
3. Ensure `PORT` environment variable is set (Railway sets this automatically)
4. Check that database connection variables are correct
5. Verify Node.js version compatibility (requires Node 18+)

### Issue: Database Connection Failed

**Symptoms**: "Unable to connect to the database" in logs

**Solutions**:
1. Verify database service is running in Railway
2. Check that `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` are correct
3. Ensure database variables reference the PostgreSQL service correctly
4. Wait a few minutes after creating the database (provisioning takes time)

### Issue: Migrations Not Running

**Symptoms**: Tables don't exist, API returns database errors

**Solutions**:
1. Run migrations manually: `railway run npm run migrate`
2. Check migration logs for errors
3. Verify database connection is working first
4. Ensure you have the correct database permissions

### Issue: CORS Errors in Browser

**Symptoms**: "CORS policy" errors when accessing API from frontend

**Solutions**:
1. Update `CLIENT_PORTAL_URL` and `CONFIRMING_PARTY_PORTAL_URL` in Railway
2. Ensure frontend URL matches exactly (including https/http)
3. Check that `NODE_ENV=production` is set
4. Verify CORS configuration in `src/app.js`

### Issue: Email Not Sending

**Symptoms**: Users not receiving credential emails

**Solutions**:
1. Verify SMTP settings are correct
2. For Gmail, use App Password (not regular password)
3. Check Railway logs for email errors
4. Test SMTP connection with a simple email service
5. Verify `EMAIL_FROM` is a valid email address

### Issue: JWT Token Errors

**Symptoms**: "Invalid token" or "Token expired" errors

**Solutions**:
1. Verify `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are set
2. Ensure secrets are 64+ characters long
3. Check token expiry settings
4. Verify system clock is synchronized

### Issue: Encryption Errors

**Symptoms**: "Invalid key length" or decryption errors

**Solutions**:
1. Verify `ENCRYPTION_KEY` is exactly 32 characters
2. Ensure encryption key hasn't changed (changing it will break existing encrypted data)
3. Generate a new key: `node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"`

### Getting Help

1. **Check Railway Logs**: Always check logs first
2. **Railway Status**: Check [status.railway.app](https://status.railway.app)
3. **Railway Docs**: [docs.railway.app](https://docs.railway.app)
4. **Your API Logs**: Check application logs in Railway dashboard

---

## Post-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations completed successfully
- [ ] Admin user created
- [ ] Health endpoint returns 200 OK
- [ ] Login endpoint works
- [ ] CORS configured for frontend domains
- [ ] Email service tested (send test email)
- [ ] API URL documented and shared
- [ ] Monitoring set up (optional but recommended)
- [ ] Backup strategy in place (Railway handles this automatically)

---

## Custom Domain (Optional)

To use a custom domain instead of `*.up.railway.app`:

1. Go to your API service → **Settings** → **Networking**
2. Click **"Custom Domain"**
3. Add your domain (e.g., `api.yourfirm.com`)
4. Follow Railway's DNS instructions
5. Update `CLIENT_PORTAL_URL` and `CONFIRMING_PARTY_PORTAL_URL` if needed

---

## Cost Considerations

Railway offers:
- **Free tier**: $5 credit/month (good for testing)
- **Hobby plan**: Pay-as-you-go
- **Pro plan**: For production workloads

Monitor your usage in Railway dashboard → **Usage**.

---

## Security Best Practices

1. ✅ Never commit `.env` files to Git
2. ✅ Use strong, randomly generated secrets
3. ✅ Enable HTTPS (Railway does this automatically)
4. ✅ Regularly rotate JWT secrets (requires re-authentication)
5. ✅ Monitor Railway logs for suspicious activity
6. ✅ Keep dependencies updated
7. ✅ Use Railway's built-in secrets management
8. ✅ Set up proper CORS origins
9. ✅ Enable rate limiting (already configured)
10. ✅ Regular database backups (Railway handles this)

---

## Next Steps

After successful deployment:

1. **Document your API URL** for other developers
2. **Set up monitoring** (optional but recommended)
3. **Configure custom domain** (optional)
4. **Set up CI/CD** for automatic deployments (optional)
5. **Create API documentation** for other teams
6. **Test all endpoints** to ensure everything works
7. **Set up staging environment** (optional, for testing)

---

## Complete Deployment Workflow for All Services on Railway

Here's the recommended order for deploying all your services on Railway:

### Phase 1: Deploy API Service
1. ✅ Create Railway project
2. ✅ Add PostgreSQL database
3. ✅ Deploy API service from Git repository
4. ✅ Configure all environment variables (except frontend URLs)
5. ✅ Run database migrations
6. ✅ Create admin user
7. ✅ Test API health endpoint
8. ✅ **Note the API URL** (e.g., `https://verity-api.up.railway.app`)

### Phase 2: Deploy Frontend Services
1. ✅ Deploy Client Portal service
2. ✅ Deploy Confirming Party Portal service
3. ✅ **Note the frontend URLs**:
   - Client Portal: `https://client-portal.up.railway.app`
   - Confirming Party: `https://confirming-party.up.railway.app`

### Phase 3: Connect Everything
1. ✅ Update API service environment variables:
   - `CLIENT_PORTAL_URL=https://client-portal.up.railway.app`
   - `CONFIRMING_PARTY_PORTAL_URL=https://confirming-party.up.railway.app`
2. ✅ Add to Client Portal service:
   - `VITE_API_URL=https://verity-api.up.railway.app/api/v1`
3. ✅ Add to Confirming Party Portal service:
   - `VITE_API_URL=https://verity-api.up.railway.app/api/v1`
4. ✅ Redeploy all services (or wait for auto-redeploy)

### Phase 4: Verify Everything Works
1. ✅ Test API health: `https://verity-api.up.railway.app/health`
2. ✅ Test Client Portal login
3. ✅ Test Confirming Party Portal login
4. ✅ Check CORS is working (no CORS errors in browser console)
5. ✅ Test email functionality (credentials should include correct portal URLs)

### Railway Project Structure (Final)

```
Railway Project: "Verity Platform"
│
├── PostgreSQL Database
│   └── (Shared by all services)
│
├── API Service
│   ├── URL: https://verity-api.up.railway.app
│   ├── Environment Variables:
│   │   ├── Database connection (from PostgreSQL)
│   │   ├── JWT secrets
│   │   ├── SMTP settings
│   │   ├── CLIENT_PORTAL_URL=https://client-portal.up.railway.app
│   │   └── CONFIRMING_PARTY_PORTAL_URL=https://confirming-party.up.railway.app
│   └── Purpose: Authentication & API backend
│
├── Client Portal Service
│   ├── URL: https://client-portal.up.railway.app
│   ├── Environment Variables:
│   │   └── VITE_API_URL=https://verity-api.up.railway.app/api/v1
│   └── Purpose: Client-facing frontend
│
└── Confirming Party Portal Service
    ├── URL: https://confirming-party.up.railway.app
    ├── Environment Variables:
    │   └── VITE_API_URL=https://verity-api.up.railway.app/api/v1
    └── Purpose: Confirming party frontend
```

### Benefits of All Services on Railway

✅ **Single Dashboard**: Manage all services in one place  
✅ **Shared Database**: All services can use the same PostgreSQL instance  
✅ **Easy Updates**: Update environment variables across services easily  
✅ **Cost Management**: See all costs in one place  
✅ **Automatic HTTPS**: Railway provides HTTPS for all services  
✅ **Auto-Deploy**: Connect Git repos for automatic deployments  
✅ **Monitoring**: View logs and metrics for all services together  

---

## Summary

Your Verity User Auth API and all frontend websites are now deployed on Railway and ready to work together! The complete platform provides:

- ✅ User authentication and authorization
- ✅ Role-based access control
- ✅ Engagement management
- ✅ Confirmation tool
- ✅ Client onboarding
- ✅ Independence declarations
- ✅ Secure webhooks
- ✅ Audit logging

**API Base URL**: `https://your-app-name.up.railway.app/api/v1`

Share this URL with other developers who need to integrate with your authentication and user management system.

---

**Need Help?** Refer to:
- Railway Documentation: [docs.railway.app](https://docs.railway.app)
- Your API Documentation: `README.md` and `API_ENDPOINTS.md`
- Railway Support: Available in Railway dashboard

