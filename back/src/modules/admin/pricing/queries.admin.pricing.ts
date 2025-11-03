    /**
     * version: 1.3.4
     * SQL queries for pricing administration module.
     * Contains parameterized queries related to pricing (currencies and price lists).
     * Includes integrity check queries and queries for event payload data.
     * File: queries.admin.pricing.ts (backend)
     * 
     * Changes in v1.3.4:
     * - Added country field to fetchAllPriceLists query
     * - Added country field to fetchPriceListsWithSearch query
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
            pli.country,
            pli.is_active,
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
            pli.country,
            pli.is_active,
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
            country,
            is_active,
            owner_id,
            created_by,
            updated_by,
            created_at,
            updated_at
        FROM app.price_lists_info
        WHERE price_list_id = $1
    `,

    /**
     * Fetch price list items by price list ID
     */
    fetchPriceListItems: `
        SELECT 
            item_id,
            price_list_id,
            item_type,
            item_code,
            item_name,
            list_price,
            wholesale_price,
            created_by,
            updated_by,
            created_at,
            updated_at
        FROM app.price_lists
        WHERE price_list_id = $1
        ORDER BY item_id ASC
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
     * Parameters: name, description, currency_code, country, is_active, 
     *             owner_id, created_by
     */
    insertPriceList: `
        INSERT INTO app.price_lists_info (
            name,
            description,
            currency_code,
            country,
            is_active,
            owner_id,
            created_by,
            updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
        RETURNING price_list_id
    `,

    /**
     * Update price list
     * Parameters: price_list_id, name, description, currency_code, country, is_active, 
     *             owner_id, updated_by
     */
    updatePriceList: `
        UPDATE app.price_lists_info SET
            name = COALESCE($2, name),
            description = COALESCE($3, description),
            currency_code = COALESCE($4, currency_code),
            country = COALESCE($5, country),
            is_active = COALESCE($6, is_active),
            owner_id = COALESCE($7, owner_id),
            updated_by = $8,
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
    `,

    // ============================================
    // Price List Item Queries
    // ============================================

    /**
     * Fetch active price item types
     */
    fetchPriceItemTypes: `
        SELECT 
            type_code,
            type_name,
            description,
            is_active,
            created_at,
            updated_at
        FROM app.price_item_types
        WHERE is_active = true
        ORDER BY type_name ASC
    `,

    /**
     * Insert price list item
     * Parameters: price_list_id, item_type, item_code, item_name, list_price, wholesale_price, created_by
     */
    insertPriceListItem: `
        INSERT INTO app.price_lists (
            price_list_id,
            item_type,
            item_code,
            item_name,
            list_price,
            wholesale_price,
            created_by,
            updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
        RETURNING item_id
    `,

    /**
     * Check if price list item code exists in specific price list
     * Parameters: price_list_id, item_code
     */
    checkPriceListItemCodeExists: `
        SELECT 1 FROM app.price_lists
        WHERE price_list_id = $1 AND item_code = $2
    `,

    /**
     * Check if price list exists
     * Parameters: price_list_id
     */
    existsPriceList: `
        SELECT 1 FROM app.price_lists_info
        WHERE price_list_id = $1
    `,

    /**
     * Check if price item type exists and is active
     * Parameters: type_code
     */
    existsPriceItemType: `
        SELECT 1 FROM app.price_item_types
        WHERE type_code = $1 AND is_active = true
    `,

    /**
     * Delete price list items by item codes
     * Parameters: item_codes array
     */
    deletePriceListItems: `
        DELETE FROM app.price_lists
        WHERE item_code = ANY($1)
        RETURNING item_code
    `,

    /**
     * Check if price list items exist by item codes
     * Parameters: item_codes array
     */
    checkPriceListItemsExist: `
        SELECT item_code FROM app.price_lists
        WHERE item_code = ANY($1)
    `,

    /**
     * Update price list item by item code
     * Parameters: item_code, item_type, item_code, item_name, list_price, wholesale_price, updated_by
     */
    updatePriceListItem: `
        UPDATE app.price_lists SET
            item_type = COALESCE($2, item_type),
            item_code = COALESCE($3, item_code),
            item_name = COALESCE($4, item_name),
            list_price = COALESCE($5, list_price),
            wholesale_price = COALESCE($6, wholesale_price),
            updated_by = $7,
            updated_at = NOW()
        WHERE item_code = $1
        RETURNING item_code
    `,

    /**
     * Check if price list item exists by item code
     * Parameters: item_code
     */
    existsPriceListItemByCode: `
        SELECT 1 FROM app.price_lists WHERE item_code = $1
    `,

    /**
     * Check if price list item code exists in specific price list (excluding current item)
     * Parameters: price_list_id, item_code, exclude_item_code
     */
    checkPriceListItemCodeExistsExcluding: `
        SELECT 1 FROM app.price_lists
        WHERE price_list_id = $1 AND item_code = $2 AND item_code != $3
    `,

    /**
     * Fetch price list basic info for event payload (id, name, currency_code)
     * Parameters: price_list_id
     */
    fetchPriceListBasicInfo: `
        SELECT 
            price_list_id,
            name,
            currency_code
        FROM app.price_lists_info
        WHERE price_list_id = $1
    `,

    /**
     * Fetch currency by code for event payload
     * Parameters: code
     */
    fetchCurrencyByCode: `
        SELECT code, name, symbol, active
        FROM app.currencies
        WHERE code = $1
    `,

    /**
     * Fetch price list items by codes for event payload
     * Parameters: item_codes array, price_list_id
     */
    fetchPriceListItemsByCodes: `
        SELECT 
            item_id, price_list_id, item_type, item_code, item_name,
            list_price, wholesale_price
        FROM app.price_lists
        WHERE item_code = ANY($1) AND price_list_id = $2
    `,

    /**
     * Fetch price list item by code for event payload (full item data)
     * Parameters: item_code, price_list_id
     */
    fetchPriceListItemByCode: `
        SELECT 
            item_id, price_list_id, item_type, item_code, item_name,
            list_price, wholesale_price, created_by, updated_by, created_at, updated_at
        FROM app.price_lists
        WHERE item_code = $1 AND price_list_id = $2
    `
};


