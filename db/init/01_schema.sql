-- Version: 1.0
-- Description: Create app schema
-- Backend file: init_schema

-- Create app schema
CREATE SCHEMA IF NOT EXISTS app;

-- Enable required extensions

CREATE EXTENSION IF NOT EXISTS "pg_trgm";
