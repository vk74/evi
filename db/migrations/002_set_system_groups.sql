-- Version: 1.2.1
-- Description: Set is_system=true for specific groups (SystemAdministrators and chushpanchiki)
-- Backend file: 002_set_system_groups.sql

-- Set is_system=true for groups with specified names
UPDATE app.groups
SET is_system = true
WHERE group_name IN ('SystemAdministrators', 'chushpanchiki');
