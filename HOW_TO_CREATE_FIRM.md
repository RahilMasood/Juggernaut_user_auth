# How to Create a New Firm Manually

This guide shows you how to manually create a new firm with all required credentials.

---

## Method 1: Using the Interactive Script (Recommended)

The easiest way is to use the interactive script that handles password hashing automatically.

### Steps:

1. **Run the script:**
   ```bash
   npm run create-firm
   ```
   Or directly:
   ```bash
   node scripts/create-firm.js
   ```

2. **Enter the required information when prompted:**
   - `tenant_id`: Your tenant identifier
   - `client_id`: Client ID for external integrations
   - `client_secret`: Client secret for external integrations
   - `admin_id`: Admin login username (what the admin will use to log in)
   - `admin_password`: Admin password (will be hashed automatically)
   - Confirm password

3. **The script will:**
   - Validate all inputs
   - Check for duplicate `admin_id` or `tenant_id`
   - Hash the password using bcrypt
   - Create the firm record
   - Display the created firm details

### Example:
```bash
$ npm run create-firm

=== Create New Firm ===

Enter tenant_id: tenant_abc123
Enter client_id: client_xyz789
Enter client_secret: secret_key_456
Enter admin_id (login username): admin_user
Enter admin_password (will be hashed): SecurePass123!
Confirm admin_password: SecurePass123!

⏳ Hashing password...
⏳ Creating firm...

✅ Firm created successfully!

Firm Details:
──────────────────────────────────────────────────
Firm ID:        a1b2c3d4-e5f6-7890-abcd-ef1234567890
Tenant ID:      tenant_abc123
Client ID:      client_xyz789
Admin ID:       admin_user
──────────────────────────────────────────────────

💡 You can now login using:
   POST /api/v1/admin/login
   Body: { "admin_id": "admin_user", "password": "SecurePass123!" }
```

---

## Method 2: Using SQL Directly

If you prefer to use SQL directly, follow these steps:

### Step 1: Hash the Password

You need to hash the password using bcrypt. You can do this in several ways:

#### Option A: Using Node.js (Recommended)
```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('your_password_here', 10).then(hash => console.log(hash));"
```

Replace `your_password_here` with the actual password. This will output a bcrypt hash like:
```
$2b$10$rK8X9YzA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y
```

#### Option B: Using Online Bcrypt Generator
- Go to https://bcrypt-generator.com/
- Enter your password
- Set rounds to 10
- Copy the generated hash

### Step 2: Insert the Firm

Connect to your PostgreSQL database and run:

```sql
INSERT INTO firms (
    id,
    tenant_id,
    client_id,
    client_secret,
    admin_id,
    admin_password,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),                    -- Auto-generate UUID
    'your_tenant_id',                     -- Replace with your tenant_id
    'your_client_id',                     -- Replace with your client_id
    'your_client_secret',                 -- Replace with your client_secret
    'your_admin_id',                      -- Replace with admin login username
    '$2b$10$YOUR_HASHED_PASSWORD_HERE',  -- Replace with bcrypt hash from Step 1
    NOW(),
    NOW()
);
```

### Step 3: Verify the Firm

```sql
SELECT 
    id, 
    tenant_id, 
    client_id, 
    admin_id, 
    created_at 
FROM firms 
WHERE admin_id = 'your_admin_id';
```

**Note:** The `admin_password` and `client_secret` are not shown in the SELECT for security reasons.

---

## Method 3: Using a SQL File

1. **Edit the SQL template:**
   ```bash
   # Open the template file
   code scripts/create-firm-sql.sql
   ```

2. **Replace the placeholder values:**
   - `your_tenant_id_here`
   - `your_client_id_here`
   - `your_client_secret_here`
   - `your_admin_id_here`
   - `$2b$10$YOUR_HASHED_PASSWORD_HERE` (use the hash from Step 1)

3. **Run the SQL file:**
   ```bash
   psql -U postgres -d audit_software -f scripts/create-firm-sql.sql
   ```

---

## Testing the Admin Login

After creating the firm, test the admin login:

```bash
curl -X POST http://localhost:3000/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "admin_id": "your_admin_id",
    "password": "your_password"
  }'
```

Or using PowerShell:
```powershell
$body = @{
    admin_id = "your_admin_id"
    password = "your_password"
} | ConvertTo-Json

Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/v1/admin/login" `
    -ContentType "application/json" `
    -Body $body
```

---

## Important Notes

1. **Password Security:**
   - Never store passwords in plain text
   - Always use bcrypt hashing (the script does this automatically)
   - Use strong passwords (12+ characters, mixed case, numbers, special chars)

2. **Unique Constraints:**
   - `admin_id` must be unique across all firms
   - `tenant_id` must be unique across all firms
   - The script will check for duplicates before creating

3. **Firm ID:**
   - The `firm_id` (UUID) is auto-generated
   - You don't need to provide it manually

4. **Email:**
   - Currently, the firm table doesn't have an email field
   - If you need to store admin email, you would need to:
     - Add an `admin_email` column to the firms table, OR
     - Create a separate admin user in the users table with that email

---

## Adding Admin Email (Optional)

If you want to store an admin email, you have two options:

### Option 1: Add email to Firm table (requires migration)

Add a column to the firms table:
```sql
ALTER TABLE firms ADD COLUMN admin_email VARCHAR(255);
```

Then update your firm:
```sql
UPDATE firms 
SET admin_email = 'admin@example.com' 
WHERE admin_id = 'your_admin_id';
```

### Option 2: Create a User with that Email

Create a user in the users table with the admin's email:
```sql
-- First, get the firm_id
SELECT id FROM firms WHERE admin_id = 'your_admin_id';

-- Then create a user (replace firm_id_uuid with the actual UUID)
INSERT INTO users (
    id,
    firm_id,
    user_name,
    email,
    password_hash,
    type,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'firm_id_uuid',                    -- From the SELECT above
    'Admin User',
    'admin@example.com',
    '$2b$10$YOUR_HASHED_PASSWORD',    -- Hash the same password
    'partner',                         -- Or 'manager'
    true,
    NOW(),
    NOW()
);
```

---

## Troubleshooting

### Error: "Firm with admin_id already exists"
- The `admin_id` must be unique. Choose a different one.

### Error: "Firm with tenant_id already exists"
- The `tenant_id` must be unique. Choose a different one.

### Error: "Invalid credentials" when logging in
- Double-check the `admin_id` and `password`
- Make sure the password was hashed correctly
- Verify the firm exists in the database

### Password hash format
- Bcrypt hashes always start with `$2b$10$` or `$2a$10$`
- They are 60 characters long
- Never modify the hash manually

---

## Quick Reference

| Field | Description | Required | Unique |
|-------|-------------|----------|--------|
| `id` | Firm UUID | Auto-generated | Yes |
| `tenant_id` | Tenant identifier | Yes | Yes |
| `client_id` | Client ID for integrations | Yes | No |
| `client_secret` | Client secret for integrations | Yes | No |
| `admin_id` | Admin login username | Yes | Yes |
| `admin_password` | Admin password (hashed) | Yes | No |

---

## Next Steps

After creating a firm:

1. **Login as admin:**
   ```bash
   POST /api/v1/admin/login
   ```

2. **Create users:**
   ```bash
   POST /api/v1/admin/users
   ```

3. **Create audit clients:**
   ```bash
   POST /api/v1/admin/clients
   ```

4. **Create engagements:**
   ```bash
   POST /api/v1/admin/clients/:clientId/engagements
   ```

See `NEW_SCHEMA_API_DOCUMENTATION.md` for full API documentation.

