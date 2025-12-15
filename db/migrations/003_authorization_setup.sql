-- Migration: 003_authorization_setup
-- Description: Sets up authorization tables (permissions, group_permissions) and seeds initial roles for adminProducts module.

-- 1. Create permissions table
CREATE TABLE IF NOT EXISTS app.permissions (
    permission_key VARCHAR(255) PRIMARY KEY,
    module VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE app.permissions IS 'Registry of all available system permissions';

-- 2. Create group_permissions table
CREATE TABLE IF NOT EXISTS app.group_permissions (
    group_id UUID NOT NULL REFERENCES app.groups(group_id) ON DELETE CASCADE,
    permission_key VARCHAR(255) NOT NULL REFERENCES app.permissions(permission_key) ON DELETE CASCADE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    granted_by UUID, -- Should reference a user, but nullable for initial seed
    PRIMARY KEY (group_id, permission_key)
);

COMMENT ON TABLE app.group_permissions IS 'Mapping of system groups to permissions';

-- 3. Rename "System Administrators" to "sysadmins"
UPDATE app.groups
SET 
    group_name = 'sysadmins',
    group_email = 'sysadmins@evi.team',
    group_modified_at = NOW()
WHERE group_name = 'System Administrators';

-- 4. Seed Permissions for adminProducts
INSERT INTO app.permissions (permission_key, module, description) VALUES
-- Access
('adminProducts:module:access', 'adminProducts', 'Access to Product Admin module'),
-- Settings
('adminProducts:settings:update', 'adminProducts', 'Update Product Admin settings'),
-- Items (Read)
('adminProducts:items:read:all', 'adminProducts', 'Read all products'),
('adminProducts:items:read:own', 'adminProducts', 'Read own products'),
-- Items (Create)
('adminProducts:items:create', 'adminProducts', 'Create new products'),
-- Items (Update)
('adminProducts:items:update:all', 'adminProducts', 'Update all products'),
('adminProducts:items:update:own', 'adminProducts', 'Update own products'),
-- Items (Delete)
('adminProducts:items:delete:all', 'adminProducts', 'Delete all products'),
('adminProducts:items:delete:own', 'adminProducts', 'Delete own products'), 
-- Items (Actions)
('adminProducts:items:change_owner:all', 'adminProducts', 'Change owner for all products'),
('adminProducts:items:change_owner:own', 'adminProducts', 'Change owner for own products'),
('adminProducts:history:read:all', 'adminProducts', 'Read product history')
ON CONFLICT (permission_key) DO NOTHING;

-- 5. Seed System Groups for adminProducts
-- Uses dynamic UUID generation (gen_random_uuid) and looks up system admin ID.

DO $$
DECLARE
    -- Lookup system admin user ID dynamically
    sys_user_id UUID;
    
    -- Group IDs to be generated
    admin_group_id UUID;
    editor_group_id UUID;
    specialist_group_id UUID;
    auditor_group_id UUID;
BEGIN
    -- Find the system administrator (fallback to hardcoded if not found, though it should exist from 06_system_users.sql)
    SELECT user_id INTO sys_user_id FROM app.users WHERE username = 'admin' LIMIT 1;
    
    -- Fallback safety check
    IF sys_user_id IS NULL THEN
        RAISE NOTICE 'System admin user not found, authorization groups will be created without creator reference';
    END IF;

    -- Create Groups
    -- We use a helper block to insert-or-select to handle idempotency with generated UUIDs
    
    -- Product Admin
    INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
    VALUES (gen_random_uuid(), 'role.adminProducts.admin', true, sys_user_id, sys_user_id, 'Product Administrators with full access', 'active')
    ON CONFLICT (group_name) DO UPDATE SET group_description = EXCLUDED.group_description
    RETURNING group_id INTO admin_group_id;

    -- Product Editor
    INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
    VALUES (gen_random_uuid(), 'role.adminProducts.editor', true, sys_user_id, sys_user_id, 'Product Editors (Content Management)', 'active')
    ON CONFLICT (group_name) DO UPDATE SET group_description = EXCLUDED.group_description
    RETURNING group_id INTO editor_group_id;

    -- Product Specialist
    INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
    VALUES (gen_random_uuid(), 'role.adminProducts.specialist', true, sys_user_id, sys_user_id, 'Product Specialists (Own products management)', 'active')
    ON CONFLICT (group_name) DO UPDATE SET group_description = EXCLUDED.group_description
    RETURNING group_id INTO specialist_group_id;

    -- Product Auditor
    INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
    VALUES (gen_random_uuid(), 'role.adminProducts.auditor', true, sys_user_id, sys_user_id, 'Product Auditors (Read-only access)', 'active')
    ON CONFLICT (group_name) DO UPDATE SET group_description = EXCLUDED.group_description
    RETURNING group_id INTO auditor_group_id;

    -- 6. Map Permissions to Groups

    -- Admin Permissions (All module permissions)
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT admin_group_id, permission_key, sys_user_id
    FROM app.permissions
    WHERE module = 'adminProducts'
    ON CONFLICT DO NOTHING;

    -- Editor Permissions
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT editor_group_id, p.permission_key, sys_user_id
    FROM app.permissions p
    WHERE p.permission_key IN (
        'adminProducts:module:access',
        'adminProducts:items:read:all',
        'adminProducts:items:update:all'
    )
    ON CONFLICT DO NOTHING;

    -- Specialist Permissions
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT specialist_group_id, p.permission_key, sys_user_id
    FROM app.permissions p
    WHERE p.permission_key IN (
        'adminProducts:module:access',
        'adminProducts:items:create',
        'adminProducts:items:read:own',
        'adminProducts:items:update:own',
        'adminProducts:items:change_owner:own'
    )
    ON CONFLICT DO NOTHING;

    -- Auditor Permissions
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT auditor_group_id, p.permission_key, sys_user_id
    FROM app.permissions p
    WHERE p.permission_key IN (
        'adminProducts:module:access',
        'adminProducts:items:read:all',
        'adminProducts:history:read:all'
    )
    ON CONFLICT DO NOTHING;

END $$;
