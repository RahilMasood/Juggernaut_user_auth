# Railway Database Connection Setup - Quick Fix

## Problem
Your app is trying to connect to `localhost` instead of Railway's PostgreSQL service. This means the database environment variables are not configured.

## Solution: Configure Database Environment Variables

### Step 1: Get PostgreSQL Connection Details

1. Go to your **Railway project dashboard**
2. Click on your **PostgreSQL service** (the database)
3. Go to the **"Variables"** tab
4. You'll see these variables automatically created by Railway:
   - `PGHOST` - Database host
   - `PGPORT` - Database port (usually 5432)
   - `PGDATABASE` - Database name
   - `PGUSER` - Database user
   - `PGPASSWORD` - Database password

**Copy these values** - you'll need them in the next step.

### Step 2: Add Database Variables to API Service

1. In your Railway project, click on your **API service** (the Node.js app)
2. Go to the **"Variables"** tab
3. Click **"+ New Variable"** for each of these:

#### Option A: Reference Variables (Recommended - Auto-syncs)

Railway allows you to reference variables from other services:

1. Click **"+ New Variable"**
2. Click **"Reference Variable"** button
3. Select your **PostgreSQL service**
4. Select the variable you want to reference:
   - For `DB_HOST`: Reference `PGHOST` from PostgreSQL
   - For `DB_PORT`: Reference `PGPORT` from PostgreSQL (or just set to `5432`)
   - For `DB_NAME`: Reference `PGDATABASE` from PostgreSQL
   - For `DB_USER`: Reference `PGUSER` from PostgreSQL
   - For `DB_PASSWORD`: Reference `PGPASSWORD` from PostgreSQL

#### Option B: Manual Entry (If reference doesn't work)

Add these variables manually with the values you copied:

```
DB_HOST=<value from PGHOST>
DB_PORT=5432
DB_NAME=<value from PGDATABASE>
DB_USER=<value from PGUSER>
DB_PASSWORD=<value from PGPASSWORD>
```

### Step 3: Verify Variables Are Set

After adding all variables, you should see:
- ✅ `DB_HOST` - Should NOT be `localhost`
- ✅ `DB_PORT` - Should be `5432`
- ✅ `DB_NAME` - Should match your database name
- ✅ `DB_USER` - Should match your database user
- ✅ `DB_PASSWORD` - Should be set

### Step 4: Redeploy

After adding the variables:
1. Railway will automatically detect the changes
2. It will trigger a new deployment
3. Wait for the deployment to complete
4. Check the logs - you should see "Database connection established successfully"

## Quick Checklist

- [ ] PostgreSQL service is running in Railway
- [ ] Got connection details from PostgreSQL service Variables tab
- [ ] Added `DB_HOST` to API service (using reference or manual value)
- [ ] Added `DB_PORT` to API service (set to `5432`)
- [ ] Added `DB_NAME` to API service (using reference or manual value)
- [ ] Added `DB_USER` to API service (using reference or manual value)
- [ ] Added `DB_PASSWORD` to API service (using reference or manual value)
- [ ] Redeployed API service
- [ ] Checked logs - no more connection errors

## Troubleshooting

### Still seeing "ECONNREFUSED ::1:5432"?

1. **Check variable names**: Make sure they're exactly `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` (case-sensitive)
2. **Check values**: `DB_HOST` should NOT be `localhost` - it should be a Railway hostname
3. **Wait for redeploy**: After adding variables, wait 1-2 minutes for Railway to redeploy
4. **Check PostgreSQL is running**: Make sure your PostgreSQL service shows as "Active" in Railway

### Variable Reference Not Working?

If Railway's "Reference Variable" feature doesn't work:
1. Manually copy the values from PostgreSQL service
2. Paste them directly into the API service variables
3. Make sure there are no extra spaces or quotes

### Still Having Issues?

1. Check Railway logs for the exact error message
2. Verify PostgreSQL service is provisioned and running
3. Make sure you're adding variables to the **API service**, not the PostgreSQL service
4. Try removing and re-adding the variables

---

**After fixing this, your app should connect to the database and start successfully!**

