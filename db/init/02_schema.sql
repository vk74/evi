-- Version: 1.2
-- Description: Enables extensions and creates migration tracking tables.
-- Backend file: 01_schema.sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
-- CREATE EXTENSION IF NOT EXISTS "pg_cron"; -- Commented out for local development

-- Create schema migrations table to track applied migrations
CREATE TABLE IF NOT EXISTS app.schema_migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    applied_by VARCHAR(100) DEFAULT CURRENT_USER,
    execution_time_ms INTEGER
);

-- Create app version tracking table
CREATE TABLE IF NOT EXISTS app.app_version (
    id INTEGER PRIMARY KEY DEFAULT 1,
    version VARCHAR(20) NOT NULL,
    schema_version VARCHAR(20) NOT NULL,
    deployed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deployed_by VARCHAR(100) DEFAULT CURRENT_USER
);

-- Insert initial version record (version and schema_version kept in sync by release.sh)
INSERT INTO app.app_version (version, schema_version) 
VALUES ('0.9.14', '0.9.14')
ON CONFLICT (id) DO UPDATE SET 
    version = EXCLUDED.version,
    schema_version = EXCLUDED.schema_version,
    deployed_at = NOW(),
    deployed_by = CURRENT_USER;
