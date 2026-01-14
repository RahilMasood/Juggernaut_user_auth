-- Migration script to add tool-based session management
-- Changes confirmation_tool/sampling_tool to confirmation_no/sampling_no
-- Adds clientOnboard_no, allowed_tools, and application_type

DO $$
BEGIN
    -- Step 1: Add new columns to firms table
    -- Add confirmation_no if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'firms' AND column_name = 'confirmation_no') THEN
        -- First, migrate existing confirmation_tool data
        ALTER TABLE firms ADD COLUMN confirmation_no INTEGER NOT NULL DEFAULT 0;
        
        -- Migrate existing boolean values: true -> 999 (unlimited), false -> 0 (not available)
        UPDATE firms SET confirmation_no = CASE 
            WHEN confirmation_tool = true THEN 999 
            ELSE 0 
        END;
        
        RAISE NOTICE 'Column confirmation_no added to firms table';
    ELSE
        RAISE NOTICE 'Column confirmation_no already exists in firms table';
    END IF;

    -- Add sampling_no if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'firms' AND column_name = 'sampling_no') THEN
        ALTER TABLE firms ADD COLUMN sampling_no INTEGER NOT NULL DEFAULT 0;
        
        -- Migrate existing boolean values: true -> 999 (unlimited), false -> 0 (not available)
        UPDATE firms SET sampling_no = CASE 
            WHEN sampling_tool = true THEN 999 
            ELSE 0 
        END;
        
        RAISE NOTICE 'Column sampling_no added to firms table';
    ELSE
        RAISE NOTICE 'Column sampling_no already exists in firms table';
    END IF;

    -- Add client_onboard_no if it doesn't exist (snake_case for Sequelize)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'firms' AND column_name = 'client_onboard_no') THEN
        ALTER TABLE firms ADD COLUMN client_onboard_no INTEGER NOT NULL DEFAULT 0;
        RAISE NOTICE 'Column client_onboard_no added to firms table';
    ELSE
        RAISE NOTICE 'Column client_onboard_no already exists in firms table';
    END IF;
    
    -- If camelCase version exists, rename it to snake_case
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'firms' AND column_name = 'clientOnboard_no') THEN
        ALTER TABLE firms RENAME COLUMN "clientOnboard_no" TO client_onboard_no;
        RAISE NOTICE 'Renamed clientOnboard_no to client_onboard_no';
    END IF;

    -- Step 2: Add allowed_tools column to users table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'allowed_tools') THEN
        ALTER TABLE users ADD COLUMN allowed_tools JSONB DEFAULT NULL;
        RAISE NOTICE 'Column allowed_tools added to users table';
    ELSE
        RAISE NOTICE 'Column allowed_tools already exists in users table';
    END IF;

    -- Step 3: Add application_type column to refresh_tokens table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'refresh_tokens' AND column_name = 'application_type') THEN
        ALTER TABLE refresh_tokens ADD COLUMN application_type VARCHAR(50) NOT NULL DEFAULT 'main';
        
        -- Set existing tokens to 'main' (default)
        UPDATE refresh_tokens SET application_type = 'main' WHERE application_type IS NULL;
        
        RAISE NOTICE 'Column application_type added to refresh_tokens table';
    ELSE
        RAISE NOTICE 'Column application_type already exists in refresh_tokens table';
    END IF;

    -- Step 4: Add indexes for performance
    -- Index on application_type for refresh_tokens
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE indexname = 'idx_refresh_tokens_application_type'
                   AND tablename = 'refresh_tokens') THEN
        CREATE INDEX idx_refresh_tokens_application_type ON refresh_tokens(application_type);
        RAISE NOTICE 'Index idx_refresh_tokens_application_type created';
    ELSE
        RAISE NOTICE 'Index idx_refresh_tokens_application_type already exists';
    END IF;

    -- Composite index for efficient session checks
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE indexname = 'idx_refresh_tokens_user_app_revoked'
                   AND tablename = 'refresh_tokens') THEN
        CREATE INDEX idx_refresh_tokens_user_app_revoked ON refresh_tokens(user_id, application_type, is_revoked);
        RAISE NOTICE 'Index idx_refresh_tokens_user_app_revoked created';
    ELSE
        RAISE NOTICE 'Index idx_refresh_tokens_user_app_revoked already exists';
    END IF;

END $$;

-- Note: We keep confirmation_tool and sampling_tool columns for now to allow gradual migration
-- They can be dropped in a future migration after verifying everything works

