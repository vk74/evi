/**
 * queries.catalog.products.ts - backend file
 * version: 1.1.0
 * 
 * Purpose: SQL queries for catalog products (public consumption layer)
 * Logic: Provides parameterized queries to fetch active products for the catalog and product details
 *        Filters products with option_only=true based on display settings
 * File type: Backend TypeScript (queries.catalog.products.ts)
 */

export const queries = {
  /**
   * Select active products for catalog consumption
   * - Only products with is_published = true
   * - Filters option_only products based on $2 parameter
   * - Minimal set of fields required for product cards
   * - Uses specified language parameter ($1)
   * - Parameters: [language, showOptionsOnly]
   */
  getActiveProducts: `
    SELECT 
      p.product_id,
      p.product_code,
      p.translation_key,
      p.is_published,
      pt.name,
      pt.short_desc,
      pt.long_desc,
      pt.tech_specs,
      pt.area_specifics,
      pt.industry_specifics,
      pt.key_features,
      pt.product_overview,
      p.created_at,
      p.created_by
    FROM app.products p
    JOIN app.product_translations pt 
      ON p.product_id = pt.product_id 
      AND pt.language_code = $1
    WHERE p.is_published = true
      AND ($2 = true OR p.option_only = false)
    ORDER BY p.product_code ASC, pt.name ASC
  `,

  /**
   * Select active products by section for catalog consumption
   * - Only products with is_published = true
   * - Filters option_only products based on $3 parameter
   * - Joined with app.section_products for filtering
   * - Uses specified language parameter ($2)
   * - Parameters: [sectionId, language, showOptionsOnly]
   */
  getActiveProductsBySection: `
    SELECT 
      p.product_id,
      p.product_code,
      p.translation_key,
      p.is_published,
      pt.name,
      pt.short_desc,
      pt.long_desc,
      pt.tech_specs,
      pt.area_specifics,
      pt.industry_specifics,
      pt.key_features,
      pt.product_overview,
      p.created_at,
      p.created_by
    FROM app.section_products sp
    JOIN app.products p ON sp.product_id = p.product_id
    JOIN app.product_translations pt 
      ON p.product_id = pt.product_id 
      AND pt.language_code = $2
    WHERE p.is_published = true 
      AND sp.section_id = $1
      AND ($3 = true OR p.option_only = false)
    ORDER BY p.product_code ASC, pt.name ASC
  `,

  /**
   * Select product details for single product view
   * - Only products with is_published = true
   * - Comprehensive product information for detailed display
   * - Uses specified language parameter
   */
  getProductDetails: `
    SELECT 
      p.product_id,
      p.product_code,
      p.translation_key,
      p.is_published,
      pt.name,
      pt.short_desc,
      pt.long_desc,
      pt.tech_specs,
      pt.area_specifics,
      pt.industry_specifics,
      pt.key_features,
      pt.product_overview,
      p.created_at,
      p.created_by,
      p.updated_at,
      p.updated_by
    FROM app.products p
    JOIN app.product_translations pt 
      ON p.product_id = pt.product_id 
      AND pt.language_code = $2
    WHERE p.product_id = $1 AND p.is_published = true
  `,

  /**
   * Select product options for a product card
   * - Only options where the option product is published
   * - LEFT JOIN translations to include options even without translations
   * - If no translation exists, option_name will be NULL
   */
  getProductOptionsByProductId: `
    SELECT 
      po.option_product_id,
      pt.name AS option_name,
      p_option.product_code,
      p_option.is_published,
      po.is_required,
      po.units_count,
      NULL::numeric AS unit_price
    FROM app.product_options po
    JOIN app.products p_option ON p_option.product_id = po.option_product_id
    LEFT JOIN app.product_translations pt 
      ON pt.product_id = po.option_product_id
      AND pt.language_code = $2
    WHERE po.main_product_id = $1
      AND p_option.is_published = true
    ORDER BY COALESCE(pt.name, p_option.product_code) ASC
  `,
};

export default queries;
