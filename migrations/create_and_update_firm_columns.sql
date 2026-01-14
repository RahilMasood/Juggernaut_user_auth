-- Create the missing columns and update existing firms
-- Run this SQL to fix the issue

-- Step 1: Create confirmation_no column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'firms' AND column_name = 'confirmation_no') THEN
        ALTER TABLE firms ADD COLUMN confirmation_no INTEGER NOT NULL DEFAULT 0;
        RAISE NOTICE 'Created confirmation_no column';
    END IF;
END $$;

-- Step 2: Create sampling_no column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'firms' AND column_name = 'sampling_no') THEN
        ALTER TABLE firms ADD COLUMN sampling_no INTEGER NOT NULL DEFAULT 0;
        RAISE NOTICE 'Created sampling_no column';
    END IF;
END $$;

-- Step 3: Create client_onboard_no column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'firms' AND column_name = 'client_onboard_no') THEN
        ALTER TABLE firms ADD COLUMN client_onboard_no INTEGER NOT NULL DEFAULT 0;
        RAISE NOTICE 'Created client_onboard_no column';
    END IF;
END $$;

-- Step 4: Migrate existing boolean values if they exist
DO $$
BEGIN
    -- Migrate confirmation_tool to confirmation_no
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'firms' AND column_name = 'confirmation_tool') THEN
        UPDATE firms 
        SET confirmation_no = CASE 
            WHEN confirmation_tool = true THEN 999 
            ELSE 0 
        END
        WHERE confirmation_no = 0;
        RAISE NOTICE 'Migrated confirmation_tool to confirmation_no';
    END IF;

    -- Migrate sampling_tool to sampling_no
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'firms' AND column_name = 'sampling_tool') THEN
        UPDATE firms 
        SET sampling_no = CASE 
            WHEN sampling_tool = true THEN 999 
            ELSE 0 
        END
        WHERE sampling_no = 0;
        RAISE NOTICE 'Migrated sampling_tool to sampling_no';
    END IF;
END $$;

-- Step 5: Now update your specific firm
UPDATE firms 
SET 
    confirmation_no = 2,
    sampling_no = 2,
    client_onboard_no = 5
WHERE id = '2cb68455-c7b7-4f63-a6d4-74778d99be1a';

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
WHERE id = '2cb68455-c7b7-4f63-a6d4-74778d99be1a';

