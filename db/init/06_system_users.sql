-- Version: 1.1
-- Description: Seeds the database with initial system users and their profiles.
-- Backend file: 06_system_users.sql

-- This script inserts the essential system users required for the application to function,
-- including a default administrator and several test/demo users.
-- Passwords are pre-hashed with complex passwords (10 chars: uppercase, lowercase, numbers, special chars).
-- All users except admin are created with 'disabled' status for security.
-- The script is idempotent, using ON CONFLICT to prevent errors on subsequent runs.

-- Insert system users
INSERT INTO app.users (user_id, username, hashed_password, email, is_staff, account_status, first_name, last_name, created_at, mobile_phone_number, gender) VALUES
-- Deleted user (system) - GDPR-friendly placeholder
('00000000-0000-0000-0000-00000000dead', NULL, NULL, NULL, false, 'disabled', 'Deleted', 'User', NOW(), NULL, NULL),
-- System administrator (active)
('550e8400-e29b-41d4-a716-446655440001', 'admin', '$2b$10$rkRimJQnKoqxf7riMA2XnOM.t0ch726cq.e65xe9FfZ1/8UMU89F6', 'admin@example.com', true, 'active', 'System', 'Administrator', NOW(), '+1234567890', 'm'),
-- Test user t1 (disabled)
('550e8400-e29b-41d4-a716-446655440002', 't1', '$2b$10$9GIwz8elHAkUUskF2b60vOTKUej72qPu0Gcom0YXoxlA1Il6woKLq', 't1@example.com', false, 'disabled', 'Test', 'User', NOW(), '+1234567891', 'm'),
-- Demo users (all disabled)
('550e8400-e29b-41d4-a716-446655440003', 'johndoe', '$2b$10$/agfxyY2Uta.Ve8bYGHCK.6SiSQWNGTVQZwJsHzLT8f3Vr4SvceHu', 'john.doe@example.com', false, 'disabled', 'John', 'Doe', NOW(), '+1234567892', 'm'),
('550e8400-e29b-41d4-a716-446655440004', 'janesmith', '$2b$10$Bqg0OWixwYdTCqHvJCIQ.ujK83Cph6eXEyU1LqiEAClQbfeJUKEM6', 'jane.smith@example.com', false, 'disabled', 'Jane', 'Smith', NOW(), '+1234567893', 'f'),
('550e8400-e29b-41d4-a716-446655440005', 'bobwilson', '$2b$10$abHi0RHBqUwToe/ZEj9ACOEerPcDnX6HZ.9Dz/hH77LMt2mqzV2Bm', 'bob.wilson@example.com', false, 'disabled', 'Bob', 'Wilson', NOW(), '+1234567894', 'm')
ON CONFLICT (user_id) DO UPDATE SET
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    is_staff = EXCLUDED.is_staff,
    account_status = EXCLUDED.account_status,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    mobile_phone_number = EXCLUDED.mobile_phone_number,
    gender = EXCLUDED.gender;