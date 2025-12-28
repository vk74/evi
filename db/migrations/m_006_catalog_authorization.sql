-- Migration: 006_catalog_authorization
-- Description: Sets up authorization tables (permissions, groups) for adminCatalog module.
-- Updated: Split publisher role into products.publisher and services.publisher

-- 1. Seed Permissions for adminCatalog
INSERT INTO app.permissions (permission_key, module, description) VALUES
-- Access
('adminCatalog:module:access', 'adminCatalog', 'Access to Catalog Admin module'),

-- Sections (Catalog Structure)
('adminCatalog:sections:read:all', 'adminCatalog', 'Read all catalog sections'),
('adminCatalog:sections:create:all', 'adminCatalog', 'Create catalog sections'),
('adminCatalog:sections:update:all', 'adminCatalog', 'Update all catalog sections'),
('adminCatalog:sections:delete:all', 'adminCatalog', 'Delete all catalog sections'),

-- Publishing - Services
('adminCatalog:publishing:services:read:all', 'adminCatalog', 'Read services publishing status'),
('adminCatalog:publishing:services:update:all', 'adminCatalog', 'Update services publishing status'),

-- Publishing - Products
('adminCatalog:publishing:products:read:all', 'adminCatalog', 'Read products publishing status'),
('adminCatalog:publishing:products:update:all', 'adminCatalog', 'Update products publishing status'),

-- Settings
('adminCatalog:settings:read:all', 'adminCatalog', 'Read catalog settings'),
('adminCatalog:settings:update:all', 'adminCatalog', 'Update catalog settings')
ON CONFLICT (permission_key) DO NOTHING;

-- 2. Seed System Groups for adminCatalog
DO $$
DECLARE
    -- Lookup system admin user ID dynamically
    sys_user_id UUID;
    
    -- Group IDs to be generated
    admin_group_id UUID;
    editor_group_id UUID;
    publisher_products_group_id UUID;
    publisher_services_group_id UUID;
    auditor_group_id UUID;
BEGIN
    -- Find the system administrator
    SELECT user_id INTO sys_user_id FROM app.users WHERE username = 'admin' LIMIT 1;
    
    -- Fallback safety check
    IF sys_user_id IS NULL THEN
        RAISE NOTICE 'System admin user not found, authorization groups will be created without creator reference';
    END IF;

    -- Create Groups
    
    -- Catalog Admin
    INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
    VALUES (gen_random_uuid(), 'role.adminCatalog.admin', true, sys_user_id, sys_user_id, 'Catalog Administrators with full access', 'active')
    ON CONFLICT (group_name) DO UPDATE SET group_description = EXCLUDED.group_description
    RETURNING group_id INTO admin_group_id;

    -- Catalog Editor
    INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
    VALUES (gen_random_uuid(), 'role.adminCatalog.editor', true, sys_user_id, sys_user_id, 'Catalog Editors (Content management, no settings)', 'active')
    ON CONFLICT (group_name) DO UPDATE SET group_description = EXCLUDED.group_description
    RETURNING group_id INTO editor_group_id;

    -- Catalog Products Publisher
    INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
    VALUES (gen_random_uuid(), 'role.adminCatalog.products.publisher', true, sys_user_id, sys_user_id, 'Catalog Products Publishers', 'active')
    ON CONFLICT (group_name) DO UPDATE SET group_description = EXCLUDED.group_description
    RETURNING group_id INTO publisher_products_group_id;

    -- Catalog Services Publisher
    INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
    VALUES (gen_random_uuid(), 'role.adminCatalog.services.publisher', true, sys_user_id, sys_user_id, 'Catalog Services Publishers', 'active')
    ON CONFLICT (group_name) DO UPDATE SET group_description = EXCLUDED.group_description
    RETURNING group_id INTO publisher_services_group_id;

    -- Catalog Auditor
    INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
    VALUES (gen_random_uuid(), 'role.adminCatalog.auditor', true, sys_user_id, sys_user_id, 'Catalog Auditors (Read-only access)', 'active')
    ON CONFLICT (group_name) DO UPDATE SET group_description = EXCLUDED.group_description
    RETURNING group_id INTO auditor_group_id;

    -- 3. Map Permissions to Groups

    -- Admin Permissions (All module permissions)
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT admin_group_id, permission_key, sys_user_id
    FROM app.permissions
    WHERE module = 'adminCatalog'
    ON CONFLICT DO NOTHING;

    -- Editor Permissions (All except settings)
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT editor_group_id, permission_key, sys_user_id
    FROM app.permissions
    WHERE module = 'adminCatalog'
    AND permission_key NOT LIKE 'adminCatalog:settings:%'
    ON CONFLICT DO NOTHING;

    -- Products Publisher Permissions (Product Publishing + Access)
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT publisher_products_group_id, permission_key, sys_user_id
    FROM app.permissions
    WHERE permission_key IN (
        'adminCatalog:module:access',
        'adminCatalog:publishing:products:read:all',
        'adminCatalog:publishing:products:update:all'
    )
    ON CONFLICT DO NOTHING;

    -- Services Publisher Permissions (Service Publishing + Access)
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT publisher_services_group_id, permission_key, sys_user_id
    FROM app.permissions
    WHERE permission_key IN (
        'adminCatalog:module:access',
        'adminCatalog:publishing:services:read:all',
        'adminCatalog:publishing:services:update:all'
    )
    ON CONFLICT DO NOTHING;

    -- Auditor Permissions (Read-only for all)
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT auditor_group_id, permission_key, sys_user_id
    FROM app.permissions
    WHERE permission_key IN (
        'adminCatalog:module:access',
        'adminCatalog:sections:read:all',
        'adminCatalog:publishing:products:read:all',
        'adminCatalog:publishing:services:read:all',
        'adminCatalog:settings:read:all'
    )
    ON CONFLICT DO NOTHING;

    -- 4. Grant All Permissions to sysadmins
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT g.group_id, p.permission_key, sys_user_id
    FROM app.groups g
    CROSS JOIN app.permissions p
    WHERE g.group_name = 'sysadmins'
    AND p.module = 'adminCatalog'
    ON CONFLICT DO NOTHING;

END $$;
