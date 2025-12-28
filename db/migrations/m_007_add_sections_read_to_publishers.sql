-- Migration: 007_add_sections_read_to_publishers
-- Description: Adds adminCatalog:sections:read:all permission to publisher roles so they can view sections when publishing items.

DO $$
DECLARE
    -- Lookup system admin user ID dynamically
    sys_user_id UUID;
    
    -- Role IDs
    publisher_products_group_id UUID;
    publisher_services_group_id UUID;
BEGIN
    -- Find the system administrator
    SELECT user_id INTO sys_user_id FROM app.users WHERE username = 'admin' LIMIT 1;
    
    -- Fallback safety check
    IF sys_user_id IS NULL THEN
        RAISE NOTICE 'System admin user not found, authorization groups will be created without creator reference';
    END IF;

    -- Get Role IDs
    SELECT group_id INTO publisher_products_group_id FROM app.groups WHERE group_name = 'role.adminCatalog.products.publisher';
    SELECT group_id INTO publisher_services_group_id FROM app.groups WHERE group_name = 'role.adminCatalog.services.publisher';

    -- Add permissions if roles exist
    
    -- Products Publisher
    IF publisher_products_group_id IS NOT NULL THEN
        INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
        VALUES (publisher_products_group_id, 'adminCatalog:sections:read:all', sys_user_id)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Services Publisher
    IF publisher_services_group_id IS NOT NULL THEN
        INSERT INTO app.group_permissions (group_id, permission_key, granted_by)
        VALUES (publisher_services_group_id, 'adminCatalog:sections:read:all', sys_user_id)
        ON CONFLICT DO NOTHING;
    END IF;

END $$;

