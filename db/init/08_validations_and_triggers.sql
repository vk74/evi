-- Version: 1.7.0
-- Description: Database validation functions and triggers for business logic enforcement.
-- Backend file: 08_validations_and_triggers.sql
-- 
-- This script contains validation functions and triggers that enforce business rules
-- and data integrity constraints beyond basic foreign key relationships.
-- Executed BEFORE app_settings data insertion to ensure validation is active during initial load.
--
-- Changes in v1.2.0:
-- - Added validation for country-pricelist mapping setting
-- - Validates country names against app.app_countries enum
-- - Validates pricelist IDs are integers >= 1
--
-- Changes in v1.2.1:
-- - Fixed language validation to use app.system_language_code (app.app_languages was removed)
--
-- Changes in v1.2.2:
-- - Removed enum validation for default.language setting
-- - Now validates against allowed.languages setting or simple string validation for 'english'/'russian'
--
-- Changes in v1.3.0:
-- - Added trigger for automatic updated_at update on app.regions table
--
-- Changes in v1.5.0:
-- - Removed validation for current.country setting (setting removed from app.settings)
--
-- Changes in v1.6.0:
-- - Added trigger for automatic updated_at update on app.taxable_categories table
--
-- Changes in v1.7.0:
-- - Added trigger for automatic updated_at update on app.regions_taxable_categories table

-- ============================================
-- Regional Settings Validation
-- ============================================

-- Function to validate regional settings values against enum types
CREATE OR REPLACE FUNCTION app.validate_regional_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate timezone setting
  IF NEW.setting_name = 'current.timezone' THEN
    -- Check if value (removing quotes) is a valid timezone enum value
    IF NOT (NEW.value #>> '{}')::app.timezones IS NOT NULL THEN
      RAISE EXCEPTION 'Invalid timezone value: %. Must be one of the app.timezones enum values', NEW.value;
    END IF;
  END IF;

  -- Validate language setting
  IF NEW.setting_name = 'default.language' THEN
    -- Check if value (removing quotes) is a valid language value
    DECLARE
      lang_value TEXT;
    BEGIN
      lang_value := NEW.value #>> '{}';
      IF lang_value NOT IN ('english', 'russian') THEN
        RAISE EXCEPTION 'Invalid language value: %. Must be one of: english, russian', lang_value;
      END IF;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate regional settings before insert or update
CREATE TRIGGER validate_regional_settings_trigger
  BEFORE INSERT OR UPDATE ON app.app_settings
  FOR EACH ROW
  WHEN (
    NEW.section_path = 'Application.RegionalSettings' AND
    NEW.setting_name IN ('current.timezone', 'default.language')
  )
  EXECUTE FUNCTION app.validate_regional_settings();

-- ============================================
-- Additional validation functions can be added here
-- ============================================

-- ============================================
-- Pricing: Auto-update triggers for updated_at
-- ============================================

CREATE OR REPLACE FUNCTION app.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION app.update_updated_at_column() IS 
    'Generic trigger function to automatically update updated_at timestamp on row UPDATE';

-- Apply trigger to price_item_types
DO $$ BEGIN
  CREATE TRIGGER trg_price_item_types_updated_at
      BEFORE UPDATE ON app.price_item_types
      FOR EACH ROW
      EXECUTE FUNCTION app.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Apply trigger to price_lists_info
DO $$ BEGIN
  CREATE TRIGGER trg_price_lists_info_updated_at
      BEFORE UPDATE ON app.price_lists_info
      FOR EACH ROW
      EXECUTE FUNCTION app.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Apply trigger to price_lists
DO $$ BEGIN
  CREATE TRIGGER trg_price_lists_updated_at
      BEFORE UPDATE ON app.price_lists
      FOR EACH ROW
      EXECUTE FUNCTION app.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Apply trigger to regions
DO $$ BEGIN
  CREATE TRIGGER trg_regions_updated_at
      BEFORE UPDATE ON app.regions
      FOR EACH ROW
      EXECUTE FUNCTION app.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- Apply trigger to taxable_categories
DO $$ BEGIN
  CREATE TRIGGER trg_taxable_categories_updated_at
      BEFORE UPDATE ON app.taxable_categories
      FOR EACH ROW
      EXECUTE FUNCTION app.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Apply trigger to regions_taxable_categories
DO $$ BEGIN
  CREATE TRIGGER trg_regions_taxable_categories_updated_at
      BEFORE UPDATE ON app.regions_taxable_categories
      FOR EACH ROW
      EXECUTE FUNCTION app.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ============================================
-- Pricing: Automatic partition creation
-- ============================================

CREATE OR REPLACE FUNCTION app.create_price_list_partition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Create partition for the new price list
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS app.price_lists_%s 
         PARTITION OF app.price_lists 
         FOR VALUES IN (%s)',
        NEW.price_list_id,
        NEW.price_list_id
    );
    
    RAISE NOTICE 'Created partition app.price_lists_% for price list %', 
        NEW.price_list_id, NEW.name;
    
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION app.create_price_list_partition() IS 
    'Automatically creates a partition when a new price list is inserted into price_lists_info';

-- Trigger to create partition after inserting into price_lists_info
DO $$ BEGIN
  CREATE TRIGGER trg_create_price_list_partition
      AFTER INSERT ON app.price_lists_info
      FOR EACH ROW
      EXECUTE FUNCTION app.create_price_list_partition();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- Pricing: Automatic partition deletion
-- ============================================

CREATE OR REPLACE FUNCTION app.drop_price_list_partition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Drop partition for the deleted price list
    -- Use IF EXISTS to avoid errors if partition doesn't exist
    EXECUTE format(
        'DROP TABLE IF EXISTS app.price_lists_%s',
        OLD.price_list_id
    );
    
    RAISE NOTICE 'Dropped partition app.price_lists_% for price list % (ID: %)', 
        OLD.price_list_id, OLD.name, OLD.price_list_id;
    
    RETURN OLD;
END;
$$;

COMMENT ON FUNCTION app.drop_price_list_partition() IS 
    'Automatically drops a partition when a price list is deleted from price_lists_info';

-- Trigger to drop partition before deleting from price_lists_info
DO $$ BEGIN
  CREATE TRIGGER trg_drop_price_list_partition
      BEFORE DELETE ON app.price_lists_info
      FOR EACH ROW
      EXECUTE FUNCTION app.drop_price_list_partition();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;



