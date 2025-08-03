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
     */
    createService: `
        INSERT INTO app.services (
            name, priority, status, description_short, description_long, 
            purpose, comments, is_public, icon_name, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, name, created_at
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
            s.modified_by,
            s.tile_preferred_width,
            s.tile_preferred_height
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
            s.id, s.name, s.priority, s.status, s.description_short,
            s.description_long, s.purpose, s.comments, s.is_public,
            s.created_at, s.created_by, s.modified_at, s.modified_by,
            s.tile_preferred_width, s.tile_preferred_height,
            -- Пользователи
            u1.username as owner,
            u2.username as backup_owner,
            u3.username as technical_owner,
            u4.username as backup_technical_owner,
            u5.username as dispatcher,
            -- Группы поддержки
            g1.name as support_tier1,
            g2.name as support_tier2,
            g3.name as support_tier3
        FROM app.services s
        LEFT JOIN app.service_users u1 ON s.id = u1.service_id AND u1.role_type = 'owner'
        LEFT JOIN app.service_users u2 ON s.id = u2.service_id AND u2.role_type = 'backup_owner'
        LEFT JOIN app.service_users u3 ON s.id = u3.service_id AND u3.role_type = 'technical_owner'
        LEFT JOIN app.service_users u4 ON s.id = u4.service_id AND u4.role_type = 'backup_technical_owner'
        LEFT JOIN app.service_users u5 ON s.id = u5.service_id AND u5.role_type = 'dispatcher'
        LEFT JOIN app.service_groups g1 ON s.id = g1.service_id AND g1.role_type = 'support_tier1'
        LEFT JOIN app.service_groups g2 ON s.id = g2.service_id AND g2.role_type = 'support_tier2'
        LEFT JOIN app.service_groups g3 ON s.id = g3.service_id AND g3.role_type = 'support_tier3'
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
     * Updates an existing service (basic fields only)
     * Parameters: [id, name, priority, status, description_short, description_long,
     * purpose, comments, is_public, modified_by]
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
            modified_by = $10,
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
    `
}; 