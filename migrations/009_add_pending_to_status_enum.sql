-- Migration: Add 'Pending' value to enum_status enum
-- This allows audit clients to have a 'Pending' status before approval

DO $$
BEGIN
    -- Check if 'Pending' already exists in the enum
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'Pending' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_status')
    ) THEN
        -- Add 'Pending' to the enum
        -- Note: PostgreSQL doesn't support positioning enum values, so it will be added at the end
        ALTER TYPE enum_status ADD VALUE 'Pending';
    END IF;
END $$;

