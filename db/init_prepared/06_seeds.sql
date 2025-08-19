-- Version: 1.0
-- Description: Insert seed data
-- Backend file: init_seeds

-- Import application settings
-- Note: This file should be copied to the same directory as init scripts
-- or the path should be adjusted for docker container

-- Insert application settings
INSERT INTO app.app_settings (section_path, setting_name, environment, value, description, is_ui) VALUES
-- UI Settings for module visibility
('Application.Work', 'work.module.is.visible', 'all', 'true', 'Enable Work module display in application', true),
('Application.Reports', 'reports.module.is.visible', 'all', 'true', 'Enable Reports module display in application', true),
('Application.KnowledgeBase', 'knowledgebase.module.is.visible', 'all', 'true', 'Enable Knowledge Base module display in application', true),

-- Security Settings
('Application.Security.PasswordPolicies', 'password.min.length', 'all', '8', 'Minimum password length (4-40 characters)', false),
('Application.Security.PasswordPolicies', 'password.max.length', 'all', '128', 'Maximum password length (8-128 characters)', false),
('Application.Security.PasswordPolicies', 'password.require.uppercase', 'all', 'true', 'Require uppercase letters in password', false),
('Application.Security.PasswordPolicies', 'password.require.lowercase', 'all', 'true', 'Require lowercase letters in password', false),
('Application.Security.PasswordPolicies', 'password.require.numbers', 'all', 'true', 'Require numbers in password', false),
('Application.Security.PasswordPolicies', 'password.require.special.chars', 'all', 'true', 'Require special characters in password', false),
('Application.Security.PasswordPolicies', 'password.allowed.special.chars', 'all', '"!@#$%^&*()_+-=[]{}|;:,.<>?"', 'Allowed special characters', false),

-- Session Management Settings
('Application.Security.SessionManagement', 'access.token.lifetime', 'all', '3600', 'Validity period of JWT access token issued to users', false),
('Application.Security.SessionManagement', 'refresh.token.lifetime', 'all', '2592000', 'Validity period of refresh access token issued to users devices', false),
('Application.Security.SessionManagement', 'max.refresh.tokens.per.user', 'all', '10', 'Maximum number of tokens per each user', false),
('Application.Security.SessionManagement', 'refresh.jwt.n.seconds.before.expiry', 'all', '300', 'number of seconds JWT will be automatically refreshed before its expiration time', false),
('Application.Security.SessionManagement', 'drop.refresh.tokens.on.user.change.password', 'all', 'true', 'Drop all active refresh tokens except current from users device when user changes password', false),
('Application.Security.SessionManagement', 'drop.refresh.tokens.on.admin.password.change', 'all', 'true', 'Drop all active refresh tokens for a user which password is changed by admin', false),

-- System Logging Settings
('Application.System.Logging', 'turn.on.console.logging', 'all', 'true', 'Enable console logging output', false),
('Application.System.Logging', 'turn.on.file.logging', 'all', 'true', 'Enable file logging output', false),
('Application.System.Logging', 'console.log.debug.events', 'all', 'false', 'Enable debug events output to console', false),
('Application.System.Logging', 'console.log.info.events', 'all', 'true', 'Enable info events output to console', false),
('Application.System.Logging', 'console.log.error.events', 'all', 'true', 'Enable error events output to console', false),

-- Event Bus Settings
('Application.System.EventBus', 'generate.events.in.domain.auth', 'all', 'true', 'Enable event generation in domain authentication', false),
('Application.System.EventBus', 'generate.events.in.domain.adminServices', 'all', 'true', 'Enable event generation in admin services domain', false),
('Application.System.EventBus', 'generate.events.in.domain.catalog', 'all', 'true', 'Enable event generation in catalog domain', false),
('Application.System.EventBus', 'generate.events.in.domain.connectionHandler', 'all', 'true', 'Enable event generation in domain connection handler', false),
('Application.System.EventBus', 'generate.events.in.domain.groupEditor', 'all', 'true', 'Enable event generation in domain group editor', false),
('Application.System.EventBus', 'generate.events.in.domain.groupsList', 'all', 'true', 'Enable event generation in domain groups list', false),
('Application.System.EventBus', 'generate.events.in.domain.helpers', 'all', 'true', 'Enable event generation in domain helpers', false),
('Application.System.EventBus', 'generate.events.in.domain.logger', 'all', 'true', 'Enable event generation in domain logger', false),
('Application.System.EventBus', 'generate.events.in.domain.products', 'all', 'true', 'Enable event generation in products domain', false),
('Application.System.EventBus', 'generate.events.in.domain.PublicPasswordPolicies', 'all', 'true', 'Enable event generation in domain public password policies', false),
('Application.System.EventBus', 'generate.events.in.domain.services', 'all', 'true', 'Enable event generation in services domain', false),
('Application.System.EventBus', 'generate.events.in.domain.settings', 'all', 'true', 'Enable event generation in domain settings', false),
('Application.System.EventBus', 'generate.events.in.domain.system', 'all', 'true', 'Enable event generation in domain system', false),
('Application.System.EventBus', 'generate.events.in.domain.userEditor', 'all', 'true', 'Enable event generation in domain user editor', false),
('Application.System.EventBus', 'generate.events.in.domain.usersList', 'all', 'true', 'Enable event generation in domain users list', false)
ON CONFLICT (section_path, setting_name, environment) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    is_ui = EXCLUDED.is_ui,
    updated_at = CURRENT_TIMESTAMP;

-- Insert system users
INSERT INTO app.users (user_id, username, hashed_password, email, is_staff, account_status, first_name, last_name, created_at) VALUES
-- System administrator
('550e8400-e29b-41d4-a716-446655440001', 'admin', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'admin@example.com', true, 'active', 'System', 'Administrator', NOW()),
-- Test user t1 (with original hash)
('550e8400-e29b-41d4-a716-446655440002', 't1', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 't1@example.com', false, 'active', 'Test', 'User', NOW()),
-- Demo users
('550e8400-e29b-41d4-a716-446655440003', 'john.doe', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'john.doe@example.com', false, 'active', 'John', 'Doe', NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'jane.smith', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'jane.smith@example.com', false, 'active', 'Jane', 'Smith', NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'bob.wilson', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'bob.wilson@example.com', false, 'active', 'Bob', 'Wilson', NOW()),
-- Additional demo users
('550e8400-e29b-41d4-a716-446655440006', 'alice.johnson', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'alice.johnson@example.com', false, 'active', 'Alice', 'Johnson', NOW()),
('550e8400-e29b-41d4-a716-446655440007', 'charlie.brown', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'charlie.brown@example.com', false, 'active', 'Charlie', 'Brown', NOW()),
('550e8400-e29b-41d4-a716-446655440008', 'diana.prince', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'diana.prince@example.com', false, 'active', 'Diana', 'Prince', NOW()),
('550e8400-e29b-41d4-a716-446655440009', 'edward.norton', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'edward.norton@example.com', false, 'active', 'Edward', 'Norton', NOW()),
('550e8400-e29b-41d4-a716-446655440010', 'fiona.gallagher', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'fiona.gallagher@example.com', false, 'active', 'Fiona', 'Gallagher', NOW()),
('550e8400-e29b-41d4-a716-446655440011', 'george.martin', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'george.martin@example.com', false, 'active', 'George', 'Martin', NOW()),
('550e8400-e29b-41d4-a716-446655440012', 'helen.keller', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'helen.keller@example.com', false, 'active', 'Helen', 'Keller', NOW()),
('550e8400-e29b-41d4-a716-446655440013', 'ivan.drago', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'ivan.drago@example.com', false, 'active', 'Ivan', 'Drago', NOW()),
('550e8400-e29b-41d4-a716-446655440014', 'julia.roberts', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'julia.roberts@example.com', false, 'active', 'Julia', 'Roberts', NOW()),
('550e8400-e29b-41d4-a716-446655440015', 'kevin.bacon', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'kevin.bacon@example.com', false, 'active', 'Kevin', 'Bacon', NOW()),
('550e8400-e29b-41d4-a716-446655440016', 'lisa.simpson', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'lisa.simpson@example.com', false, 'active', 'Lisa', 'Simpson', NOW()),
('550e8400-e29b-41d4-a716-446655440017', 'michael.scott', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'michael.scott@example.com', false, 'active', 'Michael', 'Scott', NOW()),
('550e8400-e29b-41d4-a716-446655440018', 'nancy.drew', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'nancy.drew@example.com', false, 'active', 'Nancy', 'Drew', NOW()),
('550e8400-e29b-41d4-a716-446655440019', 'oscar.wilde', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'oscar.wilde@example.com', false, 'active', 'Oscar', 'Wilde', NOW()),
('550e8400-e29b-41d4-a716-446655440020', 'pam.beesly', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'pam.beesly@example.com', false, 'active', 'Pam', 'Beesly', NOW()),
('550e8400-e29b-41d4-a716-446655440021', 'quentin.tarantino', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'quentin.tarantino@example.com', false, 'active', 'Quentin', 'Tarantino', NOW()),
('550e8400-e29b-41d4-a716-446655440022', 'rachel.green', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'rachel.green@example.com', false, 'active', 'Rachel', 'Green', NOW()),
('550e8400-e29b-41d4-a716-446655440023', 'steve.jobs', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'steve.jobs@example.com', false, 'active', 'Steve', 'Jobs', NOW()),
('550e8400-e29b-41d4-a716-446655440024', 'tina.fey', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'tina.fey@example.com', false, 'active', 'Tina', 'Fey', NOW()),
('550e8400-e29b-41d4-a716-446655440025', 'ulysses.grant', '$2b$10$USKBfWFGWHx8oIG3O2GxWej0cFtgDY4DGKzBn4vH7VGNxqQZhDBGy', 'ulysses.grant@example.com', false, 'active', 'Ulysses', 'Grant', NOW())
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
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', '+1234567894', '654 Pine Ln, City', 'Consulting Inc', 'Project Manager', 'm'),
-- Additional user profiles
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', '+1234567895', '111 Elm St, City', 'Marketing Pro', 'Marketing Manager', 'f'),
('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440007', '+1234567896', '222 Maple Ave, City', 'Sales Corp', 'Sales Representative', 'm'),
('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440008', '+1234567897', '333 Cedar Rd, City', 'HR Solutions', 'HR Specialist', 'f'),
('660e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440009', '+1234567898', '444 Birch Ln, City', 'Finance Inc', 'Financial Analyst', 'm'),
('660e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440010', '+1234567899', '555 Willow St, City', 'Legal Services', 'Legal Assistant', 'f'),
('660e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440011', '+1234567900', '666 Spruce Ave, City', 'Creative Agency', 'Creative Director', 'm'),
('660e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440012', '+1234567901', '777 Aspen Rd, City', 'Education Corp', 'Teacher', 'f'),
('660e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440013', '+1234567902', '888 Poplar Ln, City', 'Security Firm', 'Security Guard', 'm'),
('660e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440014', '+1234567903', '999 Oak St, City', 'Entertainment Inc', 'Actor', 'f'),
('660e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440015', '+1234567904', '101 Pine Ave, City', 'Film Studio', 'Director', 'm'),
('660e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440016', '+1234567905', '202 Cedar Rd, City', 'Animation Corp', 'Animator', 'f'),
('660e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440017', '+1234567906', '303 Maple Ln, City', 'Paper Company', 'Regional Manager', 'm'),
('660e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440018', '+1234567907', '404 Elm St, City', 'Detective Agency', 'Private Investigator', 'f'),
('660e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440019', '+1234567908', '505 Birch Ave, City', 'Publishing House', 'Author', 'm'),
('660e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440020', '+1234567909', '606 Willow Rd, City', 'Paper Company', 'Receptionist', 'f'),
('660e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440021', '+1234567910', '707 Spruce Ln, City', 'Film Studio', 'Director', 'm'),
('660e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440022', '+1234567911', '808 Aspen St, City', 'Fashion House', 'Fashion Designer', 'f'),
('660e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440023', '+1234567912', '909 Poplar Ave, City', 'Tech Giant', 'CEO', 'm'),
('660e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440024', '+1234567913', '110 Oak Rd, City', 'Comedy Club', 'Comedian', 'f'),
('660e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440025', '+1234567914', '111 Pine Ln, City', 'Military Academy', 'General', 'm')
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
('770e8400-e29b-41d4-a716-446655440005', 'Security Team', 'active', '550e8400-e29b-41d4-a716-446655440001', true),
-- Additional groups
('770e8400-e29b-41d4-a716-446655440006', 'Marketing Team', 'active', '550e8400-e29b-41d4-a716-446655440001', false),
('770e8400-e29b-41d4-a716-446655440007', 'Sales Team', 'active', '550e8400-e29b-41d4-a716-446655440001', false),
('770e8400-e29b-41d4-a716-446655440008', 'HR Team', 'active', '550e8400-e29b-41d4-a716-446655440001', false),
('770e8400-e29b-41d4-a716-446655440009', 'Finance Team', 'active', '550e8400-e29b-41d4-a716-446655440001', false),
('770e8400-e29b-41d4-a716-446655440010', 'Legal Team', 'active', '550e8400-e29b-41d4-a716-446655440001', false),
('770e8400-e29b-41d4-a716-446655440011', 'Creative Team', 'active', '550e8400-e29b-41d4-a716-446655440001', false),
('770e8400-e29b-41d4-a716-446655440012', 'Education Team', 'active', '550e8400-e29b-41d4-a716-446655440001', false),
('770e8400-e29b-41d4-a716-446655440013', 'Entertainment Team', 'active', '550e8400-e29b-41d4-a716-446655440001', false),
('770e8400-e29b-41d4-a716-446655440014', 'Management Team', 'active', '550e8400-e29b-41d4-a716-446655440001', false),
('770e8400-e29b-41d4-a716-446655440015', 'Quality Assurance', 'active', '550e8400-e29b-41d4-a716-446655440001', false)
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
('770e8400-e29b-41d4-a716-446655440005', 'Security and compliance team members', 'security@example.com', '550e8400-e29b-41d4-a716-446655440001'),
-- Additional group details
('770e8400-e29b-41d4-a716-446655440006', 'Marketing and advertising team members', 'marketing@example.com', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440007', 'Sales and business development team', 'sales@example.com', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440008', 'Human resources and recruitment team', 'hr@example.com', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440009', 'Finance and accounting team members', 'finance@example.com', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440010', 'Legal and compliance team members', 'legal@example.com', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440011', 'Creative design and content team', 'creative@example.com', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440012', 'Education and training team members', 'education@example.com', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440013', 'Entertainment and media team', 'entertainment@example.com', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440014', 'Senior management and executives', 'management@example.com', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440015', 'Quality assurance and testing team', 'qa@example.com', '550e8400-e29b-41d4-a716-446655440001')
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
('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001'),
-- Additional group members
-- Marketing Team
('770e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001'),
-- Sales Team
('770e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440001'),
-- HR Team
('770e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440001'),
-- Finance Team
('770e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440001'),
-- Legal Team
('770e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001'),
-- Creative Team
('770e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440001'),
-- Education Team
('770e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440001'),
-- Entertainment Team
('770e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440001'),
-- Management Team
('770e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440001'),
-- Quality Assurance
('770e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440001')
ON CONFLICT (group_id, user_id, is_active) DO NOTHING;

-- Insert catalog sections
INSERT INTO app.catalog_sections (id, name, owner, description, status, is_public, "order", icon_name, color, created_by) VALUES
-- Catalog sections
('880e8400-e29b-41d4-a716-446655440001', 'IT Services', '550e8400-e29b-41d4-a716-446655440001', 'Information Technology Services', 'active', true, 1, 'Monitor', '#64748B', '550e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440002', 'Business Solutions', '550e8400-e29b-41d4-a716-446655440001', 'Business Process Solutions', 'active', true, 2, 'Briefcase', '#6B7280', '550e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440003', 'Support Services', '550e8400-e29b-41d4-a716-446655440001', 'Technical Support and Maintenance', 'active', true, 3, 'Headset', '#7C3AED', '550e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440004', 'Security Services', '550e8400-e29b-41d4-a716-446655440001', 'Cybersecurity and Compliance', 'active', true, 4, 'Shield', '#DC2626', '550e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440005', 'Cloud Solutions', '550e8400-e29b-41d4-a716-446655440001', 'Cloud Infrastructure and Services', 'active', true, 5, 'Cloud', '#0891B2', '550e8400-e29b-41d4-a716-446655440001')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    is_public = EXCLUDED.is_public,
    "order" = EXCLUDED."order",
    icon_name = EXCLUDED.icon_name,
    color = EXCLUDED.color;

-- Note: Sub-sections removed for simplicity

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
