/**
 * version: 1.0.0
 * SQL queries for pricing administration module.
 * Contains parameterized queries related to pricing (currencies and future pricing entities).
 * File: queries.admin.pricing.ts (backend)
 */

export const queries = {
    /**
     * Fetch all currencies
     */
    fetchCurrencies: `
        SELECT 
            code,
            name,
            symbol,
            minor_units,
            rounding_mode,
            active
        FROM app.currencies
        ORDER BY code ASC
    `
};


