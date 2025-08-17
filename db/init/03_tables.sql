-- Version: 1.0
-- Description: Create all tables
-- Backend file: init_tables

-- Create sequences
CREATE SEQUENCE IF NOT EXISTS app.tokens_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;

-- Create users table
CREATE TABLE IF NOT EXISTS app.users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE,
    hashed_password TEXT,
    email VARCHAR(255) UNIQUE,
    is_staff BOOLEAN DEFAULT false,
    account_status app.account_status DEFAULT 'active'::app.account_status,
    first_name VARCHAR(50),
    middle_name VARCHAR(50),
    last_name VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS app.user_profiles (
    profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app.users(user_id) ON DELETE CASCADE,
    reserve1 VARCHAR(50),
    reserve2 VARCHAR(50),
    reserve3 VARCHAR(50),
    mobile_phone_number VARCHAR(15) UNIQUE,
    address TEXT,
    company_name VARCHAR(255),
    position VARCHAR(255),
    gender app.gender
);

-- Create groups table
CREATE TABLE IF NOT EXISTS app.groups (
    group_id UUID PRIMARY KEY,
    group_name VARCHAR(100) UNIQUE NOT NULL,
    reserve_1 VARCHAR(100),
    group_status app.group_status NOT NULL DEFAULT 'active'::app.group_status,
    group_owner UUID NOT NULL REFERENCES app.users(user_id),
    is_system BOOLEAN NOT NULL DEFAULT false
);

-- Create group_details table
CREATE TABLE IF NOT EXISTS app.group_details (
    group_id UUID PRIMARY KEY REFERENCES app.groups(group_id) ON DELETE CASCADE,
    group_description TEXT,
    group_email VARCHAR(255) UNIQUE,
    reserve_field_1 VARCHAR(100),
    reserve_field_2 VARCHAR(100),
    reserve_field_3 SMALLINT,
    group_created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    group_created_by UUID NOT NULL REFERENCES app.users(user_id),
    group_modified_at TIMESTAMP WITH TIME ZONE,
    group_modified_by UUID REFERENCES app.users(user_id)
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
    UNIQUE(group_id, user_id, is_active)
);

-- Create tokens table
CREATE TABLE IF NOT EXISTS app.tokens (
    id BIGINT PRIMARY KEY DEFAULT nextval('app.tokens_id_seq'::regclass),
    user_uuid UUID NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT false,
    device_fingerprint_hash VARCHAR(64)
);

-- Set ownership for sequence
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
    product_sku VARCHAR(100) UNIQUE,
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
    CONSTRAINT chk_product_lead_time_positive CHECK (product_lead_time_days IS NULL OR product_lead_time_days > 0)
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
    product_id UUID NOT NULL REFERENCES app.products(id) ON DELETE CASCADE,
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
    UNIQUE(service_id, user_id, role_type)
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
    UNIQUE(service_id, group_id, role_type)
);
