# Railway: Connecting Postgres, User Auth API, and Verity Website

This guide shows you how to connect your three Railway services:
1. **PostgreSQL Database**
2. **User Auth API** (backend)
3. **Verity Website** (frontend)

---

## 📋 Prerequisites

- All three services are already deployed on Railway
- You have access to your Railway dashboard
- You know the Railway URLs for each service

---

## 🔗 Step-by-Step Connection Guide

### Step 1: Get Your Service URLs

First, collect the URLs for all your services:

1. **Go to Railway Dashboard** → Your Project
2. **For each service**, click on it → **Settings** → **Networking**
3. **Copy the Public Domain** for each:

   - **PostgreSQL**: You don't need the URL, but note the service name
   - **User Auth API**: `https://your-api-name.up.railway.app`
   - **Verity Website**: `https://your-website-name.up.railway.app`

**Example URLs:**
```
PostgreSQL Service: (no URL needed)
API Service: https://verity-api.up.railway.app
Website Service: https://verity-website.up.railway.app
```

---

### Step 2: Connect PostgreSQL to User Auth API

The User Auth API needs database connection variables.

#### Option A: Using Railway Variable References (Recommended)

1. **Go to Railway Dashboard** → Your Project → **User Auth API Service**
2. Click **Variables** tab
3. Click **"+ New Variable"**
4. Click **"Reference Variable"** (instead of typing manually)
5. **For each database variable**, do the following:

   **DB_HOST:**
   - Select your **PostgreSQL service** from dropdown
   - Select variable: `PGHOST`
   - Railway will auto-sync this

   **DB_PORT:**
   - Select your **PostgreSQL service**
   - Select variable: `PGPORT`
   - Or manually set: `5432`

   **DB_NAME:**
   - Select your **PostgreSQL service**
   - Select variable: `PGDATABASE`

   **DB_USER:**
   - Select your **PostgreSQL service**
   - Select variable: `PGUSER`

   **DB_PASSWORD:**
   - Select your **PostgreSQL service**
   - Select variable: `PGPASSWORD`

#### Option B: Manual Configuration

1. **Go to PostgreSQL Service** → **Variables** tab
2. **Copy these values:**
   - `PGHOST`
   - `PGPORT` (usually `5432`)
   - `PGDATABASE`
   - `PGUSER`
   - `PGPASSWORD`

3. **Go to User Auth API Service** → **Variables** tab
4. **Add these variables manually:**

```
DB_HOST=<paste PGHOST value>
DB_PORT=5432
DB_NAME=<paste PGDATABASE value>
DB_USER=<paste PGUSER value>
DB_PASSWORD=<paste PGPASSWORD value>
```

**✅ Verification:** After adding these, your API service should automatically redeploy. Check logs to see "Database connection established successfully".

---

### Step 3: Configure CORS in User Auth API

The API needs to know which frontend URLs to allow.

1. **Go to User Auth API Service** → **Variables** tab
2. **Add these variables:**

```
CLIENT_PORTAL_URL=https://your-website-name.up.railway.app
CONFIRMING_PARTY_PORTAL_URL=https://your-website-name.up.railway.app
NODE_ENV=production
```

**Important:**
- Replace `your-website-name.up.railway.app` with your **actual Verity Website URL**
- Use `https://` (Railway provides HTTPS automatically)
- If you have separate portals, use their respective URLs

**Example:**
```
CLIENT_PORTAL_URL=https://verity-website.up.railway.app
CONFIRMING_PARTY_PORTAL_URL=https://verity-website.up.railway.app
NODE_ENV=production
```

**✅ Verification:** The API will redeploy. CORS is now configured to allow requests from your frontend.

---

### Step 4: Connect Verity Website to User Auth API

The frontend needs to know where the API is located.

1. **Go to Verity Website Service** → **Variables** tab
2. **Click "+ New Variable"**
3. **Add this variable:**

```
VITE_API_URL=https://your-api-name.up.railway.app/api/v1
```

**Important:**
- Replace `your-api-name.up.railway.app` with your **actual API URL**
- Include `/api/v1` at the end
- Use `https://` (not `http://`)

**Example:**
```
VITE_API_URL=https://verity-api.up.railway.app/api/v1
```

**✅ Verification:** The frontend will rebuild and redeploy. After deployment, your frontend will use this API URL.

---

### Step 5: Add Other Required Environment Variables

#### For User Auth API Service

Add these additional variables if not already set:

**JWT Secrets** (generate secure random strings):
```bash
# Generate these locally using:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Then add to Railway:
```
JWT_ACCESS_SECRET=<64+ character random string>
JWT_REFRESH_SECRET=<64+ character random string>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

**Encryption Key** (generate 32-character key):
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Then add:
```
ENCRYPTION_KEY=<32 character random string>
```

**Webhook Secret**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then add:
```
PAYROLL_WEBHOOK_SECRET=<32+ character random string>
```

**Email Configuration** (SMTP):
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourfirm.com
```

**Port** (Railway sets this automatically, but you can verify):
```
PORT=3000
```

---

### Step 6: Run Database Migrations

After connecting the database, you need to create the tables:

1. **Install Railway CLI** (if not already installed):
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Link to your project**:
   ```bash
   railway link
   ```
   Select your Railway project when prompted.

4. **Run migrations**:
   ```bash
   railway run npm run migrate
   ```

**✅ Verification:** Check Railway logs to see if migrations completed successfully.

---

### Step 7: Create Admin User

After migrations, create your first admin user:

```bash
railway run npm run seed-admin
```

This will prompt you for:
- Firm name
- Admin email
- Admin password
- Other firm details

---

### Step 8: Verify Everything Works

#### Test 1: API Health Check

Open in browser or use curl:
```
https://your-api-name.up.railway.app/health
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

#### Test 2: Frontend Can Access API

1. **Open your Verity Website**: `https://your-website-name.up.railway.app`
2. **Open Browser DevTools** (F12) → **Network** tab
3. **Try to log in** or make any API call
4. **Check for CORS errors** in Console tab
   - ✅ **No CORS errors** = Success!
   - ❌ **CORS errors** = Check `CLIENT_PORTAL_URL` matches your frontend URL exactly

#### Test 3: Database Connection

Check Railway logs for User Auth API service:
- Look for: "Database connection established successfully"
- No database errors

---

## 🔍 Troubleshooting

### Issue: CORS Errors in Browser

**Symptoms:** Browser console shows "CORS policy" errors

**Solution:**
1. Verify `CLIENT_PORTAL_URL` in API service matches your frontend URL **exactly**
2. Ensure both use `https://` (not `http://`)
3. Check that `NODE_ENV=production` is set in API service
4. Redeploy API service after changing CORS variables

### Issue: Frontend Can't Connect to API

**Symptoms:** "Failed to fetch" or network errors

**Solution:**
1. Verify `VITE_API_URL` is set correctly in Verity Website service
2. Check the API URL includes `/api/v1` at the end
3. Ensure API service is running (check health endpoint)
4. Redeploy frontend service after adding environment variable

### Issue: Database Connection Failed

**Symptoms:** API logs show "Unable to connect to database"

**Solution:**
1. Verify all database variables (`DB_HOST`, `DB_PORT`, etc.) are set correctly
2. Check PostgreSQL service is running in Railway
3. If using variable references, ensure they're linked correctly
4. Wait a few minutes after creating database (provisioning takes time)

### Issue: Environment Variables Not Working

**Symptoms:** Frontend still uses old API URL or localhost

**Solution:**
1. **For Vite projects:** Environment variables must start with `VITE_`
2. After adding `VITE_API_URL`, the frontend must rebuild
3. Check Railway deployment logs to see if variables are being used
4. Clear browser cache and hard refresh (Ctrl+Shift+R)

---

## 📊 Complete Configuration Summary

### User Auth API Service Variables

```
# Database (from PostgreSQL service)
DB_HOST=<from PostgreSQL PGHOST>
DB_PORT=5432
DB_NAME=<from PostgreSQL PGDATABASE>
DB_USER=<from PostgreSQL PGUSER>
DB_PASSWORD=<from PostgreSQL PGPASSWORD>

# CORS
CLIENT_PORTAL_URL=https://your-website-name.up.railway.app
CONFIRMING_PARTY_PORTAL_URL=https://your-website-name.up.railway.app
NODE_ENV=production

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
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourfirm.com

# Port
PORT=3000
```

### Verity Website Service Variables

```
VITE_API_URL=https://your-api-name.up.railway.app/api/v1
```

---

## ✅ Final Checklist

- [ ] PostgreSQL service is running
- [ ] User Auth API has all database variables configured
- [ ] User Auth API has CORS variables set (`CLIENT_PORTAL_URL`, `CONFIRMING_PARTY_PORTAL_URL`)
- [ ] Verity Website has `VITE_API_URL` set to API URL
- [ ] Database migrations have been run
- [ ] Admin user has been created
- [ ] API health endpoint returns 200 OK
- [ ] Frontend can make API calls without CORS errors
- [ ] Login works from the frontend

---

## 🎉 Success!

Once all steps are complete, your three services are connected:

```
┌─────────────────┐
│   PostgreSQL    │
│    Database     │
└────────┬────────┘
         │
         │ DB_HOST, DB_PORT, etc.
         │
┌────────▼────────┐         ┌──────────────────┐
│  User Auth API  │◄────────│  Verity Website  │
│   (Backend)     │         │    (Frontend)    │
│                 │         │                  │
│ Railway URL:    │         │ Railway URL:     │
│ api.up.railway  │         │ website.up.rail  │
└─────────────────┘         └──────────────────┘
         │
         │ VITE_API_URL
         │ points here
```

**Your services are now connected and ready to use!**

---

## 📚 Related Documentation

- **[RAILWAY_DEPLOYMENT_GUIDE.md](RAILWAY_DEPLOYMENT_GUIDE.md)** - Complete deployment guide
- **[RAILWAY_MULTI_SERVICE_SETUP.md](RAILWAY_MULTI_SERVICE_SETUP.md)** - Multi-service architecture
- **[README.md](README.md)** - API documentation

---

**Need Help?** Check Railway logs in the dashboard or refer to the troubleshooting section above.

