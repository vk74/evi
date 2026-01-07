-- Version: 1.2
-- Description: Creates the app schema and grants privileges to app_service.
-- Backend file: 01_init.sql
-- Note: User 'app_service' is created by 00_init_users.sh before this script runs.

-- Create the application schema FIRST
CREATE SCHEMA IF NOT EXISTS app;

-- Grant basic connection rights to the database
GRANT CONNECT ON DATABASE maindb TO app_service;

-- Grant usage on the 'app' schema, allowing the user to see and access objects within it
GRANT USAGE ON SCHEMA app TO app_service;

-- Grant comprehensive CRUD permissions on all existing tables within the 'app' schema
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app TO app_service;

-- Grant permissions for using all existing sequences, which is crucial for tables with auto-incrementing IDs
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA app TO app_service;

-- IMPORTANT: Set default privileges for future objects.
-- This ensures that any new tables or sequences created in the 'app' schema
-- will automatically have the correct permissions granted to 'app_service'.
ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_service;
ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO app_service;
