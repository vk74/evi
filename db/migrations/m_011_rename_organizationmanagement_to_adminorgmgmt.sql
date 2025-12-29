-- Migration: 011_rename_organizationmanagement_to_adminorgmgmt
-- Description: Renames section_path for organization management settings from 'OrganizationManagement.GroupsManagement' and 'OrganizationManagement.RegistrationPage' to 'AdminOrgMgmt'
-- 
-- This migration renames the section_path for organization management settings in app.app_settings table.
-- Affected settings:
-- - add.only.active.users.to.groups (from OrganizationManagement.GroupsManagement)
-- - registration.page.enabled (from OrganizationManagement.RegistrationPage)
-- 
-- Both settings will be moved to 'AdminOrgMgmt' section.
-- setting_name values remain unchanged.

UPDATE app.app_settings
SET section_path = 'AdminOrgMgmt'
WHERE section_path = 'OrganizationManagement.GroupsManagement'
   OR section_path = 'OrganizationManagement.RegistrationPage';

