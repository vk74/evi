-- Version: 1.0.0
-- Description: Seeds permissions and role groups for authorization (MVP merge: final state from m_003, m_005, m_006, m_007, m_013..m_019).
-- Backend file: 09_authorization.sql
--
-- Inserts all permission keys in final form, creates role groups, maps group_permissions,
-- and adds all users to role.users.registered. Depends on 08_system_groups (sysadmins exists).

-- 1. Seed all permissions in final form (no renames: items:create:all, adminOrg *:all, etc.)
INSERT INTO app.permissions (permission_key, module, description) VALUES
-- adminProducts (items:create:all from start, settings:read/update:all, settings:access)
('adminProducts:module:access', 'adminProducts', 'Access to Product Admin module'),
('adminProducts:settings:read:all', 'adminProducts', 'Read product settings (all)'),
('adminProducts:settings:update:all', 'adminProducts', 'Update product settings (all)'),
('adminProducts:settings:access', 'adminProducts', 'Access to view Products settings section in UI'),
('adminProducts:items:read:all', 'adminProducts', 'Read all products'),
('adminProducts:items:read:own', 'adminProducts', 'Read own products'),
('adminProducts:items:create:all', 'adminProducts', 'Create new products'),
('adminProducts:items:update:all', 'adminProducts', 'Update all products'),
('adminProducts:items:update:own', 'adminProducts', 'Update own products'),
('adminProducts:items:delete:all', 'adminProducts', 'Delete all products'),
('adminProducts:items:delete:own', 'adminProducts', 'Delete own products'),
('adminProducts:items:change_owner:all', 'adminProducts', 'Change owner for all products'),
('adminProducts:items:change_owner:own', 'adminProducts', 'Change owner for own products'),
('adminProducts:history:read:all', 'adminProducts', 'Read product history'),
-- adminPricing
('adminPricing:module:access', 'adminPricing', 'Access to Pricing Admin module'),
('adminPricing:settings:read:all', 'adminPricing', 'Read pricing settings (all)'),
('adminPricing:settings:update:all', 'adminPricing', 'Update pricing settings (all)'),
('adminPricing:settings:access', 'adminPricing', 'Access to view Pricing settings section in UI'),
('adminPricing:pricelists:read:all', 'adminPricing', 'Read all price lists'),
('adminPricing:pricelists:create:all', 'adminPricing', 'Create price lists'),
('adminPricing:pricelists:update:all', 'adminPricing', 'Update all price lists'),
('adminPricing:pricelists:delete:all', 'adminPricing', 'Delete all price lists'),
('adminPricing:items:read:all', 'adminPricing', 'Read all price list items'),
('adminPricing:items:create:all', 'adminPricing', 'Create price list items'),
('adminPricing:items:update:all', 'adminPricing', 'Update all price list items'),
('adminPricing:items:delete:all', 'adminPricing', 'Delete all price list items'),
('adminPricing:currencies:read:all', 'adminPricing', 'Read all currencies'),
('adminPricing:currencies:update:all', 'adminPricing', 'Update all currencies'),
('adminPricing:taxes:read:all', 'adminPricing', 'Read all tax regions'),
('adminPricing:taxes:update:all', 'adminPricing', 'Update all tax regions'),
-- adminCatalog
('adminCatalog:module:access', 'adminCatalog', 'Access to Catalog Admin module'),
('adminCatalog:settings:read:all', 'adminCatalog', 'Read catalog settings'),
('adminCatalog:settings:update:all', 'adminCatalog', 'Update catalog settings'),
('adminCatalog:settings:access', 'adminCatalog', 'Access to view Catalog settings section in UI'),
('adminCatalog:sections:read:all', 'adminCatalog', 'Read all catalog sections'),
('adminCatalog:sections:create:all', 'adminCatalog', 'Create catalog sections'),
('adminCatalog:sections:update:all', 'adminCatalog', 'Update all catalog sections'),
('adminCatalog:sections:delete:all', 'adminCatalog', 'Delete all catalog sections'),
('adminCatalog:publishing:services:read:all', 'adminCatalog', 'Read services publishing status'),
('adminCatalog:publishing:services:update:all', 'adminCatalog', 'Update services publishing status'),
('adminCatalog:publishing:products:read:all', 'adminCatalog', 'Read products publishing status'),
('adminCatalog:publishing:products:update:all', 'adminCatalog', 'Update products publishing status'),
-- adminOrg (all with :all suffix)
('adminOrg:module:access', 'adminOrg', 'Access to Organization Admin module'),
('adminOrg:users:read:all', 'adminOrg', 'Read users and their details'),
('adminOrg:users:create:all', 'adminOrg', 'Create new users'),
('adminOrg:users:update:all', 'adminOrg', 'Update user details'),
('adminOrg:users:delete:all', 'adminOrg', 'Delete users'),
('adminOrg:users:manage_groups:all', 'adminOrg', 'Manage user group memberships'),
('adminOrg:users:reset_password:all', 'adminOrg', 'Reset user password (admin function)'),
('adminOrg:groups:read:all', 'adminOrg', 'Read groups and their details'),
('adminOrg:groups:create:all', 'adminOrg', 'Create new groups'),
('adminOrg:groups:update:all', 'adminOrg', 'Update group details'),
('adminOrg:groups:delete:all', 'adminOrg', 'Delete groups'),
('adminOrg:groups:manage_members:all', 'adminOrg', 'Manage group members'),
('adminOrg:groups:change_owner:all', 'adminOrg', 'Change group owner'),
('adminOrg:settings:read:all', 'adminOrg', 'Read organization settings (all)'),
('adminOrg:settings:update:all', 'adminOrg', 'Update organization settings (all)'),
('adminOrg:settings:access', 'adminOrg', 'Access to view Organization settings section in UI'),
-- common, system, adminServices
('settings:read:common', 'common', 'Read common/public settings'),
('system:settings:read:all', 'system', 'Read system-wide settings'),
('system:settings:update:all', 'system', 'Update system-wide settings'),
('system:settings:access', 'system', 'Access to view Application Settings in navigation'),
('adminServices:module:access', 'adminServices', 'Access to Services Admin module in navigation'),
('adminServices:settings:access', 'adminServices', 'Access to view Services settings section in UI')
ON CONFLICT (permission_key) DO NOTHING;

-- 2. Create role groups and assign permissions
DO $$
DECLARE
    sys_user_id UUID;
    admin_group_id UUID;
    editor_group_id UUID;
    specialist_group_id UUID;
    auditor_group_id UUID;
    publisher_products_group_id UUID;
    publisher_services_group_id UUID;
    analyst_group_id UUID;
    services_admin_group_id UUID;
    services_auditor_group_id UUID;
    org_admin_group_id UUID;
    org_editor_group_id UUID;
    org_auditor_group_id UUID;
    catalog_admin_group_id UUID;
    catalog_editor_group_id UUID;
    catalog_auditor_group_id UUID;
    price_admin_group_id UUID;
    price_editor_group_id UUID;
    price_analyst_group_id UUID;
    price_auditor_group_id UUID;
    reg_users_group_id UUID := '440e8400-e29b-41d4-a716-446655440002';
BEGIN
    SELECT user_id INTO sys_user_id FROM app.users WHERE username = 'admin' LIMIT 1;
    IF sys_user_id IS NULL THEN
        RAISE NOTICE 'System admin user not found, authorization seed may be incomplete';
    END IF;

    -- role.users.registered (fixed UUID)
    INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
    VALUES (reg_users_group_id, 'role.users.registered', true, sys_user_id, sys_user_id, 'All registered users', 'active')
    ON CONFLICT (group_name) DO UPDATE SET group_description = EXCLUDED.group_description;

    -- adminProducts groups
    INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
    VALUES (gen_random_uuid(), 'role.adminProducts.admin', true, sys_user_id, sys_user_id, 'Product Administrators with full access', 'active')
    ON CONFLICT (group_name) DO UPDATE SET group_description = EXCLUDED.group_description RETURNING group_id INTO admin_group_id;
    INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
    VALUES (gen_random_uuid(), 'role.adminProducts.editor', true, sys_user_id, sys_user_id, 'Product Editors (Content Management)', 'active')
    ON CONFLICT (group_name) DO UPDATE SET group_description = EXCLUDED.group_description RETURNING group_id INTO editor_group_id;
    INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
    VALUES (gen_random_uuid(), 'role.adminProducts.specialist', true, sys_user_id, sys_user_id, 'Product Specialists (Own products management)', 'active')
    ON CONFLICT (group_name) DO UPDATE SET group_description = EXCLUDED.group_description RETURNING group_id INTO specialist_group_id;
    INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
    VALUES (gen_random_uuid(), 'role.adminProducts.auditor', true, sys_user_id, sys_user_id, 'Product Auditors (Read-only access)', 'active')
    ON CONFLICT (group_name) DO UPDATE SET group_description = EXCLUDED.group_description RETURNING group_id INTO auditor_group_id;

    -- adminPricing groups
    INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
    VALUES (gen_random_uuid(), 'role.adminPricing.admin', true, sys_user_id, sys_user_id, 'Pricing Administrators with full access', 'active')
    ON CONFLICT (group_name) DO UPDATE SET group_description = EXCLUDED.group_description RETURNING group_id INTO price_admin_group_id;
    INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
    VALUES (gen_random_uuid(), 'role.adminPricing.editor', true, sys_user_id, sys_user_id, 'Pricing Editors (No settings access)', 'active')
    ON CONFLICT (group_name) DO UPDATE SET group_description = EXCLUDED.group_description RETURNING group_id INTO price_editor_group_id;
    INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
    VALUES (gen_random_uuid(), 'role.adminPricing.analyst', true, sys_user_id, sys_user_id, 'Pricing Analysts (Price lists management only, others read-only)', 'active')
    ON CONFLICT (group_name) DO UPDATE SET group_description = EXCLUDED.group_description RETURNING group_id INTO analyst_group_id;
    INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
    VALUES (gen_random_uuid(), 'role.adminPricing.auditor', true, sys_user_id, sys_user_id, 'Pricing Auditors (Read-only access)', 'active')
    ON CONFLICT (group_name) DO UPDATE SET group_description = EXCLUDED.group_description RETURNING group_id INTO price_auditor_group_id;

    -- adminCatalog groups
    INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
    VALUES (gen_random_uuid(), 'role.adminCatalog.admin', true, sys_user_id, sys_user_id, 'Catalog Administrators with full access', 'active')
    ON CONFLICT (group_name) DO UPDATE SET group_description = EXCLUDED.group_description RETURNING group_id INTO catalog_admin_group_id;
    INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
    VALUES (gen_random_uuid(), 'role.adminCatalog.editor', true, sys_user_id, sys_user_id, 'Catalog Editors (Content management, no settings)', 'active')
    ON CONFLICT (group_name) DO UPDATE SET group_description = EXCLUDED.group_description RETURNING group_id INTO catalog_editor_group_id;
    INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
    VALUES (gen_random_uuid(), 'role.adminCatalog.products.publisher', true, sys_user_id, sys_user_id, 'Catalog Products Publishers', 'active')
    ON CONFLICT (group_name) DO UPDATE SET group_description = EXCLUDED.group_description RETURNING group_id INTO publisher_products_group_id;
    INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
    VALUES (gen_random_uuid(), 'role.adminCatalog.services.publisher', true, sys_user_id, sys_user_id, 'Catalog Services Publishers', 'active')
    ON CONFLICT (group_name) DO UPDATE SET group_description = EXCLUDED.group_description RETURNING group_id INTO publisher_services_group_id;
    INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
    VALUES (gen_random_uuid(), 'role.adminCatalog.auditor', true, sys_user_id, sys_user_id, 'Catalog Auditors (Read-only access)', 'active')
    ON CONFLICT (group_name) DO UPDATE SET group_description = EXCLUDED.group_description RETURNING group_id INTO catalog_auditor_group_id;

    -- adminOrg groups
    INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
    VALUES (gen_random_uuid(), 'role.adminOrg.admin', true, sys_user_id, sys_user_id, 'Organization Administrators with full access', 'active')
    ON CONFLICT (group_name) DO UPDATE SET group_description = EXCLUDED.group_description RETURNING group_id INTO org_admin_group_id;
    INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
    VALUES (gen_random_uuid(), 'role.adminOrg.editor', true, sys_user_id, sys_user_id, 'Organization Editors (Users and Groups management, no settings)', 'active')
    ON CONFLICT (group_name) DO UPDATE SET group_description = EXCLUDED.group_description RETURNING group_id INTO org_editor_group_id;
    INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
    VALUES (gen_random_uuid(), 'role.adminOrg.auditor', true, sys_user_id, sys_user_id, 'Organization Auditors (Read-only access)', 'active')
    ON CONFLICT (group_name) DO UPDATE SET group_description = EXCLUDED.group_description RETURNING group_id INTO org_auditor_group_id;

    -- adminServices groups
    INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
    VALUES (gen_random_uuid(), 'role.adminServices.admin', true, sys_user_id, sys_user_id, 'Services Administrators with full access', 'active')
    ON CONFLICT (group_name) DO UPDATE SET group_description = EXCLUDED.group_description RETURNING group_id INTO services_admin_group_id;
    INSERT INTO app.groups (group_id, group_name, is_system, group_owner, group_created_by, group_description, group_status)
    VALUES (gen_random_uuid(), 'role.adminServices.auditor', true, sys_user_id, sys_user_id, 'Services Auditors (Read-only access)', 'active')
    ON CONFLICT (group_name) DO UPDATE SET group_description = EXCLUDED.group_description RETURNING group_id INTO services_auditor_group_id;

    -- Reload group IDs (RETURNING only works for the last INSERT in a multi-insert, so re-select)
    SELECT group_id INTO admin_group_id FROM app.groups WHERE group_name = 'role.adminProducts.admin' LIMIT 1;
    SELECT group_id INTO editor_group_id FROM app.groups WHERE group_name = 'role.adminProducts.editor' LIMIT 1;
    SELECT group_id INTO specialist_group_id FROM app.groups WHERE group_name = 'role.adminProducts.specialist' LIMIT 1;
    SELECT group_id INTO auditor_group_id FROM app.groups WHERE group_name = 'role.adminProducts.auditor' LIMIT 1;
    SELECT group_id INTO price_admin_group_id FROM app.groups WHERE group_name = 'role.adminPricing.admin' LIMIT 1;
    SELECT group_id INTO price_editor_group_id FROM app.groups WHERE group_name = 'role.adminPricing.editor' LIMIT 1;
    SELECT group_id INTO analyst_group_id FROM app.groups WHERE group_name = 'role.adminPricing.analyst' LIMIT 1;
    SELECT group_id INTO price_auditor_group_id FROM app.groups WHERE group_name = 'role.adminPricing.auditor' LIMIT 1;
    SELECT group_id INTO catalog_admin_group_id FROM app.groups WHERE group_name = 'role.adminCatalog.admin' LIMIT 1;
    SELECT group_id INTO catalog_editor_group_id FROM app.groups WHERE group_name = 'role.adminCatalog.editor' LIMIT 1;
    SELECT group_id INTO publisher_products_group_id FROM app.groups WHERE group_name = 'role.adminCatalog.products.publisher' LIMIT 1;
    SELECT group_id INTO publisher_services_group_id FROM app.groups WHERE group_name = 'role.adminCatalog.services.publisher' LIMIT 1;
    SELECT group_id INTO catalog_auditor_group_id FROM app.groups WHERE group_name = 'role.adminCatalog.auditor' LIMIT 1;
    SELECT group_id INTO org_admin_group_id FROM app.groups WHERE group_name = 'role.adminOrg.admin' LIMIT 1;
    SELECT group_id INTO org_editor_group_id FROM app.groups WHERE group_name = 'role.adminOrg.editor' LIMIT 1;
    SELECT group_id INTO org_auditor_group_id FROM app.groups WHERE group_name = 'role.adminOrg.auditor' LIMIT 1;
    SELECT group_id INTO services_admin_group_id FROM app.groups WHERE group_name = 'role.adminServices.admin' LIMIT 1;
    SELECT group_id INTO services_auditor_group_id FROM app.groups WHERE group_name = 'role.adminServices.auditor' LIMIT 1;

    -- Grant ALL permissions to sysadmins
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT g.group_id, p.permission_key, sys_user_id
    FROM app.groups g
    CROSS JOIN app.permissions p
    WHERE g.group_name = 'sysadmins'
    ON CONFLICT DO NOTHING;

    -- adminProducts: admin (all), editor, specialist, auditor
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT admin_group_id, permission_key, sys_user_id FROM app.permissions WHERE module = 'adminProducts' ON CONFLICT DO NOTHING;
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT editor_group_id, permission_key, sys_user_id FROM app.permissions WHERE permission_key IN ('adminProducts:module:access','adminProducts:items:read:all','adminProducts:items:update:all') ON CONFLICT DO NOTHING;
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT specialist_group_id, permission_key, sys_user_id FROM app.permissions WHERE permission_key IN ('adminProducts:module:access','adminProducts:items:create:all','adminProducts:items:read:own','adminProducts:items:update:own','adminProducts:items:change_owner:own') ON CONFLICT DO NOTHING;
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT auditor_group_id, permission_key, sys_user_id FROM app.permissions WHERE permission_key IN ('adminProducts:module:access','adminProducts:items:read:all','adminProducts:history:read:all') ON CONFLICT DO NOTHING;

    -- adminPricing: admin (all), editor (all except settings:update), analyst, auditor
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT price_admin_group_id, permission_key, sys_user_id FROM app.permissions WHERE module = 'adminPricing' ON CONFLICT DO NOTHING;
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT price_editor_group_id, permission_key, sys_user_id FROM app.permissions WHERE module = 'adminPricing' AND permission_key != 'adminPricing:settings:update:all' ON CONFLICT DO NOTHING;
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT analyst_group_id, permission_key, sys_user_id FROM app.permissions WHERE permission_key IN ('adminPricing:module:access','adminPricing:pricelists:read:all','adminPricing:pricelists:create:all','adminPricing:pricelists:update:all','adminPricing:pricelists:delete:all','adminPricing:items:read:all','adminPricing:items:create:all','adminPricing:items:update:all','adminPricing:items:delete:all','adminPricing:currencies:read:all','adminPricing:taxes:read:all') ON CONFLICT DO NOTHING;
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT price_auditor_group_id, permission_key, sys_user_id FROM app.permissions WHERE permission_key IN ('adminPricing:module:access','adminPricing:pricelists:read:all','adminPricing:items:read:all','adminPricing:currencies:read:all','adminPricing:taxes:read:all') ON CONFLICT DO NOTHING;

    -- adminCatalog: admin (all), editor (no settings), publishers (+ sections:read:all), auditor
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT catalog_admin_group_id, permission_key, sys_user_id FROM app.permissions WHERE module = 'adminCatalog' ON CONFLICT DO NOTHING;
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT catalog_editor_group_id, permission_key, sys_user_id FROM app.permissions WHERE module = 'adminCatalog' AND permission_key NOT LIKE 'adminCatalog:settings:%' ON CONFLICT DO NOTHING;
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT publisher_products_group_id, permission_key, sys_user_id FROM app.permissions WHERE permission_key IN ('adminCatalog:module:access','adminCatalog:sections:read:all','adminCatalog:publishing:products:read:all','adminCatalog:publishing:products:update:all') ON CONFLICT DO NOTHING;
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT publisher_services_group_id, permission_key, sys_user_id FROM app.permissions WHERE permission_key IN ('adminCatalog:module:access','adminCatalog:sections:read:all','adminCatalog:publishing:services:read:all','adminCatalog:publishing:services:update:all') ON CONFLICT DO NOTHING;
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT catalog_auditor_group_id, permission_key, sys_user_id FROM app.permissions WHERE permission_key IN ('adminCatalog:module:access','adminCatalog:sections:read:all','adminCatalog:publishing:products:read:all','adminCatalog:publishing:services:read:all','adminCatalog:settings:read:all') ON CONFLICT DO NOTHING;

    -- adminOrg: admin (all), editor (no settings), auditor
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT org_admin_group_id, permission_key, sys_user_id FROM app.permissions WHERE module = 'adminOrg' ON CONFLICT DO NOTHING;
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT org_editor_group_id, permission_key, sys_user_id FROM app.permissions WHERE module = 'adminOrg' AND permission_key NOT LIKE 'adminOrg:settings:%' ON CONFLICT DO NOTHING;
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT org_auditor_group_id, permission_key, sys_user_id FROM app.permissions WHERE permission_key IN ('adminOrg:module:access','adminOrg:users:read:all','adminOrg:groups:read:all','adminOrg:settings:read:all') ON CONFLICT DO NOTHING;

    -- adminServices: admin and auditor
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT services_admin_group_id, permission_key, sys_user_id FROM app.permissions WHERE permission_key IN ('adminServices:module:access','adminServices:settings:access') ON CONFLICT DO NOTHING;
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT services_auditor_group_id, permission_key, sys_user_id FROM app.permissions WHERE permission_key IN ('adminServices:module:access','adminServices:settings:access') ON CONFLICT DO NOTHING;

    -- Settings visibility: grant settings:access to product/pricing/catalog/org admins and auditors (handled above via module grants for adminProducts etc.; sysadmins have all)
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT g.group_id, p.permission_key, sys_user_id
    FROM app.groups g
    CROSS JOIN app.permissions p
    WHERE p.permission_key IN ('adminProducts:settings:access','adminPricing:settings:access','adminCatalog:settings:access','adminOrg:settings:access')
    AND g.group_name IN ('role.adminProducts.admin','role.adminProducts.auditor','role.adminPricing.admin','role.adminPricing.auditor','role.adminCatalog.admin','role.adminCatalog.auditor','role.adminOrg.admin','role.adminOrg.auditor')
    ON CONFLICT DO NOTHING;

    -- role.users.registered: settings:read:common
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    VALUES (reg_users_group_id, 'settings:read:common', sys_user_id)
    ON CONFLICT DO NOTHING;

    -- Add all users to role.users.registered
    INSERT INTO app.group_members (group_id, user_id, added_by)
    SELECT reg_users_group_id, user_id, sys_user_id FROM app.users
    ON CONFLICT (group_id, user_id, is_active) DO NOTHING;
END $$;
