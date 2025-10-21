-- Version: 1.0.0
-- Description: Database validation functions and triggers for business logic enforcement.
-- Backend file: 08_validations_and_triggers.sql
-- 
-- This script contains validation functions and triggers that enforce business rules
-- and data integrity constraints beyond basic foreign key relationships.
-- Executed BEFORE app_settings data insertion to ensure validation is active during initial load.

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
-- Pricing: Auto-deactivation function
-- ============================================

CREATE OR REPLACE FUNCTION app.deactivate_expired_price_lists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deactivated_count INTEGER;
BEGIN
    -- Deactivate price lists that have expired
    UPDATE app.price_lists_info 
    SET 
        is_active = FALSE,
        updated_at = NOW()
    WHERE is_active = TRUE
        AND valid_to < NOW()
        AND auto_deactivate = TRUE;
    
    GET DIAGNOSTICS deactivated_count = ROW_COUNT;
    
    -- Log the result
    RAISE NOTICE 'Price lists auto-deactivation: % price lists deactivated', 
        deactivated_count;
END;
$$;

COMMENT ON FUNCTION app.deactivate_expired_price_lists() IS 
    'Deactivates expired price lists where auto_deactivate is TRUE - called by pg_cron daily';

