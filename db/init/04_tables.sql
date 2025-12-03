-- Version: 1.12.0
-- Description: Create all application tables, functions, and triggers.
-- Backend file: 04_tables.sql
-- Updated: mobile_phone_number -> mobile_phone field name
-- Added: published_by and published_at columns to section_products table
-- Updated: status_code column uses app.product_status UDT enum instead of VARCHAR with FK
-- Updated: is_public column moved after updated_at to match dev database order
-- Changes in v1.4.0:
-- - Removed visibility flags: is_visible_area_specs, is_visible_industry_specs, is_visible_key_features, is_visible_overview from app.products
-- - Removed JSONB fields: area_specifics, industry_specifics, key_features, product_overview from app.product_translations
-- Changes in v1.5.0:
-- - Added app.regions table for application regions management
-- Changes in v1.5.1:
-- - Added FOREIGN KEY constraint fk_price_lists_info_region on app.price_lists_info.region -> app.regions.region_name with ON DELETE SET NULL
-- Changes in v1.5.2:
-- - Added FOREIGN KEY constraint fk_users_location_region on app.users.location -> app.regions.region_name with ON DELETE SET NULL
-- Changes in v1.6.0:
-- Changes in v1.7.0:
-- - Added app.taxable_categories table for application taxable categories management
-- Changes in v1.8.0:
-- - Added app.regions_taxable_categories junction table for linking regions with taxable categories
-- Changes in v1.9.0:
-- - Added vat_rate column to app.regions_taxable_categories table for storing VAT rate (0-99%) per regional category
-- - Added CHECK constraint to validate vat_rate range (0-99 or NULL)
-- - Updated table and column comments to reflect VAT rate storage functionality
-- Changes in v1.10.0:
-- - Added taxable_category column to app.products table for linking products with taxable categories
-- - Added FOREIGN KEY constraint fk_products_taxable_category on app.products.taxable_category -> app.taxable_categories.category_id with ON DELETE SET NULL
-- Changes in v1.11.0:
-- - Added app.product_regions junction table for linking products with regions (product availability in regions)
-- Changes in v1.12.0:
-- - Added taxable_category_id column to app.product_regions table for linking products with taxable categories per region
-- - Added composite FOREIGN KEY constraint fk_product_regions_region_category on (region_id, taxable_category_id) -> app.regions_taxable_categories(region_id, category_id) with ON DELETE SET NULL
-- - Removed taxable_category column from app.products table (moved to app.product_regions for regional assignment)
-- - Removed FOREIGN KEY constraint fk_products_taxable_category from app.products

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
    mobile_phone VARCHAR(15),
    gender app.gender,
    location VARCHAR(50),
    is_system BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT unique_user_name UNIQUE (username),
    CONSTRAINT unique_email UNIQUE (email),
    CONSTRAINT unique_mobile_phone UNIQUE (mobile_phone)
);


-- Create groups table
CREATE TABLE IF NOT EXISTS app.groups (
    group_id UUID PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL,
    group_status app.group_status NOT NULL DEFAULT 'active'::app.group_status,
    group_owner UUID NOT NULL REFERENCES app.users(user_id),
    is_system BOOLEAN NOT NULL DEFAULT false,
    group_description TEXT,
    group_email VARCHAR(255),
    group_created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    group_created_by UUID NOT NULL REFERENCES app.users(user_id),
    group_modified_at TIMESTAMP WITH TIME ZONE,
    group_modified_by UUID REFERENCES app.users(user_id),
    CONSTRAINT unique_group_name UNIQUE (group_name),
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
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_public BOOLEAN DEFAULT FALSE,
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

-- Create products table
CREATE TABLE IF NOT EXISTS app.products (
  product_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code     VARCHAR(150) UNIQUE,
  translation_key  VARCHAR(150) NOT NULL UNIQUE,

  -- Publication flag
  is_published     BOOLEAN NOT NULL DEFAULT false,

  -- Visibility flags
  is_visible_owner              BOOLEAN NOT NULL DEFAULT false,
  is_visible_groups             BOOLEAN NOT NULL DEFAULT false,
  is_visible_tech_specs         BOOLEAN NOT NULL DEFAULT false,
  is_visible_long_description   BOOLEAN NOT NULL DEFAULT false,

  -- Product status
  status_code                   app.product_status NOT NULL DEFAULT 'draft'::app.product_status,

  -- Audit
  created_by      UUID NOT NULL DEFAULT '00000000-0000-0000-0000-00000000dead',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by      UUID,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Relations
  FOREIGN KEY (created_by) REFERENCES app.users(user_id) ON DELETE SET DEFAULT,
  FOREIGN KEY (updated_by) REFERENCES app.users(user_id) ON DELETE SET NULL
);

CREATE TRIGGER tgr_products_set_updated_at
BEFORE UPDATE ON app.products
FOR EACH ROW EXECUTE FUNCTION app.tgr_set_updated_at();

-- Product-to-region link (product availability in regions)
CREATE TABLE IF NOT EXISTS app.product_regions (
    product_id UUID NOT NULL,
    region_id INTEGER NOT NULL,
    taxable_category_id INTEGER NULL,
    
    -- Audit
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Primary key
    PRIMARY KEY (product_id, region_id),
    
    -- Foreign keys
    CONSTRAINT fk_product_regions_product 
        FOREIGN KEY (product_id) 
        REFERENCES app.products(product_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_product_regions_region 
        FOREIGN KEY (region_id) 
        REFERENCES app.regions(region_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_product_regions_region_category 
        FOREIGN KEY (region_id, taxable_category_id) 
        REFERENCES app.regions_taxable_categories(region_id, category_id) 
        ON DELETE SET NULL,
    CONSTRAINT fk_product_regions_created_by 
        FOREIGN KEY (created_by) 
        REFERENCES app.users(user_id) 
        ON DELETE RESTRICT,
    CONSTRAINT fk_product_regions_updated_by 
        FOREIGN KEY (updated_by) 
        REFERENCES app.users(user_id) 
        ON DELETE SET NULL
);

-- Add comments for product_regions table
COMMENT ON TABLE app.product_regions IS 'Junction table linking products with regions - each product can be available in multiple regions. Stores taxable category assignment per region.';
COMMENT ON COLUMN app.product_regions.product_id IS 'Reference to app.products.product_id';
COMMENT ON COLUMN app.product_regions.region_id IS 'Reference to app.regions.region_id';
COMMENT ON COLUMN app.product_regions.taxable_category_id IS 'Reference to app.taxable_categories.category_id for this product in this region. NULL if no category assigned. Must exist in app.regions_taxable_categories for the same region_id.';
COMMENT ON COLUMN app.product_regions.created_by IS 'User who created the product-region association (required, no default - backend must provide valid user UUID)';
COMMENT ON COLUMN app.product_regions.created_at IS 'Timestamp when the product-region association was created';
COMMENT ON COLUMN app.product_regions.updated_by IS 'User who last updated the product-region association';
COMMENT ON COLUMN app.product_regions.updated_at IS 'Timestamp when the product-region association was last updated';
COMMENT ON CONSTRAINT fk_product_regions_product ON app.product_regions IS 
    'Foreign key to app.products.product_id with CASCADE delete - when product is deleted, all region associations are automatically deleted';
COMMENT ON CONSTRAINT fk_product_regions_region ON app.product_regions IS 
    'Foreign key to app.regions.region_id with CASCADE delete - when region is deleted, all product associations are automatically deleted';
COMMENT ON CONSTRAINT fk_product_regions_region_category ON app.product_regions IS 
    'Composite foreign key to app.regions_taxable_categories(region_id, category_id) with ON DELETE SET NULL. Ensures that the assigned category is available in the product region. When the category-region binding is deleted, taxable_category_id is automatically set to NULL.';
COMMENT ON CONSTRAINT fk_product_regions_created_by ON app.product_regions IS 
    'Foreign key to app.users.user_id with RESTRICT delete - prevents deletion of user who created the association';

-- ===========================================
-- Pricing core tables
-- ===========================================

-- Currencies dictionary (PK = ISO code)
CREATE TABLE IF NOT EXISTS app.currencies (
  code           CHAR(3) PRIMARY KEY,
  name           VARCHAR(50) NOT NULL,
  symbol         VARCHAR(3) NOT NULL,
  rounding_precision SMALLINT NOT NULL DEFAULT 2,
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ,
  CONSTRAINT chk_currencies_rounding_precision CHECK (rounding_precision BETWEEN 0 AND 8)
);

COMMENT ON TABLE app.currencies IS 'Currency dictionary - rounding logic handled by backend based on currency code';
COMMENT ON COLUMN app.currencies.code IS 'ISO 4217 currency code (3 letters)';
COMMENT ON COLUMN app.currencies.symbol IS 'Currency symbol for UI display (max 3 characters, required)';

-- Seed base currencies (idempotent)
INSERT INTO app.currencies (code, name, symbol, rounding_precision, active)
VALUES
  ('RUB', 'Российский рубль',      '₽', 2, true),
  ('BYN', 'Белорусский рубль',     'Br', 2, true),
  ('KZT', 'Казахстанский тенге',   '₸', 2, true),
  ('CNY', 'Китайский юань',        '¥', 2, true),
  ('USD', 'Доллар США',            '$', 2, true),
  ('EUR', 'Евро',                  '€', 2, true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  symbol = EXCLUDED.symbol,
  rounding_precision = EXCLUDED.rounding_precision,
  active = EXCLUDED.active,
  updated_at = now();

-- Regions reference table
CREATE TABLE IF NOT EXISTS app.regions (
    region_id SERIAL PRIMARY KEY,
    region_name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

COMMENT ON TABLE app.regions IS 'Application regions reference table - stores all available regions';
COMMENT ON COLUMN app.regions.region_id IS 'Unique identifier for the region (auto-increment)';
COMMENT ON COLUMN app.regions.region_name IS 'Region name (unique, matches values from app.regions setting)';
COMMENT ON COLUMN app.regions.created_at IS 'Timestamp when region was created';
COMMENT ON COLUMN app.regions.updated_at IS 'Timestamp when region was last updated';

-- Taxable categories reference table
CREATE TABLE IF NOT EXISTS app.taxable_categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

COMMENT ON TABLE app.taxable_categories IS 'Application taxable categories reference table - stores all available tax categories';
COMMENT ON COLUMN app.taxable_categories.category_id IS 'Unique identifier for the category (auto-increment)';
COMMENT ON COLUMN app.taxable_categories.category_name IS 'Category name';
COMMENT ON COLUMN app.taxable_categories.created_at IS 'Timestamp when category was created';
COMMENT ON COLUMN app.taxable_categories.updated_at IS 'Timestamp when category was last updated';

-- Regions taxable categories junction table
CREATE TABLE IF NOT EXISTS app.regions_taxable_categories (
    region_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    vat_rate SMALLINT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    PRIMARY KEY (region_id, category_id),
    CONSTRAINT fk_regions_taxable_categories_region 
        FOREIGN KEY (region_id) 
        REFERENCES app.regions(region_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_regions_taxable_categories_category 
        FOREIGN KEY (category_id) 
        REFERENCES app.taxable_categories(category_id) 
        ON DELETE CASCADE,
    CONSTRAINT chk_regions_taxable_categories_vat_rate 
        CHECK (vat_rate IS NULL OR (vat_rate >= 0 AND vat_rate <= 99))
);

COMMENT ON TABLE app.regions_taxable_categories IS 'Junction table linking regions with taxable categories - each region can have multiple taxable categories. Stores VAT rate (0-99%) for each regional category combination.';
COMMENT ON COLUMN app.regions_taxable_categories.region_id IS 'Reference to app.regions.region_id';
COMMENT ON COLUMN app.regions_taxable_categories.category_id IS 'Reference to app.taxable_categories.category_id';
COMMENT ON COLUMN app.regions_taxable_categories.vat_rate IS 'VAT rate in percent (0-99) assigned to this regional category. NULL means no rate assigned yet.';
COMMENT ON COLUMN app.regions_taxable_categories.created_at IS 'Timestamp when the binding was created';
COMMENT ON COLUMN app.regions_taxable_categories.updated_at IS 'Timestamp when the binding was last updated';
COMMENT ON CONSTRAINT fk_regions_taxable_categories_region ON app.regions_taxable_categories IS 
    'Foreign key to app.regions.region_id with CASCADE delete - when region is deleted, all bindings are automatically deleted';
COMMENT ON CONSTRAINT fk_regions_taxable_categories_category ON app.regions_taxable_categories IS 
    'Foreign key to app.taxable_categories.category_id with CASCADE delete - when category is deleted, all bindings are automatically deleted';

-- Add foreign key constraint for app.users.location -> app.regions.region_name
-- This constraint ensures data integrity: user locations must reference valid regions
-- When a region is deleted, user locations referencing it are automatically set to NULL
ALTER TABLE app.users
ADD CONSTRAINT fk_users_location_region
    FOREIGN KEY (location)
    REFERENCES app.regions(region_name)
    ON DELETE SET NULL;

COMMENT ON CONSTRAINT fk_users_location_region ON app.users IS 
    'Foreign key constraint: app.users.location references app.regions.region_name. When a region is deleted, user locations are automatically set to NULL.';

-- Ensure product_code is suitable for FK (not null + unique)
ALTER TABLE app.products
  ALTER COLUMN product_code SET NOT NULL;

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
    published_by UUID NOT NULL REFERENCES app.users(user_id) ON DELETE RESTRICT,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (section_id, product_id)
);

-- Add table and column comments
COMMENT ON TABLE app.section_products IS 'Relationships between catalog sections and products (product publication in sections)';
COMMENT ON COLUMN app.section_products.section_id IS 'Reference to catalog section';
COMMENT ON COLUMN app.section_products.product_id IS 'Reference to product';
COMMENT ON COLUMN app.section_products.published_by IS 'User who published the product to this section';
COMMENT ON COLUMN app.section_products.published_at IS 'Timestamp when product was published to this section';

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
COMMENT ON TYPE app.product_user_role IS 'User roles for products: owner';
COMMENT ON TYPE app.product_group_role IS 'Group roles for products: product_specialists';
COMMENT ON COLUMN app.product_users.role_type IS 'Role type for the user in this product';
COMMENT ON COLUMN app.product_groups.role_type IS 'Role type for the group in this product';

-- ============================================
-- Pricing: Price Lists Structure
-- ============================================

-- Reference table for price item types (customizable by users)
CREATE TABLE IF NOT EXISTS app.price_item_types (
    type_code VARCHAR(50) PRIMARY KEY,
    type_name VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE app.price_item_types IS 'Reference table for price list item types - customizable by users';
COMMENT ON COLUMN app.price_item_types.type_code IS 'Unique code for item type (e.g., product, work_hour)';
COMMENT ON COLUMN app.price_item_types.type_name IS 'Display name for the item type';
COMMENT ON COLUMN app.price_item_types.description IS 'Detailed description of the item type';
COMMENT ON COLUMN app.price_item_types.is_active IS 'Whether this item type is currently active';

-- Insert initial price item types
INSERT INTO app.price_item_types (type_code, type_name, description) VALUES
('product', 'Product', 'Physical or digital product'),
('work_hour', 'Work Hour', 'Hourly rate for professional services'),
('standard_activity', 'Standard Activity', 'Predefined standardized activity with fixed scope'),
('service_subscription', 'Service Subscription', 'Recurring subscription fee for service access')
ON CONFLICT (type_code) DO NOTHING;

-- Price list metadata/headers
CREATE TABLE IF NOT EXISTS app.price_lists_info (
    price_list_id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description VARCHAR(2000),
    currency_code CHAR(3) NOT NULL,
    is_active BOOLEAN DEFAULT FALSE NOT NULL,
    owner_id UUID,
    region VARCHAR(255) NULL,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Foreign keys
    CONSTRAINT fk_price_lists_currency_code 
        FOREIGN KEY (currency_code) 
        REFERENCES app.currencies(code) 
        ON DELETE RESTRICT,
    
    CONSTRAINT fk_price_lists_owner_id 
        FOREIGN KEY (owner_id) 
        REFERENCES app.users(user_id) 
        ON DELETE SET NULL,
    
    CONSTRAINT fk_price_lists_created_by 
        FOREIGN KEY (created_by) 
        REFERENCES app.users(user_id) 
        ON DELETE SET NULL,
    
    CONSTRAINT fk_price_lists_updated_by 
        FOREIGN KEY (updated_by) 
        REFERENCES app.users(user_id) 
        ON DELETE SET NULL,
    
    CONSTRAINT fk_price_lists_info_region 
        FOREIGN KEY (region) 
        REFERENCES app.regions(region_name) 
        ON DELETE SET NULL
);

COMMENT ON TABLE app.price_lists_info IS 'Metadata for price lists - headers/info about each price list';
COMMENT ON COLUMN app.price_lists_info.price_list_id IS 'Unique identifier for the price list';
COMMENT ON COLUMN app.price_lists_info.name IS 'Unique name of the price list';
COMMENT ON COLUMN app.price_lists_info.description IS 'User description/notes about the price list';
COMMENT ON COLUMN app.price_lists_info.currency_code IS 'Currency for all prices in this price list';
COMMENT ON COLUMN app.price_lists_info.is_active IS 'Whether this price list is currently active';
COMMENT ON COLUMN app.price_lists_info.owner_id IS 'Price list owner (optional, can be different from created_by)';
COMMENT ON COLUMN app.price_lists_info.region IS 'Region assigned to this price list. References app.regions.region_name. Each region can be assigned to only one price list. NULL values are allowed. Automatically set to NULL when referenced region is deleted.';

-- Price list items (partitioned by price_list_id)
CREATE TABLE IF NOT EXISTS app.price_lists (
    item_id BIGSERIAL NOT NULL,
    price_list_id INTEGER NOT NULL,
    item_type VARCHAR(50) NOT NULL,
    item_code VARCHAR(64) NOT NULL,
    item_name VARCHAR(200),
    list_price NUMERIC(20,8) NOT NULL,
    wholesale_price NUMERIC(20,8),
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Primary key includes partition key
    PRIMARY KEY (price_list_id, item_id),
    
    -- Unique constraint: one item per price list
    CONSTRAINT uq_price_list_item 
        UNIQUE (price_list_id, item_type, item_code),
    
    -- Foreign keys
    CONSTRAINT fk_price_lists_price_list_id 
        FOREIGN KEY (price_list_id) 
        REFERENCES app.price_lists_info(price_list_id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_price_lists_item_type 
        FOREIGN KEY (item_type) 
        REFERENCES app.price_item_types(type_code) 
        ON DELETE RESTRICT,
    
    CONSTRAINT fk_price_lists_created_by 
        FOREIGN KEY (created_by) 
        REFERENCES app.users(user_id) 
        ON DELETE SET NULL,
    
    CONSTRAINT fk_price_lists_updated_by 
        FOREIGN KEY (updated_by) 
        REFERENCES app.users(user_id) 
        ON DELETE SET NULL,
    
    -- Check constraints
    CONSTRAINT chk_list_price_positive 
        CHECK (list_price >= 0),
    
    CONSTRAINT chk_wholesale_price_positive 
        CHECK (wholesale_price IS NULL OR wholesale_price >= 0)
        
) PARTITION BY LIST (price_list_id);

COMMENT ON TABLE app.price_lists IS 'Price list items - partitioned by price_list_id for isolation and performance';
COMMENT ON COLUMN app.price_lists.item_id IS 'Auto-incrementing unique identifier (sequential across all partitions)';
COMMENT ON COLUMN app.price_lists.price_list_id IS 'Reference to price list metadata (partition key)';
COMMENT ON COLUMN app.price_lists.item_type IS 'Type of item (product, service, work_hour, etc.)';
COMMENT ON COLUMN app.price_lists.item_code IS 'Code to match against product_code, service_code, or activity_code';
COMMENT ON COLUMN app.price_lists.item_name IS 'Optional display name for the item';
COMMENT ON COLUMN app.price_lists.list_price IS 'Standard list price (NUMERIC(20,8) supports all currencies including Bitcoin)';
COMMENT ON COLUMN app.price_lists.wholesale_price IS 'Wholesale/bulk price (for future use)';