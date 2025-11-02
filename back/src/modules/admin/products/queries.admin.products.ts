/**
 * queries.admin.products.ts - version 1.0.7
 * SQL queries for products administration operations.
 * 
 * Contains all SQL queries used by products admin module.
 * Queries are parameterized to prevent SQL injection.
 * 
 * Backend file - queries.admin.products.ts
  
  Changes in v1.0.3:
  - Removed is_public field from fetchPublishingSections query
  
  Changes in v1.0.4:
  - Added published_by parameter to insertSectionProduct query
  
  Changes in v1.0.5:
  - Added status_code field to fetchSingleProduct query
  - Added status_code parameter to createProduct query
  - Added fetchProductStatuses query to retrieve active product statuses
  
  Changes in v1.0.6:
  - Added status_code field to fetchAllProducts SELECT clause
  - Added status_code to fetchAllProducts GROUP BY clause
  - Added status filter condition to fetchAllProducts WHERE clause
  - Updated fetchAllProducts parameters from 8 to 9 (added statusFilter)
  - Added status filter condition to countAllProducts WHERE clause
  - Updated countAllProducts parameters from 3 to 4 (added statusFilter)
  - Added status_code field to fetchAllOptions SELECT clause
  - Added status_code to fetchAllOptions GROUP BY clause
  
  Changes in v1.0.7:
  - Added sorting support for status_code, published, and owner fields in fetchAllProducts ORDER BY clause
 */

export const queries = {
    /**
     * Creates a new product (only basic fields)
     * Parameters: [product_code, translation_key, status_code, can_be_option, option_only, 
     * is_published, is_visible_owner, is_visible_groups, is_visible_tech_specs,
     * is_visible_area_specs, is_visible_industry_specs, is_visible_key_features,
     * is_visible_overview, is_visible_long_description, created_by]
     * Note: product_id is generated automatically by database default value
     */
    createProduct: `
        INSERT INTO app.products (
            product_code, translation_key, status_code, can_be_option, option_only, 
            is_published, is_visible_owner, is_visible_groups, is_visible_tech_specs,
            is_visible_area_specs, is_visible_industry_specs, is_visible_key_features,
            is_visible_overview, is_visible_long_description, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING product_id, product_code, translation_key, created_at
    `,

    /**
     * Creates a product translation
     * Parameters: [product_id, language_code, name, short_desc, long_desc,
     * tech_specs, area_specifics, industry_specifics, key_features, product_overview, created_by]
     */
    createProductTranslation: `
        INSERT INTO app.product_translations (
            product_id, language_code, name, short_desc, long_desc,
            tech_specs, area_specifics, industry_specifics, key_features, product_overview, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING translation_id, product_id, language_code, name, created_at
    `,

    /**
     * Checks if product code already exists
     * Parameters: [product_code]
     */
    checkProductCodeExists: `
        SELECT product_id FROM app.products 
        WHERE LOWER(product_code) = LOWER($1)
    `,

    /**
     * Checks if translation key already exists
     * Parameters: [translation_key]
     */
    checkTranslationKeyExists: `
        SELECT product_id FROM app.products 
        WHERE LOWER(translation_key) = LOWER($1)
    `,

    /**
     * Fetches all products with pagination and filtering (basic info only)
     * Parameters: [limit, offset, search_term]
     */
    fetchProducts: `
        SELECT 
            p.product_id,
            p.product_code,
            p.translation_key,
            p.can_be_option,
            p.option_only,
            p.is_published,
            p.created_at,
            p.created_by,
            p.updated_at,
            p.updated_by
        FROM app.products p
        WHERE ($3::text IS NULL OR 
               LOWER(p.product_code) LIKE LOWER('%' || $3 || '%') OR
               LOWER(p.translation_key) LIKE LOWER('%' || $3 || '%'))
        ORDER BY p.product_code ASC
        LIMIT $1 OFFSET $2
    `,

    /**
     * Counts total products for pagination
     * Parameters: [search_term]
     */
    countProducts: `
        SELECT COUNT(*) as total
        FROM app.products p
        WHERE ($1::text IS NULL OR 
               LOWER(p.product_code) LIKE LOWER('%' || $1 || '%') OR
               LOWER(p.translation_key) LIKE LOWER('%' || $1 || '%'))
    `,

    /**
     * Fetches a single product by ID with all translations
     * Parameters: [product_id]
     */
    fetchSingleProduct: `
        SELECT 
            p.product_id,
            p.product_code,
            p.translation_key,
            p.status_code,
            p.can_be_option,
            p.option_only,
            p.is_published,
            p.is_visible_owner,
            p.is_visible_groups,
            p.is_visible_tech_specs,
            p.is_visible_area_specs,
            p.is_visible_industry_specs,
            p.is_visible_key_features,
            p.is_visible_overview,
            p.is_visible_long_description,
            p.created_at,
            p.created_by,
            p.updated_at,
            p.updated_by
        FROM app.products p
        WHERE p.product_id = $1
    `,

    /**
     * Fetches all active product statuses from reference table
     * Parameters: []
     * Returns statuses sorted by display_order
     */
    fetchProductStatuses: `
        SELECT 
            status_code,
            description,
            is_active,
            display_order
        FROM app.product_statuses
        WHERE is_active = true
        ORDER BY display_order ASC
    `,

    /**
     * Fetches product translations by product ID
     * Parameters: [product_id]
     */
    fetchProductTranslations: `
        SELECT 
            pt.translation_id,
            pt.product_id,
            pt.language_code,
            pt.name,
            pt.short_desc,
            pt.long_desc,
            pt.tech_specs,
            pt.area_specifics,
            pt.industry_specifics,
            pt.key_features,
            pt.product_overview,
            pt.created_at,
            pt.created_by,
            pt.updated_at,
            pt.updated_by
        FROM app.product_translations pt
        WHERE pt.product_id = $1
        ORDER BY pt.language_code ASC
    `,

    /**
     * Updates a product
     * Parameters: [product_code, translation_key, status_code, can_be_option, option_only,
     * is_published, is_visible_owner, is_visible_groups, is_visible_tech_specs,
     * is_visible_area_specs, is_visible_industry_specs, is_visible_key_features,
     * is_visible_overview, is_visible_long_description, updated_by, product_id]
     */
    updateProduct: `
        UPDATE app.products SET
            product_code = $1,
            translation_key = $2,
            status_code = $3,
            can_be_option = $4,
            option_only = $5,
            is_published = $6,
            is_visible_owner = $7,
            is_visible_groups = $8,
            is_visible_tech_specs = $9,
            is_visible_area_specs = $10,
            is_visible_industry_specs = $11,
            is_visible_key_features = $12,
            is_visible_overview = $13,
            is_visible_long_description = $14,
            updated_by = $15,
            updated_at = now()
        WHERE product_id = $16
        RETURNING product_id, product_code, translation_key, updated_at
    `,

    /**
     * Updates a product translation
     * Parameters: [name, short_desc, long_desc, tech_specs, area_specifics,
     * industry_specifics, key_features, product_overview, updated_by, translation_id]
     */
    updateProductTranslation: `
        UPDATE app.product_translations SET
            name = $1,
            short_desc = $2,
            long_desc = $3,
            tech_specs = $4,
            area_specifics = $5,
            industry_specifics = $6,
            key_features = $7,
            product_overview = $8,
            updated_by = $9,
            updated_at = now()
        WHERE translation_id = $10
        RETURNING translation_id, product_id, language_code, name, updated_at
    `,

    /**
     * Deletes a product and all its translations
     * Parameters: [product_id]
     */
    deleteProduct: `
        DELETE FROM app.products 
        WHERE product_id = $1
    `,

    /**
     * Deletes product translations by product ID
     * Parameters: [product_id]
     */
    deleteProductTranslations: `
        DELETE FROM app.product_translations 
        WHERE product_id = $1
    `,

    /**
     * Creates a product-user relationship
     * Parameters: [product_id, user_id, role_type, created_by]
     */
    createProductUser: `
        INSERT INTO app.product_users (
            product_id, user_id, role_type, created_by
        ) VALUES ($1, $2, $3, $4)
        RETURNING id, product_id, user_id, role_type, created_at
    `,

    /**
     * Creates a product-group relationship
     * Parameters: [product_id, group_id, role_type, created_by]
     */
    createProductGroup: `
        INSERT INTO app.product_groups (
            product_id, group_id, role_type, created_by
        ) VALUES ($1, $2, $3, $4)
        RETURNING id, product_id, group_id, role_type, created_at
    `,

    /**
     * Fetches all products with pagination, search, sorting and filtering
     * Parameters: [offset, limit, searchQuery, sortBy, sortDesc, typeFilter, publishedFilter, languageCode, statusFilter]
     */
    fetchAllProducts: `
        SELECT 
            p.product_id,
            p.product_code,
            p.translation_key,
            p.can_be_option,
            p.option_only,
            p.is_published,
            p.is_visible_owner,
            p.is_visible_groups,
            p.is_visible_tech_specs,
            p.is_visible_area_specs,
            p.is_visible_industry_specs,
            p.is_visible_key_features,
            p.is_visible_overview,
            p.is_visible_long_description,
            p.status_code,
            p.created_by,
            p.created_at,
            p.updated_by,
            p.updated_at,
            pt.name as translation_name,
            pt.language_code,
            owner_user.username as owner_name,
            array_agg(DISTINCT specialist_group.group_name) FILTER (WHERE specialist_group.group_name IS NOT NULL) as specialists_groups
        FROM app.products p
        LEFT JOIN app.product_translations pt ON p.product_id = pt.product_id AND pt.language_code = $8
        LEFT JOIN (
            SELECT pu.product_id, u.username
            FROM app.product_users pu
            JOIN app.users u ON pu.user_id = u.user_id
            WHERE pu.role_type = 'owner'
        ) owner_user ON p.product_id = owner_user.product_id
        LEFT JOIN (
            SELECT pg.product_id, g.group_name
            FROM app.product_groups pg
            JOIN app.groups g ON pg.group_id = g.group_id
            WHERE pg.role_type = 'product_specialists'
        ) specialist_group ON p.product_id = specialist_group.product_id
        WHERE 1=1
        AND ($3::text IS NULL OR $3::text = '' OR LOWER(p.product_code) LIKE LOWER($3::text) OR LOWER(pt.name) LIKE LOWER($3::text) OR LOWER(p.translation_key) LIKE LOWER($3::text))
        AND ($6::text IS NULL OR $6::text = '' OR 
            ($6::text = 'product' AND p.can_be_option = false AND p.option_only = false) OR
            ($6::text = 'productAndOption' AND p.can_be_option = true AND p.option_only = false) OR
            ($6::text = 'option' AND p.option_only = true)
        )
        AND ($7::text IS NULL OR $7::text = '' OR 
            ($7::text = 'published' AND p.is_published = true) OR
            ($7::text = 'unpublished' AND p.is_published = false)
        )
        AND ($9::text IS NULL OR $9::text = '' OR p.status_code = $9::text)
        GROUP BY p.product_id, p.product_code, p.translation_key, p.can_be_option, p.option_only,
                 p.is_published, p.is_visible_owner, p.is_visible_groups, p.is_visible_tech_specs,
                 p.is_visible_area_specs, p.is_visible_industry_specs, p.is_visible_key_features,
                 p.is_visible_overview, p.is_visible_long_description, p.status_code, p.created_by, p.created_at,
                 p.updated_by, p.updated_at, pt.name, pt.language_code, owner_user.username
        ORDER BY 
            CASE WHEN $4 = 'product_code' AND $5 = false THEN p.product_code END ASC,
            CASE WHEN $4 = 'product_code' AND $5 = true THEN p.product_code END DESC,
            CASE WHEN $4 = 'name' AND $5 = false THEN pt.name END ASC,
            CASE WHEN $4 = 'name' AND $5 = true THEN pt.name END DESC,
            CASE WHEN $4 = 'type' AND $5 = false THEN 
                CASE 
                    WHEN p.option_only = true THEN 3
                    WHEN p.can_be_option = true THEN 2
                    ELSE 1
                END
            END ASC,
            CASE WHEN $4 = 'type' AND $5 = true THEN 
                CASE 
                    WHEN p.option_only = true THEN 3
                    WHEN p.can_be_option = true THEN 2
                    ELSE 1
                END
            END DESC,
            CASE WHEN $4 = 'status_code' AND $5 = false THEN p.status_code END ASC,
            CASE WHEN $4 = 'status_code' AND $5 = true THEN p.status_code END DESC,
            CASE WHEN $4 = 'published' AND $5 = false THEN p.is_published END ASC,
            CASE WHEN $4 = 'published' AND $5 = true THEN p.is_published END DESC,
            CASE WHEN $4 = 'owner' AND $5 = false THEN owner_user.username END ASC NULLS LAST,
            CASE WHEN $4 = 'owner' AND $5 = true THEN owner_user.username END DESC NULLS LAST,
            p.product_code ASC
        LIMIT $2 OFFSET $1
    `,

    /**
     * Counts total products with same filters as fetchAllProducts
     * Parameters: [searchQuery, typeFilter, publishedFilter, statusFilter]
     */
    countAllProducts: `
        SELECT COUNT(DISTINCT p.product_id) as total
        FROM app.products p
        LEFT JOIN app.product_translations pt ON p.product_id = pt.product_id
        WHERE 1=1
        AND ($1::text IS NULL OR $1::text = '' OR LOWER(p.product_code) LIKE LOWER($1::text) OR LOWER(pt.name) LIKE LOWER($1::text) OR LOWER(p.translation_key) LIKE LOWER($1::text))
        AND ($2::text IS NULL OR $2::text = '' OR 
            ($2::text = 'product' AND p.can_be_option = false AND p.option_only = false) OR
            ($2::text = 'productAndOption' AND p.can_be_option = true AND p.option_only = false) OR
            ($2::text = 'option' AND p.option_only = true)
        )
        AND ($3::text IS NULL OR $3::text = '' OR 
            ($3::text = 'published' AND p.is_published = true) OR
            ($3::text = 'unpublished' AND p.is_published = false)
        )
        AND ($4::text IS NULL OR $4::text = '' OR p.status_code = $4::text)
    `,

    // Delete products query - deletes products and cascades to related tables
    deleteProducts: `
        DELETE FROM app.products 
        WHERE product_id = ANY($1)
        RETURNING product_id, product_code
    `,

    /**
     * Fetches all options (products with can_be_option = true OR option_only = true)
     * Parameters: [offset, itemsPerPage, searchQuery, sortBy, sortDesc, languageCode, excludeProductId]
     */
    fetchAllOptions: `
        SELECT 
            p.product_id,
            p.product_code,
            p.translation_key,
            p.can_be_option,
            p.option_only,
            p.is_published,
            p.is_visible_owner,
            p.is_visible_groups,
            p.is_visible_tech_specs,
            p.is_visible_area_specs,
            p.is_visible_industry_specs,
            p.is_visible_key_features,
            p.is_visible_overview,
            p.is_visible_long_description,
            p.status_code,
            p.created_by,
            p.created_at,
            p.updated_by,
            p.updated_at,
            pt.name as translation_name,
            pt.language_code,
            owner_user.username as owner_name,
            array_agg(DISTINCT specialist_group.group_name) FILTER (WHERE specialist_group.group_name IS NOT NULL) as specialists_groups
        FROM app.products p
        LEFT JOIN app.product_translations pt ON p.product_id = pt.product_id AND pt.language_code = $6
        LEFT JOIN (
            SELECT pu.product_id, u.username
            FROM app.product_users pu
            JOIN app.users u ON pu.user_id = u.user_id
            WHERE pu.role_type = 'owner'
        ) owner_user ON p.product_id = owner_user.product_id
        LEFT JOIN (
            SELECT pg.product_id, g.group_name
            FROM app.product_groups pg
            JOIN app.groups g ON pg.group_id = g.group_id
            WHERE pg.role_type = 'product_specialists'
        ) specialist_group ON p.product_id = specialist_group.product_id
        WHERE 1=1
        AND (p.can_be_option = true OR p.option_only = true)
        AND ($3::text IS NULL OR $3::text = '' OR LOWER(p.product_code) LIKE LOWER($3::text) OR LOWER(pt.name) LIKE LOWER($3::text) OR LOWER(p.translation_key) LIKE LOWER($3::text))
        AND ($7::uuid IS NULL OR p.product_id != $7)
        GROUP BY p.product_id, p.product_code, p.translation_key, p.can_be_option, p.option_only,
                 p.is_published, p.is_visible_owner, p.is_visible_groups, p.is_visible_tech_specs,
                 p.is_visible_area_specs, p.is_visible_industry_specs, p.is_visible_key_features,
                 p.is_visible_overview, p.is_visible_long_description, p.status_code, p.created_by, p.created_at,
                 p.updated_by, p.updated_at, pt.name, pt.language_code, owner_user.username
        ORDER BY 
            CASE WHEN $4 = 'product_code' AND $5 = false THEN p.product_code END ASC,
            CASE WHEN $4 = 'product_code' AND $5 = true THEN p.product_code END DESC,
            CASE WHEN $4 = 'name' AND $5 = false THEN pt.name END ASC,
            CASE WHEN $4 = 'name' AND $5 = true THEN pt.name END DESC,
            CASE WHEN $4 = 'type' AND $5 = false THEN 
                CASE 
                    WHEN p.option_only = true THEN 3
                    WHEN p.can_be_option = true THEN 2
                    ELSE 1
                END
            END ASC,
            CASE WHEN $4 = 'type' AND $5 = true THEN 
                CASE 
                    WHEN p.option_only = true THEN 3
                    WHEN p.can_be_option = true THEN 2
                    ELSE 1
                END
            END DESC,
            p.product_code ASC
        LIMIT $2 OFFSET $1
    `,

    /**
     * Counts total options with same filters as fetchAllOptions
     * Parameters: [searchQuery, excludeProductId]
     */
    countAllOptions: `
        SELECT COUNT(DISTINCT p.product_id) as total
        FROM app.products p
        LEFT JOIN app.product_translations pt ON p.product_id = pt.product_id
        WHERE 1=1
        AND (p.can_be_option = true OR p.option_only = true)
        AND ($1::text IS NULL OR $1::text = '' OR LOWER(p.product_code) LIKE LOWER($1::text) OR LOWER(pt.name) LIKE LOWER($1::text) OR LOWER(p.translation_key) LIKE LOWER($1::text))
        AND ($2::uuid IS NULL OR p.product_id != $2)
    `,

    /**
     * Fetches all catalog sections for product publication
     * Returns sections with basic info for publication management
     */
    fetchPublishingSections: `
        SELECT 
            cs.id,
            cs.name,
            cs.owner,
            cs.status
        FROM app.catalog_sections cs
        ORDER BY cs.name ASC
    `,

    /**
     * Checks if product exists
     * Parameters: [product_id]
     */
    checkProductExists: `
        SELECT product_id FROM app.products 
        WHERE product_id = $1
    `,

    /**
     * Fetches section IDs where product is currently published
     * Parameters: [product_id]
     */
    fetchProductSectionIds: `
        SELECT section_id 
        FROM app.section_products 
        WHERE product_id = $1
    `,

    /**
     * Checks if sections exist
     * Parameters: [section_ids_array]
     */
    checkSectionsExist: `
        SELECT id 
        FROM app.catalog_sections 
        WHERE id = ANY($1)
    `,

    /**
     * Deletes product from section
     * Parameters: [product_id, section_id]
     */
    deleteProductFromSection: `
        DELETE FROM app.section_products 
        WHERE product_id = $1 AND section_id = $2
    `,

    /**
     * Inserts product into section
     * Parameters: [section_id, product_id, published_by]
     */
    insertSectionProduct: `
        INSERT INTO app.section_products (section_id, product_id, published_by)
        VALUES ($1, $2, $3)
        ON CONFLICT (section_id, product_id) DO NOTHING
    `,

    /**
     * Updates product is_published status based on section_products relationships
     * Parameters: [product_id]
     */
    updateProductIsPublished: `
        UPDATE app.products 
        SET is_published = (
            SELECT COUNT(*) > 0 
            FROM app.section_products 
            WHERE product_id = $1
        ), 
        updated_at = NOW()
        WHERE product_id = $1
    `
};
