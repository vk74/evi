-- Version: 1.0.0
-- Description: Add region column to price_lists_info table with UNIQUE constraint
-- Backend file: 002_add_region_to_price_lists.sql
-- 
-- Changes:
-- - Add region VARCHAR(255) NULL column to app.price_lists_info table
-- - Add UNIQUE constraint on region column (allows multiple NULL values)
-- - Add comment to region column

-- Add region column
ALTER TABLE app.price_lists_info 
ADD COLUMN IF NOT EXISTS region VARCHAR(255) NULL;

-- Add UNIQUE constraint on region column
-- Note: PostgreSQL allows multiple NULL values in UNIQUE columns
CREATE UNIQUE INDEX IF NOT EXISTS idx_price_lists_info_region_unique 
ON app.price_lists_info(region) 
WHERE region IS NOT NULL;

-- Add comment to region column
COMMENT ON COLUMN app.price_lists_info.region IS 'Region assigned to this price list. Each region can be assigned to only one price list. NULL values are allowed.';

