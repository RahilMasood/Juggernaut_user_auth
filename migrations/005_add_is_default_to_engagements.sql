-- Migration to add is_default field to engagements table
-- This marks the default engagement created during client onboarding

DO $$
BEGIN
    -- Add is_default column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'engagements' AND column_name = 'is_default') THEN
        ALTER TABLE engagements ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT false;
        
        -- Add index for faster lookups
        CREATE INDEX IF NOT EXISTS idx_engagements_is_default ON engagements(is_default);
        
        RAISE NOTICE 'Added is_default column to engagements table';
    ELSE
        RAISE NOTICE 'is_default column already exists in engagements table';
    END IF;
END $$;

