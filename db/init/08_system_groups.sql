-- Version: 1.3.0
-- Description: Seeds the database with essential system groups only.
-- Backend file: 08_system_groups.sql
--
-- Changes in v1.3.0: MVP merge - group created as sysadmins / sysadmins@evi.team from start

-- This script establishes only the essential system group required by the application:
-- - System Administrators group with is_system = true
-- It also populates this group with the system administrator user.
-- The script is idempotent.

-- Insert essential system group (sysadmins from start - MVP merge)
INSERT INTO app.groups (group_id, group_name, group_status, group_owner, is_system, group_description, group_email, group_created_by) VALUES
-- System administrators group
('770e8400-e29b-41d4-a716-446655440001', 'sysadmins', 'active', '550e8400-e29b-41d4-a716-446655440001', true, 'System administrators with full access to all features', 'sysadmins@example.com', '550e8400-e29b-41d4-a716-446655440001')
ON CONFLICT (group_id) DO UPDATE SET
    group_name = EXCLUDED.group_name,
    group_status = EXCLUDED.group_status,
    group_owner = EXCLUDED.group_owner,
    is_system = EXCLUDED.is_system,
    group_description = EXCLUDED.group_description,
    group_email = EXCLUDED.group_email,
    group_modified_at = CURRENT_TIMESTAMP,
    group_modified_by = EXCLUDED.group_created_by;

-- Insert group member
INSERT INTO app.group_members (group_id, user_id, added_by) VALUES
-- System Administrator group member
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001')
ON CONFLICT (group_id, user_id, is_active) DO NOTHING;
