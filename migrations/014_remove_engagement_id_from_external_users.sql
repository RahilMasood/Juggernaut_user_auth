-- Migration: Remove engagement_id column from external_users table
-- Date: 2026-01-29
-- Description: Remove engagement_id column as it's not needed - engagement tracking is done in people_data.json

-- Drop engagement_id column if it exists
ALTER TABLE external_users 
DROP COLUMN IF EXISTS engagement_id;

-- Drop index if it exists
DROP INDEX IF EXISTS idx_external_users_engagement_id;

