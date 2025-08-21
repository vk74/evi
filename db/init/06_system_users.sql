-- Version: 1.0
-- Description: Seeds the database with initial system users and their profiles.
-- Backend file: 06_system_users.sql

-- This script inserts the essential system users required for the application to function,
-- including a default administrator and several test/demo users.
-- Passwords are pre-hashed. The script is idempotent, using ON CONFLICT to prevent
-- errors on subsequent runs.

-- Insert system users
INSERT INTO app.users (user_id, username, hashed_password, email, is_staff, account_status, first_name, last_name, created_at) VALUES
-- System administrator
('550e8400-e29b-41d4-a716-446655440001', 'admin', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'admin@example.com', true, 'active', 'System', 'Administrator', NOW()),
-- Test user t1 (with original hash)
('550e8400-e29b-41d4-a716-446655440002', 't1', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 't1@example.com', false, 'active', 'Test', 'User', NOW()),
-- Demo users
('550e8400-e29b-41d4-a716-446655440003', 'johndoe', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'john.doe@example.com', false, 'active', 'John', 'Doe', NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'janesmith', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'jane.smith@example.com', false, 'active', 'Jane', 'Smith', NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'bobwilson', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'bob.wilson@example.com', false, 'active', 'Bob', 'Wilson', NOW())
ON CONFLICT (user_id) DO UPDATE SET
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    is_staff = EXCLUDED.is_staff,
    account_status = EXCLUDED.account_status,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name;

-- Insert user profiles
INSERT INTO app.user_profiles (profile_id, user_id, mobile_phone_number, address, company_name, position, gender) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '+1234567890', '123 Admin St, City', 'System Corp', 'System Administrator', 'm'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '+1234567891', '456 Test Ave, City', 'Test Company', 'Test Engineer', 'm'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', '+1234567892', '789 Main St, City', 'Tech Solutions', 'Software Developer', 'm'),
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', '+1234567893', '321 Oak Rd, City', 'Design Studio', 'UI/UX Designer', 'f'),
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', '+1234567894', '654 Pine Ln, City', 'Consulting Inc', 'Project Manager', 'm')
ON CONFLICT (profile_id) DO UPDATE SET
    mobile_phone_number = EXCLUDED.mobile_phone_number,
    address = EXCLUDED.address,
    company_name = EXCLUDED.company_name,
    position = EXCLUDED.position,
    gender = EXCLUDED.gender;
