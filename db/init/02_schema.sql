-- Version: 1.3.1
-- Description: Enables extensions and creates migration tracking tables. Defines app.instance for installation version tracking.
-- Backend file: 02_schema.sql
--
-- Changes in v1.3:
-- - Replaced app.app_version with app.instance table
-- - Columns: postgres_version, schema_version, evi_fe, evi_be, evi_db, instance_id, deployed_at, last_updated_at, deployed_by
-- - INSERT/ON CONFLICT updated for new structure; version literals kept in sync by release.sh (trailing comma on version line required for sed)
--
-- Changes in v1.3.1:
-- - postgres_version: use split_part(..., ' ', 1) so value fits VARCHAR(20).
-- - Version literals: separate placeholders 0.10.3, 0.10.3, 0.10.3, 0.10.3 so release.sh replaces each column independently (avoids one-column merge).

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

-- Instance and version tracking (one row per installation)
CREATE TABLE IF NOT EXISTS app.instance (
    id INTEGER PRIMARY KEY DEFAULT 1,
    postgres_version VARCHAR(20) NOT NULL,
    schema_version VARCHAR(20) NOT NULL,
    evi_fe VARCHAR(20) NOT NULL,
    evi_be VARCHAR(20) NOT NULL,
    evi_db VARCHAR(20) NOT NULL,
    instance_id UUID,
    deployed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deployed_by VARCHAR(100) DEFAULT CURRENT_USER
);

-- Insert/upsert instance record. Four version literals below are updated by release.sh (schema_version, evi_fe, evi_be, evi_db).
INSERT INTO app.instance (
    postgres_version, schema_version, evi_fe, evi_be, evi_db, instance_id,
    deployed_at, last_updated_at, deployed_by
)
VALUES (
    split_part(current_setting('server_version'), ' ', 1),
    '0.10.2', '0.10.3', '0.10.3', '0.10.2',
    NULL,
    NOW(),
    NOW(),
    CURRENT_USER
)
ON CONFLICT (id) DO UPDATE SET
    postgres_version = split_part(current_setting('server_version'), ' ', 1),
    schema_version = EXCLUDED.schema_version,
    evi_fe = EXCLUDED.evi_fe,
    evi_be = EXCLUDED.evi_be,
    evi_db = EXCLUDED.evi_db,
    last_updated_at = NOW(),
    deployed_by = CURRENT_USER;
