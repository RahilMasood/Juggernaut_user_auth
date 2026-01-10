# Quick Start Checklist

Follow these steps in order to get everything working:

## ✅ Step 1: Database Setup

```bash
# Make sure PostgreSQL is running
# Then run migration
cd "C:\Users\HP\Desktop\Verity User Auth"
node migrations/migrate-new-schema.js
```

**Expected:** Should see "Migration completed successfully"

---

## ✅ Step 2: Create a Firm (Admin Account)

```bash
# Still in main directory
npm run create-firm
```

**Enter when prompted:**
- `tenant_id`: e.g., `tenant_123`
- `client_id`: e.g., `client_456`
- `client_secret`: e.g., `secret_789`
- `admin_id`: **This is your login username** - e.g., `admin_user`
- `admin_password`: **This is your login password** - e.g., `SecurePass123!`
- Confirm password

**IMPORTANT:** Write down your `admin_id` and `admin_password` - you'll need them to log in!

**Expected:** Should see "Firm created successfully" with Firm ID

---

## ✅ Step 3: Start Backend Server

```bash
# Still in main directory
npm run dev
```

**Expected:** Should see:
```
Server running on port 3000
Database connected successfully
```

**Keep this terminal open!**

---

## ✅ Step 4: Start Frontend Server

Open a **NEW terminal window**:

```bash
cd "C:\Users\HP\Desktop\Verity User Auth\Verity_website"
npm install  # Only needed first time
npm run dev
```

**Expected:** Should see:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:8080/
```

**Keep this terminal open too!**

---

## ✅ Step 5: Test Login

1. Open browser: `http://localhost:8080`
2. Click "Login" button
3. Enter:
   - **Admin ID**: The `admin_id` you created in Step 2
   - **Password**: The `admin_password` you created in Step 2
4. Click "Login"

**Expected:** Should redirect to dashboard showing "User Management"

---

## ✅ Step 6: Create Your First User

1. On the dashboard, click "Create User"
2. Fill in:
   - **User Name**: e.g., "John Doe"
   - **Email**: e.g., "john@example.com"
   - **Password**: Must be at least 12 characters with uppercase, lowercase, number, and special character
     - Example: `SecurePass123!`
   - **Type**: Select from dropdown (partner/manager/associate/article)
   - **Payroll ID**: (Optional) e.g., "payroll_123"
3. Click "Create User"

**Expected:** Should see success toast and user appears in table

---

## 🔍 Troubleshooting

### If login fails with 401:

1. **Check if firm exists:**
   ```bash
   # In PostgreSQL
   psql -U postgres -d audit_software
   SELECT admin_id, tenant_id FROM firms;
   ```

2. **Verify password:**
   - Make sure you're using the exact `admin_id` and `admin_password` from Step 2
   - Check for typos (case-sensitive)

3. **Recreate firm if needed:**
   ```bash
   npm run create-firm
   ```

### If you see 400 error on dashboard:

1. **Check backend is running** (Step 3)
2. **Check token exists:**
   - Press F12 → Application → Local Storage
   - Should see `admin_token`
3. **If no token:** Log in again

### If backend won't start:

1. **Check database connection:**
   - Make sure PostgreSQL is running
   - Check `.env` file has correct DB credentials

2. **Check port 3000 is free:**
   ```bash
   # Windows
   netstat -ano | findstr :3000
   ```

### If frontend won't start:

1. **Check if port 8080 is free**
2. **Make sure `.env` file exists** in `Verity_website` folder:
   ```
   VITE_API_URL=http://localhost:3000/api/v1
   ```
3. **Restart dev server** after creating `.env`

---

## 📝 Quick Reference

| What | Command | Location |
|------|---------|----------|
| Run migration | `node migrations/migrate-new-schema.js` | Main directory |
| Create firm | `npm run create-firm` | Main directory |
| Start backend | `npm run dev` | Main directory |
| Start frontend | `npm run dev` | Verity_website directory |
| Backend URL | `http://localhost:3000` | - |
| Frontend URL | `http://localhost:8080` | - |

---

## 🎯 Success Indicators

You'll know everything is working when:

- ✅ Backend shows "Server running on port 3000"
- ✅ Frontend shows "Local: http://localhost:8080"
- ✅ You can log in with admin credentials
- ✅ Dashboard loads and shows user management interface
- ✅ You can create a new user successfully

---

## Need Help?

1. Check browser console (F12) for errors
2. Check backend terminal for server errors
3. Verify all steps above are completed
4. Make sure both servers are running simultaneously

