-- Migration: 012_remove_products_options_setting
-- Description: Removes products.options setting, trigger and function that are no longer used in application code
-- 
-- This migration removes:
-- - Setting 'max.options.per.product' from 'products.options' section in app.app_settings table
-- - Trigger 'trg_check_max_options_per_product' on app.product_options table
-- - Function 'app.check_max_options_per_product()' that was used by the trigger
-- 
-- The setting was only used in database trigger to limit maximum number of options per product.
-- Since it's not used in application code (frontend/backend), it's being removed.

-- Drop trigger first (if exists)
DROP TRIGGER IF EXISTS trg_check_max_options_per_product ON app.product_options;

-- Drop function (if exists)
DROP FUNCTION IF EXISTS app.check_max_options_per_product();

-- Remove setting from app_settings table
DELETE FROM app.app_settings
WHERE section_path = 'products.options'
  AND setting_name = 'max.options.per.product';

