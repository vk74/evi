-- Version: 1.2.0
-- Description: Seeds the database with essential system users only.
-- Backend file: 06_system_users.sql

-- This script inserts only the essential system users required for the application to function:
-- - Deleted user placeholder for GDPR compliance
-- - System administrator with is_system = true
-- Passwords are pre-hashed with complex passwords (10 chars: uppercase, lowercase, numbers, special chars).
-- The script is idempotent, using ON CONFLICT to prevent errors on subsequent runs.

-- Insert essential system users
INSERT INTO app.users (user_id, username, hashed_password, email, is_staff, account_status, first_name, last_name, created_at, mobile_phone_number, gender, is_system) VALUES
-- Deleted user (system) -friendly placeholder to be inserted in place of deleted user accounts 
('00000000-0000-0000-0000-00000000dead', NULL, NULL, NULL, false, 'disabled', 'Deleted', 'User', NOW(), NULL, NULL, true),
-- System administrator (active) - marked as system user
('550e8400-e29b-41d4-a716-446655440001', 'admin', '$2b$10$rkRimJQnKoqxf7riMA2XnOM.t0ch726cq.e65xe9FfZ1/8UMU89F6', 'admin@example.com', true, 'active', 'System', 'Administrator', NOW(), '+1234567890', 'm', true)
ON CONFLICT (user_id) DO UPDATE SET
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    is_staff = EXCLUDED.is_staff,
    account_status = EXCLUDED.account_status,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    mobile_phone_number = EXCLUDED.mobile_phone_number,
    gender = EXCLUDED.gender,
    is_system = EXCLUDED.is_system;