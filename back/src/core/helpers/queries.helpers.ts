/**
 * version: 1.2.0
 * SQL queries for core helpers.
 * Contains parameterized queries related to core helper functions.
 * File: queries.helpers.ts (backend)
 * 
 * Changes in v1.1.0:
 * - Added fetchActivePriceListIds query for fetching active price list IDs
 * 
 * Changes in v1.2.0:
 * - Removed fetchAppCountries query (unused; countries list endpoint removed)
 */

export const queries = {
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

