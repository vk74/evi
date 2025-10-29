-- Migration: Rename mobile_phone_number to mobile_phone
-- Version: 1.0.0
-- Description: Rename mobile_phone_number column to mobile_phone in app.users table
-- Backend file: 002_rename_mobile_phone_number_to_mobile_phone.sql

-- Rename the column in app.users table
ALTER TABLE app.users 
RENAME COLUMN mobile_phone_number TO mobile_phone;

-- Update any indexes that might reference the old column name
-- (if any exist, they will be automatically updated by PostgreSQL)

-- Add comment to document the change
COMMENT ON COLUMN app.users.mobile_phone IS 'User mobile phone number (renamed from mobile_phone_number)';
