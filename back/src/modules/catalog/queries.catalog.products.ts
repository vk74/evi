/**
 * queries.catalog.products.ts - backend file
 * version: 1.3.0
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
 */

export const queries = {
  /**
   * Select active products for catalog consumption
   * - Only products with is_published = true
   * - Minimal set of fields required for product cards
   * - Uses LEFT JOIN with fallback to always show products even without translation
   * - Parameters: [requestedLanguage, fallbackLanguage]
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
      COALESCE(pt_requested.area_specifics, pt_fallback.area_specifics) as area_specifics,
      COALESCE(pt_requested.industry_specifics, pt_fallback.industry_specifics) as industry_specifics,
      COALESCE(pt_requested.key_features, pt_fallback.key_features) as key_features,
      COALESCE(pt_requested.product_overview, pt_fallback.product_overview) as product_overview,
      p.created_at,
      p.created_by
    FROM app.products p
    LEFT JOIN app.product_translations pt_requested 
      ON p.product_id = pt_requested.product_id 
      AND pt_requested.language_code = $1
    LEFT JOIN app.product_translations pt_fallback
      ON p.product_id = pt_fallback.product_id
      AND pt_fallback.language_code = $2
    WHERE p.is_published = true
      AND (pt_requested.product_id IS NOT NULL OR pt_fallback.product_id IS NOT NULL)
    ORDER BY p.product_code ASC, COALESCE(pt_requested.name, pt_fallback.name) ASC
  `,

  /**
   * Select active products by section for catalog consumption
   * - Only products with is_published = true
   * - Joined with app.section_products for filtering
   * - Uses LEFT JOIN with fallback to always show products even without translation
   * - Parameters: [sectionId, requestedLanguage, fallbackLanguage]
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
      COALESCE(pt_requested.area_specifics, pt_fallback.area_specifics) as area_specifics,
      COALESCE(pt_requested.industry_specifics, pt_fallback.industry_specifics) as industry_specifics,
      COALESCE(pt_requested.key_features, pt_fallback.key_features) as key_features,
      COALESCE(pt_requested.product_overview, pt_fallback.product_overview) as product_overview,
      p.created_at,
      p.created_by
    FROM app.section_products sp
    JOIN app.products p ON sp.product_id = p.product_id
    LEFT JOIN app.product_translations pt_requested 
      ON p.product_id = pt_requested.product_id 
      AND pt_requested.language_code = $2
    LEFT JOIN app.product_translations pt_fallback
      ON p.product_id = pt_fallback.product_id
      AND pt_fallback.language_code = $3
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
      COALESCE(pt_requested.area_specifics, pt_fallback.area_specifics) as area_specifics,
      COALESCE(pt_requested.industry_specifics, pt_fallback.industry_specifics) as industry_specifics,
      COALESCE(pt_requested.key_features, pt_fallback.key_features) as key_features,
      COALESCE(pt_requested.product_overview, pt_fallback.product_overview) as product_overview,
      p.created_at,
      p.created_by,
      p.updated_at,
      p.updated_by
    FROM app.products p
    LEFT JOIN app.product_translations pt_requested 
      ON p.product_id = pt_requested.product_id 
      AND pt_requested.language_code = $2
    LEFT JOIN app.product_translations pt_fallback
      ON p.product_id = pt_fallback.product_id
      AND pt_fallback.language_code = $3
    WHERE p.product_id = $1 
      AND p.is_published = true
      AND (pt_requested.product_id IS NOT NULL OR pt_fallback.product_id IS NOT NULL)
  `,

  /**
   * Select product options for a product card
   * - Only options where the option product has status_code = 'active'
   * - Uses LEFT JOIN with fallback to always show options even without translation
   * - Parameters: [mainProductId, requestedLanguage, fallbackLanguage]
   */
  getProductOptionsByProductId: `
    SELECT 
      po.option_product_id,
      COALESCE(pt_requested.name, pt_fallback.name, p_option.product_code) AS option_name,
      p_option.product_code,
      p_option.is_published,
      po.is_required,
      po.units_count,
      NULL::numeric AS unit_price
    FROM app.product_options po
    JOIN app.products p_option ON p_option.product_id = po.option_product_id
    LEFT JOIN app.product_translations pt_requested 
      ON pt_requested.product_id = po.option_product_id
      AND pt_requested.language_code = $2
    LEFT JOIN app.product_translations pt_fallback
      ON pt_fallback.product_id = po.option_product_id
      AND pt_fallback.language_code = $3
    WHERE po.main_product_id = $1
      AND p_option.status_code = 'active'
    ORDER BY COALESCE(pt_requested.name, pt_fallback.name, p_option.product_code) ASC
  `,
};

export default queries;
