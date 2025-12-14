-- Version: 1.0
-- Description: Rename section_path for product settings from 'Catalog.Products' to 'Admin.Products'
-- Backend file: 002_rename_catalog_products_to_admin_products.sql
-- 
-- This migration renames the section_path for product-related settings in app.app_settings table.
-- Affected settings:
-- - display.optionsOnlyProducts
-- - card.color
-- - product.card.default.section
-- 
-- The settings will be moved from 'Catalog.Products' section to 'Admin.Products' section.
-- setting_name values remain unchanged.

UPDATE app.app_settings
SET section_path = 'Admin.Products'
WHERE section_path = 'Catalog.Products';

