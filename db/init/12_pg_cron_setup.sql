-- Version: 1.1
-- Description: Sets up pg_cron extension and configures periodic token cleanup.
-- Backend file: 12_pg_cron_setup.sql

-- This script enables the pg_cron extension and creates a scheduled job
-- to clean up expired tokens from the app.tokens table. The cleanup runs
-- every hour and includes load balancing to avoid high system load.

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant necessary permissions to postgres user for pg_cron
GRANT USAGE ON SCHEMA cron TO postgres;

-- Create function for smart token cleanup with load balancing
CREATE OR REPLACE FUNCTION app.cleanup_expired_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    active_connections INTEGER;
    deleted_count INTEGER := 0;
    total_deleted INTEGER := 0;
    batch_size INTEGER := 1000;
    high_load_threshold INTEGER := 50;
BEGIN
    -- Check current active connections
    SELECT count(*) INTO active_connections
    FROM pg_stat_activity 
    WHERE state = 'active' AND datname = current_database();
    
    -- If high load, use smaller batch size and add delays
    IF active_connections > high_load_threshold THEN
        batch_size := 500;
    END IF;
    
    -- Clean up expired tokens in batches
    LOOP
        EXECUTE format('DELETE FROM app.tokens WHERE expires_at < NOW() LIMIT %s', batch_size);
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        total_deleted := total_deleted + deleted_count;
        
        -- Exit if no more records to delete
        EXIT WHEN deleted_count = 0;
        
        -- If high load, add delay between batches
        IF active_connections > high_load_threshold THEN
            PERFORM pg_sleep(0.1); -- 100ms delay
        END IF;
    END LOOP;
    
    -- Log cleanup results to PostgreSQL log
    RAISE NOTICE 'Token cleanup completed: deleted % expired tokens with % active connections', 
                 total_deleted, active_connections;
END;
$$;

-- Schedule token cleanup to run every hour at minute 0
SELECT cron.schedule(
    'cleanup-expired-tokens',
    '0 * * * *', -- Every hour at minute 0
    'SELECT app.cleanup_expired_tokens();'
);

-- Grant execute permission on the cleanup function
GRANT EXECUTE ON FUNCTION app.cleanup_expired_tokens() TO postgres;

-- Log successful setup
SELECT 'pg_cron extension configured successfully - token cleanup scheduled every hour' AS setup_status;
