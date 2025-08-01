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
     * Creates a new service
     * Parameters: [name, support_tier1, support_tier2, support_tier3, owner, backup_owner, 
     * technical_owner, backup_technical_owner, dispatcher, priority, status, description_short, 
     * description_long, purpose, comments, is_public, access_allowed_groups, access_denied_groups, 
     * access_denied_users, created_by]
     * Note: id is generated automatically by database default value
     */
    createService: `
        INSERT INTO app.services (
            name, support_tier1, support_tier2, support_tier3, owner, backup_owner,
            technical_owner, backup_technical_owner, dispatcher, priority, status,
            description_short, description_long, purpose, comments, is_public,
            access_allowed_groups, access_denied_groups, access_denied_users, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        RETURNING id, name, created_at
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
     * Fetches all services with pagination and filtering
     * Parameters: [limit, offset, search_term]
     */
    fetchServices: `
        SELECT 
            s.id,
            s.name,
            s.support_tier1,
            s.support_tier2,
            s.support_tier3,
            s.owner,
            s.backup_owner,
            s.technical_owner,
            s.backup_technical_owner,
            s.dispatcher,
            s.priority,
            s.status,
            s.description_short,
            s.description_long,
            s.purpose,
            s.comments,
            s.is_public,
            s.access_allowed_groups,
            s.access_denied_groups,
            s.access_denied_users,
            s.created_at,
            s.created_by,
            s.modified_at,
            s.modified_by,
            s.tile_preferred_width,
            s.tile_preferred_height
        FROM app.services s
        WHERE ($3::text IS NULL OR 
               LOWER(s.name) LIKE LOWER('%' || $3 || '%') OR
               LOWER(s.owner) LIKE LOWER('%' || $3 || '%') OR
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
               LOWER(s.owner) LIKE LOWER('%' || $1 || '%') OR
               LOWER(s.description_short) LIKE LOWER('%' || $1 || '%'))
    `,

    /**
     * Fetches a single service by ID
     * Parameters: [id]
     */
    fetchServiceById: `
        SELECT 
            s.id,
            s.name,
            s.support_tier1,
            s.support_tier2,
            s.support_tier3,
            s.owner,
            s.backup_owner,
            s.technical_owner,
            s.backup_technical_owner,
            s.dispatcher,
            s.priority,
            s.status,
            s.description_short,
            s.description_long,
            s.purpose,
            s.comments,
            s.is_public,
            s.access_allowed_groups,
            s.access_denied_groups,
            s.access_denied_users,
            s.created_at,
            s.created_by,
            s.modified_at,
            s.modified_by,
            s.tile_preferred_width,
            s.tile_preferred_height
        FROM app.services s
        WHERE s.id = $1
    `,

    /**
     * Updates an existing service
     * Parameters: [id, name, support_tier1, support_tier2, support_tier3, owner, backup_owner,
     * technical_owner, backup_technical_owner, dispatcher, priority, status, description_short,
     * description_long, purpose, comments, is_public, access_allowed_groups, access_denied_groups,
     * access_denied_users, modified_by]
     */
    updateService: `
        UPDATE app.services SET
            name = $2,
            support_tier1 = $3,
            support_tier2 = $4,
            support_tier3 = $5,
            owner = $6,
            backup_owner = $7,
            technical_owner = $8,
            backup_technical_owner = $9,
            dispatcher = $10,
            priority = $11,
            status = $12,
            description_short = $13,
            description_long = $14,
            purpose = $15,
            comments = $16,
            is_public = $17,
            access_allowed_groups = $18,
            access_denied_groups = $19,
            access_denied_users = $20,
            modified_by = $21,
            modified_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, name, modified_at
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
    `
}; 