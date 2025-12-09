-- Version: 1.0.2
-- Description: Seeds the database with demo catalog data, including sections and services.
-- Backend file: 11_demo_catalog.sql

-- This script populates the product/service catalog with a set of demo entries
-- to provide a meaningful example for new users. It includes creating catalog
-- sections and linking services to them. The script is idempotent.

-- Changes in v1.0.2:
-- - Fixed invalid UUIDs: replaced 's' with 'a' for sections, 'm' with 'b' for medical products, 't' with 'c' for tools
-- - All UUIDs now use valid hex characters (0-9, a-f) only

-- ===========================================
-- 1. Delete all demo services and their relations
-- ===========================================

DELETE FROM app.section_services;
DELETE FROM app.service_users;
DELETE FROM app.service_groups;
DELETE FROM app.services;

-- ===========================================
-- 2. Regions
-- ===========================================

INSERT INTO app.regions (region_name) VALUES
('reg-a'),
('reg-b'),
('reg-c')
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
-- 4. Taxable Categories
-- ===========================================

INSERT INTO app.taxable_categories (category_name) VALUES
('стандартные товары'),
('медицинские товары')
ON CONFLICT DO NOTHING;

-- ===========================================
-- 5. Regional Tax Rates
-- ===========================================

-- Get region and category IDs for tax rates
DO $$
DECLARE
    reg_a_id INTEGER;
    reg_b_id INTEGER;
    reg_c_id INTEGER;
    std_cat_id INTEGER;
    med_cat_id INTEGER;
BEGIN
    SELECT region_id INTO reg_a_id FROM app.regions WHERE region_name = 'reg-a';
    SELECT region_id INTO reg_b_id FROM app.regions WHERE region_name = 'reg-b';
    SELECT region_id INTO reg_c_id FROM app.regions WHERE region_name = 'reg-c';
    SELECT category_id INTO std_cat_id FROM app.taxable_categories WHERE category_name = 'стандартные товары';
    SELECT category_id INTO med_cat_id FROM app.taxable_categories WHERE category_name = 'медицинские товары';

    -- reg-a: стандартные 20%, медицинские 0%
    INSERT INTO app.regions_taxable_categories (region_id, category_id, vat_rate) VALUES
    (reg_a_id, std_cat_id, 20),
    (reg_a_id, med_cat_id, 0)
    ON CONFLICT (region_id, category_id) DO UPDATE SET vat_rate = EXCLUDED.vat_rate;

    -- reg-b: стандартные 15%, медицинские 5%
    INSERT INTO app.regions_taxable_categories (region_id, category_id, vat_rate) VALUES
    (reg_b_id, std_cat_id, 15),
    (reg_b_id, med_cat_id, 5)
    ON CONFLICT (region_id, category_id) DO UPDATE SET vat_rate = EXCLUDED.vat_rate;

    -- reg-c: стандартные 17%, медицинские 5%
    INSERT INTO app.regions_taxable_categories (region_id, category_id, vat_rate) VALUES
    (reg_c_id, std_cat_id, 17),
    (reg_c_id, med_cat_id, 5)
    ON CONFLICT (region_id, category_id) DO UPDATE SET vat_rate = EXCLUDED.vat_rate;
END $$;

-- ===========================================
-- 6. Test Users
-- ===========================================

INSERT INTO app.users (user_id, username, hashed_password, email, is_staff, account_status, first_name, last_name, created_at, mobile_phone, gender, is_system) VALUES
-- Test user t1 (active) - for testing purposes
('7ef9dce8-c832-40fe-a6ef-85afff37c474', 't1', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 't1@evi.team', false, 'active', 'Test', 'User', NOW(), NULL, NULL, false),
-- Test user t2 (active) - for testing purposes
('c2cbae6f-89b9-4fa8-be9b-a8391526ead7', 't2', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 't2@evi.team', false, 'active', 'Test', 'User Two', NOW(), NULL, NULL, false)
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
('a1b2c3d4-e5f6-4789-a0b1-c2d3e4f5a6b7', 'Продажи', 'active', '7ef9dce8-c832-40fe-a6ef-85afff37c474', false, 'Отдел продаж', 'sales@evi.team', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b2c3d4e5-f6a7-4890-b1c2-d3e4f5a6b7c8', 'Техническая поддержка', 'active', '7ef9dce8-c832-40fe-a6ef-85afff37c474', false, 'Отдел технической поддержки', 'support@evi.team', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c3d4e5f6-a7b8-4901-c2d3-e4f5a6b7c8d9', 'Медицинские специалисты', 'active', '7ef9dce8-c832-40fe-a6ef-85afff37c474', false, 'Группа медицинских специалистов', 'medical@evi.team', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('d4e5f6a7-b8c9-4012-d3e4-f5a6b7c8d9e0', 'Автомобильные специалисты', 'active', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7', false, 'Группа автомобильных специалистов', 'auto@evi.team', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('e5f6a7b8-c9d0-4123-e4f5-a6b7c8d9e0f1', 'Финансовый отдел', 'active', '7ef9dce8-c832-40fe-a6ef-85afff37c474', false, 'Финансовый отдел', 'finance@evi.team', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('f6a7b8c9-d0e1-4234-f5a6-b7c8d9e0f1a2', 'Отдел закупок', 'active', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7', false, 'Отдел закупок', 'procurement@evi.team', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7')
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
('f6a7b8c9-d0e1-4234-f5a6-b7c8d9e0f1a2', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7')
ON CONFLICT (group_id, user_id, is_active) DO NOTHING;

-- ===========================================
-- 8. Automotive Products
-- ===========================================

-- Products
INSERT INTO app.products (product_id, product_code, translation_key, is_published, status_code, created_by) VALUES
('a1111111-1111-1111-1111-111111111111', 'AUTO-01-12345', 'auto.sedan.business', true, 'active', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a2222222-2222-2222-2222-222222222222', 'AUTO-02-67890', 'auto.jeep', true, 'active', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a3333333-3333-3333-3333-333333333333', 'AUTO-03-11111', 'auto.documents', true, 'active', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a4444444-4444-4444-4444-444444444444', 'AUTO-04-22222', 'auto.keys', true, 'active', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a5555555-5555-5555-5555-555555555555', 'AUTO-05-33333', 'auto.sedan.accessories', true, 'active', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a6666666-6666-6666-6666-666666666666', 'AUTO-06-44444', 'auto.jeep.accessories', true, 'active', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a7777777-7777-7777-7777-777777777777', 'AUTO-07-55555', 'auto.winch', true, 'active', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a8888888-8888-8888-8888-888888888888', 'AUTO-08-66666', 'auto.roof.rack', true, 'active', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
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
('a1111111-1111-1111-1111-111111111111', 'ru', 'Седан бизнес-класса', 'Премиальный седан для деловых поездок', 'Комфортабельный седан бизнес-класса с современным дизайном и премиальной отделкой салона. Идеален для деловых поездок и представительских целей.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a1111111-1111-1111-1111-111111111111', 'en', 'Business Sedan', 'Premium sedan for business trips', 'Comfortable business-class sedan with modern design and premium interior trim. Ideal for business trips and representative purposes.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
-- Jeep
('a2222222-2222-2222-2222-222222222222', 'ru', 'Джип', 'Внедорожник для активного отдыха', 'Надежный внедорожник с полным приводом, высокой проходимостью и просторным салоном. Подходит для активного отдыха и поездок по бездорожью.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a2222222-2222-2222-2222-222222222222', 'en', 'Jeep', 'SUV for active recreation', 'Reliable SUV with all-wheel drive, high ground clearance and spacious interior. Suitable for active recreation and off-road trips.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
-- Documents
('a3333333-3333-3333-3333-333333333333', 'ru', 'Документы на автомобиль', 'Комплект документов', 'Полный комплект документов на автомобиль: ПТС, СТС, страховка.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a3333333-3333-3333-3333-333333333333', 'en', 'Car Documents', 'Document set', 'Complete set of car documents: title, registration, insurance.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
-- Keys
('a4444444-4444-4444-4444-444444444444', 'ru', 'Ключи запасные', 'Запасной комплект ключей', 'Запасной комплект ключей от автомобиля с брелоком.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a4444444-4444-4444-4444-444444444444', 'en', 'Spare Keys', 'Spare key set', 'Spare set of car keys with key fob.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
-- Sedan accessories
('a5555555-5555-5555-5555-555555555555', 'ru', 'Набор аксессуаров для седана', 'Комплект аксессуаров', 'Набор аксессуаров для седана: чехлы на сиденья, коврики, органайзер для багажника.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a5555555-5555-5555-5555-555555555555', 'en', 'Sedan Accessories Set', 'Accessories kit', 'Sedan accessories set: seat covers, mats, trunk organizer.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
-- Jeep accessories
('a6666666-6666-6666-6666-666666666666', 'ru', 'Набор аксессуаров для джипа', 'Комплект аксессуаров', 'Набор аксессуаров для джипа: лебедка, багажник на крышу, защита днища.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a6666666-6666-6666-6666-666666666666', 'en', 'Jeep Accessories Set', 'Accessories kit', 'Jeep accessories set: winch, roof rack, underbody protection.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
-- Winch
('a7777777-7777-7777-7777-777777777777', 'ru', 'Лебедка', 'Электрическая лебедка', 'Мощная электрическая лебедка для внедорожников. Грузоподъемность 3500 кг.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a7777777-7777-7777-7777-777777777777', 'en', 'Winch', 'Electric winch', 'Powerful electric winch for SUVs. Load capacity 3500 kg.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
-- Roof rack
('a8888888-8888-8888-8888-888888888888', 'ru', 'Багажник на крышу', 'Крышной багажник', 'Универсальный багажник на крышу с креплениями. Вместимость до 75 кг.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a8888888-8888-8888-8888-888888888888', 'en', 'Roof Rack', 'Roof luggage rack', 'Universal roof rack with mounts. Capacity up to 75 kg.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
-- Media upgrade
('a9999999-9999-9999-9999-999999999999', 'ru', 'Апгрейд медиасистемы', 'Мультимедийная система', 'Обновление медиасистемы: большой сенсорный экран, навигация, Apple CarPlay, Android Auto.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a9999999-9999-9999-9999-999999999999', 'en', 'Media System Upgrade', 'Multimedia system', 'Media system upgrade: large touchscreen, navigation, Apple CarPlay, Android Auto.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
-- Mats
('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ru', 'Коврики автомобильные', 'Комплект ковриков', 'Комплект ковриков в салон и багажник. Водонепроницаемые, легко моются.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'en', 'Car Mats', 'Mat set', 'Set of mats for interior and trunk. Waterproof, easy to clean.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
-- Seat covers
('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'ru', 'Чехлы на сиденья', 'Комплект чехлов', 'Комплект чехлов на сиденья из качественного материала. Защита от износа и загрязнений.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'en', 'Seat Covers', 'Seat cover set', 'Set of seat covers made of quality material. Protection against wear and dirt.', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7')
ON CONFLICT (product_id, language_code) DO UPDATE SET
    name = EXCLUDED.name,
    short_desc = EXCLUDED.short_desc,
    long_desc = EXCLUDED.long_desc;

-- Product regions (reg-b only, standard category)
DO $$
DECLARE
    reg_b_id INTEGER;
    std_cat_id INTEGER;
BEGIN
    SELECT region_id INTO reg_b_id FROM app.regions WHERE region_name = 'reg-b';
    SELECT category_id INTO std_cat_id FROM app.taxable_categories WHERE category_name = 'стандартные товары';

    INSERT INTO app.product_regions (product_id, region_id, taxable_category_id, created_by) VALUES
    ('a1111111-1111-1111-1111-111111111111', reg_b_id, std_cat_id, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
    ('a2222222-2222-2222-2222-222222222222', reg_b_id, std_cat_id, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
    ('a3333333-3333-3333-3333-333333333333', reg_b_id, std_cat_id, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
    ('a4444444-4444-4444-4444-444444444444', reg_b_id, std_cat_id, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
    ('a5555555-5555-5555-5555-555555555555', reg_b_id, std_cat_id, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
    ('a6666666-6666-6666-6666-666666666666', reg_b_id, std_cat_id, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
    ('a7777777-7777-7777-7777-777777777777', reg_b_id, std_cat_id, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
    ('a8888888-8888-8888-8888-888888888888', reg_b_id, std_cat_id, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
    ('a9999999-9999-9999-9999-999999999999', reg_b_id, std_cat_id, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
    ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', reg_b_id, std_cat_id, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
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
('a6666666-6666-6666-6666-666666666666', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7', 'owner', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a7777777-7777-7777-7777-777777777777', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7', 'owner', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a8888888-8888-8888-8888-888888888888', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7', 'owner', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a9999999-9999-9999-9999-999999999999', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7', 'owner', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7', 'owner', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7', 'owner', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7')
ON CONFLICT (product_id, user_id, role_type) DO NOTHING;

-- Product pairing (Sedan)
INSERT INTO app.product_options (main_product_id, option_product_id, is_required, units_count, created_by) VALUES
-- Sedan: required
('a1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', true, 1, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a1111111-1111-1111-1111-111111111111', 'a4444444-4444-4444-4444-444444444444', true, 2, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
-- Sedan: optional
('a1111111-1111-1111-1111-111111111111', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', false, NULL, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a1111111-1111-1111-1111-111111111111', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaab', false, NULL, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a1111111-1111-1111-1111-111111111111', 'a9999999-9999-9999-9999-999999999999', false, NULL, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a1111111-1111-1111-1111-111111111111', 'a5555555-5555-5555-5555-555555555555', false, NULL, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
-- Jeep: required
('a2222222-2222-2222-2222-222222222222', 'a3333333-3333-3333-3333-333333333333', true, 1, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a2222222-2222-2222-2222-222222222222', 'a4444444-4444-4444-4444-444444444444', true, 2, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
-- Jeep: optional
('a2222222-2222-2222-2222-222222222222', 'a7777777-7777-7777-7777-777777777777', false, NULL, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a2222222-2222-2222-2222-222222222222', 'a8888888-8888-8888-8888-888888888888', false, NULL, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a2222222-2222-2222-2222-222222222222', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', false, NULL, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a2222222-2222-2222-2222-222222222222', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaab', false, NULL, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a2222222-2222-2222-2222-222222222222', 'a6666666-6666-6666-6666-666666666666', false, NULL, 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7')
ON CONFLICT (main_product_id, option_product_id) DO UPDATE SET
    is_required = EXCLUDED.is_required,
    units_count = EXCLUDED.units_count;

-- ===========================================
-- 9. Medical Products
-- ===========================================

-- Products
INSERT INTO app.products (product_id, product_code, translation_key, is_published, status_code, created_by) VALUES
('b1111111-1111-1111-1111-111111111111', 'MED-01-12345', 'med.ultrasound', true, 'active', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b2222222-2222-2222-2222-222222222222', 'MED-02-67890', 'med.patient.monitor', true, 'active', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b3333333-3333-3333-3333-333333333333', 'MED-03-11111', 'med.dental.equipment', true, 'active', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b4444444-4444-4444-4444-444444444444', 'MED-04-22222', 'med.ultrasound.gel', true, 'active', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b5555555-5555-5555-5555-555555555555', 'MED-05-33333', 'med.ultrasound.probes', true, 'active', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b6666666-6666-6666-6666-666666666666', 'MED-06-44444', 'med.monitor.electrodes', true, 'active', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b7777777-7777-7777-7777-777777777777', 'MED-07-55555', 'med.monitor.cable', true, 'active', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b8888888-8888-8888-8888-888888888888', 'MED-08-66666', 'med.dental.tips', true, 'active', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b9999999-9999-9999-9999-999999999999', 'MED-09-77777', 'med.probe.covers', true, 'active', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('baaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'MED-10-88888', 'med.equipment.stand', true, 'active', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('baaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'MED-11-99999', 'med.monitor.protection', true, 'active', '7ef9dce8-c832-40fe-a6ef-85afff37c474')
ON CONFLICT (product_id) DO UPDATE SET
    product_code = EXCLUDED.product_code,
    translation_key = EXCLUDED.translation_key,
    is_published = EXCLUDED.is_published,
    status_code = EXCLUDED.status_code;

-- Product translations (Russian and English)
INSERT INTO app.product_translations (product_id, language_code, name, short_desc, long_desc, created_by) VALUES
-- Ultrasound
('b1111111-1111-1111-1111-111111111111', 'ru', 'Аппарат УЗИ', 'Ультразвуковой диагностический аппарат', 'Современный ультразвуковой диагностический аппарат с высоким разрешением для медицинских исследований.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b1111111-1111-1111-1111-111111111111', 'en', 'Ultrasound Machine', 'Ultrasound diagnostic device', 'Modern ultrasound diagnostic device with high resolution for medical examinations.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
-- Patient Monitor
('b2222222-2222-2222-2222-222222222222', 'ru', 'Монитор пациента', 'Монитор жизненных показателей', 'Монитор для непрерывного контроля жизненных показателей пациента: пульс, давление, сатурация кислорода.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b2222222-2222-2222-2222-222222222222', 'en', 'Patient Monitor', 'Vital signs monitor', 'Monitor for continuous monitoring of patient vital signs: pulse, blood pressure, oxygen saturation.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
-- Dental Equipment
('b3333333-3333-3333-3333-333333333333', 'ru', 'Стоматологическое оборудование', 'Стоматологическая установка', 'Профессиональная стоматологическая установка с бормашиной и всеми необходимыми инструментами.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b3333333-3333-3333-3333-333333333333', 'en', 'Dental Equipment', 'Dental unit', 'Professional dental unit with drill and all necessary instruments.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
-- Ultrasound Gel
('b4444444-4444-4444-4444-444444444444', 'ru', 'Гель для УЗИ', 'Ультразвуковой гель', 'Специальный гель для ультразвуковых исследований. Обеспечивает хороший контакт датчика с кожей.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b4444444-4444-4444-4444-444444444444', 'en', 'Ultrasound Gel', 'Ultrasound gel', 'Special gel for ultrasound examinations. Provides good contact between the probe and the skin.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
-- Ultrasound Probes
('b5555555-5555-5555-5555-555555555555', 'ru', 'Датчики УЗИ', 'Ультразвуковые датчики', 'Комплект ультразвуковых датчиков для различных типов исследований.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b5555555-5555-5555-5555-555555555555', 'en', 'Ultrasound Probes', 'Ultrasound probes', 'Set of ultrasound probes for various types of examinations.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
-- Monitor Electrodes
('b6666666-6666-6666-6666-666666666666', 'ru', 'Электроды для монитора', 'ЭКГ электроды', 'Одноразовые электроды для подключения к монитору пациента.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b6666666-6666-6666-6666-666666666666', 'en', 'Monitor Electrodes', 'ECG electrodes', 'Disposable electrodes for connecting to patient monitor.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
-- Monitor Cable
('b7777777-7777-7777-7777-777777777777', 'ru', 'Кабель питания для монитора', 'Сетевой кабель', 'Кабель питания для подключения монитора пациента к сети.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b7777777-7777-7777-7777-777777777777', 'en', 'Monitor Power Cable', 'Power cable', 'Power cable for connecting patient monitor to the network.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
-- Dental Tips
('b8888888-8888-8888-8888-888888888888', 'ru', 'Наконечники стоматологические', 'Стоматологические наконечники', 'Наконечники для стоматологической установки. Различные размеры и типы.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b8888888-8888-8888-8888-888888888888', 'en', 'Dental Tips', 'Dental handpiece tips', 'Tips for dental unit. Various sizes and types.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
-- Probe Covers
('b9999999-9999-9999-9999-999999999999', 'ru', 'Чехлы для датчиков', 'Защитные чехлы', 'Защитные чехлы для ультразвуковых датчиков. Одноразовые, стерильные.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b9999999-9999-9999-9999-999999999999', 'en', 'Probe Covers', 'Protective covers', 'Protective covers for ultrasound probes. Disposable, sterile.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
-- Equipment Stand
('baaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ru', 'Стойка для оборудования', 'Медицинская стойка', 'Универсальная стойка для размещения медицинского оборудования. Регулируемая высота.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('baaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'en', 'Equipment Stand', 'Medical stand', 'Universal stand for medical equipment placement. Adjustable height.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
-- Monitor Protection
('baaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'ru', 'Защитный чехол для монитора', 'Защитный чехол', 'Защитный чехол для монитора пациента. Защита от пыли и повреждений.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('baaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'en', 'Monitor Protection Cover', 'Protection cover', 'Protection cover for patient monitor. Protection from dust and damage.', '7ef9dce8-c832-40fe-a6ef-85afff37c474')
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
    SELECT category_id INTO med_cat_id FROM app.taxable_categories WHERE category_name = 'медицинские товары';

    INSERT INTO app.product_regions (product_id, region_id, taxable_category_id, created_by) VALUES
    ('b1111111-1111-1111-1111-111111111111', reg_b_id, med_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('b2222222-2222-2222-2222-222222222222', reg_b_id, med_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('b3333333-3333-3333-3333-333333333333', reg_b_id, med_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('b4444444-4444-4444-4444-444444444444', reg_b_id, med_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('b5555555-5555-5555-5555-555555555555', reg_b_id, med_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('b6666666-6666-6666-6666-666666666666', reg_b_id, med_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('b7777777-7777-7777-7777-777777777777', reg_b_id, med_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('b8888888-8888-8888-8888-888888888888', reg_b_id, med_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('b9999999-9999-9999-9999-999999999999', reg_b_id, med_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('baaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', reg_b_id, med_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('baaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaab', reg_b_id, med_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474')
    ON CONFLICT (product_id, region_id) DO UPDATE SET
        taxable_category_id = EXCLUDED.taxable_category_id;
END $$;

-- Product owners
INSERT INTO app.product_users (product_id, user_id, role_type, created_by) VALUES
('b1111111-1111-1111-1111-111111111111', '7ef9dce8-c832-40fe-a6ef-85afff37c474', 'owner', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b2222222-2222-2222-2222-222222222222', '7ef9dce8-c832-40fe-a6ef-85afff37c474', 'owner', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b3333333-3333-3333-3333-333333333333', '7ef9dce8-c832-40fe-a6ef-85afff37c474', 'owner', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b4444444-4444-4444-4444-444444444444', '7ef9dce8-c832-40fe-a6ef-85afff37c474', 'owner', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b5555555-5555-5555-5555-555555555555', '7ef9dce8-c832-40fe-a6ef-85afff37c474', 'owner', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b6666666-6666-6666-6666-666666666666', '7ef9dce8-c832-40fe-a6ef-85afff37c474', 'owner', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b7777777-7777-7777-7777-777777777777', '7ef9dce8-c832-40fe-a6ef-85afff37c474', 'owner', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b8888888-8888-8888-8888-888888888888', '7ef9dce8-c832-40fe-a6ef-85afff37c474', 'owner', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b9999999-9999-9999-9999-999999999999', '7ef9dce8-c832-40fe-a6ef-85afff37c474', 'owner', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('baaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '7ef9dce8-c832-40fe-a6ef-85afff37c474', 'owner', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('baaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaab', '7ef9dce8-c832-40fe-a6ef-85afff37c474', 'owner', '7ef9dce8-c832-40fe-a6ef-85afff37c474')
ON CONFLICT (product_id, user_id, role_type) DO NOTHING;

-- Product pairing (Medical)
INSERT INTO app.product_options (main_product_id, option_product_id, is_required, units_count, created_by) VALUES
-- Ultrasound: required
('b1111111-1111-1111-1111-111111111111', 'b4444444-4444-4444-4444-444444444444', true, 3, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b1111111-1111-1111-1111-111111111111', 'b5555555-5555-5555-5555-555555555555', true, 1, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
-- Ultrasound: optional
('b1111111-1111-1111-1111-111111111111', 'b9999999-9999-9999-9999-999999999999', false, NULL, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b1111111-1111-1111-1111-111111111111', 'baaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', false, NULL, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
-- Patient Monitor: required
('b2222222-2222-2222-2222-222222222222', 'b6666666-6666-6666-6666-666666666666', true, 10, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b2222222-2222-2222-2222-222222222222', 'b7777777-7777-7777-7777-777777777777', true, 1, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
-- Patient Monitor: optional
('b2222222-2222-2222-2222-222222222222', 'baaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', false, NULL, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b2222222-2222-2222-2222-222222222222', 'baaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaab', false, NULL, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
-- Dental Equipment: required
('b3333333-3333-3333-3333-333333333333', 'b8888888-8888-8888-8888-888888888888', true, 2, '7ef9dce8-c832-40fe-a6ef-85afff37c474')
ON CONFLICT (main_product_id, option_product_id) DO UPDATE SET
    is_required = EXCLUDED.is_required,
    units_count = EXCLUDED.units_count;

-- ===========================================
-- 10. Tools Products
-- ===========================================

-- Products
INSERT INTO app.products (product_id, product_code, translation_key, is_published, status_code, created_by) VALUES
('c1111111-1111-1111-1111-111111111111', 'TOOL-01-12345', 'tool.sterilizer', true, 'active', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c2222222-2222-2222-2222-222222222222', 'TOOL-02-67890', 'tool.surgical.set', true, 'active', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c3333333-3333-3333-3333-333333333333', 'TOOL-03-11111', 'tool.multimeter', true, 'active', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c4444444-4444-4444-4444-444444444444', 'TOOL-04-22222', 'tool.soldering.station', true, 'active', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c5555555-5555-5555-5555-555555555555', 'TOOL-05-33333', 'tool.wrench.set', true, 'active', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c6666666-6666-6666-6666-666666666666', 'TOOL-06-44444', 'tool.jack', true, 'active', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c7777777-7777-7777-7777-777777777777', 'TOOL-07-55555', 'tool.screwdriver.set', true, 'active', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c8888888-8888-8888-8888-888888888888', 'TOOL-08-66666', 'tool.hammer', true, 'active', '7ef9dce8-c832-40fe-a6ef-85afff37c474')
ON CONFLICT (product_id) DO UPDATE SET
    product_code = EXCLUDED.product_code,
    translation_key = EXCLUDED.translation_key,
    is_published = EXCLUDED.is_published,
    status_code = EXCLUDED.status_code;

-- Product translations (Russian and English)
INSERT INTO app.product_translations (product_id, language_code, name, short_desc, long_desc, created_by) VALUES
-- Sterilizer
('c1111111-1111-1111-1111-111111111111', 'ru', 'Стерилизатор', 'Медицинский стерилизатор', 'Автоклав для стерилизации медицинских инструментов. Температура до 134°C.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c1111111-1111-1111-1111-111111111111', 'en', 'Sterilizer', 'Medical sterilizer', 'Autoclave for sterilization of medical instruments. Temperature up to 134°C.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
-- Surgical Set
('c2222222-2222-2222-2222-222222222222', 'ru', 'Набор хирургических инструментов', 'Хирургический набор', 'Комплект хирургических инструментов для различных операций.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c2222222-2222-2222-2222-222222222222', 'en', 'Surgical Instruments Set', 'Surgical set', 'Set of surgical instruments for various operations.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
-- Multimeter
('c3333333-3333-3333-3333-333333333333', 'ru', 'Мультиметр', 'Цифровой мультиметр', 'Цифровой мультиметр для измерения напряжения, тока и сопротивления.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c3333333-3333-3333-3333-333333333333', 'en', 'Multimeter', 'Digital multimeter', 'Digital multimeter for measuring voltage, current and resistance.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
-- Soldering Station
('c4444444-4444-4444-4444-444444444444', 'ru', 'Паяльная станция', 'Паяльник с регулировкой температуры', 'Паяльная станция с регулировкой температуры и защитой от перегрева.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c4444444-4444-4444-4444-444444444444', 'en', 'Soldering Station', 'Temperature controlled soldering iron', 'Soldering station with temperature control and overheat protection.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
-- Wrench Set
('c5555555-5555-5555-5555-555555555555', 'ru', 'Набор ключей', 'Автомобильный набор ключей', 'Набор гаечных ключей различных размеров для автомобильного ремонта.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c5555555-5555-5555-5555-555555555555', 'en', 'Wrench Set', 'Automotive wrench set', 'Set of wrenches of various sizes for automotive repair.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
-- Jack
('c6666666-6666-6666-6666-666666666666', 'ru', 'Домкрат', 'Гидравлический домкрат', 'Гидравлический домкрат для подъема автомобиля. Грузоподъемность 2 тонны.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c6666666-6666-6666-6666-666666666666', 'en', 'Jack', 'Hydraulic jack', 'Hydraulic jack for lifting cars. Load capacity 2 tons.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
-- Screwdriver Set
('c7777777-7777-7777-7777-777777777777', 'ru', 'Набор отверток', 'Комплект отверток', 'Набор отверток различных размеров и типов: плоские, крестовые, шестигранные.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c7777777-7777-7777-7777-777777777777', 'en', 'Screwdriver Set', 'Screwdriver kit', 'Set of screwdrivers of various sizes and types: flat, Phillips, hex.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
-- Hammer
('c8888888-8888-8888-8888-888888888888', 'ru', 'Молоток', 'Слесарный молоток', 'Профессиональный слесарный молоток с деревянной ручкой. Вес 500 г.', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c8888888-8888-8888-8888-888888888888', 'en', 'Hammer', 'Mechanic hammer', 'Professional mechanic hammer with wooden handle. Weight 500 g.', '7ef9dce8-c832-40fe-a6ef-85afff37c474')
ON CONFLICT (product_id, language_code) DO UPDATE SET
    name = EXCLUDED.name,
    short_desc = EXCLUDED.short_desc,
    long_desc = EXCLUDED.long_desc;

-- Product regions (all regions, standard category)
DO $$
DECLARE
    reg_a_id INTEGER;
    reg_b_id INTEGER;
    reg_c_id INTEGER;
    std_cat_id INTEGER;
BEGIN
    SELECT region_id INTO reg_a_id FROM app.regions WHERE region_name = 'reg-a';
    SELECT region_id INTO reg_b_id FROM app.regions WHERE region_name = 'reg-b';
    SELECT region_id INTO reg_c_id FROM app.regions WHERE region_name = 'reg-c';
    SELECT category_id INTO std_cat_id FROM app.taxable_categories WHERE category_name = 'стандартные товары';

    INSERT INTO app.product_regions (product_id, region_id, taxable_category_id, created_by) VALUES
    ('c1111111-1111-1111-1111-111111111111', reg_a_id, std_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('c1111111-1111-1111-1111-111111111111', reg_b_id, std_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('c1111111-1111-1111-1111-111111111111', reg_c_id, std_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('c2222222-2222-2222-2222-222222222222', reg_a_id, std_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('c2222222-2222-2222-2222-222222222222', reg_b_id, std_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('c2222222-2222-2222-2222-222222222222', reg_c_id, std_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('c3333333-3333-3333-3333-333333333333', reg_a_id, std_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('c3333333-3333-3333-3333-333333333333', reg_b_id, std_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('c3333333-3333-3333-3333-333333333333', reg_c_id, std_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('c4444444-4444-4444-4444-444444444444', reg_a_id, std_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('c4444444-4444-4444-4444-444444444444', reg_b_id, std_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('c4444444-4444-4444-4444-444444444444', reg_c_id, std_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('c5555555-5555-5555-5555-555555555555', reg_a_id, std_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('c5555555-5555-5555-5555-555555555555', reg_b_id, std_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('c5555555-5555-5555-5555-555555555555', reg_c_id, std_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('c6666666-6666-6666-6666-666666666666', reg_a_id, std_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('c6666666-6666-6666-6666-666666666666', reg_b_id, std_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('c6666666-6666-6666-6666-666666666666', reg_c_id, std_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('c7777777-7777-7777-7777-777777777777', reg_a_id, std_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('c7777777-7777-7777-7777-777777777777', reg_b_id, std_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('c7777777-7777-7777-7777-777777777777', reg_c_id, std_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('c8888888-8888-8888-8888-888888888888', reg_a_id, std_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('c8888888-8888-8888-8888-888888888888', reg_b_id, std_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    ('c8888888-8888-8888-8888-888888888888', reg_c_id, std_cat_id, '7ef9dce8-c832-40fe-a6ef-85afff37c474')
    ON CONFLICT (product_id, region_id) DO UPDATE SET
        taxable_category_id = EXCLUDED.taxable_category_id;
END $$;

-- Product owners
INSERT INTO app.product_users (product_id, user_id, role_type, created_by) VALUES
('c1111111-1111-1111-1111-111111111111', '7ef9dce8-c832-40fe-a6ef-85afff37c474', 'owner', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c2222222-2222-2222-2222-222222222222', '7ef9dce8-c832-40fe-a6ef-85afff37c474', 'owner', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c3333333-3333-3333-3333-333333333333', '7ef9dce8-c832-40fe-a6ef-85afff37c474', 'owner', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c4444444-4444-4444-4444-444444444444', '7ef9dce8-c832-40fe-a6ef-85afff37c474', 'owner', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c5555555-5555-5555-5555-555555555555', '7ef9dce8-c832-40fe-a6ef-85afff37c474', 'owner', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c6666666-6666-6666-6666-666666666666', '7ef9dce8-c832-40fe-a6ef-85afff37c474', 'owner', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c7777777-7777-7777-7777-777777777777', '7ef9dce8-c832-40fe-a6ef-85afff37c474', 'owner', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c8888888-8888-8888-8888-888888888888', '7ef9dce8-c832-40fe-a6ef-85afff37c474', 'owner', '7ef9dce8-c832-40fe-a6ef-85afff37c474')
ON CONFLICT (product_id, user_id, role_type) DO NOTHING;

-- Product pairing (Tools with medical and auto products)
INSERT INTO app.product_options (main_product_id, option_product_id, is_required, units_count, created_by) VALUES
-- Sterilizer with medical equipment (required)
('b1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', true, 1, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', true, 1, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b3333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', true, 1, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
-- Surgical set with medical equipment (optional)
('b1111111-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222', false, NULL, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', false, NULL, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b3333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', false, NULL, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
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

-- Price list info
INSERT INTO app.price_lists_info (name, description, currency_code, is_active, owner_id, region, created_by) VALUES
('Прайслист RUB reg-b', 'Прайслист в российских рублях для региона reg-b', 'RUB', true, '7ef9dce8-c832-40fe-a6ef-85afff37c474', 'reg-b', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('Прайслист KZT reg-a', 'Прайслист в казахстанских тенге для региона reg-a', 'KZT', true, '7ef9dce8-c832-40fe-a6ef-85afff37c474', 'reg-a', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('Прайслист BYN reg-c', 'Прайслист в белорусских рублях для региона reg-c', 'BYN', false, '7ef9dce8-c832-40fe-a6ef-85afff37c474', 'reg-c', '7ef9dce8-c832-40fe-a6ef-85afff37c474')
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    currency_code = EXCLUDED.currency_code,
    is_active = EXCLUDED.is_active,
    region = EXCLUDED.region;

-- Price list items (all products in all price lists)
-- Note: We need to create partitions first, but for demo we'll use dynamic SQL
DO $$
DECLARE
    pl_rub_id INTEGER;
    pl_kzt_id INTEGER;
    pl_byn_id INTEGER;
BEGIN
    SELECT price_list_id INTO pl_rub_id FROM app.price_lists_info WHERE name = 'Прайслист RUB reg-b';
    SELECT price_list_id INTO pl_kzt_id FROM app.price_lists_info WHERE name = 'Прайслист KZT reg-a';
    SELECT price_list_id INTO pl_byn_id FROM app.price_lists_info WHERE name = 'Прайслист BYN reg-c';

    -- Create partitions if they don't exist
    BEGIN
        EXECUTE format('CREATE TABLE IF NOT EXISTS app.price_lists_%s PARTITION OF app.price_lists FOR VALUES IN (%s)', pl_rub_id, pl_rub_id);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        EXECUTE format('CREATE TABLE IF NOT EXISTS app.price_lists_%s PARTITION OF app.price_lists FOR VALUES IN (%s)', pl_kzt_id, pl_kzt_id);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        EXECUTE format('CREATE TABLE IF NOT EXISTS app.price_lists_%s PARTITION OF app.price_lists FOR VALUES IN (%s)', pl_byn_id, pl_byn_id);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- Insert prices for all products (auto, medical, tools)
    -- RUB prices (realistic prices in rubles)
    INSERT INTO app.price_lists (price_list_id, item_type, item_code, item_name, list_price, created_by) VALUES
    (pl_rub_id, 'product', 'AUTO-01-12345', 'Седан бизнес-класса', 3500000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'AUTO-02-67890', 'Джип', 4200000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'AUTO-03-11111', 'Документы на автомобиль', 5000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'AUTO-04-22222', 'Ключи запасные', 15000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'AUTO-05-33333', 'Набор аксессуаров для седана', 25000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'AUTO-06-44444', 'Набор аксессуаров для джипа', 35000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'AUTO-07-55555', 'Лебедка', 45000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'AUTO-08-66666', 'Багажник на крышу', 18000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'AUTO-09-77777', 'Апгрейд медиасистемы', 85000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'AUTO-10-88888', 'Коврики автомобильные', 3500.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'AUTO-11-99999', 'Чехлы на сиденья', 5500.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'MED-01-12345', 'Аппарат УЗИ', 2500000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'MED-02-67890', 'Монитор пациента', 180000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'MED-03-11111', 'Стоматологическое оборудование', 1200000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'MED-04-22222', 'Гель для УЗИ', 850.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'MED-05-33333', 'Датчики УЗИ', 45000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'MED-06-44444', 'Электроды для монитора', 120.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'MED-07-55555', 'Кабель питания для монитора', 2500.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'MED-08-66666', 'Наконечники стоматологические', 3500.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'MED-09-77777', 'Чехлы для датчиков', 450.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'MED-10-88888', 'Стойка для оборудования', 12000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'MED-11-99999', 'Защитный чехол для монитора', 1800.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'TOOL-01-12345', 'Стерилизатор', 85000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'TOOL-02-67890', 'Набор хирургических инструментов', 125000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'TOOL-03-11111', 'Мультиметр', 3500.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'TOOL-04-22222', 'Паяльная станция', 8500.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'TOOL-05-33333', 'Набор ключей', 4500.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'TOOL-06-44444', 'Домкрат', 3500.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'TOOL-07-55555', 'Набор отверток', 1200.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_rub_id, 'product', 'TOOL-08-66666', 'Молоток', 850.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474')
    ON CONFLICT (price_list_id, item_type, item_code) DO UPDATE SET
        item_name = EXCLUDED.item_name,
        list_price = EXCLUDED.list_price;

    -- KZT prices (realistic prices in tenge, approximately 1 RUB = 5 KZT)
    INSERT INTO app.price_lists (price_list_id, item_type, item_code, item_name, list_price, created_by) VALUES
    (pl_kzt_id, 'product', 'AUTO-01-12345', 'Седан бизнес-класса', 17500000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'AUTO-02-67890', 'Джип', 21000000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'AUTO-03-11111', 'Документы на автомобиль', 25000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'AUTO-04-22222', 'Ключи запасные', 75000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'AUTO-05-33333', 'Набор аксессуаров для седана', 125000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'AUTO-06-44444', 'Набор аксессуаров для джипа', 175000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'AUTO-07-55555', 'Лебедка', 225000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'AUTO-08-66666', 'Багажник на крышу', 90000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'AUTO-09-77777', 'Апгрейд медиасистемы', 425000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'AUTO-10-88888', 'Коврики автомобильные', 17500.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'AUTO-11-99999', 'Чехлы на сиденья', 27500.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'MED-01-12345', 'Аппарат УЗИ', 12500000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'MED-02-67890', 'Монитор пациента', 900000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'MED-03-11111', 'Стоматологическое оборудование', 6000000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'MED-04-22222', 'Гель для УЗИ', 4250.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'MED-05-33333', 'Датчики УЗИ', 225000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'MED-06-44444', 'Электроды для монитора', 600.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'MED-07-55555', 'Кабель питания для монитора', 12500.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'MED-08-66666', 'Наконечники стоматологические', 17500.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'MED-09-77777', 'Чехлы для датчиков', 2250.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'MED-10-88888', 'Стойка для оборудования', 60000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'MED-11-99999', 'Защитный чехол для монитора', 9000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'TOOL-01-12345', 'Стерилизатор', 425000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'TOOL-02-67890', 'Набор хирургических инструментов', 625000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'TOOL-03-11111', 'Мультиметр', 17500.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'TOOL-04-22222', 'Паяльная станция', 42500.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'TOOL-05-33333', 'Набор ключей', 22500.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'TOOL-06-44444', 'Домкрат', 17500.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'TOOL-07-55555', 'Набор отверток', 6000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_kzt_id, 'product', 'TOOL-08-66666', 'Молоток', 4250.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474')
    ON CONFLICT (price_list_id, item_type, item_code) DO UPDATE SET
        item_name = EXCLUDED.item_name,
        list_price = EXCLUDED.list_price;

    -- BYN prices (realistic prices in belarusian rubles, approximately 1 RUB = 0.03 BYN)
    INSERT INTO app.price_lists (price_list_id, item_type, item_code, item_name, list_price, created_by) VALUES
    (pl_byn_id, 'product', 'AUTO-01-12345', 'Седан бизнес-класса', 105000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_byn_id, 'product', 'AUTO-02-67890', 'Джип', 126000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_byn_id, 'product', 'AUTO-03-11111', 'Документы на автомобиль', 150.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_byn_id, 'product', 'AUTO-04-22222', 'Ключи запасные', 450.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_byn_id, 'product', 'AUTO-05-33333', 'Набор аксессуаров для седана', 750.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_byn_id, 'product', 'AUTO-06-44444', 'Набор аксессуаров для джипа', 1050.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_byn_id, 'product', 'AUTO-07-55555', 'Лебедка', 1350.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_byn_id, 'product', 'AUTO-08-66666', 'Багажник на крышу', 540.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_byn_id, 'product', 'AUTO-09-77777', 'Апгрейд медиасистемы', 2550.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_byn_id, 'product', 'AUTO-10-88888', 'Коврики автомобильные', 105.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_byn_id, 'product', 'AUTO-11-99999', 'Чехлы на сиденья', 165.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_byn_id, 'product', 'MED-01-12345', 'Аппарат УЗИ', 75000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_byn_id, 'product', 'MED-02-67890', 'Монитор пациента', 5400.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_byn_id, 'product', 'MED-03-11111', 'Стоматологическое оборудование', 36000.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_byn_id, 'product', 'MED-04-22222', 'Гель для УЗИ', 25.50, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_byn_id, 'product', 'MED-05-33333', 'Датчики УЗИ', 1350.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_byn_id, 'product', 'MED-06-44444', 'Электроды для монитора', 3.60, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_byn_id, 'product', 'MED-07-55555', 'Кабель питания для монитора', 75.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_byn_id, 'product', 'MED-08-66666', 'Наконечники стоматологические', 105.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_byn_id, 'product', 'MED-09-77777', 'Чехлы для датчиков', 13.50, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_byn_id, 'product', 'MED-10-88888', 'Стойка для оборудования', 360.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_byn_id, 'product', 'MED-11-99999', 'Защитный чехол для монитора', 54.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_byn_id, 'product', 'TOOL-01-12345', 'Стерилизатор', 2550.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_byn_id, 'product', 'TOOL-02-67890', 'Набор хирургических инструментов', 3750.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_byn_id, 'product', 'TOOL-03-11111', 'Мультиметр', 105.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_byn_id, 'product', 'TOOL-04-22222', 'Паяльная станция', 255.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_byn_id, 'product', 'TOOL-05-33333', 'Набор ключей', 135.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_byn_id, 'product', 'TOOL-06-44444', 'Домкрат', 105.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_byn_id, 'product', 'TOOL-07-55555', 'Набор отверток', 36.00, '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
    (pl_byn_id, 'product', 'TOOL-08-66666', 'Молоток', 25.50, '7ef9dce8-c832-40fe-a6ef-85afff37c474')
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

-- Insert new sections
INSERT INTO app.catalog_sections (id, name, owner, description, status, is_public, "order", icon_name, color, created_by) VALUES
('a1111111-1111-1111-1111-111111111111', 'main', '7ef9dce8-c832-40fe-a6ef-85afff37c474', 'Основная секция каталога', 'active', true, 1, 'Folder', '#F8F8F8', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('a2222222-2222-2222-2222-222222222222', 'auto', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7', 'Автомобильные продукты', 'active', true, 2, 'Car', '#FFE4B5', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a3333333-3333-3333-3333-333333333333', 'med', '7ef9dce8-c832-40fe-a6ef-85afff37c474', 'Медицинские продукты', 'active', true, 3, 'Medical', '#B0E0E6', '7ef9dce8-c832-40fe-a6ef-85afff37c474')
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

-- Publish automotive products to auto section
INSERT INTO app.section_products (section_id, product_id, published_by) VALUES
('a2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a2222222-2222-2222-2222-222222222222', 'a3333333-3333-3333-3333-333333333333', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a2222222-2222-2222-2222-222222222222', 'a4444444-4444-4444-4444-444444444444', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a2222222-2222-2222-2222-222222222222', 'a5555555-5555-5555-5555-555555555555', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a2222222-2222-2222-2222-222222222222', 'a6666666-6666-6666-6666-666666666666', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a2222222-2222-2222-2222-222222222222', 'a7777777-7777-7777-7777-777777777777', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a2222222-2222-2222-2222-222222222222', 'a8888888-8888-8888-8888-888888888888', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a2222222-2222-2222-2222-222222222222', 'a9999999-9999-9999-9999-999999999999', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a2222222-2222-2222-2222-222222222222', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a2222222-2222-2222-2222-222222222222', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7')
ON CONFLICT (section_id, product_id) DO NOTHING;

-- Publish medical products to med section
INSERT INTO app.section_products (section_id, product_id, published_by) VALUES
('a3333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111111', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('a3333333-3333-3333-3333-333333333333', 'b2222222-2222-2222-2222-222222222222', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('a3333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('a3333333-3333-3333-3333-333333333333', 'b4444444-4444-4444-4444-444444444444', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('a3333333-3333-3333-3333-333333333333', 'b5555555-5555-5555-5555-555555555555', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('a3333333-3333-3333-3333-333333333333', 'b6666666-6666-6666-6666-666666666666', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('a3333333-3333-3333-3333-333333333333', 'b7777777-7777-7777-7777-777777777777', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('a3333333-3333-3333-3333-333333333333', 'b8888888-8888-8888-8888-888888888888', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('a3333333-3333-3333-3333-333333333333', 'b9999999-9999-9999-9999-999999999999', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('a3333333-3333-3333-3333-333333333333', 'baaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('a3333333-3333-3333-3333-333333333333', 'baaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaab', '7ef9dce8-c832-40fe-a6ef-85afff37c474')
ON CONFLICT (section_id, product_id) DO NOTHING;

-- Publish tools products to main section
INSERT INTO app.section_products (section_id, product_id, published_by) VALUES
('a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('a1111111-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('a1111111-1111-1111-1111-111111111111', 'c3333333-3333-3333-3333-333333333333', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('a1111111-1111-1111-1111-111111111111', 'c4444444-4444-4444-4444-444444444444', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('a1111111-1111-1111-1111-111111111111', 'c5555555-5555-5555-5555-555555555555', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('a1111111-1111-1111-1111-111111111111', 'c6666666-6666-6666-6666-666666666666', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('a1111111-1111-1111-1111-111111111111', 'c7777777-7777-7777-7777-777777777777', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('a1111111-1111-1111-1111-111111111111', 'c8888888-8888-8888-8888-888888888888', '7ef9dce8-c832-40fe-a6ef-85afff37c474')
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
('a6666666-6666-6666-6666-666666666666', 'd4e5f6a7-b8c9-4012-d3e4-f5a6b7c8d9e0', 'product_specialists', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a7777777-7777-7777-7777-777777777777', 'd4e5f6a7-b8c9-4012-d3e4-f5a6b7c8d9e0', 'product_specialists', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a8888888-8888-8888-8888-888888888888', 'd4e5f6a7-b8c9-4012-d3e4-f5a6b7c8d9e0', 'product_specialists', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('a9999999-9999-9999-9999-999999999999', 'd4e5f6a7-b8c9-4012-d3e4-f5a6b7c8d9e0', 'product_specialists', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'd4e5f6a7-b8c9-4012-d3e4-f5a6b7c8d9e0', 'product_specialists', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7'),
('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'd4e5f6a7-b8c9-4012-d3e4-f5a6b7c8d9e0', 'product_specialists', 'c2cbae6f-89b9-4fa8-be9b-a8391526ead7')
ON CONFLICT (product_id, group_id, role_type) DO NOTHING;

-- Assign groups to medical products
INSERT INTO app.product_groups (product_id, group_id, role_type, created_by) VALUES
('b1111111-1111-1111-1111-111111111111', 'c3d4e5f6-a7b8-4901-c2d3-e4f5a6b7c8d9', 'product_specialists', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b2222222-2222-2222-2222-222222222222', 'c3d4e5f6-a7b8-4901-c2d3-e4f5a6b7c8d9', 'product_specialists', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b3333333-3333-3333-3333-333333333333', 'c3d4e5f6-a7b8-4901-c2d3-e4f5a6b7c8d9', 'product_specialists', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b4444444-4444-4444-4444-444444444444', 'c3d4e5f6-a7b8-4901-c2d3-e4f5a6b7c8d9', 'product_specialists', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b5555555-5555-5555-5555-555555555555', 'c3d4e5f6-a7b8-4901-c2d3-e4f5a6b7c8d9', 'product_specialists', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b6666666-6666-6666-6666-666666666666', 'c3d4e5f6-a7b8-4901-c2d3-e4f5a6b7c8d9', 'product_specialists', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b7777777-7777-7777-7777-777777777777', 'c3d4e5f6-a7b8-4901-c2d3-e4f5a6b7c8d9', 'product_specialists', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b8888888-8888-8888-8888-888888888888', 'c3d4e5f6-a7b8-4901-c2d3-e4f5a6b7c8d9', 'product_specialists', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('b9999999-9999-9999-9999-999999999999', 'c3d4e5f6-a7b8-4901-c2d3-e4f5a6b7c8d9', 'product_specialists', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('baaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c3d4e5f6-a7b8-4901-c2d3-e4f5a6b7c8d9', 'product_specialists', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('baaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'c3d4e5f6-a7b8-4901-c2d3-e4f5a6b7c8d9', 'product_specialists', '7ef9dce8-c832-40fe-a6ef-85afff37c474')
ON CONFLICT (product_id, group_id, role_type) DO NOTHING;

-- Assign groups to tools products
INSERT INTO app.product_groups (product_id, group_id, role_type, created_by) VALUES
('c1111111-1111-1111-1111-111111111111', 'c3d4e5f6-a7b8-4901-c2d3-e4f5a6b7c8d9', 'product_specialists', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c2222222-2222-2222-2222-222222222222', 'c3d4e5f6-a7b8-4901-c2d3-e4f5a6b7c8d9', 'product_specialists', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c3333333-3333-3333-3333-333333333333', 'b2c3d4e5-f6a7-4890-b1c2-d3e4f5a6b7c8', 'product_specialists', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c4444444-4444-4444-4444-444444444444', 'b2c3d4e5-f6a7-4890-b1c2-d3e4f5a6b7c8', 'product_specialists', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c5555555-5555-5555-5555-555555555555', 'd4e5f6a7-b8c9-4012-d3e4-f5a6b7c8d9e0', 'product_specialists', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c6666666-6666-6666-6666-666666666666', 'd4e5f6a7-b8c9-4012-d3e4-f5a6b7c8d9e0', 'product_specialists', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c7777777-7777-7777-7777-777777777777', 'b2c3d4e5-f6a7-4890-b1c2-d3e4f5a6b7c8', 'product_specialists', '7ef9dce8-c832-40fe-a6ef-85afff37c474'),
('c8888888-8888-8888-8888-888888888888', 'b2c3d4e5-f6a7-4890-b1c2-d3e4f5a6b7c8', 'product_specialists', '7ef9dce8-c832-40fe-a6ef-85afff37c474')
ON CONFLICT (product_id, group_id, role_type) DO NOTHING;
