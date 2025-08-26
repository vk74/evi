-- Version: 1.1
-- Description: Create all application tables, functions, and triggers.
-- Backend file: 04_tables.sql

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
    icon_name VARCHAR(100)
);

-- Create products table
CREATE TABLE IF NOT EXISTS app.products (
    product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name VARCHAR(250) NOT NULL,
    product_sku VARCHAR(100),
    product_code VARCHAR(100),
    product_lineup VARCHAR(100),
    product_model VARCHAR(100),
    product_category VARCHAR(100),
    product_subcategory VARCHAR(100),
    product_status app.product_status DEFAULT 'active'::app.product_status,
    product_is_public BOOLEAN NOT NULL DEFAULT false,
    product_weight NUMERIC,
    product_weight_unit app.weight_unit DEFAULT 'kg'::app.weight_unit,
    product_length NUMERIC,
    product_width NUMERIC,
    product_height NUMERIC,
    product_dimension_unit app.dimension_unit DEFAULT 'cm'::app.dimension_unit,
    product_specifications JSONB,
    product_description_short VARCHAR(500),
    product_description_long VARCHAR(10000),
    product_features TEXT,
    product_warranty_info VARCHAR(200),
    product_main_image_url VARCHAR(500),
    product_images JSONB,
    product_lead_time_days INTEGER,
    product_created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    product_created_by UUID NOT NULL REFERENCES app.users(user_id),
    product_modified_at TIMESTAMP WITH TIME ZONE,
    product_modified_by UUID REFERENCES app.users(user_id),
    CONSTRAINT chk_product_weight_positive CHECK (product_weight IS NULL OR product_weight > 0),
    CONSTRAINT chk_product_dimensions_positive CHECK (
        (product_length IS NULL OR product_length > 0) AND
        (product_width IS NULL OR product_width > 0) AND
        (product_height IS NULL OR product_height > 0)
    ),
    CONSTRAINT chk_product_lead_time_positive CHECK (product_lead_time_days IS NULL OR product_lead_time_days > 0),
    CONSTRAINT products_product_sku_key UNIQUE (product_sku)
);

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
