/**
 * queries.catalog.ts
 * SQL queries for catalog functionality.
 * Includes queries for fetching catalog sections data.
 */

// Query type definitions
interface SQLQuery {
    name: string;
    text: string;
}

interface CatalogQueries {
    // Get active catalog sections
    getActiveSections: string;
    // Get single section by ID
    getSectionById: string;
    // Fetch price list info by ID (to check if active and get currency_code)
    fetchPriceListInfo: string;
    // Fetch price list items by price list ID and item codes
    fetchPriceListItemsByCodes: string;
}

// Query definitions
export const queries: CatalogQueries = {
    // Get all active catalog sections
    getActiveSections: `
        SELECT
            id,
            name,
            description,
            icon_name,
            color,
            "order"
        FROM app.catalog_sections
        WHERE status = 'active'
        ORDER BY "order" ASC, name ASC
    `,
    
    // Get single section by ID
    getSectionById: `
        SELECT
            id,
            name,
            description,
            icon_name,
            color,
            "order"
        FROM app.catalog_sections
        WHERE id = $1 AND status = 'active'
    `,
    
    // Fetch price list info by ID (to check if active and get currency_code)
    // Parameters: price_list_id
    fetchPriceListInfo: `
        SELECT 
            price_list_id,
            name,
            currency_code,
            is_active
        FROM app.price_lists_info
        WHERE price_list_id = $1
    `,

    // Fetch price list items by price list ID and item codes
    // Returns only public data: item_code, list_price (no wholesale_price, no item_name)
    // Parameters: price_list_id, item_codes array
    fetchPriceListItemsByCodes: `
        SELECT 
            item_code,
            list_price
        FROM app.price_lists
        WHERE price_list_id = $1
          AND item_code = ANY($2::text[])
        ORDER BY item_code ASC
    `,
}; 