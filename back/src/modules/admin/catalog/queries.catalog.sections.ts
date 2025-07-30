/**
 * queries.catalog.sections.ts
 * SQL queries for catalog sections functionality in admin panel.
 * Includes queries for fetching and creating catalog sections data.
 */

// Query type definitions
interface SQLQuery {
    name: string;
    text: string;
}

interface CatalogSectionsQueries {
    // Get catalog sections data
    getAllSections: string;
    // Create new section
    createSection: string;
    // Check if section name exists
    checkSectionNameExists: string;
    // Check if order number exists
    checkOrderExists: string;
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
    `,
    
    // Create new section
    createSection: `
        INSERT INTO app.catalog_sections (
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
            created_by
        ) VALUES (
            gen_random_uuid(),
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11,
            NOW(),
            $12
        ) RETURNING id, name
    `,
    
    // Check if section name exists
    checkSectionNameExists: `
        SELECT id FROM app.catalog_sections WHERE name = $1
    `,
    
    // Check if order number exists
    checkOrderExists: `
        SELECT id FROM app.catalog_sections WHERE "order" = $1
    `
}; 