-- Migration: 016_settings_authorization
-- Description: Sets up granular authorization for settings, creates common user role, and migrates existing settings permissions.

-- 1. Create permissions for Common Users
INSERT INTO app.permissions (permission_key, module, description) VALUES
('settings:read:common', 'common', 'Read common/public settings')
ON CONFLICT (permission_key) DO NOTHING;

-- 2. Create Common Users Group (Registered Users)
-- Using a fixed UUID for reference in code if needed: 440e8400-e29b-41d4-a716-446655440002
INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
VALUES (
    '440e8400-e29b-41d4-a716-446655440002',
    'role.users.registered',
    true,
    '550e8400-e29b-41d4-a716-446655440001', -- system admin
    '550e8400-e29b-41d4-a716-446655440001',
    'All registered users',
    'active'
)
ON CONFLICT (group_name) DO NOTHING;

-- 3. Grant common permission to Registered Users
INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
VALUES (
    '440e8400-e29b-41d4-a716-446655440002',
    'settings:read:common',
    '550e8400-e29b-41d4-a716-446655440001'
)
ON CONFLICT (group_id, permission_key) DO NOTHING;

-- 4. Add all existing users to the Registered Users group
INSERT INTO app.group_members (group_id, user_id, added_by)
SELECT 
    '440e8400-e29b-41d4-a716-446655440002',
    user_id,
    '550e8400-e29b-41d4-a716-446655440001'
FROM app.users
ON CONFLICT (group_id, user_id, is_active) DO NOTHING;

-- 5. Migrate Admin Permissions

-- 5.1 Admin Org
-- Create new keys
INSERT INTO app.permissions (permission_key, module, description) VALUES
('adminOrg:settings:read:all', 'adminOrg', 'Read organization settings (all)'),
('adminOrg:settings:update:all', 'adminOrg', 'Update organization settings (all)')
ON CONFLICT (permission_key) DO NOTHING;

-- Migrate assignments
UPDATE app.group_permissions SET permission_key = 'adminOrg:settings:read:all' WHERE permission_key = 'adminOrg:settings:read';
UPDATE app.group_permissions SET permission_key = 'adminOrg:settings:update:all' WHERE permission_key = 'adminOrg:settings:update';

-- Delete old keys
DELETE FROM app.permissions WHERE permission_key IN ('adminOrg:settings:read', 'adminOrg:settings:update');

-- 5.2 Admin Products
-- Create new keys
INSERT INTO app.permissions (permission_key, module, description) VALUES
('adminProducts:settings:read:all', 'adminProducts', 'Read product settings (all)'),
('adminProducts:settings:update:all', 'adminProducts', 'Update product settings (all)')
ON CONFLICT (permission_key) DO NOTHING;

-- Migrate assignments (only update existed before)
UPDATE app.group_permissions SET permission_key = 'adminProducts:settings:update:all' WHERE permission_key = 'adminProducts:settings:update';

-- Delete old keys
DELETE FROM app.permissions WHERE permission_key = 'adminProducts:settings:update';

-- 5.3 Admin Pricing
-- Create new keys
INSERT INTO app.permissions (permission_key, module, description) VALUES
('adminPricing:settings:read:all', 'adminPricing', 'Read pricing settings (all)'),
('adminPricing:settings:update:all', 'adminPricing', 'Update pricing settings (all)')
ON CONFLICT (permission_key) DO NOTHING;

-- Migrate assignments (only update existed before)
UPDATE app.group_permissions SET permission_key = 'adminPricing:settings:update:all' WHERE permission_key = 'adminPricing:settings:update';

-- Delete old keys
DELETE FROM app.permissions WHERE permission_key = 'adminPricing:settings:update';

-- 6. Assign Permissions to Groups (Idempotent)

DO $$
DECLARE
    sys_user_id UUID := '550e8400-e29b-41d4-a716-446655440001';
    
    -- Group IDs (look up by name)
    g_org_admin UUID;
    g_prod_admin UUID;
    g_price_admin UUID;
    g_sysadmin UUID;
BEGIN
    SELECT group_id INTO g_org_admin FROM app.groups WHERE group_name = 'role.adminOrg.admin';
    SELECT group_id INTO g_prod_admin FROM app.groups WHERE group_name = 'role.adminProducts.admin';
    SELECT group_id INTO g_price_admin FROM app.groups WHERE group_name = 'role.adminPricing.admin';
    SELECT group_id INTO g_sysadmin FROM app.groups WHERE group_name = 'sysadmins';

    -- Org Admin
    IF g_org_admin IS NOT NULL THEN
        INSERT INTO app.group_permissions (group_id, permission_key, granted_by) VALUES
        (g_org_admin, 'adminOrg:settings:read:all', sys_user_id),
        (g_org_admin, 'adminOrg:settings:update:all', sys_user_id)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Product Admin
    IF g_prod_admin IS NOT NULL THEN
        INSERT INTO app.group_permissions (group_id, permission_key, granted_by) VALUES
        (g_prod_admin, 'adminProducts:settings:read:all', sys_user_id),
        (g_prod_admin, 'adminProducts:settings:update:all', sys_user_id)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Pricing Admin
    IF g_price_admin IS NOT NULL THEN
        INSERT INTO app.group_permissions (group_id, permission_key, granted_by) VALUES
        (g_price_admin, 'adminPricing:settings:read:all', sys_user_id),
        (g_price_admin, 'adminPricing:settings:update:all', sys_user_id)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Sysadmins (Grant ALL new permissions)
    IF g_sysadmin IS NOT NULL THEN
        INSERT INTO app.group_permissions (group_id, permission_key, granted_by) VALUES
        (g_sysadmin, 'settings:read:common', sys_user_id),
        (g_sysadmin, 'adminOrg:settings:read:all', sys_user_id),
        (g_sysadmin, 'adminOrg:settings:update:all', sys_user_id),
        (g_sysadmin, 'adminProducts:settings:read:all', sys_user_id),
        (g_sysadmin, 'adminProducts:settings:update:all', sys_user_id),
        (g_sysadmin, 'adminPricing:settings:read:all', sys_user_id),
        (g_sysadmin, 'adminPricing:settings:update:all', sys_user_id)
        ON CONFLICT DO NOTHING;
    END IF;

END $$;

