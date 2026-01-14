# Railway Multi-Service Setup Guide

This guide explains how to deploy all your services (API + Frontend websites) on Railway in a single project.

## 🏗️ Architecture Overview

When hosting everything on Railway, your project structure will be:

```
Railway Project: "Verity Platform"
│
├── PostgreSQL Database (shared)
│
├── API Service
│   └── URL: https://verity-api.up.railway.app
│
├── Client Portal Service
│   └── URL: https://client-portal.up.railway.app
│
└── Confirming Party Portal Service
    └── URL: https://confirming-party.up.railway.app
```

## 🔄 Deployment Order

### Step 1: Deploy API Service First

1. Create Railway project
2. Add PostgreSQL database
3. Deploy API service
4. Configure all environment variables (except frontend URLs)
5. Run migrations
6. Create admin user
7. **Note the API URL**: `https://verity-api.up.railway.app`

### Step 2: Deploy Frontend Services

1. In the **same Railway project**, add Client Portal service
2. In the **same Railway project**, add Confirming Party Portal service
3. **Note the frontend URLs**:
   - Client Portal: `https://client-portal.up.railway.app`
   - Confirming Party: `https://confirming-party.up.railway.app`

### Step 3: Connect Services Together

#### In API Service Environment Variables:
```
CLIENT_PORTAL_URL=https://client-portal.up.railway.app
CONFIRMING_PARTY_PORTAL_URL=https://confirming-party.up.railway.app
```

#### In Client Portal Service Environment Variables:
```
VITE_API_URL=https://verity-api.up.railway.app/api/v1
# or REACT_APP_API_URL for Create React App
# or NEXT_PUBLIC_API_URL for Next.js
```

#### In Confirming Party Portal Service Environment Variables:
```
VITE_API_URL=https://verity-api.up.railway.app/api/v1
# (use appropriate prefix for your framework)
```

## 🔑 Key Configuration Points

### 1. CORS Configuration

The API uses `CLIENT_PORTAL_URL` and `CONFIRMING_PARTY_PORTAL_URL` for CORS. These must:
- Match your actual Railway frontend URLs exactly
- Use `https://` (Railway provides HTTPS automatically)
- Be updated in the API service environment variables

### 2. Frontend API Configuration

Each frontend service needs to know where the API is:
- Use the Railway API service URL
- Include `/api/v1` in the path
- Use the correct environment variable prefix for your framework:
  - **Vite**: `VITE_API_URL`
  - **Create React App**: `REACT_APP_API_URL`
  - **Next.js**: `NEXT_PUBLIC_API_URL`
  - **Vue CLI**: `VUE_APP_API_URL`

### 3. Email Links

When the API sends credential emails, it uses:
- `CLIENT_PORTAL_URL` for client users
- `CONFIRMING_PARTY_PORTAL_URL` for confirming party users

These URLs are included in the email, so users can click to access their portal.

## 📋 Complete Checklist

### API Service
- [ ] Deployed from Git repository
- [ ] PostgreSQL database connected
- [ ] All secrets configured (JWT, encryption, webhook)
- [ ] SMTP email settings configured
- [ ] Database migrations run
- [ ] Admin user created
- [ ] `CLIENT_PORTAL_URL` set to Railway frontend URL
- [ ] `CONFIRMING_PARTY_PORTAL_URL` set to Railway frontend URL

### Client Portal Service
- [ ] Deployed from Git repository
- [ ] `VITE_API_URL` (or framework-specific) set to API URL
- [ ] Build command configured correctly
- [ ] Service is accessible at Railway URL

### Confirming Party Portal Service
- [ ] Deployed from Git repository
- [ ] `VITE_API_URL` (or framework-specific) set to API URL
- [ ] Build command configured correctly
- [ ] Service is accessible at Railway URL

### Verification
- [ ] API health endpoint works
- [ ] Client Portal can log in (no CORS errors)
- [ ] Confirming Party Portal can log in (no CORS errors)
- [ ] Email links point to correct Railway URLs
- [ ] All services accessible via HTTPS

## 🚨 Common Issues

### CORS Errors

**Problem**: Browser shows CORS errors when frontend tries to call API

**Solution**:
1. Verify `CLIENT_PORTAL_URL` and `CONFIRMING_PARTY_PORTAL_URL` in API service
2. Ensure URLs match exactly (including `https://`)
3. Redeploy API service after updating URLs
4. Check browser console for exact error message

### Frontend Can't Find API

**Problem**: Frontend shows "Failed to fetch" or network errors

**Solution**:
1. Verify `VITE_API_URL` (or framework-specific variable) is set
2. Check the API URL is correct: `https://verity-api.up.railway.app/api/v1`
3. Ensure frontend service has been redeployed after adding environment variable
4. Check Railway logs for frontend service

### Email Links Wrong

**Problem**: Email links point to wrong URLs

**Solution**:
1. Update `CLIENT_PORTAL_URL` and `CONFIRMING_PARTY_PORTAL_URL` in API service
2. Redeploy API service
3. Test by creating a new user and checking the email

## 💡 Tips

1. **Deploy API First**: Get the API working before deploying frontends
2. **Use Railway URLs**: Don't use localhost or placeholder URLs in production
3. **Test Each Step**: Verify each service works before moving to the next
4. **Check Logs**: Railway logs show errors and help debug issues
5. **Redeploy After Changes**: Environment variable changes require redeployment
6. **HTTPS Always**: Railway provides HTTPS automatically - always use `https://`

## 📚 Related Documentation

- **[RAILWAY_DEPLOYMENT_GUIDE.md](RAILWAY_DEPLOYMENT_GUIDE.md)** - Complete deployment guide
- **[RAILWAY_QUICK_START.md](RAILWAY_QUICK_START.md)** - Quick reference
- **[README.md](README.md)** - API documentation

---

**Need Help?** Check the troubleshooting section in `RAILWAY_DEPLOYMENT_GUIDE.md` or Railway logs in the dashboard.

