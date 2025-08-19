-- Version: 1.0
-- Description: Create all indexes
-- Backend file: init_indexes

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

-- Create indexes for products
CREATE INDEX IF NOT EXISTS idx_products_category ON app.products USING btree (product_category);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON app.products USING btree (product_created_at);
CREATE INDEX IF NOT EXISTS idx_products_public ON app.products USING btree (product_is_public);
CREATE INDEX IF NOT EXISTS idx_products_sku ON app.products USING btree (product_sku);
CREATE INDEX IF NOT EXISTS idx_products_specifications ON app.products USING gin (product_specifications);
CREATE INDEX IF NOT EXISTS idx_products_status ON app.products USING btree (product_status);
CREATE INDEX IF NOT EXISTS product_code ON app.products USING btree (product_code);

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
