-- Version: 1.0
-- Description: Insert seed data
-- Backend file: init_seeds

-- Import application settings
\i /docker-entrypoint-initdb.d/seeds/004_app_settings.sql

-- Insert system users
INSERT INTO app.users (user_id, username, hashed_password, email, is_staff, account_status, first_name, last_name, created_at) VALUES
-- System administrator
('550e8400-e29b-41d4-a716-446655440001', 'admin', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'admin@example.com', true, 'active', 'System', 'Administrator', NOW()),
-- Test user t1 (with original hash)
('550e8400-e29b-41d4-a716-446655440002', 't1', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 't1@example.com', false, 'active', 'Test', 'User', NOW()),
-- Demo users
('550e8400-e29b-41d4-a716-446655440003', 'john.doe', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'john.doe@example.com', false, 'active', 'John', 'Doe', NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'jane.smith', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'jane.smith@example.com', false, 'active', 'Jane', 'Smith', NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'bob.wilson', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'bob.wilson@example.com', false, 'active', 'Bob', 'Wilson', NOW())
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

-- Insert catalog sections
INSERT INTO app.catalog_sections (id, name, owner, description, status, is_public, "order", icon_name, color, created_by) VALUES
-- Main sections
('880e8400-e29b-41d4-a716-446655440001', 'IT Services', '550e8400-e29b-41d4-a716-446655440001', 'Information Technology Services', 'active', true, 1, 'Monitor', '#3B82F6', '550e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440002', 'Business Solutions', '550e8400-e29b-41d4-a716-446655440001', 'Business Process Solutions', 'active', true, 2, 'Briefcase', '#10B981', '550e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440003', 'Support Services', '550e8400-e29b-41d4-a716-446655440001', 'Technical Support and Maintenance', 'active', true, 3, 'Headset', '#F59E0B', '550e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440004', 'Security Services', '550e8400-e29b-41d4-a716-446655440001', 'Cybersecurity and Compliance', 'active', true, 4, 'Shield', '#EF4444', '550e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440005', 'Cloud Solutions', '550e8400-e29b-41d4-a716-446655440001', 'Cloud Infrastructure and Services', 'active', true, 5, 'Cloud', '#8B5CF6', '550e8400-e29b-41d4-a716-446655440001'),
-- Sub-sections
('880e8400-e29b-41d4-a716-446655440006', 'Software Development', '550e8400-e29b-41d4-a716-446655440001', 'Custom Software Development', 'active', true, 1, 'Code', '#06B6D4', '550e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440007', 'System Administration', '550e8400-e29b-41d4-a716-446655440001', 'System Management and Maintenance', 'active', true, 2, 'Server', '#84CC16', '550e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440008', 'Network Services', '550e8400-e29b-41d4-a716-446655440001', 'Network Infrastructure and Management', 'active', true, 3, 'Network', '#F97316', '550e8400-e29b-41d4-a716-446655440001')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    is_public = EXCLUDED.is_public,
    "order" = EXCLUDED."order",
    icon_name = EXCLUDED.icon_name,
    color = EXCLUDED.color;

-- Update parent relationships for sub-sections
UPDATE app.catalog_sections SET parent_id = '880e8400-e29b-41d4-a716-446655440001' WHERE id = '880e8400-e29b-41d4-a716-446655440006';
UPDATE app.catalog_sections SET parent_id = '880e8400-e29b-41d4-a716-446655440001' WHERE id = '880e8400-e29b-41d4-a716-446655440007';
UPDATE app.catalog_sections SET parent_id = '880e8400-e29b-41d4-a716-446655440001' WHERE id = '880e8400-e29b-41d4-a716-446655440008';

-- Insert services
INSERT INTO app.services (id, name, priority, status, description_short, description_long, purpose, is_public, icon_name, created_by) VALUES
-- IT Services
('990e8400-e29b-41d4-a716-446655440001', 'Web Application Development', 'high', 'in_production', 'Custom web applications', 'Full-stack web application development using modern technologies', 'Create scalable web solutions for business needs', true, 'Globe', '550e8400-e29b-41d4-a716-446655440001'),
('990e8400-e29b-41d4-a716-446655440002', 'Mobile App Development', 'medium', 'in_production', 'iOS and Android apps', 'Native and cross-platform mobile application development', 'Extend business reach through mobile platforms', true, 'Smartphone', '550e8400-e29b-41d4-a716-446655440001'),
('990e8400-e29b-41d4-a716-446655440003', 'Database Design', 'high', 'in_production', 'Database architecture', 'Design and optimization of database systems', 'Ensure data integrity and performance', true, 'Database', '550e8400-e29b-41d4-a716-446655440001'),
-- Business Solutions
('990e8400-e29b-41d4-a716-446655440004', 'Process Automation', 'medium', 'in_production', 'Workflow automation', 'Automate business processes to improve efficiency', 'Reduce manual work and increase productivity', true, 'Robot', '550e8400-e29b-41d4-a716-446655440001'),
('990e8400-e29b-41d4-a716-446655440005', 'Data Analytics', 'high', 'in_production', 'Business intelligence', 'Data analysis and reporting solutions', 'Make informed business decisions', true, 'Chart', '550e8400-e29b-41d4-a716-446655440001'),
-- Support Services
('990e8400-e29b-41d4-a716-446655440006', '24/7 Technical Support', 'critical', 'in_production', 'Round-the-clock support', '24/7 technical support for critical systems', 'Ensure continuous system availability', true, 'Support', '550e8400-e29b-41d4-a716-446655440001'),
('990e8400-e29b-41d4-a716-446655440007', 'System Maintenance', 'medium', 'in_production', 'Regular maintenance', 'Preventive maintenance and system updates', 'Keep systems running optimally', true, 'Wrench', '550e8400-e29b-41d4-a716-446655440001'),
-- Security Services
('990e8400-e29b-41d4-a716-446655440008', 'Security Audit', 'high', 'in_production', 'Security assessment', 'Comprehensive security audits and assessments', 'Identify and mitigate security risks', true, 'Shield', '550e8400-e29b-41d4-a716-446655440001'),
('990e8400-e29b-41d4-a716-446655440009', 'Compliance Management', 'high', 'in_production', 'Regulatory compliance', 'Ensure compliance with industry regulations', 'Meet legal and regulatory requirements', true, 'CheckCircle', '550e8400-e29b-41d4-a716-446655440001'),
-- Cloud Solutions
('990e8400-e29b-41d4-a716-446655440010', 'Cloud Migration', 'high', 'in_production', 'Cloud infrastructure', 'Migrate applications to cloud platforms', 'Improve scalability and reduce costs', true, 'Cloud', '550e8400-e29b-41d4-a716-446655440001'),
('990e8400-e29b-41d4-a716-446655440011', 'DevOps Services', 'medium', 'in_production', 'DevOps implementation', 'Implement DevOps practices and tools', 'Accelerate software delivery', true, 'GitBranch', '550e8400-e29b-41d4-a716-446655440001')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    priority = EXCLUDED.priority,
    status = EXCLUDED.status,
    description_short = EXCLUDED.description_short,
    description_long = EXCLUDED.description_long,
    purpose = EXCLUDED.purpose,
    is_public = EXCLUDED.is_public,
    icon_name = EXCLUDED.icon_name;

-- Link services to sections
INSERT INTO app.section_services (section_id, service_id, service_order) VALUES
-- IT Services section
('880e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440001', 1),
('880e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440002', 2),
('880e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440003', 3),
-- Business Solutions section
('880e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440004', 1),
('880e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440005', 2),
-- Support Services section
('880e8400-e29b-41d4-a716-446655440003', '990e8400-e29b-41d4-a716-446655440006', 1),
('880e8400-e29b-41d4-a716-446655440003', '990e8400-e29b-41d4-a716-446655440007', 2),
-- Security Services section
('880e8400-e29b-41d4-a716-446655440004', '990e8400-e29b-41d4-a716-446655440008', 1),
('880e8400-e29b-41d4-a716-446655440004', '990e8400-e29b-41d4-a716-446655440009', 2),
-- Cloud Solutions section
('880e8400-e29b-41d4-a716-446655440005', '990e8400-e29b-41d4-a716-446655440010', 1),
('880e8400-e29b-41d4-a716-446655440005', '990e8400-e29b-41d4-a716-446655440011', 2)
ON CONFLICT (section_id, service_id) DO UPDATE SET
    service_order = EXCLUDED.service_order;
