-- Migration to add unique constraint to client_name in audit_clients table
-- This ensures each client name is unique

DO $$
BEGIN
    -- Add unique constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'audit_clients_client_name_key'
    ) THEN
        ALTER TABLE audit_clients 
        ADD CONSTRAINT audit_clients_client_name_key UNIQUE (client_name);
        
        RAISE NOTICE 'Unique constraint added to client_name';
    ELSE
        RAISE NOTICE 'Unique constraint on client_name already exists';
    END IF;
END $$;

