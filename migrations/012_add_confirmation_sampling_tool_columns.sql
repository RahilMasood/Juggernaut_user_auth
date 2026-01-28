-- Migration: Add confirmation_tool and sampling_tool columns to engagement_users table
-- Date: 2026-01-28
-- Description: Add boolean columns to track which tools users have access to in an engagement

-- Add confirmation_tool column (default false)
ALTER TABLE engagement_users
ADD COLUMN IF NOT EXISTS confirmation_tool BOOLEAN NOT NULL DEFAULT false;

-- Add sampling_tool column (default false)
ALTER TABLE engagement_users
ADD COLUMN IF NOT EXISTS sampling_tool BOOLEAN NOT NULL DEFAULT false;

-- Add comment to columns
COMMENT ON COLUMN engagement_users.confirmation_tool IS 'Whether user has access to confirmation tool for this engagement';
COMMENT ON COLUMN engagement_users.sampling_tool IS 'Whether user has access to sampling tool for this engagement';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_engagement_users_confirmation_tool ON engagement_users(confirmation_tool);
CREATE INDEX IF NOT EXISTS idx_engagement_users_sampling_tool ON engagement_users(sampling_tool);

