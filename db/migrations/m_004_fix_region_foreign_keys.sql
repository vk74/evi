-- Version: 1.0.0
-- Description: Fix foreign key relationships to use IDs instead of names for regions
-- Backend file: 004_fix_region_foreign_keys.sql
--
-- This migration fixes the following issues:
-- 1. app.users.location (VARCHAR) -> app.users.location_id (INTEGER) referencing app.regions(region_id)
-- 2. app.price_lists_info.region (VARCHAR) -> app.price_lists_info.region_id (INTEGER) referencing app.regions(region_id)
-- 3. Add UNIQUE constraint on app.regions_taxable_categories(region_id, category_name)
--
-- The migration is idempotent and safe to run multiple times.

-- ===========================================
-- 1. Fix app.users.location -> location_id
-- ===========================================

DO $$
BEGIN
    -- Check if location_id column already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'app' 
        AND table_name = 'users' 
        AND column_name = 'location_id'
    ) THEN
        -- Add new location_id column
        ALTER TABLE app.users ADD COLUMN location_id INTEGER;
        
        -- Populate location_id from existing location values via JOIN
        UPDATE app.users u
        SET location_id = r.region_id
        FROM app.regions r
        WHERE u.location = r.region_name;
        
        -- Drop old foreign key constraint if it exists
        IF EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE constraint_schema = 'app' 
            AND table_name = 'users' 
            AND constraint_name = 'fk_users_location_region'
        ) THEN
            ALTER TABLE app.users DROP CONSTRAINT fk_users_location_region;
        END IF;
        
        -- Drop old location column if it exists
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'app' 
            AND table_name = 'users' 
            AND column_name = 'location'
        ) THEN
            ALTER TABLE app.users DROP COLUMN location;
        END IF;
        
        -- Add new foreign key constraint
        ALTER TABLE app.users 
        ADD CONSTRAINT fk_users_location_region_id 
        FOREIGN KEY (location_id) 
        REFERENCES app.regions(region_id) 
        ON DELETE SET NULL;
        
        -- Add comment
        COMMENT ON COLUMN app.users.location_id IS 
            'Reference to app.regions.region_id. When a region is deleted, user locations are automatically set to NULL.';
        
        RAISE NOTICE 'Migration: app.users.location -> location_id completed';
    ELSE
        RAISE NOTICE 'Migration: app.users.location_id already exists, skipping';
    END IF;
END $$;

-- ===========================================
-- 2. Fix app.price_lists_info.region -> region_id
-- ===========================================

DO $$
BEGIN
    -- Check if region_id column already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'app' 
        AND table_name = 'price_lists_info' 
        AND column_name = 'region_id'
    ) THEN
        -- Add new region_id column
        ALTER TABLE app.price_lists_info ADD COLUMN region_id INTEGER;
        
        -- Populate region_id from existing region values via JOIN
        UPDATE app.price_lists_info pli
        SET region_id = r.region_id
        FROM app.regions r
        WHERE pli.region = r.region_name;
        
        -- Drop old foreign key constraint if it exists
        IF EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE constraint_schema = 'app' 
            AND table_name = 'price_lists_info' 
            AND constraint_name = 'fk_price_lists_info_region'
        ) THEN
            ALTER TABLE app.price_lists_info DROP CONSTRAINT fk_price_lists_info_region;
        END IF;
        
        -- Drop old unique index if it exists
        IF EXISTS (
            SELECT 1 
            FROM pg_indexes 
            WHERE schemaname = 'app' 
            AND tablename = 'price_lists_info' 
            AND indexname = 'idx_price_lists_info_region_unique'
        ) THEN
            DROP INDEX IF EXISTS app.idx_price_lists_info_region_unique;
        END IF;
        
        -- Drop old region column if it exists
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'app' 
            AND table_name = 'price_lists_info' 
            AND column_name = 'region'
        ) THEN
            ALTER TABLE app.price_lists_info DROP COLUMN region;
        END IF;
        
        -- Add new foreign key constraint
        ALTER TABLE app.price_lists_info 
        ADD CONSTRAINT fk_price_lists_info_region_id 
        FOREIGN KEY (region_id) 
        REFERENCES app.regions(region_id) 
        ON DELETE SET NULL;
        
        -- Create new unique index on region_id (allows multiple NULL values)
        CREATE UNIQUE INDEX IF NOT EXISTS idx_price_lists_info_region_id_unique 
        ON app.price_lists_info(region_id) 
        WHERE region_id IS NOT NULL;
        
        -- Update comment
        COMMENT ON COLUMN app.price_lists_info.region_id IS 
            'Reference to app.regions.region_id. Each region can be assigned to only one price list. NULL values are allowed. Automatically set to NULL when referenced region is deleted.';
        
        RAISE NOTICE 'Migration: app.price_lists_info.region -> region_id completed';
    ELSE
        RAISE NOTICE 'Migration: app.price_lists_info.region_id already exists, skipping';
    END IF;
END $$;

-- ===========================================
-- 3. Add UNIQUE constraint on regions_taxable_categories
-- ===========================================

DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    -- Check if UNIQUE constraint already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_schema = 'app' 
        AND table_name = 'regions_taxable_categories' 
        AND constraint_name = 'uq_regions_taxable_categories_region_category'
    ) THEN
        -- Check for duplicates
        SELECT COUNT(*) INTO duplicate_count
        FROM (
            SELECT region_id, category_name, COUNT(*) as cnt
            FROM app.regions_taxable_categories
            GROUP BY region_id, category_name
            HAVING COUNT(*) > 1
        ) duplicates;
        
        -- Remove duplicates if any exist (keep the record with minimum id)
        IF duplicate_count > 0 THEN
            DELETE FROM app.regions_taxable_categories rtc1
            WHERE EXISTS (
                SELECT 1 
                FROM app.regions_taxable_categories rtc2
                WHERE rtc2.region_id = rtc1.region_id
                AND rtc2.category_name = rtc1.category_name
                AND rtc2.id < rtc1.id
            );
            
            RAISE NOTICE 'Migration: Removed % duplicate entries from app.regions_taxable_categories', duplicate_count;
        END IF;
        
        -- Add UNIQUE constraint
        ALTER TABLE app.regions_taxable_categories 
        ADD CONSTRAINT uq_regions_taxable_categories_region_category 
        UNIQUE (region_id, category_name);
        
        -- Add comment
        COMMENT ON CONSTRAINT uq_regions_taxable_categories_region_category 
        ON app.regions_taxable_categories IS 
            'Ensures that each category name is unique within a region';
        
        RAISE NOTICE 'Migration: Added UNIQUE constraint on app.regions_taxable_categories(region_id, category_name)';
    ELSE
        RAISE NOTICE 'Migration: UNIQUE constraint on app.regions_taxable_categories already exists, skipping';
    END IF;
END $$;

