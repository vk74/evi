-- Migration: 014_fix_org_permissions
-- Description: Renames adminOrg permissions to include :all suffix to match checkPermissions guard expectation.
--              Fixed to manually handle Foreign Key constraints by deleting referencing rows first.

DO $$
DECLARE
    perm RECORD;
BEGIN
    -- For each permission that needs renaming (except module:access)
    FOR perm IN 
        SELECT permission_key, description 
        FROM app.permissions 
        WHERE module = 'adminOrg' 
        AND permission_key NOT LIKE '%:all'
        AND permission_key != 'adminOrg:module:access'
    LOOP
        -- 1. Insert new permission with :all suffix
        INSERT INTO app.permissions (permission_key, module, description)
        VALUES (perm.permission_key || ':all', 'adminOrg', perm.description)
        ON CONFLICT DO NOTHING;

        -- 2. Copy group mappings from old permission to new permission
        INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
        SELECT group_id, perm.permission_key || ':all', granted_by
        FROM app.group_permissions
        WHERE permission_key = perm.permission_key
        ON CONFLICT DO NOTHING;

        -- 3. Delete old group mappings (Fix for FK constraint violation)
        DELETE FROM app.group_permissions 
        WHERE permission_key = perm.permission_key;

        -- 4. Delete old permission
        DELETE FROM app.permissions 
        WHERE permission_key = perm.permission_key;
        
    END LOOP;
END $$;
