-- Migration: 013_org_authorization
-- Description: Sets up authorization tables (permissions, groups) for adminOrg module.

-- 1. Seed Permissions for adminOrg
INSERT INTO app.permissions (permission_key, module, description) VALUES
-- Access
('adminOrg:module:access', 'adminOrg', 'Access to Organization Admin module'),

-- Users
('adminOrg:users:read', 'adminOrg', 'Read users and their details'),
('adminOrg:users:create', 'adminOrg', 'Create new users'),
('adminOrg:users:update', 'adminOrg', 'Update user details'),
('adminOrg:users:delete', 'adminOrg', 'Delete users'),
('adminOrg:users:manage_groups', 'adminOrg', 'Manage user group memberships'),

-- Groups
('adminOrg:groups:read', 'adminOrg', 'Read groups and their details'),
('adminOrg:groups:create', 'adminOrg', 'Create new groups'),
('adminOrg:groups:update', 'adminOrg', 'Update group details'),
('adminOrg:groups:delete', 'adminOrg', 'Delete groups'),
('adminOrg:groups:manage_members', 'adminOrg', 'Manage group members'),
('adminOrg:groups:change_owner', 'adminOrg', 'Change group owner'),

-- Settings
('adminOrg:settings:read', 'adminOrg', 'Read organization settings'),
('adminOrg:settings:update', 'adminOrg', 'Update organization settings')
ON CONFLICT (permission_key) DO NOTHING;

-- 2. Seed System Groups for adminOrg
DO $$
DECLARE
    -- Lookup system admin user ID dynamically
    sys_user_id UUID;
    
    -- Group IDs to be generated
    admin_group_id UUID;
    editor_group_id UUID;
    auditor_group_id UUID;
BEGIN
    -- Find the system administrator
    SELECT user_id INTO sys_user_id FROM app.users WHERE username = 'admin' LIMIT 1;
    
    -- Fallback safety check
    IF sys_user_id IS NULL THEN
        RAISE NOTICE 'System admin user not found, authorization groups will be created without creator reference';
    END IF;

    -- Create Groups
    
    -- Org Admin
    INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
    VALUES (gen_random_uuid(), 'role.adminOrg.admin', true, sys_user_id, sys_user_id, 'Organization Administrators with full access', 'active')
    ON CONFLICT (group_name) DO UPDATE SET group_description = EXCLUDED.group_description
    RETURNING group_id INTO admin_group_id;

    -- Org Editor
    INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
    VALUES (gen_random_uuid(), 'role.adminOrg.editor', true, sys_user_id, sys_user_id, 'Organization Editors (Users and Groups management, no settings)', 'active')
    ON CONFLICT (group_name) DO UPDATE SET group_description = EXCLUDED.group_description
    RETURNING group_id INTO editor_group_id;

    -- Org Auditor
    INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
    VALUES (gen_random_uuid(), 'role.adminOrg.auditor', true, sys_user_id, sys_user_id, 'Organization Auditors (Read-only access)', 'active')
    ON CONFLICT (group_name) DO UPDATE SET group_description = EXCLUDED.group_description
    RETURNING group_id INTO auditor_group_id;

    -- 3. Map Permissions to Groups

    -- Admin Permissions (All module permissions)
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT admin_group_id, permission_key, sys_user_id
    FROM app.permissions
    WHERE module = 'adminOrg'
    ON CONFLICT DO NOTHING;

    -- Editor Permissions (All except settings)
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT editor_group_id, permission_key, sys_user_id
    FROM app.permissions
    WHERE module = 'adminOrg'
    AND permission_key NOT LIKE 'adminOrg:settings:%'
    ON CONFLICT DO NOTHING;

    -- Auditor Permissions (Read-only for all)
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT auditor_group_id, permission_key, sys_user_id
    FROM app.permissions
    WHERE permission_key IN (
        'adminOrg:module:access',
        'adminOrg:users:read',
        'adminOrg:groups:read',
        'adminOrg:settings:read'
    )
    ON CONFLICT DO NOTHING;

    -- 4. Grant All Permissions to sysadmins
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT g.group_id, p.permission_key, sys_user_id
    FROM app.groups g
    CROSS JOIN app.permissions p
    WHERE g.group_name = 'sysadmins'
    AND p.module = 'adminOrg'
    ON CONFLICT DO NOTHING;

END $$;

