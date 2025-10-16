-- Version: 1.3.0
-- Description: Create enum types for the application.
-- Backend file: 03_enums.sql
-- Added: Regional settings enum types (timezones, app_countries, system_language_code)
-- Removed: app_languages enum (replaced by system_language_code)

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

DO $$ BEGIN
    CREATE TYPE app.system_language_code AS ENUM ('en', 'ru');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE app.product_user_role AS ENUM ('owner', 'backup_owner');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE app.product_group_role AS ENUM ('product_specialists');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE app.timezones AS ENUM (
        'GMT-12', 'GMT-11', 'GMT-10', 'GMT-9', 'GMT-8', 'GMT-7',
        'GMT-6', 'GMT-5', 'GMT-4', 'GMT-3', 'GMT-2', 'GMT-1', 'GMT',
        'GMT+1', 'GMT+2', 'GMT+3', 'GMT+4', 'GMT+5', 'GMT+6',
        'GMT+7', 'GMT+8', 'GMT+9', 'GMT+10', 'GMT+11', 'GMT+12',
        'GMT+13', 'GMT+14'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE app.app_countries AS ENUM ('russia', 'kazakhstan');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Note: app_languages enum has been deprecated and removed
-- Use app.system_language_code instead for language settings

-- Pricing: price list lifecycle statuses
DO $$ BEGIN
    CREATE TYPE app.price_list_status AS ENUM ('draft', 'active', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Pricing: item type in price lists
DO $$ BEGIN
    CREATE TYPE app.price_item_type AS ENUM ('product', 'service');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;