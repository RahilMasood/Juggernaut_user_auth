-- Migration: Add engagement_name column to engagements table
-- This allows engagements to have a custom name (e.g., Test10_FY26)

-- Add engagement_name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'engagements' 
        AND column_name = 'engagement_name'
    ) THEN
        ALTER TABLE engagements ADD COLUMN engagement_name VARCHAR(255);
        
        -- Add comment to the column
        COMMENT ON COLUMN engagements.engagement_name IS 'Name of the engagement (e.g., Test10_FY26)';
        
        RAISE NOTICE 'Column engagement_name added to engagements table';
    ELSE
        RAISE NOTICE 'Column engagement_name already exists in engagements table';
    END IF;
END $$;

