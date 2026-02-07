-- Version: 1.0.11
-- Description: Seeds the database with demo catalog data for evi (regions, products, options, price lists, catalog sections).
-- Backend file: z_01_demo_catalog.sql
--
-- Changes in v1.0.11:
-- - Product AUTO-05-33333: list_price set to 0 in both RUB and KZT price lists.

-- Demo data set for evi: regions reg-a/reg-b, auto/medical/tools products with paired options, RUB/KZT price lists, catalog sections auto and med.

-- ===========================================
-- 1. Delete all demo services and their relations
-- ===========================================

-- DELETE FROM app.section_services;
-- DELETE FROM app.service_users;
-- DELETE FROM app.service_groups;
-- DELETE FROM app.services;

-- ===========================================
-- 2. Regions
-- ===========================================

INSERT INTO app.regions (region_name) VALUES
('reg-a'),
('reg-b')
ON CONFLICT (region_name) DO NOTHING;

-- ===========================================
-- 3. Currencies
-- ===========================================

INSERT INTO app.currencies (code, name, symbol, rounding_precision, active) VALUES
('KZT', 'Казахстанский тенге', '₸', 2, true),
('CNY', 'Китайский юань', '¥', 2, true),
('USD', 'Доллар США', '$', 2, true),
('RUB', 'Российский рубль', '₽', 2, true),
('BYN', 'Белорусский рубль', 'Br', 2, true),
('JPY', 'Японская йена', '¥', 0, true),
('GEL', 'Грузинский лари', '₾', 2, true),
('EUR', 'Евро', '€', 2, true),
('BTC', 'Bitcoin', '₿', 8, true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  symbol = EXCLUDED.symbol,
  rounding_precision = EXCLUDED.rounding_precision,
  active = EXCLUDED.active,
  updated_at = now();

-- ===========================================
-- 4. Taxable Categories (Merged into Regional Taxable Categories)
-- ===========================================

-- ===========================================
-- 5. Regional Tax Rates
-- ===========================================

-- Get region and category IDs for tax rates (2 regions only)
DO $$
DECLARE
    reg_a_id INTEGER;
    reg_b_id INTEGER;
BEGIN
    SELECT region_id INTO reg_a_id FROM app.regions WHERE region_name = 'reg-a';
    SELECT region_id INTO reg_b_id FROM app.regions WHERE region_name = 'reg-b';

    -- reg-a: стандартные 20%, медицинские 0%
    IF NOT EXISTS (SELECT 1 FROM app.regions_taxable_categories WHERE region_id = reg_a_id AND category_name = 'стандартные товары') THEN
        INSERT INTO app.regions_taxable_categories (region_id, category_name, vat_rate) VALUES (reg_a_id, 'стандартные товары', 20);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM app.regions_taxable_categories WHERE region_id = reg_a_id AND category_name = 'медицинские товары') THEN
        INSERT INTO app.regions_taxable_categories (region_id, category_name, vat_rate) VALUES (reg_a_id, 'медицинские товары', 0);
    END IF;

    -- reg-b: стандартные 15%, медицинские 5%
    IF NOT EXISTS (SELECT 1 FROM app.regions_taxable_categories WHERE region_id = reg_b_id AND category_name = 'стандартные товары') THEN
        INSERT INTO app.regions_taxable_categories (region_id, category_name, vat_rate) VALUES (reg_b_id, 'стандартные товары', 15);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM app.regions_taxable_categories WHERE region_id = reg_b_id AND category_name = 'медицинские товары') THEN
        INSERT INTO app.regions_taxable_categories (region_id, category_name, vat_rate) VALUES (reg_b_id, 'медицинские товары', 5);
    END IF;
END $$;

-- ===========================================
-- 6. Test Users
-- ===========================================

INSERT INTO app.users (user_id, username, hashed_password, email, is_staff, account_status, first_name, last_name, created_at, mobile_phone, gender, is_system) VALUES
-- Test user t1 (active) - for testing purposes
('7ef9dce8-c832-40fe-a6ef-85afff37c474', 't1', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 't1@evi.team', false, 'active', 'Test', 'User', NOW(), NULL, NULL, false),
-- Test user t2 (active) - for testing purposes
('c2cbae6f-89b9-4fa8-be9b-a8391526ead7', 't2', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 't2@evi.team', false, 'active', 'Test', 'User Two', NOW(), NULL, NULL, false),
-- Demo user: tech-support member
('d1111111-1111-1111-1111-111111111111', 'tech.sup.guy', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'tech.sup.guy@evi.team', false, 'active', 'Tech', 'Support Guy', NOW(), NULL, NULL, false),
-- Demo user: sales member
('d2222222-2222-2222-2222-222222222222', 'sales.rep', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'sales.rep@evi.team', false, 'active', 'Sales', 'Rep', NOW(), NULL, NULL, false),
-- Demo user: medical-specialists member
('d3333333-3333-3333-3333-333333333333', 'med.spec', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'med.spec@evi.team', false, 'active', 'Med', 'Spec', NOW(), NULL, NULL, false)
ON CONFLICT (user_id) DO UPDATE SET
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    is_staff = EXCLUDED.is_staff,
    account_status = EXCLUDED.account_status,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    mobile_phone = EXCLUDED.mobile_phone,
    gender = EXCLUDED.gender,
    is_system = EXCLUDED.is_system;

-- ===========================================
-- 7. User Groups
-- ===========================================

INSERT INTO app.groups (group_id, group_name, group_status, group_owner, is_system, group_description, group_email, group_created_by) VALUES
('a1b2c3d4-e5f6-4789-a0b1-c2d3e4f5a6b7', 'sales', 'active', '7ef9dce8-c832-40fe-a6ef-85afff37c474', false, 'Отдел продаж', 'sales@evi.team', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b2c3d4e5-f6a7-4890-b1c2-d3e4f5a6b7c8', 'tech-support', 'active', '7ef9dce8-c832-40fe-a6ef-85afff37c474', false, 'Отдел технической поддержки', 'support@evi.team', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c3d4e5f6-a7b8-4901-c2d3-e4f5a6b7c8d9', 'medical-specialists', 'active', '7ef9dce8-c832-40fe-a6ef-85afff37c474', false, 'Группа медицинских специалистов', 'medical@evi.team', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('d4e5f6a7-b8c9-4012-d3e4-f5a6b7c8d9e0', 'auto-specialists', 'active', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7', false, 'Группа автомобильных специалистов', 'auto@evi.team', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('e5f6a7b8-c9d0-4123-e4f5-a6b7c8d9e0f1', 'finance', 'active', '7ef9dce8-c832-40fe-a6ef-85afff37c474', false, 'Финансовый отдел', 'finance@evi.team', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('f6a7b8c9-d0e1-4234-f5a6-b7c8d9e0f1a2', 'procurement', 'active', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7', false, 'Отдел закупок', 'procurement@evi.team', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7')
ON CONFLICT (group_id) DO UPDATE SET
    group_name = EXCLUDED.group_name,
    group_status = EXCLUDED.group_status,
    group_owner = EXCLUDED.group_owner,
    group_description = EXCLUDED.group_description,
    group_email = EXCLUDED.group_email,
    group_modified_at = CURRENT_TIMESTAMP,
    group_modified_by = EXCLUDED.group_created_by;

-- Add users to groups (random distribution)
INSERT INTO app.group_members (group_id, user_id, added_by) VALUES
('a1b2c3d4-e5f6-4789-a0b1-c2d3e4f5a6b7', '7ef9dce8-c832-40fe-a6ef-85afff37c474', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('a1b2c3d4-e5f6-4789-a0b1-c2d3e4f5a6b7', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b2c3d4e5-f6a7-4890-b1c2-d3e4f5a6b7c8', '7ef9dce8-c832-40fe-a6ef-85afff37c474', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c3d4e5f6-a7b8-4901-c2d3-e4f5a6b7c8d9', '7ef9dce8-c832-40fe-a6ef-85afff37c474', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c3d4e5f6-a7b8-4901-c2d3-e4f5a6b7c8d9', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('d4e5f6a7-b8c9-4012-d3e4-f5a6b7c8d9e0', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('e5f6a7b8-c9d0-4123-e4f5-a6b7c8d9e0f1', '7ef9dce8-c832-40fe-a6ef-85afff37c474', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('f6a7b8c9-d0e1-4234-f5a6-b7c8d9e0f1a2', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
-- Demo users in user groups
('b2c3d4e5-f6a7-4890-b1c2-d3e4f5a6b7c8', 'd1111111-1111-1111-1111-111111111111', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('a1b2c3d4-e5f6-4789-a0b1-c2d3e4f5a6b7', 'd2222222-2222-2222-2222-222222222222', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c3d4e5f6-a7b8-4901-c2d3-e4f5a6b7c8d9', 'd3333333-3333-3333-3333-333333333333', '7ef9dce8-c832-40fe-a6ef-85afff37c474')
ON CONFLICT (group_id, user_id, is_active) DO NOTHING;

-- Add test user t1 to sysadmins group
INSERT INTO app.group_members (group_id, user_id, added_by) VALUES
('770e8400-e29b-41d4-a716-446655440001', '7ef9dce8-c832-40fe-a6ef-85afff37c474', '7ef9dce8-c832-40fe-a6ef-85afff37c474')
ON CONFLICT (group_id, user_id, is_active) DO NOTHING;

-- ===========================================
-- 8. Automotive Products
-- ===========================================

-- Products (2 types: Sedan, Jeep; + documents, keys; + accessories). Business sedan and option products (Documents, Keys, Sedan accessories, Media upgrade, Mats, Seat covers) are active and published; Jeep is draft.
INSERT INTO app.products (product_id, product_code, translation_key, is_published, status_code, created_by) VALUES
('a1111111-1111-1111-1111-111111111111', 'AUTO-01-12345', 'auto.sedan.business', true, 'active', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a2222222-2222-2222-2222-222222222222', 'AUTO-02-67890', 'auto.jeep', false, 'draft', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a3333333-3333-3333-3333-333333333333', 'AUTO-03-11111', 'auto.documents', true, 'active', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a4444444-4444-4444-4444-444444444444', 'AUTO-04-22222', 'auto.keys', true, 'active', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a5555555-5555-5555-5555-555555555555', 'AUTO-05-33333', 'auto.sedan.accessories', true, 'active', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a9999999-9999-9999-9999-999999999999', 'AUTO-09-77777', 'auto.media.upgrade', true, 'active', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'AUTO-10-88888', 'auto.mats', true, 'active', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'AUTO-11-99999', 'auto.seat.covers', true, 'active', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7')
ON CONFLICT (product_id) DO UPDATE SET
    product_code = EXCLUDED.product_code,
    translation_key = EXCLUDED.translation_key,
    is_published = EXCLUDED.is_published,
    status_code = EXCLUDED.status_code;

-- Product translations (Russian and English)
INSERT INTO app.product_translations (product_id, language_code, name, short_desc, long_desc, created_by) VALUES
-- Sedan
('a1111111-1111-1111-1111-111111111111', 'russian', 'Седан бизнес-класса', 'Премиальный седан для деловых поездок', 'Комфортабельный седан бизнес-класса с современным дизайном и премиальной отделкой салона. Идеален для деловых поездок и представительских целей.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a1111111-1111-1111-1111-111111111111', 'english', 'Business Sedan', 'Premium sedan for business trips', 'Comfortable business-class sedan with modern design and premium interior trim. Ideal for business trips and representative purposes.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
-- Jeep
('a2222222-2222-2222-2222-222222222222', 'russian', 'Джип', 'Внедорожник для активного отдыха', 'Надежный внедорожник с полным приводом, высокой проходимостью и просторным салоном. Подходит для активного отдыха и поездок по бездорожью.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a2222222-2222-2222-2222-222222222222', 'english', 'Jeep', 'SUV for active recreation', 'Reliable SUV with all-wheel drive, high ground clearance and spacious interior. Suitable for active recreation and off-road trips.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
-- Documents
('a3333333-3333-3333-3333-333333333333', 'russian', 'Документы на автомобиль', 'Комплект документов', 'Полный комплект документов на автомобиль: ПТС, СТС, страховка.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a3333333-3333-3333-3333-333333333333', 'english', 'Car Documents', 'Document set', 'Complete set of car documents: title, registration, insurance.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
-- Keys
('a4444444-4444-4444-4444-444444444444', 'russian', 'Ключи запасные', 'Запасной комплект ключей', 'Запасной комплект ключей от автомобиля с брелоком.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a4444444-4444-4444-4444-444444444444', 'english', 'Spare Keys', 'Spare key set', 'Spare set of car keys with key fob.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
-- Sedan accessories
('a5555555-5555-5555-5555-555555555555', 'russian', 'Набор аксессуаров для седана', 'Комплект аксессуаров', 'Набор аксессуаров для седана: чехлы на сиденья, коврики, органайзер для багажника.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a5555555-5555-5555-5555-555555555555', 'english', 'Sedan Accessories Set', 'Accessories kit', 'Sedan accessories set: seat covers, mats, trunk organizer.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
-- Media upgrade
('a9999999-9999-9999-9999-999999999999', 'russian', 'Апгрейд медиасистемы', 'Мультимедийная система', 'Обновление медиасистемы: большой сенсорный экран, навигация, Apple CarPlay, Android Auto.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a9999999-9999-9999-9999-999999999999', 'english', 'Media System Upgrade', 'Multimedia system', 'Media system upgrade: large touchscreen, navigation, Apple CarPlay, Android Auto.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
-- Mats
('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'russian', 'Коврики автомобильные', 'Комплект ковриков', 'Комплект ковриков в салон и багажник. Водонепроницаемые, легко моются.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'english', 'Car Mats', 'Mat set', 'Set of mats for interior and trunk. Waterproof, easy to clean.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
-- Seat covers
('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'russian', 'Чехлы на сиденья', 'Комплект чехлов', 'Комплект чехлов на сиденья из качественного материала. Защита от износа и загрязнений.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'english', 'Seat Covers', 'Seat cover set', 'Set of seat covers made of quality material. Protection against wear and dirt.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7')
ON CONFLICT (product_id, language_code) DO UPDATE SET
    name = EXCLUDED.name,
    short_desc = EXCLUDED.short_desc,
    long_desc = EXCLUDED.long_desc;

-- Product regions (Business sedan: reg-a and reg-b; other auto: reg-b only, standard category)
DO $$
DECLARE
    reg_a_id INTEGER;
    reg_b_id INTEGER;
    reg_a_std_id INTEGER;
    std_cat_id INTEGER;
BEGIN
    SELECT region_id INTO reg_a_id FROM app.regions WHERE region_name = 'reg-a';
    SELECT region_id INTO reg_b_id FROM app.regions WHERE region_name = 'reg-b';
    SELECT id INTO reg_a_std_id FROM app.regions_taxable_categories 
    WHERE region_id = reg_a_id AND category_name = 'стандартные товары';
    SELECT id INTO std_cat_id FROM app.regions_taxable_categories 
    WHERE region_id = reg_b_id AND category_name = 'стандартные товары';

    INSERT INTO app.product_regions (product_id, region_id, taxable_category_id, created_by) VALUES
    ('a1111111-1111-1111-1111-111111111111', reg_a_id, reg_a_std_id, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
    ('a1111111-1111-1111-1111-111111111111', reg_b_id, std_cat_id, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
    ('a2222222-2222-2222-2222-222222222222', reg_b_id, std_cat_id, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
    ('a3333333-3333-3333-3333-333333333333', reg_a_id, reg_a_std_id, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
    ('a3333333-3333-3333-3333-333333333333', reg_b_id, std_cat_id, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
    ('a4444444-4444-4444-4444-444444444444', reg_a_id, reg_a_std_id, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
    ('a4444444-4444-4444-4444-444444444444', reg_b_id, std_cat_id, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
    ('a5555555-5555-5555-5555-555555555555', reg_a_id, reg_a_std_id, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
    ('a5555555-5555-5555-5555-555555555555', reg_b_id, std_cat_id, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
    ('a9999999-9999-9999-9999-999999999999', reg_b_id, std_cat_id, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
    ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', reg_a_id, reg_a_std_id, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
    ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', reg_b_id, std_cat_id, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
    ('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaab', reg_a_id, reg_a_std_id, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
    ('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaab', reg_b_id, std_cat_id, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7')
    ON CONFLICT (product_id, region_id) DO UPDATE SET
        taxable_category_id = EXCLUDED.taxable_category_id;
END $$;

-- Product owners
INSERT INTO app.product_users (product_id, user_id, role_type, created_by) VALUES
('a1111111-1111-1111-1111-111111111111', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7', 'owner', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a2222222-2222-2222-2222-222222222222', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7', 'owner', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a3333333-3333-3333-3333-333333333333', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7', 'owner', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a4444444-4444-4444-4444-444444444444', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7', 'owner', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a5555555-5555-5555-5555-555555555555', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7', 'owner', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a9999999-9999-9999-9999-999999999999', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7', 'owner', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7', 'owner', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7', 'owner', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7')
ON CONFLICT (product_id, user_id, role_type) DO NOTHING;

-- Product pairing (Sedan and Jeep: required docs/keys, optional accessories)
INSERT INTO app.product_options (main_product_id, option_product_id, is_required, units_count, created_by) VALUES
-- Sedan: required
('a1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', true, 1, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a1111111-1111-1111-1111-111111111111', 'a4444444-4444-4444-4444-444444444444', true, 2, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
-- Sedan: optional
('a1111111-1111-1111-1111-111111111111', 'a5555555-5555-5555-5555-555555555555', false, NULL, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a1111111-1111-1111-1111-111111111111', 'a9999999-9999-9999-9999-999999999999', false, NULL, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
-- Jeep: required
('a2222222-2222-2222-2222-222222222222', 'a3333333-3333-3333-3333-333333333333', true, 1, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a2222222-2222-2222-2222-222222222222', 'a4444444-4444-4444-4444-444444444444', true, 2, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
-- Jeep: optional
('a2222222-2222-2222-2222-222222222222', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', false, NULL, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a2222222-2222-2222-2222-222222222222', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaab', false, NULL, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
-- Sedan Accessories Set: optional (car mats, seat covers)
('a5555555-5555-5555-5555-555555555555', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', false, NULL, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a5555555-5555-5555-5555-555555555555', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaab', false, NULL, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7')
ON CONFLICT (main_product_id, option_product_id) DO UPDATE SET
    is_required = EXCLUDED.is_required,
    units_count = EXCLUDED.units_count;

-- ===========================================
-- 9. Medical Products
-- ===========================================

-- Products (2 types: Ultrasound, Patient Monitor; + gel, probes, electrodes, cable). All draft and unpublished.
INSERT INTO app.products (product_id, product_code, translation_key, is_published, status_code, created_by) VALUES
('b1111111-1111-1111-1111-111111111111', 'MED-01-12345', 'med.ultrasound', false, 'draft', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b2222222-2222-2222-2222-222222222222', 'MED-02-67890', 'med.patient.monitor', false, 'draft', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b4444444-4444-4444-4444-444444444444', 'MED-04-22222', 'med.ultrasound.gel', false, 'draft', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b5555555-5555-5555-5555-555555555555', 'MED-05-33333', 'med.ultrasound.probes', false, 'draft', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b6666666-6666-6666-6666-666666666666', 'MED-06-44444', 'med.monitor.electrodes', false, 'draft', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b7777777-7777-7777-7777-777777777777', 'MED-07-55555', 'med.monitor.cable', false, 'draft', '7ef9dce8-c832-40fe-a6ef-85afff37c474')
ON CONFLICT (product_id) DO UPDATE SET
    product_code = EXCLUDED.product_code,
    translation_key = EXCLUDED.translation_key,
    is_published = EXCLUDED.is_published,
    status_code = EXCLUDED.status_code;

-- Product translations (Russian and English)
INSERT INTO app.product_translations (product_id, language_code, name, short_desc, long_desc, created_by) VALUES
-- Ultrasound
('b1111111-1111-1111-1111-111111111111', 'russian', 'Аппарат УЗИ', 'Ультразвуковой диагностический аппарат', 'Современный ультразвуковой диагностический аппарат с высоким разрешением для медицинских исследований.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b1111111-1111-1111-1111-111111111111', 'english', 'Ultrasound Machine', 'Ultrasound diagnostic device', 'Modern ultrasound diagnostic device with high resolution for medical examinations.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
-- Patient Monitor
('b2222222-2222-2222-2222-222222222222', 'russian', 'Монитор пациента', 'Монитор жизненных показателей', 'Монитор для непрерывного контроля жизненных показателей пациента: пульс, давление, сатурация кислорода.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b2222222-2222-2222-2222-222222222222', 'english', 'Patient Monitor', 'Vital signs monitor', 'Monitor for continuous monitoring of patient vital signs: pulse, blood pressure, oxygen saturation.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
-- Ultrasound Gel
('b4444444-4444-4444-4444-444444444444', 'russian', 'Гель для УЗИ', 'Ультразвуковой гель', 'Специальный гель для ультразвуковых исследований. Обеспечивает хороший контакт датчика с кожей.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b4444444-4444-4444-4444-444444444444', 'english', 'Ultrasound Gel', 'Ultrasound gel', 'Special gel for ultrasound examinations. Provides good contact between the probe and the skin.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
-- Ultrasound Probes
('b5555555-5555-5555-5555-555555555555', 'russian', 'Датчики УЗИ', 'Ультразвуковые датчики', 'Комплект ультразвуковых датчиков для различных типов исследований.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b5555555-5555-5555-5555-555555555555', 'english', 'Ultrasound Probes', 'Ultrasound probes', 'Set of ultrasound probes for various types of examinations.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
-- Monitor Electrodes
('b6666666-6666-6666-6666-666666666666', 'russian', 'Электроды для монитора', 'ЭКГ электроды', 'Одноразовые электроды для подключения к монитору пациента.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b6666666-6666-6666-6666-666666666666', 'english', 'Monitor Electrodes', 'ECG electrodes', 'Disposable electrodes for connecting to patient monitor.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
-- Monitor Cable
('b7777777-7777-7777-7777-777777777777', 'russian', 'Кабель питания для монитора', 'Сетевой кабель', 'Кабель питания для подключения монитора пациента к сети.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b7777777-7777-7777-7777-777777777777', 'english', 'Monitor Power Cable', 'Power cable', 'Power cable for connecting patient monitor to the network.', '7ef9dce8-c832-40fe-a6ef-85afff37c474')
ON CONFLICT (product_id, language_code) DO UPDATE SET
    name = EXCLUDED.name,
    short_desc = EXCLUDED.short_desc,
    long_desc = EXCLUDED.long_desc;

-- Product regions (reg-b only, medical category)
DO $$
DECLARE
    reg_b_id INTEGER;
    med_cat_id INTEGER;
BEGIN
    SELECT region_id INTO reg_b_id FROM app.regions WHERE region_name = 'reg-b';
    SELECT id INTO med_cat_id FROM app.regions_taxable_categories 
    WHERE region_id = reg_b_id AND category_name = 'медицинские товары';

    INSERT INTO app.product_regions (product_id, region_id, taxable_category_id, created_by) VALUES
    ('b1111111-1111-1111-1111-111111111111', reg_b_id, med_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('b2222222-2222-2222-2222-222222222222', reg_b_id, med_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('b4444444-4444-4444-4444-444444444444', reg_b_id, med_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('b5555555-5555-5555-5555-555555555555', reg_b_id, med_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('b6666666-6666-6666-6666-666666666666', reg_b_id, med_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('b7777777-7777-7777-7777-777777777777', reg_b_id, med_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474')
    ON CONFLICT (product_id, region_id) DO UPDATE SET
        taxable_category_id = EXCLUDED.taxable_category_id;
END $$;

-- Product owners
INSERT INTO app.product_users (product_id, user_id, role_type, created_by) VALUES
('b1111111-1111-1111-1111-111111111111', '7ef9dce8-c832-40fe-a6ef-85afff37c474', 'owner', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b2222222-2222-2222-2222-222222222222', '7ef9dce8-c832-40fe-a6ef-85afff37c474', 'owner', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b4444444-4444-4444-4444-444444444444', '7ef9dce8-c832-40fe-a6ef-85afff37c474', 'owner', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b5555555-5555-5555-5555-555555555555', '7ef9dce8-c832-40fe-a6ef-85afff37c474', 'owner', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b6666666-6666-6666-6666-666666666666', '7ef9dce8-c832-40fe-a6ef-85afff37c474', 'owner', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b7777777-7777-7777-7777-777777777777', '7ef9dce8-c832-40fe-a6ef-85afff37c474', 'owner', '7ef9dce8-c832-40fe-a6ef-85afff37c474')
ON CONFLICT (product_id, user_id, role_type) DO NOTHING;

-- Product pairing (Medical: Ultrasound and Patient Monitor with their options)
INSERT INTO app.product_options (main_product_id, option_product_id, is_required, units_count, created_by) VALUES
-- Ultrasound: required
('b1111111-1111-1111-1111-111111111111', 'b4444444-4444-4444-4444-444444444444', true, 3, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b1111111-1111-1111-1111-111111111111', 'b5555555-5555-5555-5555-555555555555', true, 1, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
-- Patient Monitor: required
('b2222222-2222-2222-2222-222222222222', 'b6666666-6666-6666-6666-666666666666', true, 10, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b2222222-2222-2222-2222-222222222222', 'b7777777-7777-7777-7777-777777777777', true, 1, '7ef9dce8-c832-40fe-a6ef-85afff37c474')
ON CONFLICT (main_product_id, option_product_id) DO UPDATE SET
    is_required = EXCLUDED.is_required,
    units_count = EXCLUDED.units_count;

-- ===========================================
-- 10. Tools Products
-- ===========================================

-- Products (4 tools: sterilizer, surgical set, wrench set, jack). All draft and unpublished.
INSERT INTO app.products (product_id, product_code, translation_key, is_published, status_code, created_by) VALUES
('c1111111-1111-1111-1111-111111111111', 'TOOL-01-12345', 'tool.sterilizer', false, 'draft', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c2222222-2222-2222-2222-222222222222', 'TOOL-02-67890', 'tool.surgical.set', false, 'draft', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c5555555-5555-5555-5555-555555555555', 'TOOL-05-33333', 'tool.wrench.set', false, 'draft', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c6666666-6666-6666-6666-666666666666', 'TOOL-06-44444', 'tool.jack', false, 'draft', '7ef9dce8-c832-40fe-a6ef-85afff37c474')
ON CONFLICT (product_id) DO UPDATE SET
    product_code = EXCLUDED.product_code,
    translation_key = EXCLUDED.translation_key,
    is_published = EXCLUDED.is_published,
    status_code = EXCLUDED.status_code;

-- Product translations (Russian and English)
INSERT INTO app.product_translations (product_id, language_code, name, short_desc, long_desc, created_by) VALUES
-- Sterilizer
('c1111111-1111-1111-1111-111111111111', 'russian', 'Стерилизатор', 'Медицинский стерилизатор', 'Автоклав для стерилизации медицинских инструментов. Температура до 134°C.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c1111111-1111-1111-1111-111111111111', 'english', 'Sterilizer', 'Medical sterilizer', 'Autoclave for sterilization of medical instruments. Temperature up to 134°C.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
-- Surgical Set
('c2222222-2222-2222-2222-222222222222', 'russian', 'Набор хирургических инструментов', 'Хирургический набор', 'Комплект хирургических инструментов для различных операций.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c2222222-2222-2222-2222-222222222222', 'english', 'Surgical Instruments Set', 'Surgical set', 'Set of surgical instruments for various operations.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
-- Wrench Set
('c5555555-5555-5555-5555-555555555555', 'russian', 'Набор ключей', 'Автомобильный набор ключей', 'Набор гаечных ключей различных размеров для автомобильного ремонта.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c5555555-5555-5555-5555-555555555555', 'english', 'Wrench Set', 'Automotive wrench set', 'Set of wrenches of various sizes for automotive repair.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
-- Jack
('c6666666-6666-6666-6666-666666666666', 'russian', 'Домкрат', 'Гидравлический домкрат', 'Гидравлический домкрат для подъема автомобиля. Грузоподъемность 2 тонны.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c6666666-6666-6666-6666-666666666666', 'english', 'Jack', 'Hydraulic jack', 'Hydraulic jack for lifting cars. Load capacity 2 tons.', '7ef9dce8-c832-40fe-a6ef-85afff37c474')
ON CONFLICT (product_id, language_code) DO UPDATE SET
    name = EXCLUDED.name,
    short_desc = EXCLUDED.short_desc,
    long_desc = EXCLUDED.long_desc;

-- Product regions (reg-a and reg-b only, standard category)
DO $$
DECLARE
    reg_a_id INTEGER;
    reg_b_id INTEGER;
    reg_a_std_id INTEGER;
    reg_b_std_id INTEGER;
BEGIN
    SELECT region_id INTO reg_a_id FROM app.regions WHERE region_name = 'reg-a';
    SELECT region_id INTO reg_b_id FROM app.regions WHERE region_name = 'reg-b';
    SELECT id INTO reg_a_std_id FROM app.regions_taxable_categories WHERE region_id = reg_a_id AND category_name = 'стандартные товары';
    SELECT id INTO reg_b_std_id FROM app.regions_taxable_categories WHERE region_id = reg_b_id AND category_name = 'стандартные товары';

    INSERT INTO app.product_regions (product_id, region_id, taxable_category_id, created_by) VALUES
    ('c1111111-1111-1111-1111-111111111111', reg_a_id, reg_a_std_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('c1111111-1111-1111-1111-111111111111', reg_b_id, reg_b_std_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('c2222222-2222-2222-2222-222222222222', reg_a_id, reg_a_std_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('c2222222-2222-2222-2222-222222222222', reg_b_id, reg_b_std_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('c5555555-5555-5555-5555-555555555555', reg_a_id, reg_a_std_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('c5555555-5555-5555-5555-555555555555', reg_b_id, reg_b_std_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('c6666666-6666-6666-6666-666666666666', reg_a_id, reg_a_std_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('c6666666-6666-6666-6666-666666666666', reg_b_id, reg_b_std_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474')
    ON CONFLICT (product_id, region_id) DO UPDATE SET
        taxable_category_id = EXCLUDED.taxable_category_id;
END $$;

-- Product owners
INSERT INTO app.product_users (product_id, user_id, role_type, created_by) VALUES
('c1111111-1111-1111-1111-111111111111', '7ef9dce8-c832-40fe-a6ef-85afff37c474', 'owner', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c2222222-2222-2222-2222-222222222222', '7ef9dce8-c832-40fe-a6ef-85afff37c474', 'owner', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c5555555-5555-5555-5555-555555555555', '7ef9dce8-c832-40fe-a6ef-85afff37c474', 'owner', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c6666666-6666-6666-6666-666666666666', '7ef9dce8-c832-40fe-a6ef-85afff37c474', 'owner', '7ef9dce8-c832-40fe-a6ef-85afff37c474')
ON CONFLICT (product_id, user_id, role_type) DO NOTHING;

-- Product pairing (Tools with medical and auto products)
INSERT INTO app.product_options (main_product_id, option_product_id, is_required, units_count, created_by) VALUES
-- Sterilizer with medical equipment (required)
('b1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', true, 1, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', true, 1, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
-- Surgical set with medical equipment (optional)
('b1111111-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222', false, NULL, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', false, NULL, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
-- Wrench set with cars (optional)
('a1111111-1111-1111-1111-111111111111', 'c5555555-5555-5555-5555-555555555555', false, NULL, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a2222222-2222-2222-2222-222222222222', 'c5555555-5555-5555-5555-555555555555', false, NULL, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
-- Jack with cars (optional)
('a1111111-1111-1111-1111-111111111111', 'c6666666-6666-6666-6666-666666666666', false, NULL, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a2222222-2222-2222-2222-222222222222', 'c6666666-6666-6666-6666-666666666666', false, NULL, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7')
ON CONFLICT (main_product_id, option_product_id) DO UPDATE SET
    is_required = EXCLUDED.is_required,
    units_count = EXCLUDED.units_count;

-- ===========================================
-- 11. Price Lists
-- ===========================================

-- Price list info (reg-a RUB, reg-b KZT)
DO $$
DECLARE
    reg_a_id INTEGER;
    reg_b_id INTEGER;
BEGIN
    SELECT region_id INTO reg_a_id FROM app.regions WHERE region_name = 'reg-a';
    SELECT region_id INTO reg_b_id FROM app.regions WHERE region_name = 'reg-b';

    INSERT INTO app.price_lists_info (name, description, currency_code, is_active, owner_id, region_id, created_by) VALUES
    ('Прайслист RUB reg-a', 'Прайслист в российских рублях для региона reg-a', 'RUB', true, '7ef9dce8-c832-40fe-a6ef-85afff37c474', reg_a_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('Прайслист KZT reg-b', 'Прайслист в казахстанских тенге для региона reg-b', 'KZT', true, '7ef9dce8-c832-40fe-a6ef-85afff37c474', reg_b_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474')
    ON CONFLICT (name) DO UPDATE SET
        description = EXCLUDED.description,
        currency_code = EXCLUDED.currency_code,
        is_active = EXCLUDED.is_active,
        region_id = EXCLUDED.region_id;
END $$;

-- Price list items (remaining products only; reg-a RUB, reg-b KZT)
DO $$
DECLARE
    pl_rub_id INTEGER;
    pl_kzt_id INTEGER;
BEGIN
    SELECT price_list_id INTO pl_rub_id FROM app.price_lists_info WHERE name = 'Прайслист RUB reg-a';
    SELECT price_list_id INTO pl_kzt_id FROM app.price_lists_info WHERE name = 'Прайслист KZT reg-b';

    BEGIN
        EXECUTE format('CREATE TABLE IF NOT EXISTS app.price_lists_%s PARTITION OF app.price_lists FOR VALUES IN (%s)', pl_rub_id, pl_rub_id);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        EXECUTE format('CREATE TABLE IF NOT EXISTS app.price_lists_%s PARTITION OF app.price_lists FOR VALUES IN (%s)', pl_kzt_id, pl_kzt_id);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- RUB prices (reg-a)
    INSERT INTO app.price_lists (price_list_id, item_type, item_code, item_name, list_price, created_by) VALUES
    (pl_rub_id, 'product', 'AUTO-01-12345', 'Седан бизнес-класса', 3500000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'AUTO-02-67890', 'Джип', 4200000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'AUTO-03-11111', 'Документы на автомобиль', 5000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'AUTO-04-22222', 'Ключи запасные', 15000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'AUTO-05-33333', 'Набор аксессуаров для седана', 0, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'AUTO-09-77777', 'Апгрейд медиасистемы', 85000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'AUTO-10-88888', 'Коврики автомобильные', 3500.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'AUTO-11-99999', 'Чехлы на сиденья', 5500.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'MED-01-12345', 'Аппарат УЗИ', 2500000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'MED-02-67890', 'Монитор пациента', 180000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'MED-04-22222', 'Гель для УЗИ', 850.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'MED-05-33333', 'Датчики УЗИ', 45000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'MED-06-44444', 'Электроды для монитора', 120.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'MED-07-55555', 'Кабель питания для монитора', 2500.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'TOOL-01-12345', 'Стерилизатор', 85000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'TOOL-02-67890', 'Набор хирургических инструментов', 125000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'TOOL-05-33333', 'Набор ключей', 4500.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'TOOL-06-44444', 'Домкрат', 3500.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474')
    ON CONFLICT (price_list_id, item_type, item_code) DO UPDATE SET
        item_name = EXCLUDED.item_name,
        list_price = EXCLUDED.list_price;

    -- KZT prices (reg-b, approximately 1 RUB = 5 KZT)
    INSERT INTO app.price_lists (price_list_id, item_type, item_code, item_name, list_price, created_by) VALUES
    (pl_kzt_id, 'product', 'AUTO-01-12345', 'Седан бизнес-класса', 17500000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'AUTO-02-67890', 'Джип', 21000000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'AUTO-03-11111', 'Документы на автомобиль', 25000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'AUTO-04-22222', 'Ключи запасные', 75000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'AUTO-05-33333', 'Набор аксессуаров для седана', 0, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'AUTO-09-77777', 'Апгрейд медиасистемы', 425000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'AUTO-10-88888', 'Коврики автомобильные', 17500.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'AUTO-11-99999', 'Чехлы на сиденья', 27500.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'MED-01-12345', 'Аппарат УЗИ', 12500000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'MED-02-67890', 'Монитор пациента', 900000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'MED-04-22222', 'Гель для УЗИ', 4250.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'MED-05-33333', 'Датчики УЗИ', 225000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'MED-06-44444', 'Электроды для монитора', 600.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'MED-07-55555', 'Кабель питания для монитора', 12500.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'TOOL-01-12345', 'Стерилизатор', 425000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'TOOL-02-67890', 'Набор хирургических инструментов', 625000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'TOOL-05-33333', 'Набор ключей', 22500.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'TOOL-06-44444', 'Домкрат', 17500.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474')
    ON CONFLICT (price_list_id, item_type, item_code) DO UPDATE SET
        item_name = EXCLUDED.item_name,
        list_price = EXCLUDED.list_price;
END $$;

-- ===========================================
-- 12. Catalog Sections
-- ===========================================

-- Delete all existing sections
DELETE FROM app.section_products;
DELETE FROM app.catalog_sections;

-- Insert new sections (2 pages: auto, medical)
INSERT INTO app.catalog_sections (id, name, owner, description, status, is_public, "order", icon_name, color, created_by) VALUES
('a2222222-2222-2222-2222-222222222222', 'auto', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7', 'Автомобильные продукты', 'active', true, 1, 'Car', '#E0E0F2', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a3333333-3333-3333-3333-333333333333', 'med', '7ef9dce8-c832-40fe-a6ef-85afff37c474', 'Медицинские продукты', 'active', true, 2, 'Medical', '#E0F2F2', '7ef9dce8-c832-40fe-a6ef-85afff37c474')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    is_public = EXCLUDED.is_public,
    "order" = EXCLUDED."order",
    icon_name = EXCLUDED.icon_name,
    color = EXCLUDED.color;

-- ===========================================
-- 13. Publish Products to Sections
-- ===========================================

-- Publish Business sedan + Documents, Keys, Sedan accessories, Media upgrade, Mats, Seat covers, Wrench set, Jack to auto section
INSERT INTO app.section_products (section_id, product_id, published_by) VALUES
('a2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a2222222-2222-2222-2222-222222222222', 'a3333333-3333-3333-3333-333333333333', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a2222222-2222-2222-2222-222222222222', 'a4444444-4444-4444-4444-444444444444', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a2222222-2222-2222-2222-222222222222', 'a5555555-5555-5555-5555-555555555555', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a2222222-2222-2222-2222-222222222222', 'a9999999-9999-9999-9999-999999999999', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a2222222-2222-2222-2222-222222222222', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a2222222-2222-2222-2222-222222222222', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a2222222-2222-2222-2222-222222222222', 'c5555555-5555-5555-5555-555555555555', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a2222222-2222-2222-2222-222222222222', 'c6666666-6666-6666-6666-666666666666', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7')
ON CONFLICT (section_id, product_id) DO NOTHING;

-- ===========================================
-- 14. Assign Specialist Groups to Products
-- ===========================================

-- Assign groups to automotive products
INSERT INTO app.product_groups (product_id, group_id, role_type, created_by) VALUES
('a1111111-1111-1111-1111-111111111111', 'd4e5f6a7-b8c9-4012-d3e4-f5a6b7c8d9e0', 'product_specialists', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a2222222-2222-2222-2222-222222222222', 'd4e5f6a7-b8c9-4012-d3e4-f5a6b7c8d9e0', 'product_specialists', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a3333333-3333-3333-3333-333333333333', 'd4e5f6a7-b8c9-4012-d3e4-f5a6b7c8d9e0', 'product_specialists', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a4444444-4444-4444-4444-444444444444', 'd4e5f6a7-b8c9-4012-d3e4-f5a6b7c8d9e0', 'product_specialists', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a5555555-5555-5555-5555-555555555555', 'd4e5f6a7-b8c9-4012-d3e4-f5a6b7c8d9e0', 'product_specialists', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a9999999-9999-9999-9999-999999999999', 'd4e5f6a7-b8c9-4012-d3e4-f5a6b7c8d9e0', 'product_specialists', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'd4e5f6a7-b8c9-4012-d3e4-f5a6b7c8d9e0', 'product_specialists', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'd4e5f6a7-b8c9-4012-d3e4-f5a6b7c8d9e0', 'product_specialists', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7')
ON CONFLICT (product_id, group_id, role_type) DO NOTHING;

-- Assign groups to medical products
INSERT INTO app.product_groups (product_id, group_id, role_type, created_by) VALUES
('b1111111-1111-1111-1111-111111111111', 'c3d4e5f6-a7b8-4901-c2d3-e4f5a6b7c8d9', 'product_specialists', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b2222222-2222-2222-2222-222222222222', 'c3d4e5f6-a7b8-4901-c2d3-e4f5a6b7c8d9', 'product_specialists', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b4444444-4444-4444-4444-444444444444', 'c3d4e5f6-a7b8-4901-c2d3-e4f5a6b7c8d9', 'product_specialists', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b5555555-5555-5555-5555-555555555555', 'c3d4e5f6-a7b8-4901-c2d3-e4f5a6b7c8d9', 'product_specialists', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b6666666-6666-6666-6666-666666666666', 'c3d4e5f6-a7b8-4901-c2d3-e4f5a6b7c8d9', 'product_specialists', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b7777777-7777-7777-7777-777777777777', 'c3d4e5f6-a7b8-4901-c2d3-e4f5a6b7c8d9', 'product_specialists', '7ef9dce8-c832-40fe-a6ef-85afff37c474')
ON CONFLICT (product_id, group_id, role_type) DO NOTHING;

-- Assign groups to tools products
INSERT INTO app.product_groups (product_id, group_id, role_type, created_by) VALUES
('c1111111-1111-1111-1111-111111111111', 'c3d4e5f6-a7b8-4901-c2d3-e4f5a6b7c8d9', 'product_specialists', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c2222222-2222-2222-2222-222222222222', 'c3d4e5f6-a7b8-4901-c2d3-e4f5a6b7c8d9', 'product_specialists', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c5555555-5555-5555-5555-555555555555', 'd4e5f6a7-b8c9-4012-d3e4-f5a6b7c8d9e0', 'product_specialists', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c6666666-6666-6666-6666-666666666666', 'd4e5f6a7-b8c9-4012-d3e4-f5a6b7c8d9e0', 'product_specialists', '7ef9dce8-c832-40fe-a6ef-85afff37c474')
ON CONFLICT (product_id, group_id, role_type) DO NOTHING;