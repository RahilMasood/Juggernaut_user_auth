# Railway Deployment Guide

This guide will help you deploy your Node.js backend API to Railway.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Account**: Your code should be in a GitHub repository
3. **PostgreSQL Database**: Railway provides PostgreSQL as a service

---

## Step 1: Prepare Your Repository

### 1.1 Ensure your code is on GitHub

```bash
# If not already initialized
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 1.2 Create a `.railwayignore` file (optional)

Create `.railwayignore` to exclude unnecessary files:

```
node_modules
.env
.env.local
logs
*.log
.DS_Store
.git
```

### 1.3 Verify your `package.json` has a start script

Your `package.json` should have:
```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

✅ Already configured in your project.

---

## Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository
5. Railway will automatically detect it's a Node.js project

---

## Step 3: Add PostgreSQL Database

1. In your Railway project dashboard, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will create a PostgreSQL database
4. **Important**: Note the database connection details (you'll need them in Step 4)

---

## Step 4: Configure Environment Variables

In your Railway project dashboard:

1. Click on your **service** (the Node.js app)
2. Go to **"Variables"** tab
3. Add the following environment variables:

### Required Environment Variables

```bash
# Database Configuration
DB_HOST=<from-postgres-service>
DB_PORT=5432
DB_NAME=<from-postgres-service>
DB_USER=<from-postgres-service>
DB_PASSWORD=<from-postgres-service>

# JWT Secrets (generate strong random strings)
JWT_ACCESS_SECRET=<generate-a-strong-random-string>
JWT_REFRESH_SECRET=<generate-another-strong-random-string>

# Server Configuration
PORT=3000
NODE_ENV=production

# CORS (add your frontend URLs)
CLIENT_PORTAL_URL=https://your-frontend-domain.com
CONFIRMING_PARTY_PORTAL_URL=https://your-other-frontend-domain.com

# Optional: Email Configuration (if using email features)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# Optional: Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Optional: Bcrypt Rounds
BCRYPT_ROUNDS=12
```

### How to Get Database Variables from Railway

1. Click on your **PostgreSQL service** in Railway
2. Go to **"Variables"** tab
3. You'll see variables like:
   - `PGHOST`
   - `PGPORT`
   - `PGDATABASE`
   - `PGUSER`
   - `PGPASSWORD`

4. Map them to your app's variables:
   ```
   DB_HOST=${{Postgres.PGHOST}}
   DB_PORT=${{Postgres.PGPORT}}
   DB_NAME=${{Postgres.PGDATABASE}}
   DB_USER=${{Postgres.PGUSER}}
   DB_PASSWORD=${{Postgres.PGPASSWORD}}
   ```

   **OR** use Railway's reference syntax:
   ```
   DB_HOST=${{Postgres.PGHOST}}
   DB_PORT=${{Postgres.PGPORT}}
   DB_NAME=${{Postgres.PGDATABASE}}
   DB_USER=${{Postgres.PGUSER}}
   DB_PASSWORD=${{Postgres.PGPASSWORD}}
   ```

### Generate JWT Secrets

Use one of these methods to generate secure secrets:

**Option 1: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Option 2: Using OpenSSL**
```bash
openssl rand -hex 64
```

**Option 3: Online Tool**
Use a secure random string generator (at least 32 characters)

---

## Step 5: Configure Build Settings

1. In your Railway service, go to **"Settings"**
2. Under **"Build Command"**, leave it empty (Railway auto-detects)
3. Under **"Start Command"**, ensure it's: `npm start`
4. Under **"Root Directory"**, leave it as `/` (root)

---

## Step 6: Run Database Migrations

After your first deployment, you need to run migrations:

### Option 1: Using Railway CLI

1. Install Railway CLI:
   ```bash
   npm i -g @railway/cli
   ```

2. Login:
   ```bash
   railway login
   ```

3. Link to your project:
   ```bash
   railway link
   ```

4. Run migrations:
   ```bash
   railway run npm run migrate
   ```

### Option 2: Using Railway Shell

1. In Railway dashboard, click on your service
2. Click **"Deployments"** → **"View Logs"**
3. Click **"Shell"** tab
4. Run:
   ```bash
   npm run migrate
   ```

### Option 3: Create a One-Time Service

1. Create a new service in Railway
2. Set it to run: `npm run migrate`
3. Run it once, then delete the service

---

## Step 7: Create Initial Firm

After migrations, create your first firm:

### Using Railway CLI:
```bash
railway run npm run create-firm
```

### Using Railway Shell:
1. Open Shell in Railway dashboard
2. Run:
   ```bash
   npm run create-firm
   ```

Follow the prompts to create your firm with:
- `tenant_id`
- `client_id`
- `client_secret`
- `admin_id`
- `admin_password`

---

## Step 8: Deploy

Railway will automatically deploy when you:
- Push to your connected GitHub branch
- Or manually trigger a deployment from the dashboard

1. Push your code:
   ```bash
   git push origin main
   ```

2. Railway will automatically:
   - Detect the push
   - Build your application
   - Deploy it

3. Check deployment status in Railway dashboard

---

## Step 9: Get Your API URL

1. In Railway dashboard, click on your service
2. Go to **"Settings"** → **"Networking"**
3. Click **"Generate Domain"** to get a public URL
4. Your API will be available at: `https://your-app-name.up.railway.app`

---

## Step 10: Update Frontend Configuration

Update your frontend applications to use the Railway API URL:

**In `ClientOnboard/src/lib/api.ts`:**
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-app-name.up.railway.app/api/v1';
```

**In `Verity_website/src/lib/api.ts`:**
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-app-name.up.railway.app/api/v1';
```

Set the environment variable in your frontend deployment:
```
VITE_API_URL=https://your-app-name.up.railway.app/api/v1
```

---

## Step 11: Health Check

Test your API is working:

```bash
curl https://your-app-name.up.railway.app/health
```

Or visit in browser: `https://your-app-name.up.railway.app/health`

---

## Troubleshooting

### Database Connection Issues

1. Verify all database environment variables are set correctly
2. Check that PostgreSQL service is running in Railway
3. Verify the database reference syntax: `${{Postgres.PGHOST}}`

### Build Failures

1. Check build logs in Railway dashboard
2. Ensure `package.json` has correct dependencies
3. Verify Node.js version (Railway auto-detects, but you can specify in `package.json`):
   ```json
   {
     "engines": {
       "node": "18.x"
     }
   }
   ```

### Migration Errors

1. Check migration logs
2. Ensure database is accessible
3. Run migrations manually using Railway Shell

### CORS Issues

1. Update `CLIENT_PORTAL_URL` and `CONFIRMING_PARTY_PORTAL_URL` in environment variables
2. Or temporarily set `NODE_ENV=development` to allow all origins (not recommended for production)

---

## Optional: Custom Domain

1. In Railway dashboard, go to **"Settings"** → **"Networking"**
2. Click **"Custom Domain"**
3. Add your domain
4. Follow Railway's DNS instructions

---

## Monitoring

Railway provides:
- **Logs**: View real-time logs in dashboard
- **Metrics**: CPU, Memory, Network usage
- **Deployments**: History of all deployments

---

## Cost Considerations

Railway offers:
- **Free Tier**: $5 credit/month
- **Hobby Plan**: $5/month + usage
- **Pro Plan**: $20/month + usage

PostgreSQL database is included in your plan.

---

## Next Steps

1. ✅ Deploy backend to Railway
2. ✅ Run migrations
3. ✅ Create initial firm
4. ✅ Deploy frontend applications (separate services or different platform)
5. ✅ Update frontend API URLs
6. ✅ Test end-to-end functionality

---

## Quick Reference Commands

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Run migrations
railway run npm run migrate

# Create firm
railway run npm run create-firm

# View logs
railway logs

# Open shell
railway shell
```

---

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Your project logs: Check Railway dashboard

