-- Migration: Change confirmation_client from boolean to TEXT[] array
-- Date: 2026-01-29
-- Description: Store engagement_ids as a list in confirmation_client column

-- Drop the existing boolean column
ALTER TABLE external_users 
DROP COLUMN IF EXISTS confirmation_client;

-- Add confirmation_client as TEXT[] array
ALTER TABLE external_users 
ADD COLUMN confirmation_client TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add comment
COMMENT ON COLUMN external_users.confirmation_client IS 'Array of engagement IDs where this user is a client';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_external_users_confirmation_client ON external_users USING GIN(confirmation_client);

