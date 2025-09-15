-- Version: 1.1.1
-- Description: Create all application tables, functions, and triggers.
-- Backend file: 04_tables.sql

-- ===========================================
-- Helper Functions
-- ===========================================

-- Audit helper: update updated_at on row change
CREATE FUNCTION app.tgr_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

-- ===========================================
-- Tables
-- ===========================================

-- Create users table
CREATE TABLE IF NOT EXISTS app.users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50),
    hashed_password TEXT,
    email VARCHAR(255),
    is_staff BOOLEAN DEFAULT false,
    account_status app.account_status DEFAULT 'active'::app.account_status,
    is_active BOOLEAN GENERATED ALWAYS AS (account_status = 'active') STORED,
    first_name VARCHAR(50),
    middle_name VARCHAR(50),
    last_name VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_user_name UNIQUE (username),
    CONSTRAINT unique_email UNIQUE (email)
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS app.user_profiles (
    profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app.users(user_id) ON DELETE CASCADE,
    reserve1 VARCHAR(50),
    reserve2 VARCHAR(50),
    reserve3 VARCHAR(50),
    mobile_phone_number VARCHAR(15),
    address TEXT,
    company_name VARCHAR(255),
    position VARCHAR(255),
    gender app.gender,
    CONSTRAINT unique_mobile_number UNIQUE (mobile_phone_number)
);

-- Create groups table
CREATE TABLE IF NOT EXISTS app.groups (
    group_id UUID PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL,
    reserve_1 VARCHAR(100),
    group_status app.group_status NOT NULL DEFAULT 'active'::app.group_status,
    group_owner UUID NOT NULL REFERENCES app.users(user_id),
    is_system BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT unique_group_name UNIQUE (group_name)
);

-- Create group_details table
CREATE TABLE IF NOT EXISTS app.group_details (
    group_id UUID PRIMARY KEY REFERENCES app.groups(group_id) ON DELETE CASCADE,
    group_description TEXT,
    group_email VARCHAR(255),
    reserve_field_1 VARCHAR(100),
    reserve_field_2 VARCHAR(100),
    reserve_field_3 SMALLINT,
    group_created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    group_created_by UUID NOT NULL REFERENCES app.users(user_id),
    group_modified_at TIMESTAMP WITH TIME ZONE,
    group_modified_by UUID REFERENCES app.users(user_id),
    CONSTRAINT unique_group_email UNIQUE (group_email)
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS app.group_members (
    member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES app.groups(group_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app.users(user_id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    added_by UUID NOT NULL REFERENCES app.users(user_id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    left_at TIMESTAMP WITH TIME ZONE,
    removed_by UUID REFERENCES app.users(user_id),
    CONSTRAINT group_members_group_id_user_id_is_active_key UNIQUE(group_id, user_id, is_active)
);

-- Create tokens table
CREATE TABLE IF NOT EXISTS app.tokens (
    id BIGINT PRIMARY KEY DEFAULT nextval('app.tokens_id_seq'::regclass),
    user_uuid UUID NOT NULL,
    token_hash TEXT NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT false,
    device_fingerprint_hash VARCHAR(64),
    CONSTRAINT tokens_token_hash_key UNIQUE (token_hash)
);

-- Set sequence ownership
ALTER SEQUENCE app.tokens_id_seq OWNED BY app.tokens.id;

-- Create app_settings table
CREATE TABLE IF NOT EXISTS app.app_settings (
    section_path VARCHAR(255) NOT NULL,
    setting_name VARCHAR(100) NOT NULL,
    environment app.environment_type NOT NULL DEFAULT 'all'::app.environment_type,
    value JSONB NOT NULL,
    validation_schema JSONB,
    default_value JSONB,
    confidentiality BOOLEAN NOT NULL DEFAULT false,
    description TEXT,
    is_ui BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (section_path, setting_name, environment)
);

-- Create catalog_sections table
CREATE TABLE IF NOT EXISTS app.catalog_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(250) NOT NULL,
    owner UUID REFERENCES app.users(user_id) ON DELETE RESTRICT,
    backup_owner UUID REFERENCES app.users(user_id) ON DELETE SET NULL,
    description TEXT,
    comments TEXT,
    status app.section_status DEFAULT 'draft'::app.section_status,
    is_public BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER DEFAULT 0,
    parent_id UUID REFERENCES app.catalog_sections(id) ON DELETE CASCADE,
    icon_name VARCHAR(100),
    color VARCHAR(7),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES app.users(user_id) ON DELETE SET NULL,
    modified_at TIMESTAMP WITH TIME ZONE,
    modified_by UUID REFERENCES app.users(user_id) ON DELETE SET NULL,
    CONSTRAINT chk_section_color_format CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT chk_section_order_positive CHECK ("order" >= 0)
);

-- Create services table
CREATE TABLE IF NOT EXISTS app.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(250) NOT NULL,
    priority app.service_priority NOT NULL DEFAULT 'low'::app.service_priority,
    status app.service_status DEFAULT 'drafted'::app.service_status,
    description_short VARCHAR(250),
    description_long VARCHAR(10000),
    purpose VARCHAR(10000),
    comments VARCHAR(10000),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES app.users(user_id),
    modified_at TIMESTAMP WITH TIME ZONE,
    modified_by UUID REFERENCES app.users(user_id),
    is_public BOOLEAN NOT NULL DEFAULT false,
    icon_name VARCHAR(100),
    -- Visibility preferences for service card roles
    show_owner BOOLEAN NOT NULL DEFAULT false,
    show_backup_owner BOOLEAN NOT NULL DEFAULT false,
    show_technical_owner BOOLEAN NOT NULL DEFAULT false,
    show_backup_technical_owner BOOLEAN NOT NULL DEFAULT false,
    show_dispatcher BOOLEAN NOT NULL DEFAULT true,
    show_support_tier1 BOOLEAN NOT NULL DEFAULT true,
    show_support_tier2 BOOLEAN NOT NULL DEFAULT false,
    show_support_tier3 BOOLEAN NOT NULL DEFAULT false
);

-- Create products table (moved here to be available for foreign key references)
CREATE TABLE IF NOT EXISTS app.products (
  product_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code     VARCHAR(150) UNIQUE,
  translation_key  VARCHAR(150) NOT NULL UNIQUE,

  -- Option flags (A/B/C) and publication
  can_be_option    BOOLEAN NOT NULL DEFAULT false,
  option_only      BOOLEAN NOT NULL DEFAULT false,
  is_published     BOOLEAN NOT NULL DEFAULT false,

  -- Visibility flags
  is_visible_owner              BOOLEAN NOT NULL DEFAULT false,
  is_visible_groups             BOOLEAN NOT NULL DEFAULT false,
  is_visible_tech_specs         BOOLEAN NOT NULL DEFAULT false,
  is_visible_area_specs         BOOLEAN NOT NULL DEFAULT false,
  is_visible_industry_specs     BOOLEAN NOT NULL DEFAULT false,
  is_visible_key_features       BOOLEAN NOT NULL DEFAULT false,
  is_visible_overview           BOOLEAN NOT NULL DEFAULT false,
  is_visible_long_description   BOOLEAN NOT NULL DEFAULT false,

  -- Audit
  created_by      UUID NOT NULL DEFAULT '00000000-0000-0000-0000-00000000dead',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by      UUID,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Business rule: option_only => can_be_option
  CONSTRAINT products_option_only_impl_can_be_option
    CHECK (option_only = false OR can_be_option = true),

  -- Relations
  FOREIGN KEY (created_by) REFERENCES app.users(user_id) ON DELETE SET DEFAULT,
  FOREIGN KEY (updated_by) REFERENCES app.users(user_id) ON DELETE SET NULL
);

CREATE TRIGGER tgr_products_set_updated_at
BEFORE UPDATE ON app.products
FOR EACH ROW EXECUTE FUNCTION app.tgr_set_updated_at();

-- Create section_services table
CREATE TABLE IF NOT EXISTS app.section_services (
    section_id UUID NOT NULL REFERENCES app.catalog_sections(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES app.services(id) ON DELETE CASCADE,
    service_order INTEGER DEFAULT 0,
    PRIMARY KEY (section_id, service_id),
    CONSTRAINT chk_service_order_positive CHECK (service_order >= 0)
);

-- Create section_products table
CREATE TABLE IF NOT EXISTS app.section_products (
    section_id UUID NOT NULL REFERENCES app.catalog_sections(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES app.products(product_id) ON DELETE CASCADE,
    product_order INTEGER DEFAULT 0,
    PRIMARY KEY (section_id, product_id),
    CONSTRAINT chk_product_order_positive CHECK (product_order >= 0)
);

-- Create service_users table
CREATE TABLE IF NOT EXISTS app.service_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES app.services(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app.users(user_id) ON DELETE CASCADE,
    role_type app.service_user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID NOT NULL REFERENCES app.users(user_id),
    modified_at TIMESTAMP WITH TIME ZONE,
    modified_by UUID REFERENCES app.users(user_id),
    CONSTRAINT service_users_service_id_user_id_role_type_key UNIQUE(service_id, user_id, role_type)
);

-- Create service_groups table
CREATE TABLE IF NOT EXISTS app.service_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES app.services(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES app.groups(group_id) ON DELETE CASCADE,
    role_type app.service_group_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID NOT NULL REFERENCES app.users(user_id),
    modified_at TIMESTAMP WITH TIME ZONE,
    modified_by UUID REFERENCES app.users(user_id),
    CONSTRAINT service_groups_service_id_group_id_role_type_key UNIQUE(service_id, group_id, role_type)
);

-- ============================================
-- Functions and Triggers
-- ============================================

-- Function to prevent deletion of system groups
CREATE OR REPLACE FUNCTION app.prevent_system_group_deletion()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    RAISE EXCEPTION 'Cannot delete system group';
END;
$function$;

-- Trigger to protect system groups from deletion
CREATE TRIGGER prevent_system_group_deletion
    BEFORE DELETE ON app.groups
    FOR EACH ROW
    WHEN (OLD.is_system = true)
    EXECUTE FUNCTION app.prevent_system_group_deletion();

-- Function to cleanup expired tokens
CREATE OR REPLACE FUNCTION app.cleanup_expired_tokens()
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
    DELETE FROM app.tokens
    WHERE expires_at < now();
END;
$function$;

-- Schedule periodic cleanup of expired tokens (runs every hour)
-- SELECT cron.schedule(
--     'cleanup-expired-tokens',
--     '0 * * * *',  -- Every hour at minute 0
--     'SELECT app.cleanup_expired_tokens();'
-- ); -- Commented out for local development

-- ============================================
-- Column Comments for Services Table
-- ============================================

-- Add comments for service visibility preference columns
COMMENT ON COLUMN app.services.show_owner IS 'Whether to show owner in service card';
COMMENT ON COLUMN app.services.show_backup_owner IS 'Whether to show backup owner in service card';
COMMENT ON COLUMN app.services.show_technical_owner IS 'Whether to show technical owner in service card';
COMMENT ON COLUMN app.services.show_backup_technical_owner IS 'Whether to show backup technical owner in service card';
COMMENT ON COLUMN app.services.show_dispatcher IS 'Whether to show dispatcher in service card';
COMMENT ON COLUMN app.services.show_support_tier1 IS 'Whether to show support tier 1 in service card';
COMMENT ON COLUMN app.services.show_support_tier2 IS 'Whether to show support tier 2 in service card';
COMMENT ON COLUMN app.services.show_support_tier3 IS 'Whether to show support tier 3 in service card';

-- ===========================================
-- Product core tables & triggers
-- ===========================================

-- Products table is already defined above

-- Product translations (by product_id)
CREATE TABLE app.product_translations (
  translation_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       UUID NOT NULL,
  language_code    app.system_language_code NOT NULL,

  name             VARCHAR(300) NOT NULL,
  short_desc       VARCHAR(250),
  long_desc        TEXT,

  tech_specs         JSONB,
  area_specifics     JSONB,
  industry_specifics JSONB,
  key_features       JSONB,
  product_overview   JSONB,

  -- Audit
  created_by      UUID NOT NULL DEFAULT '00000000-0000-0000-0000-00000000dead',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by      UUID,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Integrity
  CONSTRAINT product_translations_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT uq_product_translations_one_per_lang UNIQUE (product_id, language_code),

  -- Relations
  FOREIGN KEY (product_id)  REFERENCES app.products(product_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by)  REFERENCES app.users(user_id)      ON DELETE SET DEFAULT,
  FOREIGN KEY (updated_by)  REFERENCES app.users(user_id)      ON DELETE SET NULL
);

CREATE TRIGGER tgr_product_translations_set_updated_at
BEFORE UPDATE ON app.product_translations
FOR EACH ROW EXECUTE FUNCTION app.tgr_set_updated_at();

-- Product-to-group link with roles
CREATE TABLE app.product_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  group_id   UUID NOT NULL,
  role_type app.product_group_role NOT NULL DEFAULT 'product_specialists',
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-00000000dead',
  modified_at TIMESTAMPTZ,
  modified_by UUID,
  CONSTRAINT uk_product_groups_product_group_role UNIQUE (product_id, group_id, role_type),
  FOREIGN KEY (product_id) REFERENCES app.products(product_id) ON DELETE CASCADE,
  FOREIGN KEY (group_id)   REFERENCES app.groups(group_id)     ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES app.users(user_id) ON DELETE SET DEFAULT,
  FOREIGN KEY (modified_by) REFERENCES app.users(user_id) ON DELETE SET NULL
);

-- Product-to-user link with roles
CREATE TABLE app.product_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role_type app.product_user_role NOT NULL DEFAULT 'owner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-00000000dead',
  modified_at TIMESTAMPTZ,
  modified_by UUID,
  CONSTRAINT uk_product_users_product_user_role UNIQUE (product_id, user_id, role_type),
  FOREIGN KEY (product_id) REFERENCES app.products(product_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES app.users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES app.users(user_id) ON DELETE SET DEFAULT,
  FOREIGN KEY (modified_by) REFERENCES app.users(user_id) ON DELETE SET NULL
);

-- ===========================================
-- Product Options Relationship Table
-- ===========================================

CREATE TABLE IF NOT EXISTS app.product_options (
    -- Primary key
    option_relation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign keys
    main_product_id UUID NOT NULL REFERENCES app.products(product_id) ON DELETE CASCADE,
    option_product_id UUID NOT NULL REFERENCES app.products(product_id) ON DELETE CASCADE,
    
    -- Business logic fields
    is_required BOOLEAN NOT NULL DEFAULT false,
    units_count INTEGER CHECK (units_count IS NULL OR (units_count >= 1 AND units_count <= 1000)),
    
    -- Audit fields (same structure as products table)
    created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-00000000dead'::uuid,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT chk_product_options_different_products 
        CHECK (main_product_id != option_product_id),
    
    -- Constraint to ensure units_count is only set for required options
    CONSTRAINT chk_units_count_required 
        CHECK ((is_required = true AND units_count IS NOT NULL) OR (is_required = false AND units_count IS NULL)),
    
    -- Unique constraint to prevent duplicate relationships
    CONSTRAINT uk_product_options_relation 
        UNIQUE (main_product_id, option_product_id)
);

-- ===========================================
-- Product Options Triggers
-- ===========================================

-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER trg_product_options_updated_at
    BEFORE UPDATE ON app.product_options
    FOR EACH ROW
    EXECUTE FUNCTION app.tgr_set_updated_at();

-- Trigger to check maximum number of options per product
CREATE OR REPLACE FUNCTION app.check_max_options_per_product()
RETURNS trigger AS $$
DECLARE
    max_options INTEGER;
    current_count INTEGER;
BEGIN
    -- Get max options limit from settings
    SELECT value::INTEGER INTO max_options
    FROM app.app_settings 
    WHERE section_path = 'products.options' 
    AND setting_name = 'max.options.per.product';
    
    -- If setting not found, raise error - this is a configuration issue
    IF max_options IS NULL THEN
        RAISE EXCEPTION 'Configuration error: max.options.per.product setting not found in app.app_settings. Please check database initialization.';
    END IF;
    
    -- Count current options for the main product
    SELECT COUNT(*) INTO current_count
    FROM app.product_options
    WHERE main_product_id = NEW.main_product_id;
    
    -- Check if adding this option would exceed the limit
    IF current_count >= max_options THEN
        RAISE EXCEPTION 'Maximum number of options (%) exceeded for product %', 
            max_options, NEW.main_product_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_max_options_per_product
    BEFORE INSERT ON app.product_options
    FOR EACH ROW
    EXECUTE FUNCTION app.check_max_options_per_product();

-- ============================================
-- Column Comments for Product Roles
-- ============================================

-- Add comments for product role types
COMMENT ON TYPE app.product_user_role IS 'User roles for products: owner, backup_owner';
COMMENT ON TYPE app.product_group_role IS 'Group roles for products: product_specialists';
COMMENT ON COLUMN app.product_users.role_type IS 'Role type for the user in this product';
COMMENT ON COLUMN app.product_groups.role_type IS 'Role type for the group in this product';