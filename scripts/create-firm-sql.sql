-- Manual SQL script to create a new firm
-- Replace the placeholder values with your actual data

-- Step 1: Hash the password using bcrypt
-- You can use an online bcrypt generator or Node.js:
-- node -e "const bcrypt = require('bcrypt'); bcrypt.hash('your_password', 10).then(hash => console.log(hash));"

-- Step 2: Insert the firm (replace placeholders)
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
    gen_random_uuid(),                    -- Auto-generate UUID for firm_id
    'your_tenant_id_here',                -- Replace with your tenant_id
    'your_client_id_here',                -- Replace with your client_id
    'your_client_secret_here',            -- Replace with your client_secret
    'your_admin_id_here',                 -- Replace with your admin_id (login username)
    '$2b$10$YOUR_HASHED_PASSWORD_HERE',  -- Replace with bcrypt hashed password
    NOW(),
    NOW()
);

-- Example (DO NOT USE THESE VALUES IN PRODUCTION):
-- INSERT INTO firms (
--     id,
--     tenant_id,
--     client_id,
--     client_secret,
--     admin_id,
--     admin_password,
--     created_at,
--     updated_at
-- ) VALUES (
--     gen_random_uuid(),
--     'tenant_123',
--     'client_456',
--     'secret_789',
--     'admin_user',
--     '$2b$10$rK8X9YzA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y',
--     NOW(),
--     NOW()
-- );

-- To verify the firm was created:
-- SELECT id, tenant_id, client_id, admin_id, created_at FROM firms WHERE admin_id = 'your_admin_id_here';

