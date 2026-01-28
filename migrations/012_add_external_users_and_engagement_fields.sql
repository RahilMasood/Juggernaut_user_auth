-- Migration: Add external_users table and engagement fields
-- Date: 2025-01-XX

-- Add new fields to engagements table
ALTER TABLE engagements 
ADD COLUMN IF NOT EXISTS period_end_date DATE,
ADD COLUMN IF NOT EXISTS doc_library VARCHAR(255),
ADD COLUMN IF NOT EXISTS fy_year VARCHAR(255);

-- Create external_users table
CREATE TABLE IF NOT EXISTS external_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    designation VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    confirmation_client BOOLEAN NOT NULL DEFAULT FALSE,
    confirmation_party BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_email_engagement UNIQUE (email, engagement_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_external_users_email ON external_users(email);
CREATE INDEX IF NOT EXISTS idx_external_users_engagement_id ON external_users(engagement_id);
CREATE INDEX IF NOT EXISTS idx_external_users_confirmation_client ON external_users(confirmation_client);
CREATE INDEX IF NOT EXISTS idx_external_users_confirmation_party ON external_users(confirmation_party);

-- Add comment
COMMENT ON TABLE external_users IS 'External users (clients and confirming parties) for engagements';
COMMENT ON COLUMN external_users.email IS 'Email address of the external user';
COMMENT ON COLUMN external_users.name IS 'Full name of the external user';
COMMENT ON COLUMN external_users.designation IS 'Designation/title of the external user';
COMMENT ON COLUMN external_users.password_hash IS 'Hashed password for external user login';
COMMENT ON COLUMN external_users.engagement_id IS 'Engagement this user is associated with';
COMMENT ON COLUMN external_users.confirmation_client IS 'True if user is a client for this engagement';
COMMENT ON COLUMN external_users.confirmation_party IS 'True if user is a confirming party for this engagement';

