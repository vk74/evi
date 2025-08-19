-- Version: 1.0
-- Description: Insert application settings
-- Backend file: seeds_app_settings

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
('Application.Security.PasswordPolicies', 'password.allowed.special.chars', 'all', '!@#$%^&*()_+-=[]{}|;:,.<>?', 'Allowed special characters', false),

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
