# Railway Connection Quick Start

Quick reference for connecting your 3 Railway services.

## 🚀 Quick Steps

### 1. Get Your URLs
- **API URL**: `https://your-api-name.up.railway.app`
- **Website URL**: `https://your-website-name.up.railway.app`

### 2. Connect Database to API

**In User Auth API Service → Variables:**

Use Railway's "Reference Variable" feature to link PostgreSQL variables:

| API Variable | PostgreSQL Variable |
|-------------|---------------------|
| `DB_HOST` | `PGHOST` |
| `DB_PORT` | `5432` (or `PGPORT`) |
| `DB_NAME` | `PGDATABASE` |
| `DB_USER` | `PGUSER` |
| `DB_PASSWORD` | `PGPASSWORD` |

### 3. Configure CORS in API

**In User Auth API Service → Variables:**

```
CLIENT_PORTAL_URL=https://your-website-name.up.railway.app
CONFIRMING_PARTY_PORTAL_URL=https://your-website-name.up.railway.app
NODE_ENV=production
```

### 4. Connect Frontend to API

**In Verity Website Service → Variables:**

```
VITE_API_URL=https://your-api-name.up.railway.app/api/v1
```

### 5. Run Migrations

```bash
railway login
railway link
railway run npm run migrate
```

### 6. Create Admin User

```bash
railway run npm run seed-admin
```

### 7. Test

- API Health: `https://your-api-name.up.railway.app/health`
- Frontend: `https://your-website-name.up.railway.app`
- Check browser console for CORS errors

---

## ⚠️ Common Mistakes

1. ❌ Forgetting `/api/v1` in `VITE_API_URL`
2. ❌ Using `http://` instead of `https://`
3. ❌ Not redeploying after changing environment variables
4. ❌ CORS URL doesn't match frontend URL exactly

---

## 📋 Variable Checklist

### User Auth API Service
- [ ] `DB_HOST` (from PostgreSQL)
- [ ] `DB_PORT` (5432)
- [ ] `DB_NAME` (from PostgreSQL)
- [ ] `DB_USER` (from PostgreSQL)
- [ ] `DB_PASSWORD` (from PostgreSQL)
- [ ] `CLIENT_PORTAL_URL` (your website URL)
- [ ] `CONFIRMING_PARTY_PORTAL_URL` (your website URL)
- [ ] `NODE_ENV=production`
- [ ] `JWT_ACCESS_SECRET`
- [ ] `JWT_REFRESH_SECRET`
- [ ] `ENCRYPTION_KEY`
- [ ] `PAYROLL_WEBHOOK_SECRET`
- [ ] SMTP email settings

### Verity Website Service
- [ ] `VITE_API_URL` (API URL + `/api/v1`)

---

**Full guide:** See [RAILWAY_CONNECT_SERVICES.md](RAILWAY_CONNECT_SERVICES.md)

