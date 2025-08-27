/**
 * events.change.password.ts - backend file
 * version: 1.0.0
 * Event definitions for change password operations.
 * Contains event types for admin password reset, self password change, and token cleanup operations.
 * 
 * Payload Guidelines:
 * - severity 'info'/'warning'/'error': Only user UUID and basic info
 * - severity 'debug': Internal system details for troubleshooting
 */

/**
 * Admin Password Reset Events
 * Events related to admin password reset operations
 */
export const ADMIN_PASSWORD_RESET_EVENTS = {
  // Password policy validation started
  PASSWORD_POLICY_VALIDATION_STARTED: {
    eventName: 'system.admin.password.reset.policy.validation.started',
    source: 'admin reset password service',
    eventType: 'security' as const,
    severity: 'debug' as const,
    eventMessage: 'Starting password policy validation for user',
    payload: null, // { username }
    version: '1.0.0'
  },
  
  // Password policy settings not found
  PASSWORD_POLICY_SETTINGS_NOT_FOUND: {
    eventName: 'system.admin.password.reset.policy.settings.not_found',
    source: 'admin reset password service',
    eventType: 'security' as const,
    severity: 'warning' as const,
    eventMessage: 'Password policy settings not found in cache for user',
    payload: null, // { username }
    version: '1.0.0'
  },
  
  // Password policy validation failed
  PASSWORD_POLICY_VALIDATION_FAILED: {
    eventName: 'system.admin.password.reset.policy.validation.failed',
    source: 'admin reset password service',
    eventType: 'security' as const,
    severity: 'warning' as const,
    eventMessage: 'Password policy validation failed for user',
    payload: null, // { username, violations }
    version: '1.0.0'
  },
  
  // Password policy validation passed
  PASSWORD_POLICY_VALIDATION_PASSED: {
    eventName: 'system.admin.password.reset.policy.validation.passed',
    source: 'admin reset password service',
    eventType: 'security' as const,
    severity: 'debug' as const,
    eventMessage: 'Password policy validation passed for user',
    payload: null, // { username }
    version: '1.0.0'
  },
  
  // Password reset started
  PASSWORD_RESET_STARTED: {
    eventName: 'system.admin.password.reset.started',
    source: 'admin reset password service',
    eventType: 'security' as const,
    severity: 'debug' as const,
    eventMessage: 'Starting password reset for user',
    payload: null, // { username, uuid }
    version: '1.0.0'
  },
  
  // Missing required fields
  MISSING_REQUIRED_FIELDS: {
    eventName: 'system.admin.password.reset.missing.required.fields',
    source: 'admin reset password service',
    eventType: 'security' as const,
    severity: 'warning' as const,
    eventMessage: 'Missing required fields',
    payload: null, // { requestInfo }
    version: '1.0.0'
  },
  
  // Password validation error
  PASSWORD_VALIDATION_ERROR: {
    eventName: 'system.admin.password.reset.validation.error',
    source: 'admin reset password service',
    eventType: 'security' as const,
    severity: 'warning' as const,
    eventMessage: 'Password validation error for user',
    payload: null, // { username, error }
    version: '1.0.0'
  },
  
  // Database transaction started
  DATABASE_TRANSACTION_STARTED: {
    eventName: 'system.admin.password.reset.database.transaction.started',
    source: 'admin reset password service',
    eventType: 'system' as const,
    severity: 'debug' as const,
    eventMessage: 'Database transaction started',
    payload: null, // { username }
    version: '1.0.0'
  },
  
  // User not found or username mismatch
  USER_NOT_FOUND_OR_MISMATCH: {
    eventName: 'system.admin.password.reset.user.not_found_or_mismatch',
    source: 'admin reset password service',
    eventType: 'security' as const,
    severity: 'warning' as const,
    eventMessage: 'User not found or username mismatch',
    payload: null, // { username, uuid }
    version: '1.0.0'
  },
  
  // Password hashed successfully
  PASSWORD_HASHED_SUCCESSFULLY: {
    eventName: 'system.admin.password.reset.password.hashed.successfully',
    source: 'admin reset password service',
    eventType: 'security' as const,
    severity: 'debug' as const,
    eventMessage: 'Password hashed successfully for user',
    payload: null, // { username, uuid }
    version: '1.0.0'
  },
  
  // Database update error
  DATABASE_UPDATE_ERROR: {
    eventName: 'system.admin.password.reset.database.update.error',
    source: 'admin reset password service',
    eventType: 'system' as const,
    severity: 'error' as const,
    eventMessage: 'Database update error for user',
    payload: null, // { username, uuid }
    version: '1.0.0'
  },
  
  // Token cleanup started
  TOKEN_CLEANUP_STARTED: {
    eventName: 'system.admin.password.reset.token.cleanup.started',
    source: 'admin reset password service',
    eventType: 'security' as const,
    severity: 'debug' as const,
    eventMessage: 'Cleaning up ALL refresh tokens for user',
    payload: null, // { username, uuid }
    version: '1.0.0'
  },
  
  // Token cleanup completed
  TOKEN_CLEANUP_COMPLETED: {
    eventName: 'system.admin.password.reset.token.cleanup.completed',
    source: 'admin reset password service',
    eventType: 'security' as const,
    severity: 'info' as const,
    eventMessage: 'Token cleanup completed successfully',
    payload: null, // { username, uuid }
    version: '1.0.0'
  },
  
  // Token cleanup error
  TOKEN_CLEANUP_ERROR: {
    eventName: 'system.admin.password.reset.token.cleanup.error',
    source: 'admin reset password service',
    eventType: 'security' as const,
    severity: 'error' as const,
    eventMessage: 'Error during token cleanup',
    payload: null, // { username, uuid, error }
    errorData: null, // Error details
    version: '1.0.0'
  },
  
  // Password reset successful
  PASSWORD_RESET_SUCCESSFUL: {
    eventName: 'system.admin.password.reset.successful',
    source: 'admin reset password service',
    eventType: 'security' as const,
    severity: 'info' as const,
    eventMessage: 'Password successfully reset for user',
    payload: null, // { username, uuid }
    version: '1.0.0'
  },
  
  // Service error
  SERVICE_ERROR: {
    eventName: 'system.admin.password.reset.service.error',
    source: 'admin reset password service',
    eventType: 'system' as const,
    severity: 'error' as const,
    eventMessage: 'Admin reset password service error',
    payload: null, // { username, uuid, error }
    errorData: null, // Error details
    version: '1.0.0'
  }
};

/**
 * Self Password Change Events
 * Events related to self password change operations
 */
export const SELF_PASSWORD_CHANGE_EVENTS = {
  // User not found
  USER_NOT_FOUND: {
    eventName: 'system.self.password.change.user.not_found',
    source: 'self change password service',
    eventType: 'security' as const,
    severity: 'warning' as const,
    eventMessage: 'User not found',
    payload: null, // { username, uuid }
    version: '1.0.0'
  },
  
  // Username mismatch
  USERNAME_MISMATCH: {
    eventName: 'system.self.password.change.username.mismatch',
    source: 'self change password service',
    eventType: 'security' as const,
    severity: 'warning' as const,
    eventMessage: 'Username mismatch for UUID',
    payload: null, // { username, uuid }
    version: '1.0.0'
  },
  
  // Invalid current password
  INVALID_CURRENT_PASSWORD: {
    eventName: 'system.self.password.change.invalid.current_password',
    source: 'self change password service',
    eventType: 'security' as const,
    severity: 'warning' as const,
    eventMessage: 'Invalid current password for user',
    payload: null, // { username, uuid }
    version: '1.0.0'
  },
  
  // Database update error
  DATABASE_UPDATE_ERROR: {
    eventName: 'system.self.password.change.database.update.error',
    source: 'self change password service',
    eventType: 'system' as const,
    severity: 'error' as const,
    eventMessage: 'Database update error for user',
    payload: null, // { username, uuid }
    version: '1.0.0'
  },
  
  // Device fingerprint provided
  DEVICE_FINGERPRINT_PROVIDED: {
    eventName: 'system.self.password.change.device.fingerprint.provided',
    source: 'self change password service',
    eventType: 'security' as const,
    severity: 'debug' as const,
    eventMessage: 'Device fingerprint provided, cleaning up tokens',
    payload: null, // { username, uuid }
    version: '1.0.0'
  },
  
  // Token cleanup completed
  TOKEN_CLEANUP_COMPLETED: {
    eventName: 'system.self.password.change.token.cleanup.completed',
    source: 'self change password service',
    eventType: 'security' as const,
    severity: 'info' as const,
    eventMessage: 'Token cleanup completed successfully',
    payload: null, // { username, uuid }
    version: '1.0.0'
  },
  
  // Token cleanup error
  TOKEN_CLEANUP_ERROR: {
    eventName: 'system.self.password.change.token.cleanup.error',
    source: 'self change password service',
    eventType: 'security' as const,
    severity: 'error' as const,
    eventMessage: 'Error during token cleanup',
    payload: null, // { username, uuid, error }
    errorData: null, // Error details
    version: '1.0.0'
  },
  
  // No device fingerprint provided
  NO_DEVICE_FINGERPRINT_PROVIDED: {
    eventName: 'system.self.password.change.no.device.fingerprint.provided',
    source: 'self change password service',
    eventType: 'security' as const,
    severity: 'debug' as const,
    eventMessage: 'No device fingerprint provided, skipping token cleanup',
    payload: null, // { username, uuid }
    version: '1.0.0'
  },
  
  // Password change successful
  PASSWORD_CHANGE_SUCCESSFUL: {
    eventName: 'system.self.password.change.successful',
    source: 'self change password service',
    eventType: 'security' as const,
    severity: 'info' as const,
    eventMessage: 'Password successfully changed for user',
    payload: null, // { username, uuid }
    version: '1.0.0'
  },
  
  // Service error
  SERVICE_ERROR: {
    eventName: 'system.self.password.change.service.error',
    source: 'self change password service',
    eventType: 'system' as const,
    severity: 'error' as const,
    eventMessage: 'Self change password service error',
    payload: null, // { username, uuid, error }
    errorData: null, // Error details
    version: '1.0.0'
  }
};

/**
 * Token Cleanup Events
 * Events related to token cleanup operations
 */
export const TOKEN_CLEANUP_EVENTS = {
  // Loading token cleanup setting
  LOADING_TOKEN_CLEANUP_SETTING: {
    eventName: 'system.token.cleanup.loading.setting',
    source: 'token cleanup service',
    eventType: 'system' as const,
    severity: 'debug' as const,
    eventMessage: 'Loading token cleanup setting',
    payload: null, // { settingName }
    version: '1.0.0'
  },
  
  // Critical setting not found
  CRITICAL_SETTING_NOT_FOUND: {
    eventName: 'system.token.cleanup.critical.setting.not_found',
    source: 'token cleanup service',
    eventType: 'system' as const,
    severity: 'error' as const,
    eventMessage: 'Critical setting not found',
    payload: null, // { settingName }
    version: '1.0.0'
  },
  
  // Token cleanup setting value
  TOKEN_CLEANUP_SETTING_VALUE: {
    eventName: 'system.token.cleanup.setting.value',
    source: 'token cleanup service',
    eventType: 'system' as const,
    severity: 'debug' as const,
    eventMessage: 'Token cleanup setting value',
    payload: null, // { settingName, value }
    version: '1.0.0'
  },
  
  // Finding token to keep
  FINDING_TOKEN_TO_KEEP: {
    eventName: 'system.token.cleanup.finding.token.to_keep',
    source: 'token cleanup service',
    eventType: 'system' as const,
    severity: 'debug' as const,
    eventMessage: 'Finding token to keep among active tokens',
    payload: null, // { tokenCount }
    version: '1.0.0'
  },
  
  // Token similarity
  TOKEN_SIMILARITY: {
    eventName: 'system.token.cleanup.token.similarity',
    source: 'token cleanup service',
    eventType: 'system' as const,
    severity: 'debug' as const,
    eventMessage: 'Token similarity',
    payload: null, // { tokenId, similarity }
    version: '1.0.0'
  },
  
  // Token cleanup disabled
  TOKEN_CLEANUP_DISABLED: {
    eventName: 'system.token.cleanup.disabled',
    source: 'token cleanup service',
    eventType: 'system' as const,
    severity: 'debug' as const,
    eventMessage: 'Token cleanup is disabled, skipping',
    payload: null, // { settingName }
    version: '1.0.0'
  },
  
  // Token cleanup enabled
  TOKEN_CLEANUP_ENABLED: {
    eventName: 'system.token.cleanup.enabled',
    source: 'token cleanup service',
    eventType: 'system' as const,
    severity: 'debug' as const,
    eventMessage: 'Token cleanup is enabled, proceeding',
    payload: null, // { settingName }
    version: '1.0.0'
  },
  
  // Found active tokens
  FOUND_ACTIVE_TOKENS: {
    eventName: 'system.token.cleanup.found.active.tokens',
    source: 'token cleanup service',
    eventType: 'system' as const,
    severity: 'debug' as const,
    eventMessage: 'Found active tokens for user',
    payload: null, // { userUuid, tokenCount }
    version: '1.0.0'
  },
  
  // No active tokens found
  NO_ACTIVE_TOKENS_FOUND: {
    eventName: 'system.token.cleanup.no.active.tokens.found',
    source: 'token cleanup service',
    eventType: 'system' as const,
    severity: 'debug' as const,
    eventMessage: 'No active tokens found, nothing to clean up',
    payload: null, // { userUuid }
    version: '1.0.0'
  },
  
  // No token to keep found
  NO_TOKEN_TO_KEEP_FOUND: {
    eventName: 'system.token.cleanup.no.token.to_keep.found',
    source: 'token cleanup service',
    eventType: 'system' as const,
    severity: 'debug' as const,
    eventMessage: 'No token to keep found, revoking all tokens',
    payload: null, // { userUuid }
    version: '1.0.0'
  },
  
  // Token revoked
  TOKEN_REVOKED: {
    eventName: 'system.token.cleanup.token.revoked',
    source: 'token cleanup service',
    eventType: 'security' as const,
    severity: 'debug' as const,
    eventMessage: 'Token revoked',
    payload: null, // { userUuid, tokenId }
    version: '1.0.0'
  },
  
  // Token cleanup completed
  TOKEN_CLEANUP_COMPLETED: {
    eventName: 'system.token.cleanup.completed',
    source: 'token cleanup service',
    eventType: 'security' as const,
    severity: 'info' as const,
    eventMessage: 'Token cleanup completed',
    payload: null, // { userUuid, revokedCount, keptCount }
    version: '1.0.0'
  },
  
  // ALL token cleanup started
  ALL_TOKEN_CLEANUP_STARTED: {
    eventName: 'system.token.cleanup.all.started',
    source: 'token cleanup service',
    eventType: 'security' as const,
    severity: 'debug' as const,
    eventMessage: 'Starting ALL token cleanup for user',
    payload: null, // { userUuid }
    version: '1.0.0'
  },
  
  // Admin token cleanup disabled
  ADMIN_TOKEN_CLEANUP_DISABLED: {
    eventName: 'system.token.cleanup.admin.disabled',
    source: 'token cleanup service',
    eventType: 'system' as const,
    severity: 'debug' as const,
    eventMessage: 'Admin token cleanup is disabled, skipping',
    payload: null, // { settingName }
    version: '1.0.0'
  },
  
  // Admin token cleanup enabled
  ADMIN_TOKEN_CLEANUP_ENABLED: {
    eventName: 'system.token.cleanup.admin.enabled',
    source: 'token cleanup service',
    eventType: 'system' as const,
    severity: 'debug' as const,
    eventMessage: 'Admin token cleanup is enabled, proceeding',
    payload: null, // { settingName }
    version: '1.0.0'
  },
  
  // ALL token cleanup completed
  ALL_TOKEN_CLEANUP_COMPLETED: {
    eventName: 'system.token.cleanup.all.completed',
    source: 'token cleanup service',
    eventType: 'security' as const,
    severity: 'info' as const,
    eventMessage: 'ALL token cleanup completed',
    payload: null, // { userUuid, revokedCount }
    version: '1.0.0'
  },
  
  // Token cleanup error
  TOKEN_CLEANUP_ERROR: {
    eventName: 'system.token.cleanup.error',
    source: 'token cleanup service',
    eventType: 'system' as const,
    severity: 'error' as const,
    eventMessage: 'Error during token cleanup',
    payload: null, // { userUuid, error }
    errorData: null, // Error details
    version: '1.0.0'
  },
  
  // ALL token cleanup error
  ALL_TOKEN_CLEANUP_ERROR: {
    eventName: 'system.token.cleanup.all.error',
    source: 'token cleanup service',
    eventType: 'system' as const,
    severity: 'error' as const,
    eventMessage: 'Error during ALL token cleanup',
    payload: null, // { userUuid, error }
    errorData: null, // Error details
    version: '1.0.0'
  }
};

/**
 * Admin Password Reset Controller Events
 * Events related to admin password reset controller operations
 */
export const ADMIN_PASSWORD_RESET_CONTROLLER_EVENTS = {
  // Invalid request data
  INVALID_REQUEST_DATA: {
    eventName: 'system.admin.password.reset.controller.invalid.request.data',
    source: 'admin reset password controller',
    eventType: 'security' as const,
    severity: 'error' as const,
    eventMessage: 'Invalid request data',
    payload: null, // { requestInfo }
    version: '1.0.0'
  }
};
