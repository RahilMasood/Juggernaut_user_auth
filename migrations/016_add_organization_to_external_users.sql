-- Migration: Add organization column to external_users table
-- Date: 2026-01-29
-- Description: Add organization field for confirming parties

-- Add organization column
ALTER TABLE external_users 
ADD COLUMN IF NOT EXISTS organization VARCHAR(255);

-- Add comment
COMMENT ON COLUMN external_users.organization IS 'Organization name for confirming parties (null for clients)';

