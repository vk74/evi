/**
 * version: 1.0.0
 * SQL queries for core helpers.
 * Contains parameterized queries related to core helper functions.
 * File: queries.helpers.ts (backend)
 */

export const queries = {
    // ============================================
    // Countries Queries
    // ============================================

    /**
     * Fetch list of available countries from app.app_countries ENUM
     * Returns countries ordered by enum sort order
     */
    fetchAppCountries: `
        SELECT enumlabel::text as enumlabel
        FROM pg_enum 
        WHERE enumtypid = (
            SELECT oid 
            FROM pg_type 
            WHERE typname = 'app_countries'
        )
        ORDER BY enumsortorder ASC
    `
};

