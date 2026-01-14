-- Fix existing firms table and update the 2 existing firm rows
-- This script will:
-- 1. Rename clientOnboard_no to client_onboard_no if it exists
-- 2. Create client_onboard_no if it doesn't exist
-- 3. Ensure confirmation_no and sampling_no exist
-- 4. Update existing firm rows with default values

DO $$
BEGIN
    -- Step 1: Fix client_onboard_no column name
    -- If camelCase version exists, rename it to snake_case
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'firms' AND column_name = 'clientOnboard_no') THEN
        ALTER TABLE firms RENAME COLUMN "clientOnboard_no" TO client_onboard_no;
        RAISE NOTICE 'Renamed clientOnboard_no to client_onboard_no';
    END IF;

    -- If snake_case doesn't exist, create it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'firms' AND column_name = 'client_onboard_no') THEN
        ALTER TABLE firms ADD COLUMN client_onboard_no INTEGER NOT NULL DEFAULT 0;
        RAISE NOTICE 'Created client_onboard_no column';
    END IF;

    -- Step 2: Ensure confirmation_no exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'firms' AND column_name = 'confirmation_no') THEN
        ALTER TABLE firms ADD COLUMN confirmation_no INTEGER NOT NULL DEFAULT 0;
        
        -- Migrate existing confirmation_tool data if it exists
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'firms' AND column_name = 'confirmation_tool') THEN
            UPDATE firms SET confirmation_no = CASE 
                WHEN confirmation_tool = true THEN 999 
                ELSE 0 
            END;
        END IF;
        
        RAISE NOTICE 'Created confirmation_no column';
    END IF;

    -- Step 3: Ensure sampling_no exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'firms' AND column_name = 'sampling_no') THEN
        ALTER TABLE firms ADD COLUMN sampling_no INTEGER NOT NULL DEFAULT 0;
        
        -- Migrate existing sampling_tool data if it exists
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'firms' AND column_name = 'sampling_tool') THEN
            UPDATE firms SET sampling_no = CASE 
                WHEN sampling_tool = true THEN 999 
                ELSE 0 
            END;
        END IF;
        
        RAISE NOTICE 'Created sampling_no column';
    END IF;

END $$;

-- Step 4: Update existing firms with default values
-- Set all tools to unlimited (999) for existing firms
-- You can customize these values as needed:
--   0 or -1 = tool not available
--   positive number = max concurrent users
--   999 = unlimited users

UPDATE firms 
SET 
    confirmation_no = COALESCE(confirmation_no, 999),
    sampling_no = COALESCE(sampling_no, 999),
    client_onboard_no = COALESCE(client_onboard_no, 999)
WHERE confirmation_no IS NULL OR sampling_no IS NULL OR client_onboard_no IS NULL;

-- Alternative: If you want to set specific values for your 2 firms, use this instead:
-- Replace the UUIDs with your actual firm IDs

-- Example: Set first firm to have unlimited users for all tools
-- UPDATE firms 
-- SET 
--     confirmation_no = 999,
--     sampling_no = 999,
--     client_onboard_no = 999
-- WHERE id = 'your-first-firm-uuid-here';

-- Example: Set second firm to have limited users
-- UPDATE firms 
-- SET 
--     confirmation_no = 10,  -- Max 10 users for confirmation tool
--     sampling_no = 5,        -- Max 5 users for sampling tool
--     client_onboard_no = 999 -- Unlimited for client onboard
-- WHERE id = 'your-second-firm-uuid-here';

-- Verify the update
SELECT 
    id,
    tenant_id,
    admin_id,
    confirmation_no,
    sampling_no,
    client_onboard_no,
    no_users
FROM firms
ORDER BY created_at;

