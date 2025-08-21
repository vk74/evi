-- Version: 1.1
-- Description: Create enum types for the application.
-- Backend file: 03_enums.sql

-- Create enum types
DO $$ BEGIN
    CREATE TYPE app.account_status AS ENUM ('active', 'disabled', 'requires_user_action');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE app.dimension_unit AS ENUM ('cm', 'mm', 'm', 'in', 'ft');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE app.environment_type AS ENUM ('production', 'dev', 'test', 'all');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE app.gender AS ENUM ('m', 'f', 'n');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE app.group_status AS ENUM ('active', 'disabled', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE app.group_type AS ENUM ('support', 'development', 'users', 'admin', 'security');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE app.product_status AS ENUM ('planned', 'active', 'discontinued', 'out_of_stock');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE app.section_status AS ENUM ('draft', 'active', 'archived', 'disabled', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE app.service_group_role AS ENUM ('support_tier1', 'support_tier2', 'support_tier3', 'access_allowed', 'access_denied');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE app.service_priority AS ENUM ('critical', 'high', 'medium', 'low');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE app.service_status AS ENUM ('drafted', 'being_developed', 'being_tested', 'non_compliant', 'pending_approval', 'in_production', 'under_maintenance', 'suspended', 'being_upgraded', 'discontinued');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE app.service_user_role AS ENUM ('owner', 'backup_owner', 'technical_owner', 'backup_technical_owner', 'dispatcher', 'access_denied');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE app.weight_unit AS ENUM ('kg', 'g', 'lb', 'oz');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
