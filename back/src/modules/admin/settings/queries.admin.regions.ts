/**
 * queries.admin.regions.ts - version 1.0.0
 * SQL queries for regions administration operations.
 * 
 * Contains all SQL queries used by regions admin module.
 * Queries are parameterized to prevent SQL injection.
 * 
 * File: queries.admin.regions.ts
 */

export const queries = {
    /**
     * Fetches all regions ordered by name
     * No parameters
     */
    fetchAllRegions: `
        SELECT 
            region_id,
            region_name,
            created_at,
            updated_at
        FROM app.regions
        ORDER BY region_name ASC
    `,

    /**
     * Creates a new region
     * Parameters: [region_name]
     * Note: region_id is generated automatically by database default value
     */
    createRegion: `
        INSERT INTO app.regions (region_name)
        VALUES ($1)
        RETURNING region_id, region_name, created_at, updated_at
    `,

    /**
     * Updates a region by ID
     * Parameters: [region_name, region_id]
     */
    updateRegion: `
        UPDATE app.regions
        SET region_name = $1,
            updated_at = NOW()
        WHERE region_id = $2
        RETURNING region_id, region_name, created_at, updated_at
    `,

    /**
     * Deletes regions by array of IDs
     * Parameters: [region_ids array]
     */
    deleteRegions: `
        DELETE FROM app.regions
        WHERE region_id = ANY($1::integer[])
        RETURNING region_id, region_name
    `,

    /**
     * Checks if region exists by ID
     * Parameters: [region_id]
     */
    checkRegionExists: `
        SELECT region_id, region_name
        FROM app.regions
        WHERE region_id = $1
    `,

    /**
     * Checks if region name already exists
     * Parameters: [region_name]
     */
    checkRegionNameExists: `
        SELECT region_id, region_name
        FROM app.regions
        WHERE LOWER(region_name) = LOWER($1)
    `,

    /**
     * Checks if region name exists excluding a specific region ID
     * Parameters: [region_name, exclude_region_id]
     */
    checkRegionNameExistsExcluding: `
        SELECT region_id, region_name
        FROM app.regions
        WHERE LOWER(region_name) = LOWER($1)
        AND region_id != $2
    `
}

