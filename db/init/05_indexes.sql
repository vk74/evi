-- Version: 1.1.1
-- Description: Create all indexes for the application tables.
-- Backend file: 05_indexes.sql

-- Create indexes for app_settings
CREATE INDEX IF NOT EXISTS idx_app_sections_path ON app.app_settings USING btree (section_path);
CREATE INDEX IF NOT EXISTS idx_app_settings_environment ON app.app_settings USING btree (environment);
CREATE INDEX IF NOT EXISTS idx_app_settings_value ON app.app_settings USING gin (value);
CREATE INDEX IF NOT EXISTS idx_app_settings_is_ui ON app.app_settings USING btree (is_ui);

-- Create indexes for catalog_sections
CREATE INDEX IF NOT EXISTS idx_catalog_sections_order ON app.catalog_sections USING btree ("order");
CREATE INDEX IF NOT EXISTS idx_catalog_sections_parent ON app.catalog_sections USING btree (parent_id);
CREATE INDEX IF NOT EXISTS idx_catalog_sections_public ON app.catalog_sections USING btree (is_public);
CREATE INDEX IF NOT EXISTS idx_catalog_sections_status ON app.catalog_sections USING btree (status);

-- Create indexes for group_members
CREATE INDEX IF NOT EXISTS idx_group_members_active ON app.group_members USING btree (is_active);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON app.group_members USING btree (group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON app.group_members USING btree (user_id);

-- Create indexes for products (updated for new structure)
CREATE INDEX IF NOT EXISTS idx_products_created_at ON app.products USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_products_owner ON app.products USING btree (owner_id);
CREATE INDEX IF NOT EXISTS idx_products_published ON app.products USING btree (is_published);
CREATE INDEX IF NOT EXISTS idx_products_code ON app.products USING btree (product_code);
CREATE INDEX IF NOT EXISTS idx_products_translation_key ON app.products USING btree (translation_key);

-- Create indexes for section_products
CREATE INDEX IF NOT EXISTS idx_section_products_order ON app.section_products USING btree (product_order);
CREATE INDEX IF NOT EXISTS idx_section_products_product ON app.section_products USING btree (product_id);
CREATE INDEX IF NOT EXISTS idx_section_products_section ON app.section_products USING btree (section_id);

-- Create indexes for section_services
CREATE INDEX IF NOT EXISTS idx_section_services_order ON app.section_services USING btree (service_order);
CREATE INDEX IF NOT EXISTS idx_section_services_section ON app.section_services USING btree (section_id);
CREATE INDEX IF NOT EXISTS idx_section_services_service ON app.section_services USING btree (service_id);

-- Create indexes for service_groups
CREATE INDEX IF NOT EXISTS idx_service_groups_group_id ON app.service_groups USING btree (group_id);
CREATE INDEX IF NOT EXISTS idx_service_groups_role_type ON app.service_groups USING btree (role_type);
CREATE INDEX IF NOT EXISTS idx_service_groups_service_id ON app.service_groups USING btree (service_id);

-- Create indexes for service_users
CREATE INDEX IF NOT EXISTS idx_service_users_role_type ON app.service_users USING btree (role_type);
CREATE INDEX IF NOT EXISTS idx_service_users_service_id ON app.service_users USING btree (service_id);
CREATE INDEX IF NOT EXISTS idx_service_users_user_id ON app.service_users USING btree (user_id);

-- Create indexes for tokens
CREATE INDEX IF NOT EXISTS idx_tokens_expires_at ON app.tokens USING btree (expires_at);
CREATE INDEX IF NOT EXISTS idx_tokens_user_uuid ON app.tokens USING btree (user_uuid);

-- Create indexes for users (trigram indexes for search)
CREATE INDEX IF NOT EXISTS idx_users_email_trgm ON app.users USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_username_trgm ON app.users USING gin (username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_uuid_trgm ON app.users USING gin ((user_id::text) gin_trgm_ops);

-- Create optimized index for guard middleware queries
CREATE INDEX IF NOT EXISTS idx_users_id_active ON app.users USING btree (user_id, is_active);

-- Create indexes for services visibility preferences
CREATE INDEX IF NOT EXISTS idx_services_visibility_prefs ON app.services USING btree (
    show_owner, show_backup_owner, show_technical_owner, show_backup_technical_owner,
    show_dispatcher, show_support_tier1, show_support_tier2, show_support_tier3
);

-- ===========================================
-- Product core indexes
-- ===========================================

-- Products indexes are already defined above

-- Translations
CREATE INDEX idx_product_translations_product ON app.product_translations(product_id);
CREATE INDEX idx_product_translations_lang    ON app.product_translations(language_code);

-- Case-insensitive trigram search by name
CREATE INDEX idx_product_translations_name_trgm
  ON app.product_translations USING GIN (lower(name) gin_trgm_ops);

-- Groups reverse lookup
CREATE INDEX idx_product_groups_group      ON app.product_groups(group_id);

-- Product users indexes
CREATE INDEX idx_product_users_user        ON app.product_users(user_id);
CREATE INDEX idx_product_users_role        ON app.product_users(role_type);

-- ===========================================
-- Product Options Indexes
-- ===========================================

-- Index for main product lookups (which options does this product have)
CREATE INDEX IF NOT EXISTS idx_product_options_main_product 
    ON app.product_options USING btree (main_product_id);

-- Index for option product lookups (which products use this as option)
CREATE INDEX IF NOT EXISTS idx_product_options_option_product 
    ON app.product_options USING btree (option_product_id);

-- Index for required options queries
CREATE INDEX IF NOT EXISTS idx_product_options_required 
    ON app.product_options USING btree (main_product_id, is_required) 
    WHERE is_required = true;

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_product_options_created_at 
    ON app.product_options USING btree (created_at);