# Setup and Run Guide

This guide will help you set up and run both the backend API and frontend website.

---

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

---

## Step 1: Database Setup

### 1.1 Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE audit_software;

# Exit psql
\q
```

### 1.2 Run Database Migration

```bash
# Navigate to the main project directory
cd "C:\Users\HP\Desktop\Verity User Auth"

# Run the migration
node migrations/migrate-new-schema.js
```

This will create all the necessary tables with the new schema.

### 1.3 Create a Firm (Admin Account)

You have two options:

#### Option A: Using the Interactive Script (Recommended)

```bash
npm run create-firm
```

Follow the prompts to enter:
- `tenant_id`
- `client_id`
- `client_secret`
- `admin_id` (this is what you'll use to log in)
- `admin_password`

#### Option B: Using SQL Directly

1. First, hash your password:
   ```bash
   node -e "const bcrypt = require('bcrypt'); bcrypt.hash('your_password', 10).then(hash => console.log(hash));"
   ```

2. Then insert into database:
   ```sql
   INSERT INTO firms (
       id, tenant_id, client_id, client_secret, admin_id, admin_password, created_at, updated_at
   ) VALUES (
       gen_random_uuid(),
       'your_tenant_id',
       'your_client_id',
       'your_client_secret',
       'your_admin_id',
       '$2b$10$YOUR_HASHED_PASSWORD_HERE',
       NOW(),
       NOW()
   );
   ```

---

## Step 2: Backend API Setup

### 2.1 Install Dependencies

```bash
# Make sure you're in the main project directory
cd "C:\Users\HP\Desktop\Verity User Auth"

# Install dependencies
npm install
```

### 2.2 Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=audit_software
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# JWT Configuration
JWT_ACCESS_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS (optional)
CLIENT_PORTAL_URL=http://localhost:5173
```

### 2.3 Start the Backend Server

```bash
# Development mode (with auto-reload)
npm run dev

# OR Production mode
npm start
```

The API will be running at `http://localhost:3000`

**Verify it's working:**
```bash
curl http://localhost:3000/health
```

You should see:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "..."
  }
}
```

---

## Step 3: Frontend Website Setup

### 3.1 Navigate to Website Directory

```bash
cd "C:\Users\HP\Desktop\Verity User Auth\Verity_website"
```

### 3.2 Install Dependencies

```bash
npm install
```

### 3.3 Configure Environment Variables

Create a `.env` file in the `Verity_website` directory:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

### 3.4 Start the Frontend Development Server

```bash
npm run dev
```

The website will be running at `http://localhost:5173` (or another port if 5173 is taken)

---

## Step 4: Testing the Complete Flow

### 4.1 Open the Website

1. Open your browser and go to: `http://localhost:5173`
2. You should see the Verity homepage

### 4.2 Login as Admin

1. Click the "Login" button or go to: `http://localhost:5173/login`
2. Enter your `admin_id` and `admin_password` (the ones you created in Step 1.3)
3. Click "Login"

### 4.3 Create a User

After logging in, you'll be redirected to the User Management dashboard (`/dashboard`).

1. Click the "Create User" button
2. Fill in the form:
   - **User Name**: e.g., "John Doe"
   - **Email**: e.g., "john@example.com"
   - **Password**: Must be at least 12 characters with uppercase, lowercase, number, and special character
   - **Type**: Select from dropdown (partner, manager, associate, article)
   - **Payroll ID**: (Optional) e.g., "payroll_123"
3. Click "Create User"

### 4.4 View, Edit, or Delete Users

- **View**: All users are displayed in a table
- **Edit**: Click the edit icon (pencil) next to a user
- **Delete**: Click the delete icon (trash) next to a user

---

## Troubleshooting

### Backend Issues

**Error: "Cannot connect to database"**
- Make sure PostgreSQL is running
- Check your `.env` file has correct database credentials
- Verify the database exists: `psql -U postgres -l`

**Error: "Port 3000 already in use"**
- Change the PORT in `.env` to another port (e.g., 3001)
- Or stop the process using port 3000

**Error: "Migration failed"**
- Make sure you've run the migration script: `node migrations/migrate-new-schema.js`
- Check that all previous migrations completed successfully

### Frontend Issues

**Error: "Failed to fetch" or CORS errors**
- Make sure the backend is running on `http://localhost:3000`
- Check that `VITE_API_URL` in `.env` matches your backend URL
- Restart the frontend dev server after changing `.env`

**Error: "Invalid credentials"**
- Double-check your `admin_id` and `admin_password`
- Make sure the firm was created successfully in the database
- Verify the password was hashed correctly

**Error: "Network error"**
- Ensure the backend server is running
- Check the browser console for detailed error messages
- Verify the API URL in `.env` is correct

---

## Quick Command Reference

### Backend (Main Directory)

```bash
# Install dependencies
npm install

# Run migration
node migrations/migrate-new-schema.js

# Create firm
npm run create-firm

# Start dev server
npm run dev

# Start production server
npm start
```

### Frontend (Verity_website Directory)

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Database Commands

```bash
# Connect to database
psql -U postgres -d audit_software

# View all firms
SELECT id, tenant_id, admin_id, created_at FROM firms;

# View all users
SELECT id, user_name, email, type, is_active FROM users;

# View all audit clients
SELECT id, client_name, status FROM audit_clients;

# View all engagements
SELECT id, audit_client_id, status FROM engagements;
```

---

## Next Steps

After successfully setting up and testing:

1. **Create more users** through the dashboard
2. **Set up Page 2** (Client Onboarding) - coming next
3. **Set up Page 3** (Engagement Management) - coming next

---

## Support

If you encounter any issues:

1. Check the browser console (F12) for frontend errors
2. Check the backend terminal for server errors
3. Verify all environment variables are set correctly
4. Ensure PostgreSQL is running and accessible
5. Make sure both servers (backend and frontend) are running

---

## Summary Checklist

- [ ] PostgreSQL database created
- [ ] Database migration completed
- [ ] Firm created with admin credentials
- [ ] Backend dependencies installed
- [ ] Backend `.env` configured
- [ ] Backend server running on port 3000
- [ ] Frontend dependencies installed
- [ ] Frontend `.env` configured
- [ ] Frontend server running
- [ ] Successfully logged in as admin
- [ ] Successfully created a test user

Once all items are checked, you're ready to use the system! 🎉

