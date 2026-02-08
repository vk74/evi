/**
 * queries.catalog.products.ts - backend file
 * version: 1.10.0
 * 
 * Purpose: SQL queries for catalog products (public consumption layer)
 * Logic: Provides parameterized queries to fetch active products for the catalog and product details
 *        Uses LEFT JOIN with fallback language to ensure products are always visible
 * File type: Backend TypeScript (queries.catalog.products.ts)
 * 
 * Changes in v1.2.0:
 * - Removed option_only filtering from getActiveProducts query
 * - Removed option_only filtering from getActiveProductsBySection query
 * - Removed showOptionsOnly parameter from queries
 * - All published products are now shown in catalog (no type distinction)
 * 
 * Changes in v1.3.0:
 * - Changed getProductOptionsByProductId filter from is_published = true to status_code = 'active'
 * - Product options now filtered by active status instead of published flag
 * 
 * Changes in v1.3.1:
 * - Added sp.published_at to getActiveProductsBySection query for product publication date
 * 
 * Changes in v1.3.2:
 * - Added published_at subquery to getProductDetails query to fetch latest publication date from section_products
 * 
 * Changes in v1.4.0:
 * - Removed JSONB fields (area_specifics, industry_specifics, key_features, product_overview) from all SELECT queries
 * 
 * Changes in v1.5.0:
 * - Added region filtering via INNER JOIN with app.product_regions table
 * - getActiveProducts now requires region_id parameter (REQUIRED, not optional)
 * - getActiveProductsBySection now requires region_id parameter (REQUIRED, not optional)
 * - STRICT FILTERING: Only products with records in app.product_regions for the specified region are shown
 * - Products without region assignment are NOT shown, even if they are published/active
 * 
 * Changes in v1.6.0:
 * - Added region filtering to getProductOptionsByProductId query
 * - getProductOptionsByProductId now requires region_id parameter (REQUIRED, not optional)
 * - STRICT FILTERING: Only options with records in app.product_regions for the specified region are shown
 * - Options without region assignment are NOT shown, even if they are active
 * 
 * Changes in v1.7.0:
 * - Added owner information (first_name, last_name) to getProductDetails query via LEFT JOIN with product_users and users tables
 * - Added specialist groups (array of group names) to getProductDetails query via LEFT JOIN with product_groups and groups tables
 * - Added GROUP BY clause to handle array aggregation of specialist groups
 * 
 * Changes in v1.8.0:
 * - Added visibility flags (is_visible_owner, is_visible_groups, is_visible_tech_specs, is_visible_long_description) to getProductDetails query
 * - Visibility flags control which sections are displayed in product detail cards
 * 
 * Changes in v1.9.0:
 * - Fixed language_code comparisons to cast enum to text before comparison
 * - This allows queries to work with both old enum values ('en', 'ru') and new values ('english', 'russian')
 *
 * Changes in v1.10.0:
 * - getProductOptionsByProductId now returns short_description (COALESCE from product_translations) for estimation Excel export
 */

export const queries = {
  /**
   * Select active products for catalog consumption
   * - Only products with is_published = true
   * - Minimal set of fields required for product cards
   * - Uses LEFT JOIN with fallback to always show products even without translation
   * - STRICT FILTERING: Only shows products that have a record in app.product_regions for the specified region_id
   * - Products without region assignment are NOT shown (strict filtering)
   * - Parameters: [requestedLanguage, fallbackLanguage, region_id (REQUIRED, must not be NULL)]
   */
  getActiveProducts: `
    SELECT 
      p.product_id,
      p.product_code,
      p.translation_key,
      p.is_published,
      COALESCE(pt_requested.name, pt_fallback.name) as name,
      COALESCE(pt_requested.short_desc, pt_fallback.short_desc) as short_desc,
      COALESCE(pt_requested.long_desc, pt_fallback.long_desc) as long_desc,
      COALESCE(pt_requested.tech_specs, pt_fallback.tech_specs) as tech_specs,
      p.created_at,
      p.created_by
    FROM app.products p
    INNER JOIN app.product_regions pr ON p.product_id = pr.product_id AND pr.region_id = $3::integer
    LEFT JOIN app.product_translations pt_requested 
      ON p.product_id = pt_requested.product_id 
      AND pt_requested.language_code::text = $1::text
    LEFT JOIN app.product_translations pt_fallback
      ON p.product_id = pt_fallback.product_id
      AND pt_fallback.language_code::text = $2::text
    WHERE p.is_published = true
      AND (pt_requested.product_id IS NOT NULL OR pt_fallback.product_id IS NOT NULL)
    ORDER BY p.product_code ASC, COALESCE(pt_requested.name, pt_fallback.name) ASC
  `,

  /**
   * Select active products by section for catalog consumption
   * - Only products with is_published = true
   * - Joined with app.section_products for filtering
   * - Uses LEFT JOIN with fallback to always show products even without translation
   * - STRICT FILTERING: Only shows products that have a record in app.product_regions for the specified region_id
   * - Products without region assignment are NOT shown (strict filtering)
   * - Parameters: [sectionId, requestedLanguage, fallbackLanguage, region_id (REQUIRED, must not be NULL)]
   */
  getActiveProductsBySection: `
    SELECT 
      p.product_id,
      p.product_code,
      p.translation_key,
      p.is_published,
      COALESCE(pt_requested.name, pt_fallback.name) as name,
      COALESCE(pt_requested.short_desc, pt_fallback.short_desc) as short_desc,
      COALESCE(pt_requested.long_desc, pt_fallback.long_desc) as long_desc,
      COALESCE(pt_requested.tech_specs, pt_fallback.tech_specs) as tech_specs,
      p.created_at,
      p.created_by,
      sp.published_at
    FROM app.section_products sp
    JOIN app.products p ON sp.product_id = p.product_id
    INNER JOIN app.product_regions pr ON p.product_id = pr.product_id AND pr.region_id = $4::integer
    LEFT JOIN app.product_translations pt_requested 
      ON p.product_id = pt_requested.product_id 
      AND pt_requested.language_code::text = $2::text
    LEFT JOIN app.product_translations pt_fallback
      ON p.product_id = pt_fallback.product_id
      AND pt_fallback.language_code::text = $3::text
    WHERE p.is_published = true 
      AND sp.section_id = $1
      AND (pt_requested.product_id IS NOT NULL OR pt_fallback.product_id IS NOT NULL)
    ORDER BY p.product_code ASC, COALESCE(pt_requested.name, pt_fallback.name) ASC
  `,

  /**
   * Select product details for single product view
   * - Only products with is_published = true
   * - Comprehensive product information for detailed display
   * - Uses LEFT JOIN with fallback to always show product details even without translation
   * - Includes owner information (first_name, last_name) and specialist groups
   * - Includes visibility flags for controlling section display
   * - Parameters: [productId, requestedLanguage, fallbackLanguage]
   */
  getProductDetails: `
    SELECT 
      p.product_id,
      p.product_code,
      p.translation_key,
      p.is_published,
      COALESCE(pt_requested.name, pt_fallback.name) as name,
      COALESCE(pt_requested.short_desc, pt_fallback.short_desc) as short_desc,
      COALESCE(pt_requested.long_desc, pt_fallback.long_desc) as long_desc,
      COALESCE(pt_requested.tech_specs, pt_fallback.tech_specs) as tech_specs,
      p.created_at,
      p.created_by,
      p.updated_at,
      p.updated_by,
      (SELECT MAX(sp.published_at) 
       FROM app.section_products sp 
       WHERE sp.product_id = p.product_id) as published_at,
      u_owner.first_name as owner_first_name,
      u_owner.last_name as owner_last_name,
      COALESCE(array_agg(DISTINCT g.group_name) FILTER (WHERE g.group_name IS NOT NULL), ARRAY[]::text[]) as specialist_groups,
      p.is_visible_owner,
      p.is_visible_groups,
      p.is_visible_tech_specs,
      p.is_visible_long_description
    FROM app.products p
    LEFT JOIN app.product_translations pt_requested 
      ON p.product_id = pt_requested.product_id 
      AND pt_requested.language_code::text = $2::text
    LEFT JOIN app.product_translations pt_fallback
      ON p.product_id = pt_fallback.product_id
      AND pt_fallback.language_code::text = $3::text
    LEFT JOIN app.product_users pu_owner 
      ON p.product_id = pu_owner.product_id 
      AND pu_owner.role_type = 'owner'
    LEFT JOIN app.users u_owner 
      ON pu_owner.user_id = u_owner.user_id
    LEFT JOIN app.product_groups pg 
      ON p.product_id = pg.product_id 
      AND pg.role_type = 'product_specialists'
    LEFT JOIN app.groups g 
      ON pg.group_id = g.group_id
    WHERE p.product_id = $1 
      AND p.is_published = true
      AND (pt_requested.product_id IS NOT NULL OR pt_fallback.product_id IS NOT NULL)
    GROUP BY 
      p.product_id,
      p.product_code,
      p.translation_key,
      p.is_published,
      COALESCE(pt_requested.name, pt_fallback.name),
      COALESCE(pt_requested.short_desc, pt_fallback.short_desc),
      COALESCE(pt_requested.long_desc, pt_fallback.long_desc),
      COALESCE(pt_requested.tech_specs, pt_fallback.tech_specs),
      p.created_at,
      p.created_by,
      p.updated_at,
      p.updated_by,
      u_owner.first_name,
      u_owner.last_name
  `,

  /**
   * Select product options for a product card
   * - Only options where the option product has status_code = 'active'
   * - Uses LEFT JOIN with fallback to always show options even without translation
   * - STRICT FILTERING: Only shows options that have a record in app.product_regions for the specified region_id
   * - Options without region assignment are NOT shown (strict filtering)
   * - Parameters: [mainProductId, requestedLanguage, fallbackLanguage, region_id (REQUIRED, must not be NULL)]
   */
  getProductOptionsByProductId: `
    SELECT 
      po.option_product_id,
      COALESCE(pt_requested.name, pt_fallback.name, p_option.product_code) AS option_name,
      p_option.product_code,
      COALESCE(pt_requested.short_desc, pt_fallback.short_desc) AS short_description,
      p_option.is_published,
      po.is_required,
      po.units_count,
      NULL::numeric AS unit_price
    FROM app.product_options po
    JOIN app.products p_option ON p_option.product_id = po.option_product_id
    INNER JOIN app.product_regions pr ON p_option.product_id = pr.product_id AND pr.region_id = $4::integer
    LEFT JOIN app.product_translations pt_requested 
      ON pt_requested.product_id = po.option_product_id
      AND pt_requested.language_code::text = $2::text
    LEFT JOIN app.product_translations pt_fallback
      ON pt_fallback.product_id = po.option_product_id
      AND pt_fallback.language_code::text = $3::text
    WHERE po.main_product_id = $1
      AND p_option.status_code = 'active'
    ORDER BY COALESCE(pt_requested.name, pt_fallback.name, p_option.product_code) ASC
  `,
};

export default queries;
