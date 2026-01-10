-- Migration script to restructure database schema
-- This migration creates the new normalized schema

-- Step 1: Drop existing foreign key constraints and indexes that will change
DO $$
BEGIN
    -- Drop foreign keys from engagements table
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'engagements_firm_id_fkey') THEN
        ALTER TABLE engagements DROP CONSTRAINT engagements_firm_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'engagements_created_by_fkey') THEN
        ALTER TABLE engagements DROP CONSTRAINT engagements_created_by_fkey;
    END IF;
    
    -- Drop foreign keys from engagement_users
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'engagement_users_engagement_id_fkey') THEN
        ALTER TABLE engagement_users DROP CONSTRAINT engagement_users_engagement_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'engagement_users_user_id_fkey') THEN
        ALTER TABLE engagement_users DROP CONSTRAINT engagement_users_user_id_fkey;
    END IF;
END $$;

-- Step 2: Create new ENUM types
DO $$
BEGIN
    -- Create user type enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_type') THEN
        CREATE TYPE enum_users_type AS ENUM ('partner', 'manager', 'associate', 'article');
    END IF;
    
    -- Create engagement user role enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_engagement_users_role_new') THEN
        CREATE TYPE enum_engagement_users_role_new AS ENUM (
            'engagement_partner',
            'eqr_partner',
            'engagement_manager',
            'eqr_manager',
            'associate',
            'article'
        );
    END IF;
    
    -- Create status enum for audit clients and engagements
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_status') THEN
        CREATE TYPE enum_status AS ENUM ('Active', 'Archived');
    END IF;
END $$;

-- Step 3: Update firms table
DO $$
BEGIN
    -- Add new columns to firms table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'firms' AND column_name = 'tenant_id') THEN
        ALTER TABLE firms ADD COLUMN tenant_id VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'firms' AND column_name = 'client_id') THEN
        ALTER TABLE firms ADD COLUMN client_id VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'firms' AND column_name = 'client_secret') THEN
        ALTER TABLE firms ADD COLUMN client_secret VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'firms' AND column_name = 'admin_id') THEN
        ALTER TABLE firms ADD COLUMN admin_id VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'firms' AND column_name = 'admin_password') THEN
        ALTER TABLE firms ADD COLUMN admin_password VARCHAR(255);
    END IF;
    
    -- Remove old columns if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'firms' AND column_name = 'name') THEN
        ALTER TABLE firms DROP COLUMN IF EXISTS name;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'firms' AND column_name = 'domain') THEN
        ALTER TABLE firms DROP COLUMN IF EXISTS domain;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'firms' AND column_name = 'settings') THEN
        ALTER TABLE firms DROP COLUMN IF EXISTS settings;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'firms' AND column_name = 'is_active') THEN
        ALTER TABLE firms DROP COLUMN IF EXISTS is_active;
    END IF;
END $$;

-- Add unique constraints to firms
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'firms_tenant_id_key') THEN
        ALTER TABLE firms ADD CONSTRAINT firms_tenant_id_key UNIQUE (tenant_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'firms_admin_id_key') THEN
        ALTER TABLE firms ADD CONSTRAINT firms_admin_id_key UNIQUE (admin_id);
    END IF;
END $$;

-- Step 4: Update users table
DO $$
BEGIN
    -- Add user_name if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'user_name') THEN
        -- Create user_name from first_name and last_name if they exist
        ALTER TABLE users ADD COLUMN user_name VARCHAR(255);
        UPDATE users SET user_name = COALESCE(first_name || ' ' || last_name, email) 
        WHERE user_name IS NULL;
        ALTER TABLE users ALTER COLUMN user_name SET NOT NULL;
    END IF;
    
    -- Add type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'type') THEN
        ALTER TABLE users ADD COLUMN type enum_users_type;
        -- Set default based on designation or user_type if available
        UPDATE users SET type = 'associate' WHERE type IS NULL;
        ALTER TABLE users ALTER COLUMN type SET NOT NULL;
    END IF;
    
    -- Ensure payroll_id exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'payroll_id') THEN
        ALTER TABLE users ADD COLUMN payroll_id VARCHAR(255);
    END IF;
    
    -- Remove old columns
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'first_name') THEN
        ALTER TABLE users DROP COLUMN IF EXISTS first_name;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'last_name') THEN
        ALTER TABLE users DROP COLUMN IF EXISTS last_name;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'user_type') THEN
        ALTER TABLE users DROP COLUMN IF EXISTS user_type;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'designation') THEN
        ALTER TABLE users DROP COLUMN IF EXISTS designation;
    END IF;
END $$;

-- Step 5: Create audit_clients table
CREATE TABLE IF NOT EXISTS audit_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    status enum_status NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_clients_firm_id ON audit_clients(firm_id);
CREATE INDEX IF NOT EXISTS idx_audit_clients_status ON audit_clients(status);
CREATE INDEX IF NOT EXISTS idx_audit_clients_client_name ON audit_clients(client_name);

-- Step 6: Update engagements table
DO $$
BEGIN
    -- Add audit_client_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'engagements' AND column_name = 'audit_client_id') THEN
        ALTER TABLE engagements ADD COLUMN audit_client_id UUID;
    END IF;
    
    -- Update status enum
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'engagements' AND column_name = 'status') THEN
        -- Convert existing status values
        ALTER TABLE engagements ALTER COLUMN status TYPE VARCHAR(50);
        UPDATE engagements SET status = 'Active' WHERE status IN ('ACTIVE', 'active');
        UPDATE engagements SET status = 'Archived' WHERE status IN ('COMPLETED', 'ARCHIVED', 'completed', 'archived');
    END IF;
    
    -- Remove old columns
    ALTER TABLE engagements DROP COLUMN IF EXISTS firm_id;
    ALTER TABLE engagements DROP COLUMN IF EXISTS name;
    ALTER TABLE engagements DROP COLUMN IF EXISTS client_name;
    ALTER TABLE engagements DROP COLUMN IF EXISTS description;
    ALTER TABLE engagements DROP COLUMN IF EXISTS start_date;
    ALTER TABLE engagements DROP COLUMN IF EXISTS end_date;
    ALTER TABLE engagements DROP COLUMN IF EXISTS created_by;
    ALTER TABLE engagements DROP COLUMN IF EXISTS engagement_partner_id;
    ALTER TABLE engagements DROP COLUMN IF EXISTS engagement_manager_id;
    ALTER TABLE engagements DROP COLUMN IF EXISTS eqr_partner_id;
    ALTER TABLE engagements DROP COLUMN IF EXISTS concurrent_review_partner_id;
END $$;

-- Update engagements status to use new enum
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'engagements' AND column_name = 'status' 
               AND data_type = 'character varying') THEN
        -- Drop default constraint first
        ALTER TABLE engagements ALTER COLUMN status DROP DEFAULT;
        -- Change the type
        ALTER TABLE engagements ALTER COLUMN status TYPE enum_status USING status::enum_status;
        -- Set default again
        ALTER TABLE engagements ALTER COLUMN status SET DEFAULT 'Active';
    END IF;
END $$;

-- Add foreign key for audit_client_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'engagements_audit_client_id_fkey') THEN
        ALTER TABLE engagements ADD CONSTRAINT engagements_audit_client_id_fkey 
        FOREIGN KEY (audit_client_id) REFERENCES audit_clients(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_engagements_audit_client_id ON engagements(audit_client_id);
CREATE INDEX IF NOT EXISTS idx_engagements_status ON engagements(status);

-- Step 7: Update engagement_users table
DO $$
BEGIN
    -- Add id column if it doesn't exist (new primary key)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'engagement_users' AND column_name = 'id') THEN
        ALTER TABLE engagement_users ADD COLUMN id UUID DEFAULT gen_random_uuid();
        
        -- Make it primary key (drop old composite key first)
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'engagement_users_pkey') THEN
            ALTER TABLE engagement_users DROP CONSTRAINT engagement_users_pkey;
        END IF;
        
        ALTER TABLE engagement_users ADD PRIMARY KEY (id);
    END IF;
    
    -- Update role enum
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'engagement_users' AND column_name = 'role') THEN
        -- First, drop default if it exists
        ALTER TABLE engagement_users ALTER COLUMN role DROP DEFAULT;
        
        -- Change enum type to VARCHAR first
        ALTER TABLE engagement_users ALTER COLUMN role TYPE VARCHAR(50);
        
        -- Convert old role values to new ones (now that it's VARCHAR)
        UPDATE engagement_users SET role = 'engagement_partner' WHERE role = 'LEAD';
        UPDATE engagement_users SET role = 'associate' WHERE role = 'MEMBER';
        UPDATE engagement_users SET role = 'article' WHERE role = 'VIEWER';
        
        -- Now change to new enum type
        ALTER TABLE engagement_users ALTER COLUMN role TYPE enum_engagement_users_role_new
        USING role::enum_engagement_users_role_new;
        
        -- Set default again
        ALTER TABLE engagement_users ALTER COLUMN role SET DEFAULT 'associate';
    ELSE
        ALTER TABLE engagement_users ADD COLUMN role enum_engagement_users_role_new NOT NULL DEFAULT 'associate';
    END IF;
    
    -- Ensure engagement_id and user_id are not null
    ALTER TABLE engagement_users ALTER COLUMN engagement_id SET NOT NULL;
    ALTER TABLE engagement_users ALTER COLUMN user_id SET NOT NULL;
END $$;

-- Add foreign keys back
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'engagement_users_engagement_id_fkey') THEN
        ALTER TABLE engagement_users ADD CONSTRAINT engagement_users_engagement_id_fkey 
        FOREIGN KEY (engagement_id) REFERENCES engagements(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'engagement_users_user_id_fkey') THEN
        ALTER TABLE engagement_users ADD CONSTRAINT engagement_users_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add unique constraint on engagement_id + user_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'engagement_users_engagement_user_unique') THEN
        ALTER TABLE engagement_users ADD CONSTRAINT engagement_users_engagement_user_unique 
        UNIQUE (engagement_id, user_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_engagement_users_engagement_id ON engagement_users(engagement_id);
CREATE INDEX IF NOT EXISTS idx_engagement_users_user_id ON engagement_users(user_id);
CREATE INDEX IF NOT EXISTS idx_engagement_users_role ON engagement_users(role);

-- Step 8: Clean up old enum types if they exist
-- (Keep them for now to avoid breaking existing data)

DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully';
END $$;

