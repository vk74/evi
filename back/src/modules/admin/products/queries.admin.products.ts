/**
 * queries.admin.products.ts - version 1.6.0
 * SQL queries for products administration operations.
 * 
 * Contains all SQL queries used by products admin module.
 * Queries are parameterized to prevent SQL injection.
 * 
 * Backend file - queries.admin.products.ts
  
  Changes in v1.2.0:
  - Removed fetchPublishingSections and fetchProductSectionIds queries (catalog publication functionality moved to separate module)
  
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
  
  Changes in v1.0.8:
  - Added statusFilter parameter support to fetchAllOptions query
  - Added statusFilter parameter support to countAllOptions query
  - status_code already present in fetchAllOptions SELECT and GROUP BY
  
  Changes in v1.0.7:
  - Added sorting support for status_code, published, and owner fields in fetchAllProducts ORDER BY clause
  
  Changes in v1.0.9:
  - Updated fetchProductStatuses query to get enum values from app.product_status UDT instead of product_statuses table
  - Removed description, is_active, and display_order fields from query result
  
  Changes in v1.0.10:
  - Fixed status_code comparison in WHERE clauses: added explicit cast to text (p.status_code::text = $X::text)
  - Required because status_code column is now app.product_status enum type
  
  Changes in v1.1.0:
  - Removed can_be_option and option_only from createProduct INSERT and VALUES
  - Removed can_be_option and option_only from fetchProducts SELECT
  - Removed can_be_option and option_only from fetchSingleProduct SELECT
  - Removed can_be_option and option_only from updateProduct UPDATE
  - Removed can_be_option and option_only from fetchAllProducts SELECT and GROUP BY
  - Removed type filtering logic from fetchAllProducts WHERE clause (removed typeFilter parameter)
  - Removed type sorting logic from fetchAllProducts ORDER BY clause
  - Removed type filtering logic from countAllProducts WHERE clause (removed typeFilter parameter)
  - Removed can_be_option and option_only from fetchAllOptions SELECT and GROUP BY
  - Removed (p.can_be_option = true OR p.option_only = true) condition from fetchAllOptions WHERE clause
  - Removed type sorting logic from fetchAllOptions ORDER BY clause
  - Removed (p.can_be_option = true OR p.option_only = true) condition from countAllOptions WHERE clause
  - Updated parameter numbers in queries to reflect removed parameters
  - fetchAllOptions now returns all products except the main product (no type filtering)
  
  Changes in v1.3.0:
  - Removed JSONB fields (area_specifics, industry_specifics, key_features, product_overview) from createProductTranslation, fetchProductTranslations, updateProductTranslation
  - Removed visibility flags (is_visible_area_specs, is_visible_industry_specs, is_visible_key_features, is_visible_overview) from createProduct, fetchSingleProduct, updateProduct, fetchAllProducts, fetchAllOptions
  - Updated parameter numbers in queries to reflect removed parameters
  
  Changes in v1.4.0:
  - Added fetchProductRegions query for loading product-region bindings with categories
  - Added deleteProductRegions query for removing all product-region bindings
  - Added insertProductRegion query for creating product-region bindings
  - Added fetchTaxableCategoriesByRegion query for loading categories available in a region
  
  Changes in v1.5.0:
  - Fixed language_code comparisons in fetchAllProducts and fetchAllOptions to cast enum to text
  - This allows queries to work with both old enum values ('en', 'ru') and new values ('english', 'russian')
  
  Changes in v1.6.0:
  - Added fetchAllProductsWithScopeFilter query for 'own' scope filtering
  - Added countAllProductsWithScopeFilter query for 'own' scope filtering
  - Scope filter checks: user is owner OR user's group is linked as product_specialists
 */

export const queries = {
    /**
     * Creates a new product (only basic fields)
     * Parameters: [product_code, translation_key, status_code, 
     * is_published, is_visible_owner, is_visible_groups, is_visible_tech_specs,
     * is_visible_long_description, created_by]
     * Note: product_id is generated automatically by database default value
     */
    createProduct: `
        INSERT INTO app.products (
            product_code, translation_key, status_code, 
            is_published, is_visible_owner, is_visible_groups, is_visible_tech_specs,
            is_visible_long_description, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING product_id, product_code, translation_key, created_at
    `,

    /**
     * Creates a product translation
     * Parameters: [product_id, language_code, name, short_desc, long_desc,
     * tech_specs, created_by]
     */
    createProductTranslation: `
        INSERT INTO app.product_translations (
            product_id, language_code, name, short_desc, long_desc,
            tech_specs, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
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
            p.is_published,
            p.is_visible_owner,
            p.is_visible_groups,
            p.is_visible_tech_specs,
            p.is_visible_long_description,
            p.created_at,
            p.created_by,
            p.updated_at,
            p.updated_by
        FROM app.products p
        WHERE p.product_id = $1
    `,

    /**
     * Fetches all product statuses from app.product_status enum
     * Parameters: []
     * Returns status codes sorted by enum order
     */
    fetchProductStatuses: `
        SELECT enumlabel::text as status_code
        FROM pg_enum 
        WHERE enumtypid = 'app.product_status'::regtype
        ORDER BY enumsortorder ASC
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
     * Parameters: [product_code, translation_key, status_code,
     * is_published, is_visible_owner, is_visible_groups, is_visible_tech_specs,
     * is_visible_long_description, updated_by, product_id]
     */
    updateProduct: `
        UPDATE app.products SET
            product_code = $1,
            translation_key = $2,
            status_code = $3,
            is_published = $4,
            is_visible_owner = $5,
            is_visible_groups = $6,
            is_visible_tech_specs = $7,
            is_visible_long_description = $8,
            updated_by = $9,
            updated_at = now()
        WHERE product_id = $10
        RETURNING product_id, product_code, translation_key, updated_at
    `,

    /**
     * Updates a product translation
     * Parameters: [name, short_desc, long_desc, tech_specs, updated_by, translation_id]
     */
    updateProductTranslation: `
        UPDATE app.product_translations SET
            name = $1,
            short_desc = $2,
            long_desc = $3,
            tech_specs = $4,
            updated_by = $5,
            updated_at = now()
        WHERE translation_id = $6
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
     * Parameters: [offset, limit, searchQuery, sortBy, sortDesc, publishedFilter, languageCode, statusFilter]
     */
    fetchAllProducts: `
        SELECT 
            p.product_id,
            p.product_code,
            p.translation_key,
            p.is_published,
            p.is_visible_owner,
            p.is_visible_groups,
            p.is_visible_tech_specs,
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
        LEFT JOIN app.product_translations pt ON p.product_id = pt.product_id AND pt.language_code::text = $7::text
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
            ($6::text = 'published' AND p.is_published = true) OR
            ($6::text = 'unpublished' AND p.is_published = false)
        )
        AND ($8::text IS NULL OR $8::text = '' OR p.status_code::text = $8::text)
        GROUP BY p.product_id, p.product_code, p.translation_key,
                 p.is_published, p.is_visible_owner, p.is_visible_groups, p.is_visible_tech_specs,
                 p.is_visible_long_description, p.status_code, p.created_by, p.created_at,
                 p.updated_by, p.updated_at, pt.name, pt.language_code, owner_user.username
        ORDER BY 
            CASE WHEN $4 = 'product_code' AND $5 = false THEN p.product_code END ASC,
            CASE WHEN $4 = 'product_code' AND $5 = true THEN p.product_code END DESC,
            CASE WHEN $4 = 'name' AND $5 = false THEN pt.name END ASC,
            CASE WHEN $4 = 'name' AND $5 = true THEN pt.name END DESC,
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
     * Parameters: [searchQuery, publishedFilter, statusFilter]
     */
    countAllProducts: `
        SELECT COUNT(DISTINCT p.product_id) as total
        FROM app.products p
        LEFT JOIN app.product_translations pt ON p.product_id = pt.product_id
        WHERE 1=1
        AND ($1::text IS NULL OR $1::text = '' OR LOWER(p.product_code) LIKE LOWER($1::text) OR LOWER(pt.name) LIKE LOWER($1::text) OR LOWER(p.translation_key) LIKE LOWER($1::text))
        AND ($2::text IS NULL OR $2::text = '' OR 
            ($2::text = 'published' AND p.is_published = true) OR
            ($2::text = 'unpublished' AND p.is_published = false)
        )
        AND ($3::text IS NULL OR $3::text = '' OR p.status_code::text = $3::text)
    `,

    /**
     * Fetches all products with pagination, search, sorting and filtering with scope filter for 'own' access
     * Parameters: [offset, limit, searchQuery, sortBy, sortDesc, publishedFilter, languageCode, statusFilter, userUuid]
     * Scope filter: user is owner OR user's group is linked as product_specialists
     */
    fetchAllProductsWithScopeFilter: `
        SELECT 
            p.product_id,
            p.product_code,
            p.translation_key,
            p.is_published,
            p.is_visible_owner,
            p.is_visible_groups,
            p.is_visible_tech_specs,
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
        LEFT JOIN app.product_translations pt ON p.product_id = pt.product_id AND pt.language_code::text = $7::text
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
            ($6::text = 'published' AND p.is_published = true) OR
            ($6::text = 'unpublished' AND p.is_published = false)
        )
        AND ($8::text IS NULL OR $8::text = '' OR p.status_code::text = $8::text)
        AND (
            EXISTS (
                SELECT 1 FROM app.product_users pu 
                WHERE pu.product_id = p.product_id 
                AND pu.user_id = $9 
                AND pu.role_type = 'owner'
            )
            OR EXISTS (
                SELECT 1 FROM app.product_groups pg
                JOIN app.group_members ug ON pg.group_id = ug.group_id
                WHERE pg.product_id = p.product_id
                AND pg.role_type = 'product_specialists'
                AND ug.user_id = $9
            )
        )
        GROUP BY p.product_id, p.product_code, p.translation_key,
                 p.is_published, p.is_visible_owner, p.is_visible_groups, p.is_visible_tech_specs,
                 p.is_visible_long_description, p.status_code, p.created_by, p.created_at,
                 p.updated_by, p.updated_at, pt.name, pt.language_code, owner_user.username
        ORDER BY 
            CASE WHEN $4 = 'product_code' AND $5 = false THEN p.product_code END ASC,
            CASE WHEN $4 = 'product_code' AND $5 = true THEN p.product_code END DESC,
            CASE WHEN $4 = 'name' AND $5 = false THEN pt.name END ASC,
            CASE WHEN $4 = 'name' AND $5 = true THEN pt.name END DESC,
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
     * Counts total products with same filters as fetchAllProductsWithScopeFilter
     * Parameters: [searchQuery, publishedFilter, statusFilter, userUuid]
     * Scope filter: user is owner OR user's group is linked as product_specialists
     */
    countAllProductsWithScopeFilter: `
        SELECT COUNT(DISTINCT p.product_id) as total
        FROM app.products p
        LEFT JOIN app.product_translations pt ON p.product_id = pt.product_id
        WHERE 1=1
        AND ($1::text IS NULL OR $1::text = '' OR LOWER(p.product_code) LIKE LOWER($1::text) OR LOWER(pt.name) LIKE LOWER($1::text) OR LOWER(p.translation_key) LIKE LOWER($1::text))
        AND ($2::text IS NULL OR $2::text = '' OR 
            ($2::text = 'published' AND p.is_published = true) OR
            ($2::text = 'unpublished' AND p.is_published = false)
        )
        AND ($3::text IS NULL OR $3::text = '' OR p.status_code::text = $3::text)
        AND (
            EXISTS (
                SELECT 1 FROM app.product_users pu 
                WHERE pu.product_id = p.product_id 
                AND pu.user_id = $4 
                AND pu.role_type = 'owner'
            )
            OR EXISTS (
                SELECT 1 FROM app.product_groups pg
                JOIN app.group_members ug ON pg.group_id = ug.group_id
                WHERE pg.product_id = p.product_id
                AND pg.role_type = 'product_specialists'
                AND ug.user_id = $4
            )
        )
    `,

    // Delete products query - deletes products and cascades to related tables
    deleteProducts: `
        DELETE FROM app.products 
        WHERE product_id = ANY($1)
        RETURNING product_id, product_code
    `,

    /**
     * Fetches all options (all products except the main product)
     * Parameters: [offset, itemsPerPage, searchQuery, sortBy, sortDesc, languageCode, excludeProductId, statusFilter]
     */
    fetchAllOptions: `
        SELECT 
            p.product_id,
            p.product_code,
            p.translation_key,
            p.is_published,
            p.is_visible_owner,
            p.is_visible_groups,
            p.is_visible_tech_specs,
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
        LEFT JOIN app.product_translations pt ON p.product_id = pt.product_id AND pt.language_code::text = $6::text
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
        AND ($7::uuid IS NULL OR p.product_id != $7)
        AND ($8::text IS NULL OR $8::text = '' OR p.status_code::text = $8::text)
        GROUP BY p.product_id, p.product_code, p.translation_key,
                 p.is_published, p.is_visible_owner, p.is_visible_groups, p.is_visible_tech_specs,
                 p.is_visible_long_description, p.status_code, p.created_by, p.created_at,
                 p.updated_by, p.updated_at, pt.name, pt.language_code, owner_user.username
        ORDER BY 
            CASE WHEN $4 = 'product_code' AND $5 = false THEN p.product_code END ASC,
            CASE WHEN $4 = 'product_code' AND $5 = true THEN p.product_code END DESC,
            CASE WHEN $4 = 'name' AND $5 = false THEN pt.name END ASC,
            CASE WHEN $4 = 'name' AND $5 = true THEN pt.name END DESC,
            p.product_code ASC
        LIMIT $2 OFFSET $1
    `,

    /**
     * Counts total options with same filters as fetchAllOptions
     * Parameters: [searchQuery, excludeProductId, statusFilter]
     */
    countAllOptions: `
        SELECT COUNT(DISTINCT p.product_id) as total
        FROM app.products p
        LEFT JOIN app.product_translations pt ON p.product_id = pt.product_id
        WHERE 1=1
        AND ($1::text IS NULL OR $1::text = '' OR LOWER(p.product_code) LIKE LOWER($1::text) OR LOWER(pt.name) LIKE LOWER($1::text) OR LOWER(p.translation_key) LIKE LOWER($1::text))
        AND ($2::uuid IS NULL OR p.product_id != $2)
        AND ($3::text IS NULL OR $3::text = '' OR p.status_code::text = $3::text)
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
    `,

    /**
     * Fetches all regions with product-region bindings and categories
     * Returns all regions, with LEFT JOIN to product_regions and regions_taxable_categories
     * Parameters: [product_id]
     */
    fetchProductRegions: `
        SELECT 
            r.region_id,
            r.region_name,
            pr.taxable_category_id,
            tc.category_name
        FROM app.regions r
        LEFT JOIN app.product_regions pr ON r.region_id = pr.region_id AND pr.product_id = $1
        LEFT JOIN app.regions_taxable_categories tc ON pr.taxable_category_id = tc.id
        ORDER BY r.region_name ASC
    `,

    /**
     * Deletes all product-region bindings for a product
     * Parameters: [product_id]
     */
    deleteProductRegions: `
        DELETE FROM app.product_regions 
        WHERE product_id = $1
    `,

    /**
     * Inserts a product-region binding
     * Parameters: [product_id, region_id, taxable_category_id, created_by]
     */
    insertProductRegion: `
        INSERT INTO app.product_regions (
            product_id, region_id, taxable_category_id, created_by
        ) VALUES ($1, $2, $3, $4)
        RETURNING product_id, region_id, taxable_category_id
    `,

    /**
     * Fetches taxable categories available for a specific region
     * Parameters: [region_id]
     */
    fetchTaxableCategoriesByRegion: `
        SELECT 
            id as category_id,
            category_name
        FROM app.regions_taxable_categories
        WHERE region_id = $1
        ORDER BY category_name ASC
    `
};
