-- Migration: Add no_users column to firms table
-- This column sets the maximum number of users allowed for a firm

-- Add no_users column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'firms' AND column_name = 'no_users') THEN
        ALTER TABLE firms ADD COLUMN no_users INTEGER NOT NULL DEFAULT 0;
        
        -- Add comment to the column
        COMMENT ON COLUMN firms.no_users IS 'Maximum number of users allowed for the firm';
    END IF;
END $$;

