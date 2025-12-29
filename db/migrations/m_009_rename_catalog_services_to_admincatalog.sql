-- Migration: 009_rename_catalog_services_to_admincatalog
-- Description: Renames section_path for service settings from 'Catalog.Services' to 'AdminCatalog'
-- 
-- This migration renames the section_path for service-related settings in app.app_settings table.
-- Affected settings:
-- - card.color
-- 
-- The settings will be moved from 'Catalog.Services' section to 'AdminCatalog' section.
-- setting_name values remain unchanged.

UPDATE app.app_settings
SET section_path = 'AdminCatalog'
WHERE section_path = 'Catalog.Services';

