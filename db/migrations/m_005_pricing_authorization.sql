-- Migration: 005_pricing_authorization
-- Description: Sets up authorization tables (permissions, groups) for adminPricing module.

-- 1. Seed Permissions for adminPricing
INSERT INTO app.permissions (permission_key, module, description) VALUES
-- Access
('adminPricing:module:access', 'adminPricing', 'Access to Pricing Admin module'),
-- Settings
('adminPricing:settings:update', 'adminPricing', 'Update Pricing Admin settings'),
-- Price Lists
('adminPricing:pricelists:read:all', 'adminPricing', 'Read all price lists'),
('adminPricing:pricelists:create:all', 'adminPricing', 'Create price lists'),
('adminPricing:pricelists:update:all', 'adminPricing', 'Update all price lists'),
('adminPricing:pricelists:delete:all', 'adminPricing', 'Delete all price lists'),
-- Price List Items
('adminPricing:items:read:all', 'adminPricing', 'Read all price list items'),
('adminPricing:items:create:all', 'adminPricing', 'Create price list items'),
('adminPricing:items:update:all', 'adminPricing', 'Update all price list items'),
('adminPricing:items:delete:all', 'adminPricing', 'Delete all price list items'),
-- Currencies
('adminPricing:currencies:read:all', 'adminPricing', 'Read all currencies'),
('adminPricing:currencies:update:all', 'adminPricing', 'Update all currencies'),
-- Tax Regions (Taxes)
('adminPricing:taxes:read:all', 'adminPricing', 'Read all tax regions'),
('adminPricing:taxes:update:all', 'adminPricing', 'Update all tax regions')
ON CONFLICT (permission_key) DO NOTHING;

-- 2. Seed System Groups for adminPricing
DO $$
DECLARE
    -- Lookup system admin user ID dynamically
    sys_user_id UUID;
    
    -- Group IDs to be generated
    admin_group_id UUID;
    editor_group_id UUID;
    analyst_group_id UUID;
    auditor_group_id UUID;
BEGIN
    -- Find the system administrator
    SELECT user_id INTO sys_user_id FROM app.users WHERE username = 'admin' LIMIT 1;
    
    -- Fallback safety check
    IF sys_user_id IS NULL THEN
        RAISE NOTICE 'System admin user not found, authorization groups will be created without creator reference';
    END IF;

    -- Create Groups
    
    -- Pricing Admin
    INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
    VALUES (gen_random_uuid(), 'role.adminPricing.admin', true, sys_user_id, sys_user_id, 'Pricing Administrators with full access', 'active')
    ON CONFLICT (group_name) DO UPDATE SET group_description = EXCLUDED.group_description
    RETURNING group_id INTO admin_group_id;

    -- Pricing Editor
    INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
    VALUES (gen_random_uuid(), 'role.adminPricing.editor', true, sys_user_id, sys_user_id, 'Pricing Editors (No settings access)', 'active')
    ON CONFLICT (group_name) DO UPDATE SET group_description = EXCLUDED.group_description
    RETURNING group_id INTO editor_group_id;

    -- Pricing Analyst
    INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
    VALUES (gen_random_uuid(), 'role.adminPricing.analyst', true, sys_user_id, sys_user_id, 'Pricing Analysts (Price lists management only, others read-only)', 'active')
    ON CONFLICT (group_name) DO UPDATE SET group_description = EXCLUDED.group_description
    RETURNING group_id INTO analyst_group_id;

    -- Pricing Auditor
    INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
    VALUES (gen_random_uuid(), 'role.adminPricing.auditor', true, sys_user_id, sys_user_id, 'Pricing Auditors (Read-only access)', 'active')
    ON CONFLICT (group_name) DO UPDATE SET group_description = EXCLUDED.group_description
    RETURNING group_id INTO auditor_group_id;

    -- 3. Map Permissions to Groups

    -- Admin Permissions (All module permissions)
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT admin_group_id, permission_key, sys_user_id
    FROM app.permissions
    WHERE module = 'adminPricing'
    ON CONFLICT DO NOTHING;

    -- Editor Permissions (All except settings:update)
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT editor_group_id, permission_key, sys_user_id
    FROM app.permissions
    WHERE module = 'adminPricing'
    AND permission_key != 'adminPricing:settings:update'
    ON CONFLICT DO NOTHING;

    -- Analyst Permissions
    -- CRUD for PriceLists and Items
    -- Read-only for Currencies and Taxes
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT analyst_group_id, permission_key, sys_user_id
    FROM app.permissions
    WHERE permission_key IN (
        'adminPricing:module:access',
        'adminPricing:pricelists:read:all',
        'adminPricing:pricelists:create:all',
        'adminPricing:pricelists:update:all',
        'adminPricing:pricelists:delete:all',
        'adminPricing:items:read:all',
        'adminPricing:items:create:all',
        'adminPricing:items:update:all',
        'adminPricing:items:delete:all',
        'adminPricing:currencies:read:all',
        'adminPricing:taxes:read:all'
    )
    ON CONFLICT DO NOTHING;

    -- Auditor Permissions (Read-only)
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT auditor_group_id, permission_key, sys_user_id
    FROM app.permissions
    WHERE permission_key IN (
        'adminPricing:module:access',
        'adminPricing:pricelists:read:all',
        'adminPricing:items:read:all',
        'adminPricing:currencies:read:all',
        'adminPricing:taxes:read:all'
    )
    ON CONFLICT DO NOTHING;

    -- 4. Grant All Permissions to sysadmins
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT g.group_id, p.permission_key, sys_user_id
    FROM app.groups g
    CROSS JOIN app.permissions p
    WHERE g.group_name = 'sysadmins'
    AND p.module = 'adminPricing'
    ON CONFLICT DO NOTHING;

END $$;
