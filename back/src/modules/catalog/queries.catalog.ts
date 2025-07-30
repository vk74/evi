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
}

// Query definitions
export const queries: CatalogQueries = {
    // Get all active catalog sections
    getActiveSections: `
        SELECT
            id,
            name,
            description,
            icon,
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
            icon,
            color,
            "order"
        FROM app.catalog_sections
        WHERE id = $1 AND status = 'active'
    `,
}; 