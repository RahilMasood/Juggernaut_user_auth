-- Migration: Add composite index for single session enforcement
-- This index optimizes queries to find active (non-revoked, non-expired) refresh tokens for a user
-- Used to enforce single active session per user

-- Add composite index if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_refresh_tokens_user_active'
        AND tablename = 'refresh_tokens'
    ) THEN
        CREATE INDEX idx_refresh_tokens_user_active 
        ON refresh_tokens(user_id, expires_at)
        WHERE is_revoked = false;
        
        RAISE NOTICE 'Composite index idx_refresh_tokens_user_active created on refresh_tokens table';
    ELSE
        RAISE NOTICE 'Index idx_refresh_tokens_user_active already exists on refresh_tokens table';
    END IF;
END $$;

