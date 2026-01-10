-- Migration to add client_id column to audit_clients table
-- This migration adds the client_id field for external client identifiers

DO $$
BEGIN
    -- Add client_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'audit_clients' AND column_name = 'client_id') THEN
        ALTER TABLE audit_clients ADD COLUMN client_id VARCHAR(255);
        
        -- Add index for client_id for faster lookups
        CREATE INDEX IF NOT EXISTS idx_audit_clients_client_id ON audit_clients(client_id);
    END IF;
END $$;

