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
  IF NEW.setting_name = 'default.timezone' THEN
    -- Check if value (removing quotes) is a valid timezone enum value
    IF NOT (NEW.value #>> '{}')::app.timezones IS NOT NULL THEN
      RAISE EXCEPTION 'Invalid timezone value: %. Must be one of the app.timezones enum values', NEW.value;
    END IF;
  END IF;

  -- Validate country setting
  IF NEW.setting_name = 'default.country' THEN
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
    NEW.setting_name IN ('default.timezone', 'default.country', 'default.language')
  )
  EXECUTE FUNCTION app.validate_regional_settings();

-- ============================================
-- Additional validation functions can be added here
-- ============================================

