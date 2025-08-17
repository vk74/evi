-- Version: v0.5.0
-- Description: Complete database snapshot for EV2 application
-- Backend file: v0.5.0_snapshot
-- Created: 2024-12-01

-- This file contains the complete database schema and data for EV2 v0.5.0
-- Use this for quick deployment of new instances

-- Create app schema
CREATE SCHEMA IF NOT EXISTS app;

-- Enable required extensions

CREATE EXTENSION IF NOT EXISTS "pg_trgm";

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

-- Create sequences
CREATE SEQUENCE IF NOT EXISTS app.tokens_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;

-- Create all tables
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

CREATE TABLE IF NOT EXISTS app.groups (
    group_id UUID PRIMARY KEY,
    group_name VARCHAR(100) UNIQUE NOT NULL,
    reserve_1 VARCHAR(100),
    group_status app.group_status NOT NULL DEFAULT 'active'::app.group_status,
    group_owner UUID NOT NULL REFERENCES app.users(user_id),
    is_system BOOLEAN NOT NULL DEFAULT false
);

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

CREATE TABLE IF NOT EXISTS app.tokens (
    id BIGINT PRIMARY KEY DEFAULT nextval('app.tokens_id_seq'::regclass),
    user_uuid UUID NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT false,
    device_fingerprint_hash VARCHAR(64)
);

ALTER SEQUENCE app.tokens_id_seq OWNED BY app.tokens.id;

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

CREATE TABLE IF NOT EXISTS app.section_services (
    section_id UUID NOT NULL REFERENCES app.catalog_sections(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES app.services(id) ON DELETE CASCADE,
    service_order INTEGER DEFAULT 0,
    PRIMARY KEY (section_id, service_id),
    CONSTRAINT chk_service_order_positive CHECK (service_order >= 0)
);

CREATE TABLE IF NOT EXISTS app.section_products (
    section_id UUID NOT NULL REFERENCES app.catalog_sections(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES app.products(id) ON DELETE CASCADE,
    product_order INTEGER DEFAULT 0,
    PRIMARY KEY (section_id, product_id),
    CONSTRAINT chk_product_order_positive CHECK (product_order >= 0)
);

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

-- Create all indexes
CREATE INDEX IF NOT EXISTS idx_app_sections_path ON app.app_settings USING btree (section_path);
CREATE INDEX IF NOT EXISTS idx_app_settings_environment ON app.app_settings USING btree (environment);
CREATE INDEX IF NOT EXISTS idx_app_settings_value ON app.app_settings USING gin (value);
CREATE INDEX IF NOT EXISTS idx_catalog_sections_order ON app.catalog_sections USING btree ("order");
CREATE INDEX IF NOT EXISTS idx_catalog_sections_parent ON app.catalog_sections USING btree (parent_id);
CREATE INDEX IF NOT EXISTS idx_catalog_sections_public ON app.catalog_sections USING btree (is_public);
CREATE INDEX IF NOT EXISTS idx_catalog_sections_status ON app.catalog_sections USING btree (status);
CREATE INDEX IF NOT EXISTS idx_group_members_active ON app.group_members USING btree (is_active);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON app.group_members USING btree (group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON app.group_members USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON app.products USING btree (product_category);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON app.products USING btree (product_created_at);
CREATE INDEX IF NOT EXISTS idx_products_public ON app.products USING btree (product_is_public);
CREATE INDEX IF NOT EXISTS idx_products_sku ON app.products USING btree (product_sku);
CREATE INDEX IF NOT EXISTS idx_products_specifications ON app.products USING gin (product_specifications);
CREATE INDEX IF NOT EXISTS idx_products_status ON app.products USING btree (product_status);
CREATE INDEX IF NOT EXISTS product_code ON app.products USING btree (product_code);
CREATE INDEX IF NOT EXISTS idx_section_products_order ON app.section_products USING btree (product_order);
CREATE INDEX IF NOT EXISTS idx_section_products_product ON app.section_products USING btree (product_id);
CREATE INDEX IF NOT EXISTS idx_section_products_section ON app.section_products USING btree (section_id);
CREATE INDEX IF NOT EXISTS idx_section_services_order ON app.section_services USING btree (service_order);
CREATE INDEX IF NOT EXISTS idx_section_services_section ON app.section_services USING btree (section_id);
CREATE INDEX IF NOT EXISTS idx_section_services_service ON app.section_services USING btree (service_id);
CREATE INDEX IF NOT EXISTS idx_service_groups_group_id ON app.service_groups USING btree (group_id);
CREATE INDEX IF NOT EXISTS idx_service_groups_role_type ON app.service_groups USING btree (role_type);
CREATE INDEX IF NOT EXISTS idx_service_groups_service_id ON app.service_groups USING btree (service_id);
CREATE INDEX IF NOT EXISTS idx_service_users_role_type ON app.service_users USING btree (role_type);
CREATE INDEX IF NOT EXISTS idx_service_users_service_id ON app.service_users USING btree (service_id);
CREATE INDEX IF NOT EXISTS idx_service_users_user_id ON app.service_users USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_tokens_expires_at ON app.tokens USING btree (expires_at);
CREATE INDEX IF NOT EXISTS idx_tokens_user_uuid ON app.tokens USING btree (user_uuid);
CREATE INDEX IF NOT EXISTS idx_users_email_trgm ON app.users USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_username_trgm ON app.users USING gin (username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_uuid_trgm ON app.users USING gin ((user_id::text) gin_trgm_ops);

-- Insert all seed data
INSERT INTO app.users (user_id, username, hashed_password, email, is_staff, account_status, first_name, last_name, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'admin@example.com', true, 'active', 'System', 'Administrator', NOW()),
('550e8400-e29b-41d4-a716-446655440002', 't1', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 't1@example.com', false, 'active', 'Test', 'User', NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'john.doe', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'john.doe@example.com', false, 'active', 'John', 'Doe', NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'jane.smith', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'jane.smith@example.com', false, 'active', 'Jane', 'Smith', NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'bob.wilson', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'bob.wilson@example.com', false, 'active', 'Bob', 'Wilson', NOW())
ON CONFLICT (user_id) DO UPDATE SET
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    is_staff = EXCLUDED.is_staff,
    account_status = EXCLUDED.account_status,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name;

INSERT INTO app.user_profiles (profile_id, user_id, mobile_phone_number, address, company_name, position, gender) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '+1234567890', '123 Admin St, City', 'System Corp', 'System Administrator', 'm'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '+1234567891', '456 Test Ave, City', 'Test Company', 'Test Engineer', 'm'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', '+1234567892', '789 Main St, City', 'Tech Solutions', 'Software Developer', 'm'),
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', '+1234567893', '321 Oak Rd, City', 'Design Studio', 'UI/UX Designer', 'f'),
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', '+1234567894', '654 Pine Ln, City', 'Consulting Inc', 'Project Manager', 'm')
ON CONFLICT (profile_id) DO UPDATE SET
    mobile_phone_number = EXCLUDED.mobile_phone_number,
    address = EXCLUDED.address,
    company_name = EXCLUDED.company_name,
    position = EXCLUDED.position,
    gender = EXCLUDED.gender;

INSERT INTO app.groups (group_id, group_name, group_status, group_owner, is_system) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'System Administrators', 'active', '550e8400-e29b-41d4-a716-446655440001', true),
('770e8400-e29b-41d4-a716-446655440002', 'Application Users', 'active', '550e8400-e29b-41d4-a716-446655440001', true),
('770e8400-e29b-41d4-a716-446655440003', 'Support Team', 'active', '550e8400-e29b-41d4-a716-446655440001', true),
('770e8400-e29b-41d4-a716-446655440004', 'Development Team', 'active', '550e8400-e29b-41d4-a716-446655440001', true),
('770e8400-e29b-41d4-a716-446655440005', 'Security Team', 'active', '550e8400-e29b-41d4-a716-446655440001', true)
ON CONFLICT (group_id) DO UPDATE SET
    group_name = EXCLUDED.group_name,
    group_status = EXCLUDED.group_status,
    group_owner = EXCLUDED.group_owner,
    is_system = EXCLUDED.is_system;

INSERT INTO app.group_details (group_id, group_description, group_email, group_created_by) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'System administrators with full access to all features', 'admin@example.com', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440002', 'Regular application users with standard access', 'users@example.com', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440003', 'Technical support team members', 'support@example.com', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440004', 'Software development team members', 'dev@example.com', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440005', 'Security and compliance team members', 'security@example.com', '550e8400-e29b-41d4-a716-446655440001')
ON CONFLICT (group_id) DO UPDATE SET
    group_description = EXCLUDED.group_description,
    group_email = EXCLUDED.group_email;

INSERT INTO app.group_members (group_id, user_id, added_by) VALUES
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001')
ON CONFLICT (group_id, user_id, is_active) DO NOTHING;

INSERT INTO app.catalog_sections (id, name, owner, description, status, is_public, "order", icon_name, color, created_by) VALUES
('880e8400-e29b-41d4-a716-446655440001', 'IT Services', '550e8400-e29b-41d4-a716-446655440001', 'Information Technology Services', 'active', true, 1, 'Monitor', '#3B82F6', '550e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440002', 'Business Solutions', '550e8400-e29b-41d4-a716-446655440001', 'Business Process Solutions', 'active', true, 2, 'Briefcase', '#10B981', '550e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440003', 'Support Services', '550e8400-e29b-41d4-a716-446655440001', 'Technical Support and Maintenance', 'active', true, 3, 'Headset', '#F59E0B', '550e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440004', 'Security Services', '550e8400-e29b-41d4-a716-446655440001', 'Cybersecurity and Compliance', 'active', true, 4, 'Shield', '#EF4444', '550e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440005', 'Cloud Solutions', '550e8400-e29b-41d4-a716-446655440001', 'Cloud Infrastructure and Services', 'active', true, 5, 'Cloud', '#8B5CF6', '550e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440006', 'Software Development', '550e8400-e29b-41d4-a716-446655440001', 'Custom Software Development', 'active', true, 1, 'Code', '#06B6D4', '550e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440007', 'System Administration', '550e8400-e29b-41d4-a716-446655440001', 'System Management and Maintenance', 'active', true, 2, 'Server', '#84CC16', '550e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440008', 'Network Services', '550e8400-e29b-41d4-a716-446655440001', 'Network Infrastructure and Management', 'active', true, 3, 'Network', '#F97316', '550e8400-e29b-41d4-a716-446655440001')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    is_public = EXCLUDED.is_public,
    "order" = EXCLUDED."order",
    icon_name = EXCLUDED.icon_name,
    color = EXCLUDED.color;

UPDATE app.catalog_sections SET parent_id = '880e8400-e29b-41d4-a716-446655440001' WHERE id = '880e8400-e29b-41d4-a716-446655440006';
UPDATE app.catalog_sections SET parent_id = '880e8400-e29b-41d4-a716-446655440001' WHERE id = '880e8400-e29b-41d4-a716-446655440007';
UPDATE app.catalog_sections SET parent_id = '880e8400-e29b-41d4-a716-446655440001' WHERE id = '880e8400-e29b-41d4-a716-446655440008';

INSERT INTO app.services (id, name, priority, status, description_short, description_long, purpose, is_public, icon_name, created_by) VALUES
('990e8400-e29b-41d4-a716-446655440001', 'Web Application Development', 'high', 'in_production', 'Custom web applications', 'Full-stack web application development using modern technologies', 'Create scalable web solutions for business needs', true, 'Globe', '550e8400-e29b-41d4-a716-446655440001'),
('990e8400-e29b-41d4-a716-446655440002', 'Mobile App Development', 'medium', 'in_production', 'iOS and Android apps', 'Native and cross-platform mobile application development', 'Extend business reach through mobile platforms', true, 'Smartphone', '550e8400-e29b-41d4-a716-446655440001'),
('990e8400-e29b-41d4-a716-446655440003', 'Database Design', 'high', 'in_production', 'Database architecture', 'Design and optimization of database systems', 'Ensure data integrity and performance', true, 'Database', '550e8400-e29b-41d4-a716-446655440001'),
('990e8400-e29b-41d4-a716-446655440004', 'Process Automation', 'medium', 'in_production', 'Workflow automation', 'Automate business processes to improve efficiency', 'Reduce manual work and increase productivity', true, 'Robot', '550e8400-e29b-41d4-a716-446655440001'),
('990e8400-e29b-41d4-a716-446655440005', 'Data Analytics', 'high', 'in_production', 'Business intelligence', 'Data analysis and reporting solutions', 'Make informed business decisions', true, 'Chart', '550e8400-e29b-41d4-a716-446655440001'),
('990e8400-e29b-41d4-a716-446655440006', '24/7 Technical Support', 'critical', 'in_production', 'Round-the-clock support', '24/7 technical support for critical systems', 'Ensure continuous system availability', true, 'Support', '550e8400-e29b-41d4-a716-446655440001'),
('990e8400-e29b-41d4-a716-446655440007', 'System Maintenance', 'medium', 'in_production', 'Regular maintenance', 'Preventive maintenance and system updates', 'Keep systems running optimally', true, 'Wrench', '550e8400-e29b-41d4-a716-446655440001'),
('990e8400-e29b-41d4-a716-446655440008', 'Security Audit', 'high', 'in_production', 'Security assessment', 'Comprehensive security audits and assessments', 'Identify and mitigate security risks', true, 'Shield', '550e8400-e29b-41d4-a716-446655440001'),
('990e8400-e29b-41d4-a716-446655440009', 'Compliance Management', 'high', 'in_production', 'Regulatory compliance', 'Ensure compliance with industry regulations', 'Meet legal and regulatory requirements', true, 'CheckCircle', '550e8400-e29b-41d4-a716-446655440001'),
('990e8400-e29b-41d4-a716-446655440010', 'Cloud Migration', 'high', 'in_production', 'Cloud infrastructure', 'Migrate applications to cloud platforms', 'Improve scalability and reduce costs', true, 'Cloud', '550e8400-e29b-41d4-a716-446655440001'),
('990e8400-e29b-41d4-a716-446655440011', 'DevOps Services', 'medium', 'in_production', 'DevOps implementation', 'Implement DevOps practices and tools', 'Accelerate software delivery', true, 'GitBranch', '550e8400-e29b-41d4-a716-446655440001')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    priority = EXCLUDED.priority,
    status = EXCLUDED.status,
    description_short = EXCLUDED.description_short,
    description_long = EXCLUDED.description_long,
    purpose = EXCLUDED.purpose,
    is_public = EXCLUDED.is_public,
    icon_name = EXCLUDED.icon_name;

INSERT INTO app.section_services (section_id, service_id, service_order) VALUES
('880e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440001', 1),
('880e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440002', 2),
('880e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440003', 3),
('880e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440004', 1),
('880e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440005', 2),
('880e8400-e29b-41d4-a716-446655440003', '990e8400-e29b-41d4-a716-446655440006', 1),
('880e8400-e29b-41d4-a716-446655440003', '990e8400-e29b-41d4-a716-446655440007', 2),
('880e8400-e29b-41d4-a716-446655440004', '990e8400-e29b-41d4-a716-446655440008', 1),
('880e8400-e29b-41d4-a716-446655440004', '990e8400-e29b-41d4-a716-446655440009', 2),
('880e8400-e29b-41d4-a716-446655440005', '990e8400-e29b-41d4-a716-446655440010', 1),
('880e8400-e29b-41d4-a716-446655440005', '990e8400-e29b-41d4-a716-446655440011', 2)
ON CONFLICT (section_id, service_id) DO UPDATE SET
    service_order = EXCLUDED.service_order;
