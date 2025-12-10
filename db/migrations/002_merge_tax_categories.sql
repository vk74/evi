-- Migration: 002_merge_tax_categories.sql
-- Description: Merge app.taxable_categories into app.regions_taxable_categories and simplify product bindings
-- Date: 2023-12-10

BEGIN;

-- 1. Drop constraints relying on app.regions_taxable_categories PK
-- Drop FK from app.product_regions to app.regions_taxable_categories
ALTER TABLE app.product_regions DROP CONSTRAINT IF EXISTS fk_product_regions_region_category;

-- Drop FK from app.products to app.taxable_categories (if it exists, though removed in previous versions)
ALTER TABLE app.products DROP CONSTRAINT IF EXISTS fk_products_taxable_category;

-- 2. Clear existing data as permitted (resetting tax configuration)
TRUNCATE TABLE app.regions_taxable_categories CASCADE;
TRUNCATE TABLE app.taxable_categories CASCADE;
-- Note: app.product_regions will retain records but lose taxable_category_id data (will be dropped)

-- 3. Modify app.regions_taxable_categories
-- Drop FK to taxable_categories
ALTER TABLE app.regions_taxable_categories DROP CONSTRAINT IF EXISTS fk_regions_taxable_categories_category;

-- Drop existing composite Primary Key
ALTER TABLE app.regions_taxable_categories DROP CONSTRAINT IF EXISTS regions_taxable_categories_pkey;

-- Add new ID column as Primary Key
ALTER TABLE app.regions_taxable_categories ADD COLUMN id SERIAL PRIMARY KEY;

-- Add category_name column
ALTER TABLE app.regions_taxable_categories ADD COLUMN category_name VARCHAR(255) NOT NULL;

-- Drop category_id column (reference to old table)
ALTER TABLE app.regions_taxable_categories DROP COLUMN category_id;

-- 4. Modify app.product_regions
-- Drop old composite reference column
ALTER TABLE app.product_regions DROP COLUMN IF EXISTS taxable_category_id;

-- Add new reference column
ALTER TABLE app.product_regions ADD COLUMN taxable_category_id INTEGER REFERENCES app.regions_taxable_categories(id) ON DELETE SET NULL;

-- 5. Drop old table
DROP TABLE IF EXISTS app.taxable_categories;

-- 6. Add comments
COMMENT ON TABLE app.regions_taxable_categories IS 'Regional taxable categories. Each row is a unique category defined for a specific region with a VAT rate.';
COMMENT ON COLUMN app.regions_taxable_categories.id IS 'Unique identifier for the regional category';
COMMENT ON COLUMN app.regions_taxable_categories.category_name IS 'Name of the taxable category';
COMMENT ON COLUMN app.regions_taxable_categories.vat_rate IS 'VAT rate in percent (0-99) assigned to this category. NULL means no rate assigned (should be deleted if strict).';

COMMENT ON COLUMN app.product_regions.taxable_category_id IS 'Reference to app.regions_taxable_categories.id. Defines the tax category for the product in this region.';

COMMIT;

