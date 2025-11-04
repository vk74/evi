-- Version: 1.2.0
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

  -- Validate country setting
  IF NEW.setting_name = 'current.country' THEN
    -- Check if value (removing quotes) is a valid country enum value
    IF NOT (NEW.value #>> '{}')::app.app_countries IS NOT NULL THEN
      RAISE EXCEPTION 'Invalid country value: %. Must be one of the app.app_countries enum values', NEW.value;
    END IF;
  END IF;

  -- Validate language setting
  IF NEW.setting_name = 'default.language' THEN
    -- Check if value (removing quotes) is a valid language enum value
    IF NOT (NEW.value #>> '{}')::app.app_languages IS NOT NULL THEN
      RAISE EXCEPTION 'Invalid language value: %. Must be one of the app.app_languages enum values', NEW.value;
    END IF;
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
    NEW.setting_name IN ('current.timezone', 'current.country', 'default.language')
  )
  EXECUTE FUNCTION app.validate_regional_settings();

-- ============================================
-- Country Pricelist Mapping Validation
-- ============================================

-- Function to validate country-pricelist mapping values
CREATE OR REPLACE FUNCTION app.validate_country_pricelist_mapping(mapping JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  country_key TEXT;
  valid_countries TEXT[];
BEGIN
  -- Handle empty object case
  IF mapping IS NULL OR jsonb_typeof(mapping) = 'null' THEN
    RETURN TRUE;
  END IF;

  -- Get all valid country values from enum
  SELECT ARRAY(
    SELECT enumlabel::TEXT 
    FROM pg_enum 
    WHERE enumtypid = 'app.app_countries'::regtype
    ORDER BY enumlabel
  ) INTO valid_countries;
  
  -- Check each key in mapping
  FOR country_key IN SELECT jsonb_object_keys(mapping)
  LOOP
    -- Validate country name exists in enum
    IF NOT (country_key = ANY(valid_countries)) THEN
      RAISE EXCEPTION 'Invalid country name: %. Must be one of: %', 
        country_key, array_to_string(valid_countries, ', ');
    END IF;
    
    -- Check value is integer >= 1
    IF NOT (jsonb_typeof(mapping->country_key) = 'number' 
            AND (mapping->country_key)::int >= 1) THEN
      RAISE EXCEPTION 'Invalid pricelist ID for country %. Must be an integer >= 1', country_key;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION app.validate_country_pricelist_mapping(JSONB) IS 
    'Validates that country-pricelist mapping contains only valid country names from app.app_countries enum and valid pricelist IDs (>= 1)';

-- Create trigger function for validation
CREATE OR REPLACE FUNCTION app.validate_country_pricelist_mapping_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.setting_name = 'country.product.price.list.mapping' THEN
    PERFORM app.validate_country_pricelist_mapping(NEW.value);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION app.validate_country_pricelist_mapping_trigger() IS 
    'Trigger function to validate country-pricelist mapping before insert or update';

-- Trigger to validate before insert or update
CREATE TRIGGER validate_country_pricelist_mapping_trigger
  BEFORE INSERT OR UPDATE ON app.app_settings
  FOR EACH ROW
  WHEN (NEW.setting_name = 'country.product.price.list.mapping')
  EXECUTE FUNCTION app.validate_country_pricelist_mapping_trigger();

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



