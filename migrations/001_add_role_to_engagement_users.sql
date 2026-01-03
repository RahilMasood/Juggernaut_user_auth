-- Add role column to engagement_users table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'engagement_users' 
        AND column_name = 'role'
    ) THEN
        -- Create ENUM type if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_engagement_users_role') THEN
            CREATE TYPE enum_engagement_users_role AS ENUM ('LEAD', 'MEMBER', 'VIEWER');
        END IF;
        
        -- Add the role column
        ALTER TABLE engagement_users 
        ADD COLUMN role enum_engagement_users_role NOT NULL DEFAULT 'MEMBER';
        
        RAISE NOTICE 'Added role column to engagement_users table';
    ELSE
        RAISE NOTICE 'Role column already exists in engagement_users table';
    END IF;
END $$;

-- Add created_at and updated_at if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'engagement_users' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE engagement_users 
        ADD COLUMN created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
        
        RAISE NOTICE 'Added created_at column to engagement_users table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'engagement_users' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE engagement_users 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
        
        RAISE NOTICE 'Added updated_at column to engagement_users table';
    END IF;
END $$;

-- Update existing rows to have default role if needed
UPDATE engagement_users 
SET role = 'MEMBER' 
WHERE role IS NULL;


