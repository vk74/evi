-- Migration: 010_rename_admincatalog_to_adminservices
-- Description: Renames section_path for service settings from 'AdminCatalog' to 'AdminServices'
-- 
-- This migration renames the section_path for service-related settings in app.app_settings table.
-- Affected settings:
-- - card.color
-- 
-- The settings will be moved from 'AdminCatalog' section to 'AdminServices' section.
-- setting_name values remain unchanged.

UPDATE app.app_settings
SET section_path = 'AdminServices'
WHERE section_path = 'AdminCatalog';

