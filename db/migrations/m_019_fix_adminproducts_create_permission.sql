-- Migration: 019_fix_adminproducts_create_permission
-- Description: Fixes adminProducts:items:create permission to use :all suffix for consistency with other modules
-- Issue: adminProducts:items:create was created without :all suffix, but guard expects permissions with :all or :own suffix
-- Solution: Add adminProducts:items:create:all permission and assign it to all groups that have the old permission

-- 1. Add new permission with :all suffix
INSERT INTO app.permissions (permission_key, module, description) VALUES
('adminProducts:items:create:all', 'adminProducts', 'Create new products')
ON CONFLICT (permission_key) DO NOTHING;

-- 2. Grant new permission to all groups that have the old permission
DO $$
DECLARE
    -- Lookup system admin user ID for granted_by field in group_permissions table
    -- This field tracks who granted the permission (audit trail)
    sys_user_id UUID;
BEGIN
    -- Find the system administrator user
    -- This user ID is used as granted_by value when creating new group_permissions records
    SELECT user_id INTO sys_user_id FROM app.users WHERE username = 'admin' LIMIT 1;
    
    -- Fallback safety check
    IF sys_user_id IS NULL THEN
        RAISE NOTICE 'System admin user not found, permissions will be created without creator reference';
    END IF;

    -- Grant adminProducts:items:create:all to all groups that have adminProducts:items:create
    -- Use existing granted_by from old permission, or fallback to sys_user_id
    INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
    SELECT DISTINCT gp.group_id, 'adminProducts:items:create:all', COALESCE(gp.granted_by, sys_user_id)
    FROM app.group_permissions gp
    WHERE gp.permission_key = 'adminProducts:items:create'
    ON CONFLICT DO NOTHING;

    -- Remove old permission from group_permissions
    DELETE FROM app.group_permissions
    WHERE permission_key = 'adminProducts:items:create';

    -- Remove old permission from permissions table (it's a bug, not a feature)
    DELETE FROM app.permissions
    WHERE permission_key = 'adminProducts:items:create';

END $$;
