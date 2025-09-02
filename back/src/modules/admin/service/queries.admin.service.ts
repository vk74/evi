/**
 * queries.admin.service.ts - version 1.0.0
 * SQL queries for services administration operations.
 * 
 * Contains all SQL queries used by services admin module.
 * Queries are parameterized to prevent SQL injection.
 * 
 * File: queries.admin.service.ts
 */

export const queries = {
    /**
     * Creates a new service (only basic fields)
     * Parameters: [name, priority, status, description_short, description_long, 
     * purpose, comments, is_public, icon_name, created_by]
     * Note: id is generated automatically by database default value
     * Note: visibility preferences use database defaults
     */
    createService: `
        INSERT INTO app.services (
            name, priority, status, description_short, description_long, 
            purpose, comments, is_public, icon_name, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, name, description_short, description_long, purpose, comments, created_at
    `,

    /**
     * Creates a service user role
     * Parameters: [service_id, user_id, role_type, created_by]
     */
    createServiceUser: `
        INSERT INTO app.service_users (service_id, user_id, role_type, created_by)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (service_id, user_id, role_type) DO NOTHING
    `,

    /**
     * Creates a service group role
     * Parameters: [service_id, group_id, role_type, created_by]
     */
    createServiceGroup: `
        INSERT INTO app.service_groups (service_id, group_id, role_type, created_by)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (service_id, group_id, role_type) DO NOTHING
    `,

    /**
     * Checks if service name already exists
     * Parameters: [name]
     */
    checkServiceNameExists: `
        SELECT id FROM app.services 
        WHERE LOWER(name) = LOWER($1)
    `,

    /**
     * Fetches all services with pagination and filtering (basic info only)
     * Parameters: [limit, offset, search_term]
     */
    fetchServices: `
        SELECT 
            s.id,
            s.name,
            s.icon_name,
            s.priority,
            s.status,
            s.description_short,
            s.description_long,
            s.purpose,
            s.comments,
            s.is_public,
            s.created_at,
            s.created_by,
            s.modified_at,
            s.modified_by
        FROM app.services s
        WHERE ($3::text IS NULL OR 
               LOWER(s.name) LIKE LOWER('%' || $3 || '%') OR
               LOWER(s.description_short) LIKE LOWER('%' || $3 || '%'))
        ORDER BY s.name ASC
        LIMIT $1 OFFSET $2
    `,

    /**
     * Counts total services for pagination
     * Parameters: [search_term]
     */
    countServices: `
        SELECT COUNT(*) as total
        FROM app.services s
        WHERE ($1::text IS NULL OR 
               LOWER(s.name) LIKE LOWER('%' || $1 || '%') OR
               LOWER(s.description_short) LIKE LOWER('%' || $1 || '%'))
    `,

    /**
     * Fetches a single service by ID with all user and group roles
     * Parameters: [id]
     */
    fetchServiceWithRoles: `
        SELECT 
            s.id, s.name, s.icon_name, s.priority, s.status, s.description_short,
            s.description_long, s.purpose, s.comments, s.is_public,
            s.created_at, s.created_by, s.modified_at, s.modified_by,
            -- Пользователи
            u1.username as owner,
            u2.username as backup_owner,
            u3.username as technical_owner,
            u4.username as backup_technical_owner,
            u5.username as dispatcher,
            -- Группы поддержки
            g1.group_name as support_tier1,
            g2.group_name as support_tier2,
            g3.group_name as support_tier3,
            -- Visibility preferences for service card roles
            s.show_owner,
            s.show_backup_owner,
            s.show_technical_owner,
            s.show_backup_technical_owner,
            s.show_dispatcher,
            s.show_support_tier1,
            s.show_support_tier2,
            s.show_support_tier3
        FROM app.services s
        LEFT JOIN app.service_users su1 ON s.id = su1.service_id AND su1.role_type = 'owner'
        LEFT JOIN app.users u1 ON su1.user_id = u1.user_id
        LEFT JOIN app.service_users su2 ON s.id = su2.service_id AND su2.role_type = 'backup_owner'
        LEFT JOIN app.users u2 ON su2.user_id = u2.user_id
        LEFT JOIN app.service_users su3 ON s.id = su3.service_id AND su3.role_type = 'technical_owner'
        LEFT JOIN app.users u3 ON su3.user_id = u3.user_id
        LEFT JOIN app.service_users su4 ON s.id = su4.service_id AND su4.role_type = 'backup_technical_owner'
        LEFT JOIN app.users u4 ON su4.user_id = u4.user_id
        LEFT JOIN app.service_users su5 ON s.id = su5.service_id AND su5.role_type = 'dispatcher'
        LEFT JOIN app.users u5 ON su5.user_id = u5.user_id
        LEFT JOIN app.service_groups sg1 ON s.id = sg1.service_id AND sg1.role_type = 'support_tier1'
        LEFT JOIN app.groups g1 ON sg1.group_id = g1.group_id
        LEFT JOIN app.service_groups sg2 ON s.id = sg2.service_id AND sg2.role_type = 'support_tier2'
        LEFT JOIN app.groups g2 ON sg2.group_id = g2.group_id
        LEFT JOIN app.service_groups sg3 ON s.id = sg3.service_id AND sg3.role_type = 'support_tier3'
        LEFT JOIN app.groups g3 ON sg3.group_id = g3.group_id
        WHERE s.id = $1
    `,

    /**
     * Fetches access control groups for a service
     * Parameters: [service_id]
     */
    fetchServiceAccessGroups: `
        SELECT g.name, sg.role_type
        FROM app.service_groups sg
        JOIN app.groups g ON sg.group_id = g.id
        WHERE sg.service_id = $1 AND sg.role_type IN ('access_allowed', 'access_denied')
        ORDER BY sg.role_type, g.name
    `,

    /**
     * Fetches access denied users for a service
     * Parameters: [service_id]
     */
    fetchServiceAccessUsers: `
        SELECT u.username, su.role_type
        FROM app.service_users su
        JOIN app.users u ON su.user_id = u.id
        WHERE su.service_id = $1 AND su.role_type = 'access_denied'
        ORDER BY u.username
    `,

    /**
     * Updates an existing service
     * Parameters: [id, name, priority, status, description_short, description_long,
     * purpose, comments, is_public, icon_name, modified_by]
     * Note: visibility preferences are updated separately if needed
     */
    updateService: `
        UPDATE app.services SET
            name = $2,
            priority = $3,
            status = $4,
            description_short = $5,
            description_long = $6,
            purpose = $7,
            comments = $8,
            is_public = $9,
            icon_name = $10,
            modified_by = $11,
            modified_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, name, modified_at
    `,

    /**
     * Deletes all user roles for a service
     * Parameters: [service_id]
     */
    deleteServiceUsers: `
        DELETE FROM app.service_users WHERE service_id = $1
    `,

    /**
     * Deletes all group roles for a service
     * Parameters: [service_id]
     */
    deleteServiceGroups: `
        DELETE FROM app.service_groups WHERE service_id = $1
    `,

    /**
     * Deletes services by IDs
     * Parameters: [ids] - array of service IDs
     */
    deleteServices: `
        DELETE FROM app.services 
        WHERE id = ANY($1)
        RETURNING id, name
    `,

    /**
     * Checks if service exists by ID
     * Parameters: [id]
     */
    checkServiceExists: `
        SELECT id FROM app.services WHERE id = $1
    `,

    /**
     * Checks if service name exists excluding current service (for updates)
     * Parameters: [name, exclude_id]
     */
    checkServiceNameExistsExcluding: `
        SELECT id FROM app.services 
        WHERE LOWER(name) = LOWER($1) AND id != $2
    `,

    /**
     * Fetches publishing sections for services
     * Returns: name, owner, status, is_public from catalog_sections
     */
    fetchPublishingSections: `
        SELECT 
            id,
            name,
            owner,
            status,
            is_public
        FROM app.catalog_sections
        ORDER BY name ASC
    `,

    /**
     * Fetches all services with pagination, search and sorting
     * Parameters: [searchTerm, limit, offset]
     */
    fetchServicesWithRoles: `
        SELECT 
            s.id, s.name, s.icon_name, s.priority, s.status, s.is_public,
            s.description_short, s.description_long, s.purpose, s.comments,
            s.created_at, s.created_by, s.modified_at, s.modified_by,
            u1.username as owner,
            u2.username as technical_owner,
            -- Visibility preferences for service card roles
            s.show_owner,
            s.show_backup_owner,
            s.show_technical_owner,
            s.show_backup_technical_owner,
            s.show_dispatcher,
            s.show_support_tier1,
            s.show_support_tier2,
            s.show_support_tier3
        FROM app.services s
        LEFT JOIN app.service_users su1 ON s.id = su1.service_id AND su1.role_type = 'owner'
        LEFT JOIN app.users u1 ON su1.user_id = u1.user_id
        LEFT JOIN app.service_users su2 ON s.id = su2.service_id AND su2.role_type = 'technical_owner'
        LEFT JOIN app.users u2 ON su2.user_id = u2.user_id
        WHERE ($1::text IS NULL OR LOWER(s.name) LIKE LOWER('%' || $1 || '%'))
        ORDER BY s.name ASC
        LIMIT $2 OFFSET $3
    `,

    /**
     * Counts total services for pagination with search
     * Parameters: [searchTerm]
     */
    countServicesWithSearch: `
        SELECT COUNT(*) as total
        FROM app.services s
        WHERE ($1::text IS NULL OR LOWER(s.name) LIKE LOWER('%' || $1 || '%'))
    `,

    /**
     * Checks if all provided catalog section IDs exist
     * Parameters: [section_ids uuid[]]
     */
    checkSectionsExist: `
        SELECT id
        FROM app.catalog_sections
        WHERE id = ANY($1)
    `,

    /**
     * Fetches current section bindings for a service
     * Parameters: [service_id]
     */
    fetchServiceSectionIds: `
        SELECT section_id
        FROM app.section_services
        WHERE service_id = $1
        ORDER BY section_id
    `,

    /**
     * Deletes mapping of a service from a section
     * Parameters: [service_id, section_id]
     */
    deleteServiceFromSection: `
        DELETE FROM app.section_services
        WHERE service_id = $1 AND section_id = $2
    `,

    /**
     * Gets next service order (append index) within a section
     * Parameters: [section_id]
     */
    getNextOrderInSection: `
        SELECT COALESCE(MAX(service_order) + 1, 0) AS next_order
        FROM app.section_services
        WHERE section_id = $1
    `,

    /**
     * Inserts mapping into section_services with explicit order
     * Parameters: [section_id, service_id, service_order]
     */
    insertSectionService: `
        INSERT INTO app.section_services(section_id, service_id, service_order)
        VALUES ($1, $2, $3)
    `,

    /**
     * Resequences service_order within a section to be contiguous from 0
     * Parameters: [section_id]
     */
    resequenceSectionServices: `
        WITH ordered AS (
            SELECT service_id,
                   ROW_NUMBER() OVER (ORDER BY service_order ASC, service_id) - 1 AS new_order
            FROM app.section_services
            WHERE section_id = $1
        )
        UPDATE app.section_services ss
        SET service_order = o.new_order
        FROM ordered o
        WHERE ss.section_id = $1 AND ss.service_id = o.service_id
    `,

    /**
     * Updates visibility preferences for a service
     * Parameters: [service_id, show_owner, show_backup_owner, show_technical_owner, 
     * show_backup_technical_owner, show_dispatcher, show_support_tier1, 
     * show_support_tier2, show_support_tier3, modified_by]
     */
    updateServiceVisibilityPreferences: `
        UPDATE app.services SET
            show_owner = $2,
            show_backup_owner = $3,
            show_technical_owner = $4,
            show_backup_technical_owner = $5,
            show_dispatcher = $6,
            show_support_tier1 = $7,
            show_support_tier2 = $8,
            show_support_tier3 = $9,
            modified_by = $10,
            modified_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, name, modified_at
    `
}; 