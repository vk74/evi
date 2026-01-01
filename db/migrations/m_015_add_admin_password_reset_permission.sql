-- Migration: 015_add_admin_password_reset_permission
-- Description: Adds permission for admin password reset functionality to adminOrg module.
--              Grants permission to role.adminOrg.admin, role.adminOrg.editor, and sysadmins groups.

-- 1. Add permission for admin password reset
INSERT INTO app.permissions (permission_key, module, description) VALUES
('adminOrg:users:reset_password:all', 'adminOrg', 'Reset user password (admin function)')
ON CONFLICT (permission_key) DO NOTHING;

-- 2. Grant permission to role groups
DO $$
DECLARE
    -- Lookup system admin user ID dynamically
    sys_user_id UUID;
    
    -- Group IDs
    admin_group_id UUID;
    editor_group_id UUID;
    sysadmins_group_id UUID;
BEGIN
    -- Find the system administrator
    SELECT user_id INTO sys_user_id FROM app.users WHERE username = 'admin' LIMIT 1;
    
    -- Fallback safety check
    IF sys_user_id IS NULL THEN
        RAISE NOTICE 'System admin user not found, permission will be granted without creator reference';
    END IF;

    -- Get group IDs
    SELECT group_id INTO admin_group_id FROM app.groups WHERE group_name = 'role.adminOrg.admin' LIMIT 1;
    SELECT group_id INTO editor_group_id FROM app.groups WHERE group_name = 'role.adminOrg.editor' LIMIT 1;
    SELECT group_id INTO sysadmins_group_id FROM app.groups WHERE group_name = 'sysadmins' LIMIT 1;

    -- Grant permission to role.adminOrg.admin
    IF admin_group_id IS NOT NULL THEN
        INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
        VALUES (admin_group_id, 'adminOrg:users:reset_password:all', sys_user_id)
        ON CONFLICT DO NOTHING;
    ELSE
        RAISE NOTICE 'Group role.adminOrg.admin not found';
    END IF;

    -- Grant permission to role.adminOrg.editor
    IF editor_group_id IS NOT NULL THEN
        INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
        VALUES (editor_group_id, 'adminOrg:users:reset_password:all', sys_user_id)
        ON CONFLICT DO NOTHING;
    ELSE
        RAISE NOTICE 'Group role.adminOrg.editor not found';
    END IF;

    -- Grant permission to sysadmins
    IF sysadmins_group_id IS NOT NULL THEN
        INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
        VALUES (sysadmins_group_id, 'adminOrg:users:reset_password:all', sys_user_id)
        ON CONFLICT DO NOTHING;
    ELSE
        RAISE NOTICE 'Group sysadmins not found';
    END IF;

END $$;

