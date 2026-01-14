-- Fix client_onboard_no column name issue
-- Sequelize expects snake_case (client_onboard_no) but migration may have created camelCase (clientOnboard_no)

DO $$
BEGIN
    -- Check if camelCase column exists and rename it to snake_case
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

    -- Ensure confirmation_no and sampling_no exist (in case migration wasn't run)
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

-- Update existing firms with default values (you can customize these)
-- This sets all firms to have unlimited users for all tools (999 = unlimited)
UPDATE firms 
SET 
    confirmation_no = COALESCE(confirmation_no, 999),
    sampling_no = COALESCE(sampling_no, 999),
    client_onboard_no = COALESCE(client_onboard_no, 999)
WHERE confirmation_no IS NULL OR sampling_no IS NULL OR client_onboard_no IS NULL;

-- Verify the columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'firms' 
  AND column_name IN ('confirmation_no', 'sampling_no', 'client_onboard_no')
ORDER BY column_name;

