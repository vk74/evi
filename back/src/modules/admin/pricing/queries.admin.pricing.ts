    /**
     * version: 1.9.0
     * SQL queries for pricing administration module.
     * Contains parameterized queries related to pricing (currencies and price lists).
     * Includes integrity check queries and queries for event payload data.
     * File: queries.admin.pricing.ts (backend)
     * 
     * 
     * Changes in v1.3.6:
     * - Included rounding_precision column across currency-related queries
     * 
     * Changes in v1.3.7:
     * - Updated fetchPriceListById query to JOIN with currencies table and include rounding_precision
     * 
     * Changes in v1.3.8:
     * - Added region column to all price list SELECT queries
     * - Added region parameter to insertPriceList and updatePriceList queries
     * - Added checkPriceListRegionExistsExcluding query for region uniqueness validation
     * 
     * Changes in v1.3.9:
     * - Added checkRegionExistsInRegionsTable query for validating region existence in app.regions table
     * 
     * Changes in v1.4.0:
     * - Added fetchRegions query for fetching all regions from app.regions table (removed in v1.5.0)
     * 
     * Changes in v1.5.0:
     * - Removed fetchRegions query (moved to settings module)
     * 
     * Changes in v1.6.0:
     * - Added fetchAllTaxableCategories, insertTaxableCategory, updateTaxableCategory, deleteTaxableCategories queries for taxable_categories table management
     * - Added checkTaxableCategoryNameExists and checkTaxableCategoryNameExistsExcluding queries for validation
     * 
     * Changes in v1.7.0:
     * - Updated fetchAllTaxableCategories to LEFT JOIN with app.regions_taxable_categories and app.regions to include region_name
     * - Added queries for managing region-category bindings: fetchCategoryRegions, insertCategoryRegion, deleteCategoryRegion, deleteAllCategoryRegions, checkRegionExists
     * 
     * Changes in v1.8.0:
     * - Added queries for tax regions bindings with VAT rates: fetchAllRegionsTaxableCategoriesBindings, fetchRegionTaxableCategoriesBindings
     * - Added upsertRegionCategoryBinding query for creating/updating bindings with VAT rates
     * - Added deleteRegionCategoryBinding query for deleting bindings
     * - Added checkRegionExistsById and checkTaxableCategoryExistsById queries for validation
     * 
     * Changes in v1.9.0:
     * - Updated checkTaxableCategoryNameExists to check uniqueness per region (accepts region_name parameter)
     * - Updated checkTaxableCategoryNameExistsExcluding to check uniqueness per region (accepts region_name parameter)
     * - Queries now check if category exists for specific region or without region binding
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
            active,
            rounding_precision
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
            active,
            rounding_precision
        FROM app.currencies
        WHERE active = true
        ORDER BY code ASC
    `,

    /** Insert currency */
    insertCurrency: `
        INSERT INTO app.currencies (code, name, symbol, active, rounding_precision)
        VALUES ($1, $2, $3, $4, $5)
    `,

    /** Update currency (partial) */
    updateCurrency: `
        UPDATE app.currencies SET
            name = COALESCE($2, name),
            symbol = COALESCE($3, symbol),
            active = COALESCE($4, active),
            rounding_precision = COALESCE($5, rounding_precision),
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

    /** Check existence and active status by code */
    existsActiveCurrency: `
        SELECT 1 FROM app.currencies WHERE code = $1 AND active = true
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
            pli.owner_id,
            u.username as owner_username,
            pli.region,
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
            pli.owner_id,
            u.username as owner_username,
            pli.region,
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
            pli.price_list_id,
            pli.name,
            pli.description,
            pli.currency_code,
            pli.is_active,
            pli.owner_id,
            pli.region,
            pli.created_by,
            pli.updated_by,
            pli.created_at,
            pli.updated_at,
            c.rounding_precision
        FROM app.price_lists_info pli
        LEFT JOIN app.currencies c ON pli.currency_code = c.code
        WHERE pli.price_list_id = $1
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
     * Check if price list region exists excluding specific ID (for update validation)
     * Parameters: region, price_list_id
     */
    checkPriceListRegionExistsExcluding: `
        SELECT 1 FROM app.price_lists_info
        WHERE region = $1 AND region IS NOT NULL AND price_list_id != $2
    `,

    /**
     * Check if region exists in app.regions table
     * Parameters: region_name
     */
    checkRegionExistsInRegionsTable: `
        SELECT 1 FROM app.regions
        WHERE region_name = $1
    `,

    /**
     * Insert new price list
     * Parameters: name, description, currency_code, is_active, 
     *             owner_id, region, created_by
     */
    insertPriceList: `
        INSERT INTO app.price_lists_info (
            name,
            description,
            currency_code,
            is_active,
            owner_id,
            region,
            created_by,
            updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
        RETURNING price_list_id
    `,

    /**
     * Update price list
     * Parameters: price_list_id, name, description, currency_code, is_active, 
     *             owner_id, region, updated_by
     */
    updatePriceList: `
        UPDATE app.price_lists_info SET
            name = COALESCE($2, name),
            description = COALESCE($3, description),
            currency_code = COALESCE($4, currency_code),
            is_active = COALESCE($5, is_active),
            owner_id = COALESCE($6, owner_id),
            region = CASE 
                WHEN $7::VARCHAR = '__NO_UPDATE__' THEN region
                WHEN $7::VARCHAR IS NULL THEN NULL
                ELSE $7::VARCHAR
            END,
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
        SELECT code, name, symbol, active, rounding_precision
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
    `,

    // ============================================
    // Tax Regions Bindings Queries (with VAT rates)
    // ============================================

    /**
     * Fetch all regions (for tax regions bindings)
     * No parameters
     * Returns region_id, region_name
     */
    fetchAllRegions: `
        SELECT 
            region_id,
            region_name
        FROM app.regions
        ORDER BY region_name ASC
    `,

    /**
     * Fetch all taxable categories (for tax regions bindings) - DEPRECATED/REMOVED
     * No parameters
     * Returns category_id, category_name
     */
    /* fetchAllTaxableCategoriesSimple: removed */

    /**
     * Fetch all region-taxable category bindings with VAT rates for all regions
     * No parameters
     * Returns id, region_id, region_name, category_name, vat_rate
     */
    fetchAllRegionsTaxableCategoriesBindings: `
        SELECT 
            rtc.id,
            rtc.region_id,
            r.region_name,
            rtc.category_name,
            rtc.vat_rate
        FROM app.regions_taxable_categories rtc
        JOIN app.regions r ON rtc.region_id = r.region_id
        ORDER BY r.region_name, rtc.category_name
    `,

    /**
     * Fetch all bindings for a specific region with VAT rates
     * Parameters: [region_id]
     * Returns id, category_name, vat_rate
     */
    fetchRegionTaxableCategoriesBindings: `
        SELECT 
            id,
            category_name,
            vat_rate
        FROM app.regions_taxable_categories
        WHERE region_id = $1
        ORDER BY category_name
    `,

    /**
     * Insert a region-category binding with VAT rate
     * Parameters: [region_id, category_name, vat_rate]
     */
    insertRegionCategory: `
        INSERT INTO app.regions_taxable_categories (region_id, category_name, vat_rate)
        VALUES ($1, $2, $3)
        RETURNING id, category_name, vat_rate
    `,

    /**
     * Update a region-category binding
     * Parameters: [id, category_name, vat_rate]
     */
    updateRegionCategory: `
        UPDATE app.regions_taxable_categories 
        SET category_name = $2, vat_rate = $3, updated_at = NOW()
        WHERE id = $1
        RETURNING id, category_name, vat_rate
    `,

    /**
     * Delete a specific region-category binding
     * Parameters: [id]
     */
    deleteRegionCategory: `
        DELETE FROM app.regions_taxable_categories
        WHERE id = $1
        RETURNING id
    `,

    /**
     * Check if region exists by region_id
     * Parameters: [region_id]
     * Returns region_id and region_name if exists
     */
    checkRegionExistsById: `
        SELECT region_id, region_name
        FROM app.regions
        WHERE region_id = $1
    `,

    /**
     * Check if category exists by id
     * Parameters: [id]
     */
    checkRegionCategoryExistsById: `
        SELECT id, category_name
        FROM app.regions_taxable_categories
        WHERE id = $1
    `
};


