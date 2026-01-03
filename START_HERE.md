# 🚀 Complete Setup Guide - Start to Finish

## Prerequisites Check

Before starting, make sure you have:

- ✅ **Docker Desktop** installed and running
  - Download: https://www.docker.com/products/docker-desktop
  - After installing, open Docker Desktop and make sure it's running
- ✅ **Node.js 18+** (for running scripts locally)
  - Check: `node --version`
  - Download: https://nodejs.org/

---

## Step-by-Step Setup

### Step 1: Install Dependencies

```bash
npm install
```

This installs all required Node.js packages.

**Expected output:** You should see packages being installed without errors.

---

### Step 2: Start Docker Services

```bash
docker-compose up -d
```

This command:

- Downloads PostgreSQL 15 image (first time only)
- Builds the API Docker image
- Starts both PostgreSQL and API containers
- Runs in background (`-d` = detached mode)

**Expected output:**

```
Creating network "vertiapi_default" with the default driver
Creating volume "vertiapi_postgres_data" with default driver
Creating audit_db ... done
Creating audit_api ... done
```

**Verify it's running:**

```bash
docker-compose ps
```

You should see both containers running:

```
    Name                   Command               State           Ports
--------------------------------------------------------------------------------
audit_api      docker-entrypoint.sh npm ...   Up      0.0.0.0:3000->3000/tcp
audit_db       docker-entrypoint.sh postgres  Up      0.0.0.0:5432->5432/tcp
```

---

### Step 3: Wait for Database to Initialize

The database needs a few seconds to fully start up.

```bash
# Watch the database logs
docker-compose logs -f postgres
```

**Wait until you see:**

```
database system is ready to accept connections
```

Press `Ctrl+C` to stop watching logs.

**Or simply wait 10 seconds:**

```bash
sleep 10
```

---

### Step 4: Run Database Migrations

This creates all the database tables and seeds default permissions.

```bash
docker-compose exec api npm run migrate
```

**Expected output:**

```
Starting database migration...
Database connection established successfully
Database migration completed successfully
Seeded 13 default permissions
```

**Verify tables were created:**

```bash
docker-compose exec postgres psql -U postgres -d audit_software -c "\dt"
```

You should see 12 tables listed.

---

### Step 5: Create Admin User

```bash
docker-compose exec api npm run seed-admin
```

**Expected output:**

```
🌱 Seeding initial firm and admin user...

✅ Created firm: Example Audit Firm
✅ Created Partner role with all permissions

✅ Created admin user:
   Email: admin@example.com
   Password: <RANDOM_PASSWORD>

⚠️  IMPORTANT: Save this password! You'll need to change it on first login.

✅ Seeding complete!
```

**🔴 IMPORTANT:** Copy and save the password shown! You'll need it to login.

---

### Step 6: Verify API is Running

```bash
curl http://localhost:3000/health
```

**Expected output:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### Step 7: Test Login

Replace `<PASSWORD>` with the password from Step 5:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "<PASSWORD>"
  }'
```

**Expected output:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "admin@example.com",
      "first_name": "Admin",
      "last_name": "User",
      ...
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "mustChangePassword": true
  }
}
```

**Save the `accessToken`** - you'll need it for subsequent requests!

---

## 🎉 Success! Your API is Running

Your Audit Software API is now fully operational at:

- **API:** http://localhost:3000
- **Database:** localhost:5432

---

## Quick Reference Commands

### Daily Usage

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View API logs
docker-compose logs -f api

# View all logs
docker-compose logs -f

# Restart API
docker-compose restart api

# Check status
docker-compose ps
```

### Database Access

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d audit_software

# Inside psql:
\dt                    # List tables
\d users              # Describe users table
SELECT * FROM users;  # Query users
\q                    # Quit
```

### Running Commands

```bash
# Run any npm script
docker-compose exec api npm run <script-name>

# Examples:
docker-compose exec api npm run migrate
docker-compose exec api npm run seed-admin
docker-compose exec api npm test
```

---

## Testing the API

### 1. Health Check

```bash
curl http://localhost:3000/health
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"YOUR_PASSWORD"}'
```

### 3. Get Current User (use token from login)

```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. List Users

```bash
curl http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5. Create Engagement

```bash
curl -X POST http://localhost:3000/api/v1/engagements \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Annual Audit 2024",
    "client_name": "ABC Corporation",
    "description": "Year-end financial audit",
    "start_date": "2024-01-01",
    "end_date": "2024-03-31"
  }'
```

---

## Using Postman or Insomnia

### Setup

1. **Create a new workspace/collection**

2. **Set base URL as variable:**

   - Variable name: `base_url`
   - Value: `http://localhost:3000/api/v1`

3. **Create login request:**

   - Method: `POST`
   - URL: `{{base_url}}/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "admin@example.com",
       "password": "YOUR_PASSWORD"
     }
     ```

4. **Save the access token:**

   - Copy `accessToken` from response
   - Create environment variable: `access_token`

5. **Use token in other requests:**
   - Add header: `Authorization: Bearer {{access_token}}`

---

## Development Workflow

### Making Code Changes

1. **Edit any file in your IDE** (VS Code, etc.)
2. **Changes are automatically detected** (nodemon watches files)
3. **API restarts automatically** (hot reload)
4. **View logs to see restart:**
   ```bash
   docker-compose logs -f api
   ```

### Example: Add a New Endpoint

1. Edit a file (e.g., `src/routes/auth.js`)
2. Save the file
3. Watch logs: `docker-compose logs -f api`
4. You'll see: `[nodemon] restarting due to changes...`
5. Test your changes immediately!

---

## Viewing Logs

### Real-time Logs

```bash
# All services
docker-compose logs -f

# API only
docker-compose logs -f api

# Database only
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100 api
```

### Application Logs

```bash
# View logs directory
ls -la logs/

# View error log
cat logs/error.log

# Follow error log
tail -f logs/error.log
```

---

## Troubleshooting

### Problem: Port 3000 already in use

**Solution 1:** Stop the process using port 3000

```bash
lsof -i :3000
kill -9 <PID>
```

**Solution 2:** Change the port
Edit `docker-compose.yml`:

```yaml
ports:
  - "3001:3000" # Use port 3001 instead
```

Then access API at `http://localhost:3001`

### Problem: Database connection failed

**Check database is running:**

```bash
docker-compose ps postgres
```

**Check database logs:**

```bash
docker-compose logs postgres
```

**Restart database:**

```bash
docker-compose restart postgres
```

### Problem: API not starting

**View error logs:**

```bash
docker-compose logs api
```

**Rebuild and restart:**

```bash
docker-compose down
docker-compose build api
docker-compose up -d
```

### Problem: Can't connect to API

**Check if container is running:**

```bash
docker-compose ps
```

**Check if port is accessible:**

```bash
curl http://localhost:3000/health
```

**Check firewall settings** (macOS/Linux)

### Problem: Changes not reflecting

**Ensure volumes are mounted:**

```bash
docker-compose down
docker-compose up -d
```

**Check volume mounts:**

```bash
docker-compose exec api ls -la /usr/src/app
```

---

## Clean Restart

If you want to start completely fresh:

```bash
# Stop and remove everything (⚠️ deletes database!)
docker-compose down -v

# Start fresh
docker-compose up -d

# Wait for database
sleep 10

# Run migrations
docker-compose exec api npm run migrate

# Create admin
docker-compose exec api npm run seed-admin
```

---

## Stopping the Services

### Temporary Stop (keeps data)

```bash
docker-compose stop
```

### Complete Stop (keeps data)

```bash
docker-compose down
```

### Remove Everything (⚠️ deletes database!)

```bash
docker-compose down -v
```

---

## Next Steps

Now that your API is running:

1. ✅ **Read the API documentation:** `README.md`
2. ✅ **Explore all endpoints:** See `README.md` for complete list
3. ✅ **Test with Postman/Insomnia:** Import the endpoints
4. ✅ **Build your frontend:** Connect to this API
5. ✅ **Customize firm settings:** Update database
6. ✅ **Create more users:** Use the API endpoints
7. ✅ **Set up payroll integration:** Configure webhook

---

## Important Files

- **`README.md`** - Complete API documentation
- **`DOCKER.md`** - Detailed Docker guide
- **`GETTING_STARTED.md`** - Alternative setup methods
- **`docker-compose.yml`** - Development configuration
- **`.env`** - Environment variables (not created yet, using defaults)

---

## Getting Help

### Check Logs First

```bash
docker-compose logs -f
```

### Common Issues

- See "Troubleshooting" section above
- Check `DOCKER.md` for more Docker-specific issues
- Review `GETTING_STARTED.md` for setup issues

### Verify Installation

```bash
npm run verify
```

---

## Summary of What You Just Set Up

✅ **PostgreSQL 15** database running in Docker
✅ **Node.js 18** API running in Docker
✅ **12 database tables** with relationships
✅ **13 default permissions** seeded
✅ **1 audit firm** (Example Audit Firm)
✅ **1 admin user** with Partner role
✅ **30+ API endpoints** ready to use
✅ **JWT authentication** with refresh tokens
✅ **Hot reload** for development
✅ **Comprehensive logging**
✅ **Security features** enabled

---

## You're All Set! 🎉

Your Audit Software API is fully operational and ready for development!

**Quick test:**

```bash
curl http://localhost:3000/health
```

If you see `"status": "healthy"`, you're good to go! 🚀
