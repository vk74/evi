/**
 * File: queries.admin.product.option.pairs.ts
 * Version: 1.0.0
 * Description: Parameterized SQL queries for product-option pairs operations.
 * Backend file - queries.admin.product.option.pairs.ts
 */

export const pairsQueries = {
  readPairsByMainAndOptions: `
    SELECT option_product_id, is_required, units_count
    FROM app.product_options
    WHERE main_product_id = $1
      AND option_product_id = ANY($2::uuid[])
  `,

  // Check existing pairs for conflict detection
  checkExistingPairs: `
    SELECT option_product_id
    FROM app.product_options
    WHERE main_product_id = $1
      AND option_product_id = ANY($2::uuid[])
  `,

  // Bulk insert using UNNEST arrays; explicit conflict handling happens in service
  insertPairsUsingUnnest: `
    INSERT INTO app.product_options
      (option_relation_id, main_product_id, option_product_id, is_required, units_count, created_by, created_at, updated_by, updated_at)
    SELECT rel_id, $1, option_id, is_req, units, $2, now(), $2, now()
    FROM UNNEST($3::uuid[], $4::boolean[], $5::int[], $6::uuid[]) AS s(option_id, is_req, units, rel_id)
  `,

  // Bulk update using UNNEST arrays
  updatePairsUsingUnnest: `
    UPDATE app.product_options AS po
    SET is_required = s.is_req,
        units_count = s.units,
        updated_by = $3,
        updated_at = now()
    FROM UNNEST($2::uuid[], $4::boolean[], $5::int[]) AS s(option_id, is_req, units)
    WHERE po.main_product_id = $1
      AND po.option_product_id = s.option_id
  `
  ,
  // Delete selected pairs
  deleteSelectedPairs: `
    DELETE FROM app.product_options
    WHERE main_product_id = $1
      AND option_product_id = ANY($2::uuid[])
    RETURNING option_product_id
  `,
  // Delete all pairs for product
  deleteAllPairs: `
    DELETE FROM app.product_options
    WHERE main_product_id = $1
    RETURNING option_product_id
  `
}


