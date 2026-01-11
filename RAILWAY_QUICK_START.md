# Railway Quick Start Checklist

Follow these steps in order:

## ✅ Pre-Deployment Checklist

- [ ] Code is pushed to GitHub
- [ ] Railway account created
- [ ] PostgreSQL database service added in Railway
- [ ] All environment variables configured
- [ ] JWT secrets generated

## 🚀 Deployment Steps

### 1. Create Project
- [ ] Go to railway.app → New Project
- [ ] Connect GitHub repository
- [ ] Railway auto-detects Node.js

### 2. Add Database
- [ ] Click "+ New" → Database → PostgreSQL
- [ ] Note database connection variables

### 3. Configure Environment Variables
Add these in Railway service → Variables:

**Database (use Railway references):**
```
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
```

**Required:**
```
NODE_ENV=production
PORT=3000
JWT_ACCESS_SECRET=<your-generated-secret>
JWT_REFRESH_SECRET=<your-generated-secret>
```

**Optional (update with your domains):**
```
CLIENT_PORTAL_URL=https://your-frontend.com
CONFIRMING_PARTY_PORTAL_URL=https://your-other-frontend.com
```

### 4. Deploy
- [ ] Push to GitHub (auto-deploys)
- [ ] Or manually trigger deployment
- [ ] Wait for build to complete

### 5. Run Migrations
- [ ] Install Railway CLI: `npm i -g @railway/cli`
- [ ] Login: `railway login`
- [ ] Link: `railway link`
- [ ] Run: `railway run npm run migrate`

### 6. Create Firm
- [ ] Run: `railway run npm run create-firm`
- [ ] Follow prompts to create admin account

### 7. Get API URL
- [ ] Settings → Networking → Generate Domain
- [ ] Copy the URL (e.g., `https://your-app.up.railway.app`)

### 8. Test
- [ ] Visit: `https://your-app.up.railway.app/health`
- [ ] Should return: `{"success": true, "data": {"status": "healthy", ...}}`

### 9. Update Frontend
- [ ] Update frontend API URLs to Railway URL
- [ ] Deploy frontend applications

## 🔧 Troubleshooting

**Build fails?**
- Check logs in Railway dashboard
- Verify `package.json` has `"start": "node server.js"`

**Database connection fails?**
- Verify all DB_* variables are set
- Check PostgreSQL service is running
- Use Railway reference syntax: `${{Postgres.PGHOST}}`

**Migration errors?**
- Run migrations manually: `railway run npm run migrate`
- Check database is accessible

**CORS errors?**
- Update `CLIENT_PORTAL_URL` in environment variables
- Or temporarily allow all origins (dev only)

## 📝 Environment Variables Reference

```bash
# Database (use Railway references)
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}

# Server
NODE_ENV=production
PORT=3000

# JWT (generate secrets)
JWT_ACCESS_SECRET=<64-char-hex-string>
JWT_REFRESH_SECRET=<64-char-hex-string>

# CORS
CLIENT_PORTAL_URL=https://your-frontend.com
CONFIRMING_PARTY_PORTAL_URL=https://your-other-frontend.com

# Optional
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_ROUNDS=12
```

## 🎯 Generate JWT Secrets

```bash
# Option 1: Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Option 2: OpenSSL
openssl rand -hex 64
```

## 📚 Full Documentation

See `RAILWAY_DEPLOYMENT.md` for detailed instructions.


