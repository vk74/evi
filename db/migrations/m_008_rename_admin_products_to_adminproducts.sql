-- Migration: 008_rename_admin_products_to_adminproducts
-- Description: Renames section_path for product settings from 'Admin.Products' to 'AdminProducts' (removes dot)
-- 
-- This migration renames the section_path for product-related settings in app.app_settings table.
-- Affected settings:
-- - display.optionsOnlyProducts
-- - card.color
-- - product.card.default.section
-- 
-- The settings will be moved from 'Admin.Products' section to 'AdminProducts' section.
-- setting_name values remain unchanged.

UPDATE app.app_settings
SET section_path = 'AdminProducts'
WHERE section_path = 'Admin.Products';

