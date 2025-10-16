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
-- Pricing: DML guard for archived price lists
-- ============================================

CREATE OR REPLACE FUNCTION app.price_list_dml_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_status app.price_list_status;
BEGIN
  SELECT status INTO v_status
  FROM app.price_lists_info
  WHERE price_list_id = COALESCE(NEW.price_list_id, OLD.price_list_id)
  FOR SHARE;

  IF v_status = 'archived' THEN
    RAISE EXCEPTION 'Price list % is archived: DML is not allowed', COALESCE(NEW.price_list_id, OLD.price_list_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_price_list_guard_ins BEFORE INSERT ON app.price_list
  FOR EACH ROW EXECUTE FUNCTION app.price_list_dml_guard();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_price_list_guard_upd BEFORE UPDATE ON app.price_list
  FOR EACH ROW EXECUTE FUNCTION app.price_list_dml_guard();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_price_list_guard_del BEFORE DELETE ON app.price_list
  FOR EACH ROW EXECUTE FUNCTION app.price_list_dml_guard();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- Pricing: currency scale/rounding check
-- ============================================

CREATE OR REPLACE FUNCTION app.price_list_currency_scale_check()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_minor smallint;
BEGIN
  SELECT c.minor_units INTO v_minor
  FROM app.price_lists_info pli
  JOIN app.currencies c ON c.code = pli.currency_code
  WHERE pli.price_list_id = NEW.price_list_id;

  IF v_minor IS NULL THEN
    RAISE EXCEPTION 'Currency for price_list_id % not found', NEW.price_list_id;
  END IF;

  NEW.list_price := round(NEW.list_price, v_minor);
  IF NEW.list_price < 0 THEN
    RAISE EXCEPTION 'list_price must be >= 0';
  END IF;
  RETURN NEW;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_price_list_scale_ins BEFORE INSERT ON app.price_list
  FOR EACH ROW EXECUTE FUNCTION app.price_list_currency_scale_check();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_price_list_scale_upd BEFORE UPDATE OF list_price ON app.price_list
  FOR EACH ROW EXECUTE FUNCTION app.price_list_currency_scale_check();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- Pricing: partition creation function and trigger
-- ============================================

CREATE OR REPLACE FUNCTION app.pricing_create_price_list_partition_typed(p_price_list_id integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app, public
AS $$
DECLARE
  v_parent_name  text := format('price_list_p_%s', p_price_list_id);
  v_prod_name    text := format('price_list_p_%s_product', p_price_list_id);
  v_serv_name    text := format('price_list_p_%s_service', p_price_list_id);
  v_exists       boolean;
BEGIN
  SELECT exists (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'app' AND c.relname = v_parent_name
  ) INTO v_exists;

  IF v_exists THEN
    RETURN;
  END IF;

  EXECUTE format(
    'create table app.%I partition of app.price_list for values in (%s) partition by list (item_type)',
    v_parent_name, p_price_list_id
  );

  EXECUTE format(
    'create table app.%I partition of app.%I for values in (''product'')',
    v_prod_name, v_parent_name
  );

  EXECUTE format(
    'alter table app.%I add constraint %I check (item_type=''product'')',
    v_prod_name, format('ck_%s_item_type_product', v_prod_name)
  );

  EXECUTE format(
    'alter table app.%I add constraint %I foreign key (product_code) references app.products(product_code) on update restrict on delete restrict',
    v_prod_name, format('fk_%s_product_code', v_prod_name)
  );

  EXECUTE format(
    'create index %I on app.%I (product_code)',
    format('idx_%s_product_code', v_prod_name), v_prod_name
  );

  EXECUTE format(
    'create table app.%I partition of app.%I for values in (''service'')',
    v_serv_name, v_parent_name
  );

  EXECUTE format(
    'alter table app.%I add constraint %I check (item_type=''service'')',
    v_serv_name, format('ck_%s_item_type_service', v_serv_name)
  );

  EXECUTE format(
    'create index %I on app.%I (product_code)',
    format('idx_%s_product_code', v_serv_name), v_serv_name
  );
END;
$$;

CREATE OR REPLACE FUNCTION app.price_lists_info_after_insert_partition()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM app.pricing_create_price_list_partition_typed(NEW.price_list_id);
  RETURN NEW;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_price_lists_info_after_insert
  AFTER INSERT ON app.price_lists_info
  FOR EACH ROW EXECUTE FUNCTION app.price_lists_info_after_insert_partition();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
