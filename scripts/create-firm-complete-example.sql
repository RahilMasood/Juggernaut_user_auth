-- Complete SQL Query to Create a Firm with All Contents
-- This example shows how to create a firm with all fields including the new no_users field

-- Step 1: Hash the password using bcrypt
-- You can use an online bcrypt generator or Node.js:
-- node -e "const bcrypt = require('bcrypt'); bcrypt.hash('your_password', 10).then(hash => console.log(hash));"

-- Step 2: Insert the firm with all fields
INSERT INTO firms (
    id,
    tenant_id,
    client_id,
    client_secret,
    admin_id,
    admin_password,
    site_hostname,
    site_path,
    confirmation_tool,
    sampling_tool,
    no_users,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),                    -- Auto-generate UUID for firm_id
    'tenant_example_123',                 -- Tenant identifier (must be unique)
    'client_id_example_456',              -- Client ID for external integrations
    'client_secret_example_789',          -- Client secret for external integrations
    'admin_user_example',                 -- Admin login username (must be unique)
    '$2b$10$YOUR_HASHED_PASSWORD_HERE',  -- Bcrypt hashed password (replace with actual hash)
    'juggernautenterprises.sharepoint.com', -- SharePoint site hostname (optional, can be NULL)
    '/sites/TestCloud',                    -- SharePoint site path (optional, can be NULL)
    true,                                  -- confirmation_tool enabled (true/false)
    true,                                  -- sampling_tool enabled (true/false)
    50,                                    -- no_users: Maximum number of users allowed (0 = unlimited, or set a number)
    NOW(),                                 -- created_at timestamp
    NOW()                                  -- updated_at timestamp
);

-- Field Descriptions:
-- - id: UUID (auto-generated)
-- - tenant_id: Unique tenant identifier for the firm
-- - client_id: Client ID for external integrations
-- - client_secret: Client secret for external integrations
-- - admin_id: Admin login username (must be unique)
-- - admin_password: Bcrypt hashed password (must start with $2b$10$)
-- - site_hostname: SharePoint hostname (optional)
-- - site_path: SharePoint site path (optional)
-- - confirmation_tool: Boolean flag to enable confirmation tool
-- - sampling_tool: Boolean flag to enable sampling tool
-- - no_users: Maximum number of users allowed (0 = unlimited, any positive number = limit)
-- - created_at: Timestamp when firm was created
-- - updated_at: Timestamp when firm was last updated

-- Example with specific values (DO NOT USE IN PRODUCTION):
-- INSERT INTO firms (
--     id,
--     tenant_id,
--     client_id,
--     client_secret,
--     admin_id,
--     admin_password,
--     site_hostname,
--     site_path,
--     confirmation_tool,
--     sampling_tool,
--     no_users,
--     created_at,
--     updated_at
-- ) VALUES (
--     gen_random_uuid(),
--     'acme_corp_tenant_001',
--     'acme_client_001',
--     'acme_secret_key_abc123',
--     'acme_admin',
--     '$2b$10$rK8X9YzA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y',
--     'acmecorp.sharepoint.com',
--     '/sites/AcmeAudit',
--     true,
--     true,
--     100,                                  -- Allow up to 100 users
--     NOW(),
--     NOW()
-- );

-- To verify the firm was created:
-- SELECT 
--     id, 
--     tenant_id, 
--     client_id, 
--     admin_id, 
--     confirmation_tool,
--     sampling_tool,
--     no_users,
--     created_at 
-- FROM firms 
-- WHERE admin_id = 'admin_user_example';

-- To update the user limit for an existing firm:
-- UPDATE firms 
-- SET no_users = 75, updated_at = NOW()
-- WHERE admin_id = 'admin_user_example';

