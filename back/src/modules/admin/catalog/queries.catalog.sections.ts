/**
 * queries.catalog.sections.ts
 * SQL queries for catalog sections functionality in admin panel.
 * Includes queries for fetching catalog sections data.
 */

// Query type definitions
interface SQLQuery {
    name: string;
    text: string;
}

interface CatalogSectionsQueries {
    // Get catalog sections data
    getAllSections: string;
}

// Query definitions
export const queries: CatalogSectionsQueries = {
    // Get all catalog sections
    getAllSections: `
        SELECT
            id,
            name,
            owner,
            backup_owner,
            description,
            comments,
            status,
            is_public,
            "order",
            parent_id,
            icon,
            color,
            created_at,
            created_by,
            modified_at,
            modified_by
        FROM app.catalog_sections
        ORDER BY "order" ASC, name ASC
    `
}; 