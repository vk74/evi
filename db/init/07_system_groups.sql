-- Version: 1.0
-- Description: Seeds the database with initial system groups and memberships.
-- Backend file: 07_system_groups.sql

-- This script establishes the core user groups required by the application,
-- such as administrators and general users. It also populates these groups
-- with the system users created in the previous script. The script is idempotent.

-- Insert system groups
INSERT INTO app.groups (group_id, group_name, group_status, group_owner, is_system) VALUES
-- System groups
('770e8400-e29b-41d4-a716-446655440001', 'System Administrators', 'active', '550e8400-e29b-41d4-a716-446655440001', true),
('770e8400-e29b-41d4-a716-446655440002', 'Application Users', 'active', '550e8400-e29b-41d4-a716-446655440001', true),
('770e8400-e29b-41d4-a716-446655440003', 'Support Team', 'active', '550e8400-e29b-41d4-a716-446655440001', true),
('770e8400-e29b-41d4-a716-446655440004', 'Development Team', 'active', '550e8400-e29b-41d4-a716-446655440001', true),
('770e8400-e29b-41d4-a716-446655440005', 'Security Team', 'active', '550e8400-e29b-41d4-a716-446655440001', true)
ON CONFLICT (group_id) DO UPDATE SET
    group_name = EXCLUDED.group_name,
    group_status = EXCLUDED.group_status,
    group_owner = EXCLUDED.group_owner,
    is_system = EXCLUDED.is_system;

-- Insert group details
INSERT INTO app.group_details (group_id, group_description, group_email, group_created_by) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'System administrators with full access to all features', 'admin@example.com', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440002', 'Regular application users with standard access', 'users@example.com', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440003', 'Technical support team members', 'support@example.com', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440004', 'Software development team members', 'dev@example.com', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440005', 'Security and compliance team members', 'security@example.com', '550e8400-e29b-41d4-a716-446655440001')
ON CONFLICT (group_id) DO UPDATE SET
    group_description = EXCLUDED.group_description,
    group_email = EXCLUDED.group_email;

-- Insert group members
INSERT INTO app.group_members (group_id, user_id, added_by) VALUES
-- Admin group members
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001'),
-- Users group members
('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001'),
-- Support team members
('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001'),
-- Development team members
('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001')
ON CONFLICT (group_id, user_id, is_active) DO NOTHING;
