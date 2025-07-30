/**
 * queries.catalog.sections.ts
 * SQL queries for catalog sections functionality in admin panel.
 * Includes queries for fetching, creating, updating and deleting catalog sections data.
 */

// Query type definitions
interface SQLQuery {
    name: string;
    text: string;
}

interface CatalogSectionsQueries {
    // Get catalog sections data
    getAllSections: string;
    // Get single section by ID
    getSectionById: string;
    // Create new section
    createSection: string;
    // Update existing section
    updateSection: string;
    // Delete existing section
    deleteSection: string;
    // Delete multiple sections
    deleteMultipleSections: string;
    // Check if section exists
    checkSectionExists: string;
    // Check if multiple sections exist
    checkMultipleSectionsExist: string;
    // Check if section name exists (excluding current section)
    checkSectionNameExistsExcluding: string;
    // Check if order number exists (excluding current section)
    checkOrderExistsExcluding: string;
    // Update order numbers for sections after the changed one
    updateOrderNumbersAfter: string;
    // Update order numbers for sections after deletion
    updateOrderNumbersAfterDeletion: string;
    // Update order numbers for sections after multiple deletions
    updateOrderNumbersAfterMultipleDeletion: string;
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
    
    // Get single section by ID
    getSectionById: `
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
        WHERE id = $1
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
    
    // Update existing section
    updateSection: `
        UPDATE app.catalog_sections 
        SET 
            name = COALESCE($2, name),
            owner = COALESCE($3, owner),
            backup_owner = $4,
            description = $5,
            comments = $6,
            status = COALESCE($7, status),
            is_public = COALESCE($8, is_public),
            "order" = COALESCE($9, "order"),
            color = $10,
            modified_at = NOW(),
            modified_by = $11
        WHERE id = $1
        RETURNING id, name
    `,
    
    // Delete existing section
    deleteSection: `
        DELETE FROM app.catalog_sections 
        WHERE id = $1
        RETURNING id, name, "order"
    `,
    
    // Delete multiple sections
    deleteMultipleSections: `
        DELETE FROM app.catalog_sections 
        WHERE id = ANY($1)
        RETURNING id, name, "order"
    `,
    
    // Check if section exists
    checkSectionExists: `
        SELECT id, name, "order" FROM app.catalog_sections WHERE id = $1
    `,
    
    // Check if multiple sections exist
    checkMultipleSectionsExist: `
        SELECT id, name, "order" FROM app.catalog_sections WHERE id = ANY($1)
    `,
    
    // Check if section name exists (excluding current section)
    checkSectionNameExistsExcluding: `
        SELECT id FROM app.catalog_sections WHERE name = $1 AND id != $2
    `,
    
    // Check if order number exists (excluding current section)
    checkOrderExistsExcluding: `
        SELECT id FROM app.catalog_sections WHERE "order" = $1 AND id != $2
    `,
    
    // Update order numbers for sections after the changed one
    updateOrderNumbersAfter: `
        UPDATE app.catalog_sections 
        SET "order" = "order" + 1 
        WHERE "order" >= $1 AND id != $2
    `,
    
    // Update order numbers for sections after deletion
    updateOrderNumbersAfterDeletion: `
        UPDATE app.catalog_sections 
        SET "order" = "order" - 1 
        WHERE "order" > $1
    `,
    
    // Update order numbers for sections after multiple deletions
    updateOrderNumbersAfterMultipleDeletion: `
        UPDATE app.catalog_sections 
        SET "order" = "order" - 1 
        WHERE "order" > $1
    `,
    
    // Check if section name exists
    checkSectionNameExists: `
        SELECT id FROM app.catalog_sections WHERE name = $1
    `,
    
    // Check if order number exists
    checkOrderExists: `
        SELECT id FROM app.catalog_sections WHERE "order" = $1
    `,
}; 