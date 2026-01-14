-- Migration: Add updated_at index to refresh_tokens table for heartbeat mechanism
-- This enables efficient queries to find stale tokens that haven't been updated in X minutes
-- Used for auto-revoking tokens when app crashes or system force shuts down

-- Ensure updated_at column exists (Sequelize should have created it, but check anyway)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'refresh_tokens' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE refresh_tokens ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Column updated_at added to refresh_tokens table';
    ELSE
        RAISE NOTICE 'Column updated_at already exists in refresh_tokens table';
    END IF;
END $$;

-- Add index on updated_at for efficient stale token queries
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_refresh_tokens_updated_at'
        AND tablename = 'refresh_tokens'
    ) THEN
        CREATE INDEX idx_refresh_tokens_updated_at 
        ON refresh_tokens(updated_at)
        WHERE is_revoked = false;
        
        RAISE NOTICE 'Index idx_refresh_tokens_updated_at created on refresh_tokens table';
    ELSE
        RAISE NOTICE 'Index idx_refresh_tokens_updated_at already exists on refresh_tokens table';
    END IF;
END $$;

