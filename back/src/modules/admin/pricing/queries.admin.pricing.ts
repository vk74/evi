/**
 * version: 1.2.0
 * SQL queries for pricing administration module.
 * Contains parameterized queries related to pricing (currencies and price lists).
 * Includes integrity check queries.
 * File: queries.admin.pricing.ts (backend)
 */

export const queries = {
    // ============================================
    // Currency Queries
    // ============================================

    /**
     * Fetch all currencies
     */
    fetchCurrencies: `
        SELECT 
            code,
            name,
            symbol,
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
            active
        FROM app.currencies
        WHERE active = true
        ORDER BY code ASC
    `,

    /** Insert currency */
    insertCurrency: `
        INSERT INTO app.currencies (code, name, symbol, active)
        VALUES ($1, $2, $3, $4)
    `,

    /** Update currency (partial) */
    updateCurrency: `
        UPDATE app.currencies SET
            name = COALESCE($2, name),
            symbol = COALESCE($3, symbol),
            active = COALESCE($4, active),
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
    `,

    // ============================================
    // Price List Queries
    // ============================================

    /**
     * Fetch all price lists with owner info and pagination
     * Parameters: offset, limit
     */
    fetchAllPriceLists: `
        SELECT 
            pli.price_list_id,
            pli.name,
            pli.description,
            pli.currency_code,
            pli.is_active,
            pli.valid_from,
            pli.valid_to,
            pli.owner_id,
            u.username as owner_username,
            pli.created_at,
            pli.updated_at
        FROM app.price_lists_info pli
        LEFT JOIN app.users u ON pli.owner_id = u.user_id
        ORDER BY pli.price_list_id DESC
        LIMIT $1 OFFSET $2
    `,

    /**
     * Fetch price lists with search (by name or price_list_id)
     * Parameters: searchQuery, offset, limit
     */
    fetchPriceListsWithSearch: `
        SELECT 
            pli.price_list_id,
            pli.name,
            pli.description,
            pli.currency_code,
            pli.is_active,
            pli.valid_from,
            pli.valid_to,
            pli.owner_id,
            u.username as owner_username,
            pli.created_at,
            pli.updated_at
        FROM app.price_lists_info pli
        LEFT JOIN app.users u ON pli.owner_id = u.user_id
        WHERE 
            pli.name ILIKE $1
            OR CAST(pli.price_list_id AS TEXT) LIKE $1
        ORDER BY pli.price_list_id DESC
        LIMIT $2 OFFSET $3
    `,

    /**
     * Count total price lists
     */
    countPriceLists: `
        SELECT COUNT(*) as total
        FROM app.price_lists_info
    `,

    /**
     * Count price lists with search
     * Parameters: searchQuery
     */
    countPriceListsWithSearch: `
        SELECT COUNT(*) as total
        FROM app.price_lists_info pli
        WHERE 
            pli.name ILIKE $1
            OR CAST(pli.price_list_id AS TEXT) LIKE $1
    `,

    /**
     * Fetch single price list by ID
     * Parameters: price_list_id
     */
    fetchPriceListById: `
        SELECT 
            price_list_id,
            name,
            description,
            currency_code,
            is_active,
            valid_from,
            valid_to,
            owner_id,
            created_by,
            updated_by,
            created_at,
            updated_at
        FROM app.price_lists_info
        WHERE price_list_id = $1
    `,

    /**
     * Check if price list name exists (for uniqueness validation)
     * Parameters: name
     */
    checkPriceListNameExists: `
        SELECT 1 FROM app.price_lists_info
        WHERE name = $1
    `,

    /**
     * Check if price list name exists excluding specific ID (for update validation)
     * Parameters: name, price_list_id
     */
    checkPriceListNameExistsExcluding: `
        SELECT 1 FROM app.price_lists_info
        WHERE name = $1 AND price_list_id != $2
    `,

    /**
     * Insert new price list
     * Parameters: name, description, currency_code, is_active, valid_from, valid_to, 
     *             owner_id, created_by
     */
    insertPriceList: `
        INSERT INTO app.price_lists_info (
            name,
            description,
            currency_code,
            is_active,
            valid_from,
            valid_to,
            owner_id,
            created_by,
            updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
        RETURNING price_list_id
    `,

    /**
     * Update price list
     * Parameters: price_list_id, name, description, currency_code, is_active, 
     *             valid_from, valid_to, owner_id, updated_by
     */
    updatePriceList: `
        UPDATE app.price_lists_info SET
            name = COALESCE($2, name),
            description = $3,
            currency_code = COALESCE($4, currency_code),
            is_active = COALESCE($5, is_active),
            valid_from = COALESCE($6, valid_from),
            valid_to = COALESCE($7, valid_to),
            owner_id = $8,
            updated_by = $9,
            updated_at = NOW()
        WHERE price_list_id = $1
        RETURNING price_list_id
    `,

    /**
     * Delete price list by ID
     * Parameters: price_list_id
     */
    deletePriceList: `
        DELETE FROM app.price_lists_info
        WHERE price_list_id = $1
    `
};


