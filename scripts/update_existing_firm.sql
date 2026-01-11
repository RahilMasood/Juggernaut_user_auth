-- SQL commands to manually update your existing firm
-- This script adds the new columns and updates the existing firm (assuming there's only 1 firm)

-- Step 1: Add the new columns to the firms table
ALTER TABLE firms ADD COLUMN IF NOT EXISTS site_hostname VARCHAR(255);
ALTER TABLE firms ADD COLUMN IF NOT EXISTS site_path VARCHAR(255);
ALTER TABLE firms ADD COLUMN IF NOT EXISTS confirmation_tool BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE firms ADD COLUMN IF NOT EXISTS sampling_tool BOOLEAN NOT NULL DEFAULT false;

-- Step 2: Update the existing firm with your values
-- Replace the values below with your actual data
UPDATE firms 
SET 
    site_hostname = 'juggernautenterprises.sharepoint.com',
    site_path = '/sites/TestCloud',
    confirmation_tool = false,  -- Set to true if you want to enable it
    sampling_tool = false      -- Set to true if you want to enable it
WHERE id = (SELECT id FROM firms LIMIT 1);  -- Updates the first (and only) firm

-- Step 3: Verify the update
SELECT 
    id,
    tenant_id,
    admin_id,
    site_hostname,
    site_path,
    confirmation_tool,
    sampling_tool
FROM firms;

