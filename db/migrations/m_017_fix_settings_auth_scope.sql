-- Migration: 017_fix_settings_auth_scope
-- Description: Fixes settings authorization scope. Separates 'system' settings (Application.*) from 'adminOrg' settings.
-- Assigns system settings management strictly to sysadmins.

-- 1. Create permissions for System Settings (Application.*, Work, etc.)
INSERT INTO app.permissions (permission_key, module, description) VALUES
('system:settings:read:all', 'system', 'Read system-wide settings'),
('system:settings:update:all', 'system', 'Update system-wide settings')
ON CONFLICT (permission_key) DO NOTHING;

-- 2. Grant System Permissions to Sysadmins
DO $$
DECLARE
    sys_user_id UUID := '550e8400-e29b-41d4-a716-446655440001';
    g_sysadmin UUID;
BEGIN
    SELECT group_id INTO g_sysadmin FROM app.groups WHERE group_name = 'sysadmins';

    IF g_sysadmin IS NOT NULL THEN
        INSERT INTO app.group_permissions (group_id, permission_key, granted_by) VALUES
        (g_sysadmin, 'system:settings:read:all', sys_user_id),
        (g_sysadmin, 'system:settings:update:all', sys_user_id)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 3. Ensure 'adminOrg' DOES NOT have system permissions (just in case they were wrongly inferred, though they weren't granted in DB previously)
-- No explicit revoke needed as we never granted 'system:settings' to adminOrg. 
-- The previous issue was in the Guard logic mapping, not DB grants.

-- 4. Map 'settings:read:common' to Registered Users (Already done in m_016, keeping it for basic read access)
-- Note: settings:read:common will be used for 'read' operations on system settings for regular users if we decide so,
-- BUT for 'update', we will strictly require 'system:settings:update:all'.