-- Version: 1.0
-- Description: Seeds the database with default application settings.
-- Backend file: 08_app_settings.sql

-- This script inserts a comprehensive set of default settings for the application,
-- covering areas like security, session management, and feature toggles.
-- The ON CONFLICT clause ensures that running this script multiple times will
-- update existing settings rather than causing errors.

INSERT INTO app.app_settings (
    section_path, setting_name, environment, value, validation_schema, default_value, description, is_ui
) VALUES
-- UI Settings for module visibility
('Application.Work', 'work.module.is.visible', 'all', 'true', '{"type":"boolean"}', 'true', 'Enable Work module display in application', true),
('Application.Reports', 'reports.module.is.visible', 'all', 'false', NULL, NULL, 'Enable Reports module display in application', true),
('Application.KnowledgeBase', 'knowledgebase.module.is.visible', 'all', 'false', NULL, NULL, 'Enable Knowledge Base module display in application', true),

-- Security Settings
('Application.Security.PasswordPolicies', 'password.min.length', 'all', '4', '{"type":"integer","maximum":40,"minimum":4}', '8', 'Minimum password length (4-40 characters)', false),
('Application.Security.PasswordPolicies', 'password.max.length', 'all', '14', '{"type":"integer","maximum":40,"minimum":4}', '20', 'Maximum password length (8-128 characters)', false),
('Application.Security.PasswordPolicies', 'password.require.uppercase', 'all', 'false', '{"type":"boolean"}', 'true', 'Require uppercase letters in password', false),
('Application.Security.PasswordPolicies', 'password.require.lowercase', 'all', 'false', '{"type":"boolean"}', 'true', 'Require lowercase letters in password', false),
('Application.Security.PasswordPolicies', 'password.require.numbers', 'all', 'false', '{"type":"boolean"}', 'true', 'Require numbers in password', false),
('Application.Security.PasswordPolicies', 'password.require.special.chars', 'all', 'false', '{"type":"boolean"}', 'false', 'Require special characters in password', false),
('Application.Security.PasswordPolicies', 'password.allowed.special.chars', 'all', '"!@#$%^&*()_+-=[]{}|;:,.<>?"', '{"type":"string","pattern":"^[!@#$%^&*()_+\\\\-=\\[\\]{}|;:,.<>?]+$"}', '"!@#$%^&*()_+-=[]{}|;:,.<>?"', 'Allowed special characters', false),

-- Session Management Settings
('Application.Security.SessionManagement', 'access.token.lifetime', 'all', '120', '{"type":"integer","enum":[5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100,105,110,115,120]}', '30', 'Validity period of JWT access token issued to users', false),
('Application.Security.SessionManagement', 'refresh.token.lifetime', 'all', '8', '{"type":"integer","enum":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30]}', '7', 'Validity period of refresh access token issued to users devices', false),
('Application.Security.SessionManagement', 'max.refresh.tokens.per.user', 'all', '10', '{"type":"integer","enum":[1,2,3,4,5,6,7,8,9,10]}', '5', 'Maximum number of tokens per each user', false),
('Application.Security.SessionManagement', 'refresh.jwt.n.seconds.before.expiry', 'all', '60', '{"type":"integer","enum":[30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220,230,240]}', '30', 'number of seconds JWT will be automatically refreshed before its expiration time', false),
('Application.Security.SessionManagement', 'drop.refresh.tokens.on.user.change.password', 'all', 'true', '{"type":"boolean"}', 'true', 'Drop all active refresh tokens except current from users device when user changes password', false),
('Application.Security.SessionManagement', 'drop.refresh.tokens.on.admin.password.change', 'all', 'true', '{"type":"boolean"}', 'true', 'Drop all active refresh tokens for a user which password is changed by admin', false),

-- System Logging Settings
('Application.System.Logging', 'turn.on.console.logging', 'all', 'true', '{"type":"boolean"}', 'true', 'Enable console logging output', false),
('Application.System.Logging', 'turn.on.file.logging', 'all', 'false', '{"type":"boolean"}', 'false', 'Enable file logging output', false),
('Application.System.Logging', 'console.log.debug.events', 'all', 'false', '{"type":"boolean"}', 'false', 'Enable debug events output to console', false),
('Application.System.Logging', 'console.log.info.events', 'all', 'true', '{"type":"boolean"}', 'false', 'Enable info events output to console', false),
('Application.System.Logging', 'console.log.error.events', 'all', 'true', '{"type":"boolean"}', 'false', 'Enable error events output to console', false),

-- Event Bus Settings
('Application.System.EventBus', 'generate.events.in.domain.auth', 'all', 'true', '{"type":"boolean"}', 'true', 'Enable event generation in domain authentication', false),
('Application.System.EventBus', 'generate.events.in.domain.adminServices', 'all', 'true', '{"type":"boolean"}', 'true', 'Enable event generation in admin services domain', false),
('Application.System.EventBus', 'generate.events.in.domain.catalog', 'all', 'true', '{"type":"boolean"}', 'true', 'Enable event generation in catalog domain', false),
('Application.System.EventBus', 'generate.events.in.domain.connectionHandler', 'all', 'true', '{"type":"boolean"}', 'true', 'Enable event generation in domain connection handler', false),
('Application.System.EventBus', 'generate.events.in.domain.groupEditor', 'all', 'true', '{"type":"boolean"}', 'true', 'Enable event generation in domain group editor', false),
('Application.System.EventBus', 'generate.events.in.domain.groupsList', 'all', 'true', '{"type":"boolean"}', 'true', 'Enable event generation in domain groups list', false),
('Application.System.EventBus', 'generate.events.in.domain.helpers', 'all', 'true', '{"type":"boolean"}', 'true', 'Enable event generation in domain helpers', false),
('Application.System.EventBus', 'generate.events.in.domain.logger', 'all', 'true', '{"type":"boolean"}', 'true', 'Enable event generation in domain logger', false),
('Application.System.EventBus', 'generate.events.in.domain.products', 'all', 'true', '{"type":"boolean"}', 'true', 'Enable event generation in products domain', false),
('Application.System.EventBus', 'generate.events.in.domain.PublicPasswordPolicies', 'all', 'true', '{"type":"boolean"}', 'true', 'Enable event generation in domain public password policies', false),
('Application.System.EventBus', 'generate.events.in.domain.services', 'all', 'true', '{"type":"boolean"}', 'true', 'Enable event generation in services domain', false),
('Application.System.EventBus', 'generate.events.in.domain.settings', 'all', 'true', '{"type":"boolean"}', 'true', 'Enable event generation in domain settings', false),
('Application.System.EventBus', 'generate.events.in.domain.system', 'all', 'true', '{"type":"boolean"}', 'true', 'Enable event generation in domain system', false),
('Application.System.EventBus', 'generate.events.in.domain.userEditor', 'all', 'true', '{"type":"boolean"}', 'true', 'Enable event generation in domain user editor', false),
('Application.System.EventBus', 'generate.events.in.domain.usersList', 'all', 'true', '{"type":"boolean"}', 'true', 'Enable event generation in domain users list', false),

-- Users Management Settings
('UsersManagement.GroupsManagement', 'add.only.active.users.to.groups', 'all', 'false', '{"type":"boolean"}', 'true', 'Allow adding to groups only those users with status ACTIVE', false),
('UsersManagement.RegistrationPage', 'registration.page.enabled', 'all', 'false', '{"type": "boolean"}', 'false', 'Users self-registration page', false)
ON CONFLICT (section_path, setting_name, environment) DO UPDATE SET
    value = EXCLUDED.value,
    validation_schema = EXCLUDED.validation_schema,
    default_value = EXCLUDED.default_value,
    description = EXCLUDED.description,
    is_ui = EXCLUDED.is_ui,
    updated_at = CURRENT_TIMESTAMP;
