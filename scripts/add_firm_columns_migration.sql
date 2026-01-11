-- Migration script to add new columns to firms table
-- Run this script to update your existing database

-- Add new columns to firms table
DO $$
BEGIN
    -- Add site_hostname column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'firms' AND column_name = 'site_hostname') THEN
        ALTER TABLE firms ADD COLUMN site_hostname VARCHAR(255);
        RAISE NOTICE 'Added site_hostname column';
    ELSE
        RAISE NOTICE 'site_hostname column already exists';
    END IF;
    
    -- Add site_path column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'firms' AND column_name = 'site_path') THEN
        ALTER TABLE firms ADD COLUMN site_path VARCHAR(255);
        RAISE NOTICE 'Added site_path column';
    ELSE
        RAISE NOTICE 'site_path column already exists';
    END IF;
    
    -- Add confirmation_tool column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'firms' AND column_name = 'confirmation_tool') THEN
        ALTER TABLE firms ADD COLUMN confirmation_tool BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE 'Added confirmation_tool column';
    ELSE
        RAISE NOTICE 'confirmation_tool column already exists';
    END IF;
    
    -- Add sampling_tool column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'firms' AND column_name = 'sampling_tool') THEN
        ALTER TABLE firms ADD COLUMN sampling_tool BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE 'Added sampling_tool column';
    ELSE
        RAISE NOTICE 'sampling_tool column already exists';
    END IF;
END $$;

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'firms' 
  AND column_name IN ('site_hostname', 'site_path', 'confirmation_tool', 'sampling_tool')
ORDER BY column_name;

-- Example: Update existing firm with new values (uncomment and modify as needed)
-- UPDATE firms 
-- SET 
--     site_hostname = 'juggernautenterprises.sharepoint.com',
--     site_path = '/sites/TestCloud',
--     confirmation_tool = true,
--     sampling_tool = false
-- WHERE id = 'your_firm_id_here';

