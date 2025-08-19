-- Version: 1.0
-- Description: Create PostgreSQL users for application
-- Backend file: init_users
-- Create application user for database connections
-- This user will be used by the backend application

-- Create application user if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_service') THEN
        CREATE USER app_service WITH PASSWORD 'dev_app_password';
    END IF;
END
$$;

-- Grant necessary privileges
GRANT CONNECT ON DATABASE maindb TO app_service;
GRANT USAGE ON SCHEMA app TO app_service;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA app TO app_service;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA app TO app_service;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA app TO app_service;

-- Grant privileges on future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT ALL ON TABLES TO app_service;
ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT ALL ON SEQUENCES TO app_service;
ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT ALL ON FUNCTIONS TO app_service;

-- Grant access to pg_cron extension (if needed)
-- GRANT USAGE ON SCHEMA cron TO app_service; -- Commented out for local development
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO app_service; -- Commented out for local development
