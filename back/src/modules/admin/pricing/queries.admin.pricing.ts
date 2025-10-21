/**
 * version: 1.1.2
 * SQL queries for pricing administration module.
 * Contains parameterized queries related to pricing (currencies and future pricing entities).
 * Includes integrity check query for currency deletion.
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
    `,

    /**
     * Fetch only active currencies
     */
    fetchCurrenciesActiveOnly: `
        SELECT 
            code,
            name,
            symbol,
            minor_units,
            rounding_mode,
            active
        FROM app.currencies
        WHERE active = true
        ORDER BY code ASC
    `,

    /** Insert currency */
    insertCurrency: `
        INSERT INTO app.currencies (code, name, symbol, minor_units, rounding_mode, active)
        VALUES ($1, $2, $3, $4, $5, $6)
    `,

    /** Update currency (partial) */
    updateCurrency: `
        UPDATE app.currencies SET
            name = COALESCE($2, name),
            symbol = COALESCE($3, symbol),
            minor_units = COALESCE($4, minor_units),
            rounding_mode = COALESCE($5, rounding_mode),
            active = COALESCE($6, active),
            updated_at = NOW()
        WHERE code = $1
    `,

    /** Delete currency by code */
    deleteCurrency: `
        DELETE FROM app.currencies WHERE code = $1
    `,

    /** Check existence by code */
    existsCurrency: `
        SELECT 1 FROM app.currencies WHERE code = $1
    `,

    /** Check if currency is used in price lists */
    isCurrencyUsedInPriceLists: `
        SELECT 1 FROM app.price_lists_info WHERE currency_code = $1 LIMIT 1
    `
};


