/**
 * queries.admin.catalog.ts
 * Version: 1.1.0
 * SQL queries for catalog sections functionality in admin panel.
 * Includes queries for fetching, creating, updating and deleting catalog sections data.
 * Backend file - queries.admin.catalog.ts
 * 
 * Changes in v1.1.0:
 * - Added queries for products publisher functionality
 * - getActiveProducts: fetch all products with status_code = 'active'
 * - getSectionProductMappings: fetch all section-product mappings
 * - checkProductsExist: validate products exist
 * - insertSectionProduct: insert product-section mapping
 * - deleteProductFromSection: delete product-section mapping
 * - updateProductIsPublished: update product publication flag
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
    // Products publisher queries
    getActiveProducts: string;
    getSectionProductMappings: string;
    checkProductsExist: string;
    insertSectionProduct: string;
    deleteProductFromSection: string;
    updateProductIsPublished: string;
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
            icon_name,
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
            icon_name,
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
            icon_name,
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
            icon_name = $10,
            color = $11,
            modified_at = NOW(),
            modified_by = $12
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

    // Get all active products (status_code = 'active') with translations
    // Parameters: [language_code] - default 'en' for English
    getActiveProducts: `
        SELECT 
            p.product_id,
            p.product_code,
            p.translation_key,
            p.status_code,
            COALESCE(pt.name, p.product_code) as name
        FROM app.products p
        LEFT JOIN app.product_translations pt 
            ON p.product_id = pt.product_id 
            AND pt.language_code = $1
        WHERE p.status_code = 'active'::app.product_status
        ORDER BY p.product_code ASC, COALESCE(pt.name, p.product_code) ASC
    `,

    // Get all section-product mappings
    getSectionProductMappings: `
        SELECT 
            sp.section_id, 
            sp.product_id, 
            cs.name AS section_name, 
            cs.status AS section_status
        FROM app.section_products sp
        JOIN app.catalog_sections cs ON sp.section_id = cs.id
    `,

    // Check if products exist
    // Parameters: [product_ids uuid[]]
    checkProductsExist: `
        SELECT product_id, product_code, status_code 
        FROM app.products 
        WHERE product_id = ANY($1)
    `,

    // Insert product into section
    // Parameters: [section_id, product_id, published_by]
    insertSectionProduct: `
        INSERT INTO app.section_products (section_id, product_id, published_by)
        VALUES ($1, $2, $3)
        ON CONFLICT (section_id, product_id) DO NOTHING
    `,

    // Delete product from section
    // Parameters: [product_id, section_id]
    deleteProductFromSection: `
        DELETE FROM app.section_products 
        WHERE product_id = $1 AND section_id = $2
    `,

    // Update product is_published status based on section_products relationships
    // Parameters: [product_id]
    updateProductIsPublished: `
        UPDATE app.products 
        SET is_published = (
            SELECT COUNT(*) > 0 
            FROM app.section_products 
            WHERE product_id = $1
        ), 
        updated_at = NOW()
        WHERE product_id = $1
    `,
};

