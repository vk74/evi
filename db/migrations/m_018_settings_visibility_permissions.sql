-- Migration: 018_settings_visibility_permissions
-- Description: Creates permissions for controlling settings visibility in frontend UI and creates Services admin/auditor groups.

-- 1. Create permissions for settings visibility
INSERT INTO app.permissions (permission_key, module, description) VALUES
-- Settings visibility permissions
('adminProducts:settings:access', 'adminProducts', 'Access to view Products settings section in UI'),
('adminPricing:settings:access', 'adminPricing', 'Access to view Pricing settings section in UI'),
('adminCatalog:settings:access', 'adminCatalog', 'Access to view Catalog settings section in UI'),
('adminOrg:settings:access', 'adminOrg', 'Access to view Organization settings section in UI'),
('adminServices:module:access', 'adminServices', 'Access to Services Admin module in navigation'),
('adminServices:settings:access', 'adminServices', 'Access to view Services settings section in UI'),
('system:settings:access', 'system', 'Access to view Application Settings in navigation')
ON CONFLICT (permission_key) DO NOTHING;

-- 2. Create Services Admin Groups
DO $$
DECLARE
    -- Lookup system admin user ID dynamically
    sys_user_id UUID;
    
    -- Group IDs to be generated
    services_admin_group_id UUID;
    services_auditor_group_id UUID;
    
    -- Existing group IDs for permission assignment
    g_prod_admin UUID;
    g_prod_auditor UUID;
    g_price_admin UUID;
    g_price_auditor UUID;
    g_catalog_admin UUID;
    g_catalog_auditor UUID;
    g_org_admin UUID;
    g_org_auditor UUID;
    g_sysadmin UUID;
BEGIN
    -- Find the system administrator
    SELECT user_id INTO sys_user_id FROM app.users WHERE username = 'admin' LIMIT 1;
    
    -- Fallback safety check
    IF sys_user_id IS NULL THEN
        RAISE NOTICE 'System admin user not found, authorization groups will be created without creator reference';
    END IF;

    -- Create Services Admin Group
    INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
    VALUES (gen_random_uuid(), 'role.adminServices.admin', true, sys_user_id, sys_user_id, 'Services Administrators with full access', 'active')
    ON CONFLICT (group_name) DO UPDATE SET group_description = EXCLUDED.group_description
    RETURNING group_id INTO services_admin_group_id;

    -- Create Services Auditor Group
    INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
    VALUES (gen_random_uuid(), 'role.adminServices.auditor', true, sys_user_id, sys_user_id, 'Services Auditors (Read-only access)', 'active')
    ON CONFLICT (group_name) DO UPDATE SET group_description = EXCLUDED.group_description
    RETURNING group_id INTO services_auditor_group_id;

    -- Look up existing group IDs
    SELECT group_id INTO g_prod_admin FROM app.groups WHERE group_name = 'role.adminProducts.admin';
    SELECT group_id INTO g_prod_auditor FROM app.groups WHERE group_name = 'role.adminProducts.auditor';
    SELECT group_id INTO g_price_admin FROM app.groups WHERE group_name = 'role.adminPricing.admin';
    SELECT group_id INTO g_price_auditor FROM app.groups WHERE group_name = 'role.adminPricing.auditor';
    SELECT group_id INTO g_catalog_admin FROM app.groups WHERE group_name = 'role.adminCatalog.admin';
    SELECT group_id INTO g_catalog_auditor FROM app.groups WHERE group_name = 'role.adminCatalog.auditor';
    SELECT group_id INTO g_org_admin FROM app.groups WHERE group_name = 'role.adminOrg.admin';
    SELECT group_id INTO g_org_auditor FROM app.groups WHERE group_name = 'role.adminOrg.auditor';
    SELECT group_id INTO g_sysadmin FROM app.groups WHERE group_name = 'sysadmins';

    -- 3. Assign Permissions to Groups

    -- Products Admin
    IF g_prod_admin IS NOT NULL THEN
        INSERT INTO app.group_permissions (group_id, permission_key, granted_by) VALUES
        (g_prod_admin, 'adminProducts:settings:access', sys_user_id)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Products Auditor
    IF g_prod_auditor IS NOT NULL THEN
        INSERT INTO app.group_permissions (group_id, permission_key, granted_by) VALUES
        (g_prod_auditor, 'adminProducts:settings:access', sys_user_id)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Pricing Admin
    IF g_price_admin IS NOT NULL THEN
        INSERT INTO app.group_permissions (group_id, permission_key, granted_by) VALUES
        (g_price_admin, 'adminPricing:settings:access', sys_user_id)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Pricing Auditor
    IF g_price_auditor IS NOT NULL THEN
        INSERT INTO app.group_permissions (group_id, permission_key, granted_by) VALUES
        (g_price_auditor, 'adminPricing:settings:access', sys_user_id)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Catalog Admin
    IF g_catalog_admin IS NOT NULL THEN
        INSERT INTO app.group_permissions (group_id, permission_key, granted_by) VALUES
        (g_catalog_admin, 'adminCatalog:settings:access', sys_user_id)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Catalog Auditor
    IF g_catalog_auditor IS NOT NULL THEN
        INSERT INTO app.group_permissions (group_id, permission_key, granted_by) VALUES
        (g_catalog_auditor, 'adminCatalog:settings:access', sys_user_id)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Org Admin
    IF g_org_admin IS NOT NULL THEN
        INSERT INTO app.group_permissions (group_id, permission_key, granted_by) VALUES
        (g_org_admin, 'adminOrg:settings:access', sys_user_id)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Org Auditor
    IF g_org_auditor IS NOT NULL THEN
        INSERT INTO app.group_permissions (group_id, permission_key, granted_by) VALUES
        (g_org_auditor, 'adminOrg:settings:access', sys_user_id)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Services Admin
    IF services_admin_group_id IS NOT NULL THEN
        INSERT INTO app.group_permissions (group_id, permission_key, granted_by) VALUES
        (services_admin_group_id, 'adminServices:module:access', sys_user_id),
        (services_admin_group_id, 'adminServices:settings:access', sys_user_id)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Services Auditor
    IF services_auditor_group_id IS NOT NULL THEN
        INSERT INTO app.group_permissions (group_id, permission_key, granted_by) VALUES
        (services_auditor_group_id, 'adminServices:module:access', sys_user_id),
        (services_auditor_group_id, 'adminServices:settings:access', sys_user_id)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Sysadmins (Grant ALL new permissions)
    IF g_sysadmin IS NOT NULL THEN
        INSERT INTO app.group_permissions (group_id, permission_key, granted_by) VALUES
        (g_sysadmin, 'adminProducts:settings:access', sys_user_id),
        (g_sysadmin, 'adminPricing:settings:access', sys_user_id),
        (g_sysadmin, 'adminCatalog:settings:access', sys_user_id),
        (g_sysadmin, 'adminOrg:settings:access', sys_user_id),
        (g_sysadmin, 'adminServices:module:access', sys_user_id),
        (g_sysadmin, 'adminServices:settings:access', sys_user_id),
        (g_sysadmin, 'system:settings:access', sys_user_id)
        ON CONFLICT DO NOTHING;
    END IF;

END $$;

