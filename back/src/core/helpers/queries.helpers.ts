/**
 * version: 1.1.0
 * SQL queries for core helpers.
 * Contains parameterized queries related to core helper functions.
 * File: queries.helpers.ts (backend)
 * 
 * Changes in v1.1.0:
 * - Added fetchActivePriceListIds query for fetching active price list IDs
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
    `,

    // ============================================
    // Price Lists Queries
    // ============================================

    /**
     * Fetch list of active price list IDs from app.price_lists_info
     * Returns price_list_id values ordered by price_list_id
     */
    fetchActivePriceListIds: `
        SELECT price_list_id
        FROM app.price_lists_info
        WHERE is_active = true
        ORDER BY price_list_id ASC
    `
};

