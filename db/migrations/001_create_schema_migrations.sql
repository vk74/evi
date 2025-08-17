-- Version: 1.0
-- Description: Create schema migrations tracking table
-- Backend file: schema_migrations

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

-- Insert initial version record
INSERT INTO app.app_version (version, schema_version) 
VALUES ('v0.5.0', '001')
ON CONFLICT (id) DO UPDATE SET 
    version = EXCLUDED.version,
    schema_version = EXCLUDED.schema_version,
    deployed_at = NOW(),
    deployed_by = CURRENT_USER;
