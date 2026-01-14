# Railway Quick Start Guide

A condensed version of the deployment guide for quick reference.

## 🚀 Quick Deployment Steps

### 1. Push Code to Git
```bash
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

### 2. Create Railway Project
1. Go to [railway.app](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository

### 3. Add PostgreSQL Database
1. In Railway project, click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Wait for provisioning

### 4. Configure Environment Variables

In your **API service** → **Variables** tab, add:

#### Database (Reference from PostgreSQL service)
- `DB_HOST` = Reference `PGHOST` from PostgreSQL
- `DB_PORT` = `5432`
- `DB_NAME` = Reference `PGDATABASE` from PostgreSQL
- `DB_USER` = Reference `PGUSER` from PostgreSQL
- `DB_PASSWORD` = Reference `PGPASSWORD` from PostgreSQL

#### Generate Secrets (run locally):
```bash
# JWT Secrets (64+ chars each)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Encryption Key (32 chars)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Webhook Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Required Variables:
```
NODE_ENV=production
PORT=3000

JWT_ACCESS_SECRET=<64+ char secret>
JWT_REFRESH_SECRET=<64+ char secret>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

ENCRYPTION_KEY=<32 char key>

PAYROLL_WEBHOOK_SECRET=<32+ char secret>

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourfirm.com

CLIENT_PORTAL_URL=https://client-portal.up.railway.app
CONFIRMING_PARTY_PORTAL_URL=https://confirming-party.up.railway.app
```

**Note**: Update these URLs after deploying your frontend services on Railway.

### 5. Run Migrations

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link
railway login
railway link

# Run migrations
railway run npm run migrate
```

### 6. Create Admin User

```bash
railway run npm run seed-admin
```

### 7. Get Your API URL

1. Go to API service → **Settings** → **Networking**
2. Copy **Public Domain** (e.g., `your-app.up.railway.app`)
3. Your API base URL: `https://your-app.up.railway.app/api/v1`

### 8. Deploy Frontend Services (Optional - if hosting on Railway)

1. In same Railway project, click **"+ New"** → **"GitHub Repo"**
2. Deploy Client Portal repository
3. Deploy Confirming Party Portal repository
4. Get URLs from each service → **Settings** → **Networking**
5. Update API service environment variables:
   - `CLIENT_PORTAL_URL=https://client-portal.up.railway.app`
   - `CONFIRMING_PARTY_PORTAL_URL=https://confirming-party.up.railway.app`
6. Add to each frontend service:
   - `VITE_API_URL=https://verity-api.up.railway.app/api/v1` (or `REACT_APP_API_URL` for CRA)

### 9. Test Deployment

```bash
# Health check
curl https://your-app.up.railway.app/health

# Login test
curl -X POST https://your-app.up.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourfirm.com","password":"YourPassword"}'
```

## 📝 Environment Variables Checklist

- [ ] Database variables (from PostgreSQL service)
- [ ] `NODE_ENV=production`
- [ ] `PORT=3000`
- [ ] `JWT_ACCESS_SECRET` (64+ chars)
- [ ] `JWT_REFRESH_SECRET` (64+ chars)
- [ ] `ENCRYPTION_KEY` (32 chars)
- [ ] `PAYROLL_WEBHOOK_SECRET` (32+ chars)
- [ ] SMTP email settings
- [ ] `CLIENT_PORTAL_URL` (Railway frontend URL)
- [ ] `CONFIRMING_PARTY_PORTAL_URL` (Railway frontend URL)
- [ ] Frontend services deployed (if hosting on Railway)
- [ ] Frontend environment variables configured (`VITE_API_URL` or `REACT_APP_API_URL`)

## 🔗 Using the API

**Base URL**: `https://your-app-name.up.railway.app/api/v1`

**Example JavaScript:**
```javascript
const API_URL = 'https://your-app-name.up.railway.app/api/v1';

// Login
const response = await fetch(`${API_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const { accessToken } = (await response.json()).data;

// Authenticated request
const data = await fetch(`${API_URL}/engagements`, {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
```

## 🐛 Common Issues

**Database connection failed?**
- Check database variables reference PostgreSQL service correctly
- Wait a few minutes after creating database

**CORS errors?**
- Update `CLIENT_PORTAL_URL` and `CONFIRMING_PARTY_PORTAL_URL` with actual Railway URLs
- Ensure URLs match exactly (including https://)
- Redeploy API service after updating URLs

**Email not sending?**
- For Gmail, use App Password (not regular password)
- Verify SMTP settings

**App won't start?**
- Check Railway logs
- Verify all environment variables are set
- Ensure `PORT` is set (Railway sets this automatically)

## 📚 Full Documentation

See `RAILWAY_DEPLOYMENT_GUIDE.md` for detailed instructions.

