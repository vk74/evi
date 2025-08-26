/**
 * events.auth.ts - backend file
 * version: 1.0.0
 * Event definitions for authentication operations.
 * Contains event types for login, logout, token management, and security events.
 * 
 * Payload Guidelines:
 * - severity 'info'/'warning'/'error': Only user UUID and basic info
 * - severity 'debug': Internal system details for troubleshooting
 */

/**
 * Authentication Login Events
 * Events related to user login operations
 */
export const AUTH_LOGIN_EVENTS = {
  
  /**
   * Login attempt event
   * Triggered when user attempts to log in
   * severity: debug - includes full request details
   */
  LOGIN_ATTEMPT: {
    eventName: 'auth.login.attempt',
    eventMessage: 'User login attempt initiated',
    eventType: 'security' as const,
    source: 'core.auth.login',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * Successful login event
   * Triggered when user successfully logs in
   * severity: info - includes only user UUID and basic success info
   */
  LOGIN_SUCCESS: {
    eventName: 'auth.login.success',
    eventMessage: 'User login successful',
    eventType: 'security' as const,
    source: 'core.auth.login',
    severity: 'info' as const,
    version: '1.0.0'
  },

  /**
   * Failed login event
   * Triggered when login attempt fails
   * severity: warning - includes user UUID and failure reason
   */
  LOGIN_FAILED: {
    eventName: 'auth.login.failed',
    eventMessage: 'User login failed',
    eventType: 'security' as const,
    source: 'core.auth.login',
    severity: 'warning' as const,
    version: '1.0.0'
  },

  /**
   * Login blocked event
   * Triggered when login is blocked due to brute force protection
   * severity: warning - includes IP and block reason
   */
  LOGIN_BLOCKED: {
    eventName: 'auth.login.blocked',
    eventMessage: 'Login blocked due to brute force protection',
    eventType: 'security' as const,
    source: 'core.auth.login',
    severity: 'warning' as const,
    version: '1.0.0'
  },

  /**
   * Credentials validation attempt event
   * Triggered when attempting to validate user credentials
   * severity: debug - includes username being validated
   */
  CREDENTIALS_VALIDATION_ATTEMPT: {
    eventName: 'auth.login.credentials.validation.attempt',
    eventMessage: 'Attempting to validate user credentials',
    eventType: 'security' as const,
    source: 'core.auth.login',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * Credentials validation success event
   * Triggered when credentials validation is successful
   * severity: info - includes user UUID
   */
  CREDENTIALS_VALIDATION_SUCCESS: {
    eventName: 'auth.login.credentials.validation.success',
    eventMessage: 'User credentials validation successful',
    eventType: 'security' as const,
    source: 'core.auth.login',
    severity: 'info' as const,
    version: '1.0.0'
  },

  /**
   * Database query completed event
   * Triggered when database query for credentials validation completes
   * severity: debug - includes query result details
   */
  DATABASE_QUERY_COMPLETED: {
    eventName: 'auth.login.database.query.completed',
    eventMessage: 'Database query for credentials validation completed',
    eventType: 'system' as const,
    source: 'core.auth.login',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * User not found event
   * Triggered when user is not found in database during validation
   * severity: debug - includes username that was not found
   */
  USER_NOT_FOUND: {
    eventName: 'auth.login.user.not.found',
    eventMessage: 'User not found in database during validation',
    eventType: 'security' as const,
    source: 'core.auth.login',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * User found password comparison event
   * Triggered when user is found and password comparison begins
   * severity: debug - includes user UUID
   */
  USER_FOUND_PASSWORD_COMPARISON: {
    eventName: 'auth.login.user.found.password.comparison',
    eventMessage: 'User found, beginning password comparison',
    eventType: 'security' as const,
    source: 'core.auth.login',
    severity: 'debug' as const,
    version: '1.0.0'
  }
};

/**
 * Authentication Logout Events
 * Events related to user logout operations
 */
export const AUTH_LOGOUT_EVENTS = {
  
  /**
   * Logout attempt event
   * Triggered when user attempts to log out
   * severity: debug - includes full request details
   */
  LOGOUT_ATTEMPT: {
    eventName: 'auth.logout.attempt',
    eventMessage: 'User logout attempt initiated',
    eventType: 'security' as const,
    source: 'core.auth.logout',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * Failed logout event
   * Triggered when logout attempt fails
   * severity: warning - includes user UUID and failure reason
   */
  LOGOUT_FAILED: {
    eventName: 'auth.logout.failed',
    eventMessage: 'User logout failed',
    eventType: 'security' as const,
    source: 'core.auth.logout',
    severity: 'warning' as const,
    version: '1.0.0'
  },

  /**
   * Logout processing attempt event
   * Triggered when attempting to process logout request
   * severity: debug - includes request details
   */
  LOGOUT_PROCESSING_ATTEMPT: {
    eventName: 'auth.logout.processing.attempt',
    eventMessage: 'Processing logout request',
    eventType: 'security' as const,
    source: 'core.auth.logout',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * Logout success event
   * Triggered when logout is successful
   * severity: info - includes user UUID
   */
  LOGOUT_SUCCESS: {
    eventName: 'auth.logout.success',
    eventMessage: 'Logout successful',
    eventType: 'security' as const,
    source: 'core.auth.logout',
    severity: 'info' as const,
    version: '1.0.0'
  },

  /**
   * Refresh token extraction attempt event for logout
   * Triggered when attempting to extract refresh token from request during logout
   * severity: debug - includes request details
   */
  LOGOUT_REFRESH_TOKEN_EXTRACTION_ATTEMPT: {
    eventName: 'auth.logout.refresh.token.extraction.attempt',
    eventMessage: 'Attempting to extract refresh token from request during logout',
    eventType: 'security' as const,
    source: 'core.auth.logout',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * Refresh token found in cookie for logout event
   * Triggered when refresh token is found in cookie during logout
   * severity: debug - includes token source
   */
  LOGOUT_REFRESH_TOKEN_FOUND_COOKIE: {
    eventName: 'auth.logout.refresh.token.found.cookie',
    eventMessage: 'Refresh token found in cookie during logout',
    eventType: 'security' as const,
    source: 'core.auth.logout',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * Refresh token found in body for logout event
   * Triggered when refresh token is found in request body during logout
   * severity: debug - includes token source
   */
  LOGOUT_REFRESH_TOKEN_FOUND_BODY: {
    eventName: 'auth.logout.refresh.token.found.body',
    eventMessage: 'Refresh token found in request body during logout',
    eventType: 'security' as const,
    source: 'core.auth.logout',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * Refresh token not found for logout event
   * Triggered when no refresh token is found in request during logout
   * severity: debug - includes request details
   */
  LOGOUT_REFRESH_TOKEN_NOT_FOUND: {
    eventName: 'auth.logout.refresh.token.not.found',
    eventMessage: 'No refresh token found in request during logout',
    eventType: 'security' as const,
    source: 'core.auth.logout',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * Refresh token cookie cleared for logout event
   * Triggered when refresh token cookie is cleared during logout
   * severity: info - includes operation details
   */
  LOGOUT_REFRESH_TOKEN_COOKIE_CLEARED: {
    eventName: 'auth.logout.refresh.token.cookie.cleared',
    eventMessage: 'Refresh token cookie cleared during logout',
    eventType: 'security' as const,
    source: 'core.auth.logout',
    severity: 'info' as const,
    version: '1.0.0'
  },

  /**
   * Invalid refresh token format for logout event
   * Triggered when refresh token has invalid format during logout
   * severity: debug - includes format validation details
   */
  LOGOUT_INVALID_REFRESH_TOKEN_FORMAT: {
    eventName: 'auth.logout.invalid.refresh.token.format',
    eventMessage: 'Invalid refresh token format during logout',
    eventType: 'security' as const,
    source: 'core.auth.logout',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * Invalid refresh token for logout event
   * Triggered when refresh token is invalid during logout
   * severity: debug - includes validation error
   */
  LOGOUT_INVALID_REFRESH_TOKEN: {
    eventName: 'auth.logout.invalid.refresh.token',
    eventMessage: 'Invalid refresh token for logout',
    eventType: 'security' as const,
    source: 'core.auth.logout',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * Refresh token revoked for logout event
   * Triggered when refresh token is successfully revoked during logout
   * severity: info - includes user UUID
   */
  LOGOUT_REFRESH_TOKEN_REVOKED: {
    eventName: 'auth.logout.refresh.token.revoked',
    eventMessage: 'Refresh token revoked successfully during logout',
    eventType: 'security' as const,
    source: 'core.auth.logout',
    severity: 'info' as const,
    version: '1.0.0'
  }
};

/**
 * Token Management Events
 * Events related to token operations (refresh, issue, revoke)
 */
export const AUTH_TOKEN_EVENTS = {
  
  /**
   * Token refresh attempt event
   * Triggered when token refresh is attempted
   * severity: debug - includes full request details
   */
  TOKEN_REFRESH_ATTEMPT: {
    eventName: 'auth.token.refresh.attempt',
    eventMessage: 'Token refresh attempt initiated',
    eventType: 'security' as const,
    source: 'core.auth.token.refresh',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * Successful token refresh event
   * Triggered when token refresh is successful
   * severity: info - includes only user UUID
   */
  TOKEN_REFRESH_SUCCESS: {
    eventName: 'auth.token.refresh.success',
    eventMessage: 'Token refresh successful',
    eventType: 'security' as const,
    source: 'core.auth.token.refresh',
    severity: 'info' as const,
    version: '1.0.0'
  },

  /**
   * Failed token refresh event
   * Triggered when token refresh fails
   * severity: warning - includes user UUID and failure reason
   */
  TOKEN_REFRESH_FAILED: {
    eventName: 'auth.token.refresh.failed',
    eventMessage: 'Token refresh failed',
    eventType: 'security' as const,
    source: 'core.auth.token.refresh',
    severity: 'warning' as const,
    version: '1.0.0'
  },

  /**
   * Token expired event
   * Triggered when token is expired during refresh
   * severity: warning - includes user UUID
   */
  TOKEN_REFRESH_EXPIRED: {
    eventName: 'auth.token.refresh.expired',
    eventMessage: 'Token expired during refresh',
    eventType: 'security' as const,
    source: 'core.auth.token.refresh',
    severity: 'warning' as const,
    version: '1.0.0'
  },

  /**
   * Successful token issuance event
   * Triggered when new tokens are issued
   * severity: info - includes only user UUID
   */
  TOKEN_ISSUE_SUCCESS: {
    eventName: 'auth.token.issue.success',
    eventMessage: 'Tokens issued successfully',
    eventType: 'security' as const,
    source: 'core.auth.token.issue',
    severity: 'info' as const,
    version: '1.0.0'
  },

  /**
   * Failed token issuance event
   * Triggered when token issuance fails
   * severity: error - includes user UUID and error details
   */
  TOKEN_ISSUE_FAILED: {
    eventName: 'auth.token.issue.failed',
    eventMessage: 'Token issuance failed',
    eventType: 'security' as const,
    source: 'core.auth.token.issue',
    severity: 'error' as const,
    version: '1.0.0'
  },

  /**
   * Successful token revocation event
   * Triggered when token is revoked
   * severity: info - includes only user UUID
   */
  TOKEN_REVOKE_SUCCESS: {
    eventName: 'auth.token.revoke.success',
    eventMessage: 'Token revoked successfully',
    eventType: 'security' as const,
    source: 'core.auth.token.revoke',
    severity: 'info' as const,
    version: '1.0.0'
  },

  /**
   * Token issue attempt event
   * Triggered when token issuance is initiated
   * severity: debug - includes full request details
   */
  TOKEN_ISSUE_ATTEMPT: {
    eventName: 'auth.token.issue.attempt',
    eventMessage: 'Token issuance attempt initiated',
    eventType: 'security' as const,
    source: 'core.auth.token.issue',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * Refresh token cookie set event
   * Triggered when refresh token is successfully set as httpOnly cookie
   * severity: info - includes user UUID
   */
  REFRESH_TOKEN_COOKIE_SET: {
    eventName: 'auth.token.refresh.cookie.set',
    eventMessage: 'Refresh token set as httpOnly cookie',
    eventType: 'security' as const,
    source: 'core.auth.token.issue',
    severity: 'info' as const,
    version: '1.0.0'
  },

  /**
   * Token pair generation attempt event
   * Triggered when attempting to generate token pair
   * severity: debug - includes username
   */
  TOKEN_PAIR_GENERATION_ATTEMPT: {
    eventName: 'auth.token.pair.generation.attempt',
    eventMessage: 'Attempting to generate token pair',
    eventType: 'security' as const,
    source: 'core.auth.token.issue',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * Token pair generation success event
   * Triggered when token pair is successfully generated and stored
   * severity: info - includes username and user UUID
   */
  TOKEN_PAIR_GENERATION_SUCCESS: {
    eventName: 'auth.token.pair.generation.success',
    eventMessage: 'Token pair generated and stored successfully',
    eventType: 'security' as const,
    source: 'core.auth.token.issue',
    severity: 'info' as const,
    version: '1.0.0'
  },

  /**
   * Refresh token storage attempt event
   * Triggered when attempting to store refresh token
   * severity: debug - includes user UUID
   */
  REFRESH_TOKEN_STORAGE_ATTEMPT: {
    eventName: 'auth.token.refresh.storage.attempt',
    eventMessage: 'Attempting to store refresh token',
    eventType: 'security' as const,
    source: 'core.auth.token.issue',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * Refresh token storage success event
   * Triggered when refresh token is successfully stored
   * severity: info - includes user UUID
   */
  REFRESH_TOKEN_STORAGE_SUCCESS: {
    eventName: 'auth.token.refresh.storage.success',
    eventMessage: 'Refresh token stored successfully with device fingerprint',
    eventType: 'security' as const,
    source: 'core.auth.token.issue',
    severity: 'info' as const,
    version: '1.0.0'
  },

  /**
   * Token refresh processing attempt event
   * Triggered when attempting to process token refresh request
   * severity: debug - includes request details
   */
  TOKEN_REFRESH_PROCESSING_ATTEMPT: {
    eventName: 'auth.token.refresh.processing.attempt',
    eventMessage: 'Processing token refresh request',
    eventType: 'security' as const,
    source: 'core.auth.token.refresh',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * Refresh token extraction attempt event
   * Triggered when attempting to extract refresh token from request
   * severity: debug - includes request details
   */
  REFRESH_TOKEN_EXTRACTION_ATTEMPT: {
    eventName: 'auth.token.refresh.extraction.attempt',
    eventMessage: 'Attempting to extract refresh token from request',
    eventType: 'security' as const,
    source: 'core.auth.token.refresh',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * Refresh token found in cookie event
   * Triggered when refresh token is found in the httpOnly cookie
   * severity: info - includes user UUID
   */
  REFRESH_TOKEN_FOUND_COOKIE: {
    eventName: 'auth.token.refresh.found.cookie',
    eventMessage: 'Refresh token found in httpOnly cookie',
    eventType: 'security' as const,
    source: 'core.auth.token.refresh',
    severity: 'info' as const,
    version: '1.0.0'
  },

  /**
   * Refresh token found in body event
   * Triggered when refresh token is found in the request body
   * severity: info - includes user UUID
   */
  REFRESH_TOKEN_FOUND_BODY: {
    eventName: 'auth.token.refresh.found.body',
    eventMessage: 'Refresh token found in request body',
    eventType: 'security' as const,
    source: 'core.auth.token.refresh',
    severity: 'info' as const,
    version: '1.0.0'
  },

  /**
   * Refresh token not found event
   * Triggered when refresh token is not found in request
   * severity: warning - includes user UUID
   */
  REFRESH_TOKEN_NOT_FOUND: {
    eventName: 'auth.token.refresh.not.found',
    eventMessage: 'Refresh token not found in request',
    eventType: 'security' as const,
    source: 'core.auth.token.refresh',
    severity: 'warning' as const,
    version: '1.0.0'
  },

  /**
   * New refresh token cookie set event
   * Triggered when a new refresh token is successfully set as httpOnly cookie
   * severity: info - includes user UUID
   */
  NEW_REFRESH_TOKEN_COOKIE_SET: {
    eventName: 'auth.token.refresh.new.cookie.set',
    eventMessage: 'New refresh token set as httpOnly cookie',
    eventType: 'security' as const,
    source: 'core.auth.token.refresh',
    severity: 'info' as const,
    version: '1.0.0'
  },

  /**
   * Refresh token cookie cleared event
   * Triggered when the refresh token httpOnly cookie is cleared
   * severity: info - includes user UUID
   */
  REFRESH_TOKEN_COOKIE_CLEARED: {
    eventName: 'auth.token.refresh.cookie.cleared',
    eventMessage: 'Refresh token httpOnly cookie cleared',
    eventType: 'security' as const,
    source: 'core.auth.token.refresh',
    severity: 'info' as const,
    version: '1.0.0'
  },

  /**
   * Device fingerprint extracted event
   * Triggered when device fingerprint is successfully extracted from the request
   * severity: debug - includes full device fingerprint details
   */
  DEVICE_FINGERPRINT_EXTRACTED: {
    eventName: 'auth.token.device.fingerprint.extracted',
    eventMessage: 'Device fingerprint extracted from request',
    eventType: 'security' as const,
    source: 'core.auth.token.refresh',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * Invalid refresh token event
   * Triggered when a refresh token is found but is invalid
   * severity: warning - includes user UUID
   */
  INVALID_REFRESH_TOKEN: {
    eventName: 'auth.token.refresh.invalid',
    eventMessage: 'Invalid refresh token found',
    eventType: 'security' as const,
    source: 'core.auth.token.refresh',
    severity: 'warning' as const,
    version: '1.0.0'
  }
};

/**
 * Security Events
 * Events related to security incidents and threats
 */
export const AUTH_SECURITY_EVENTS = {
  
  /**
   * Brute force attack detected event
   * Triggered when brute force attack is detected
   * severity: warning - includes IP address and attempt count
   */
  BRUTE_FORCE_DETECTED: {
    eventName: 'auth.security.brute.force.detected',
    eventMessage: 'Brute force attack detected',
    eventType: 'security' as const,
    source: 'core.auth.security',
    severity: 'warning' as const,
    version: '1.0.0'
  },

  /**
   * Device fingerprint mismatch event
   * Triggered when device fingerprint doesn't match stored one
   * severity: warning - includes user UUID and device info
   */
  DEVICE_FINGERPRINT_MISMATCH: {
    eventName: 'auth.security.device.fingerprint.mismatch',
    eventMessage: 'Device fingerprint mismatch detected',
    eventType: 'security' as const,
    source: 'core.auth.security',
    severity: 'warning' as const,
    version: '1.0.0'
  },

  /**
   * Invalid credentials event
   * Triggered when invalid credentials are provided
   * severity: warning - includes username (not password) and IP
   */
  INVALID_CREDENTIALS: {
    eventName: 'auth.security.invalid.credentials',
    eventMessage: 'Invalid credentials provided',
    eventType: 'security' as const,
    source: 'core.auth.security',
    severity: 'warning' as const,
    version: '1.0.0'
  },

  /**
   * Database error during credentials validation event
   * Triggered when database error occurs during credentials validation
   * severity: debug - includes error details
   */
  DATABASE_ERROR_CREDENTIALS: {
    eventName: 'auth.security.database.error.credentials',
    eventMessage: 'Database error during credentials validation',
    eventType: 'security' as const,
    source: 'core.auth.security',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * Token limit management error event
   * Triggered when error occurs during token limit management
   * severity: error - includes user UUID and error details
   */
  TOKEN_LIMIT_MANAGEMENT_ERROR: {
    eventName: 'auth.security.token.limit.management.error',
    eventMessage: 'Error managing token limit',
    eventType: 'security' as const,
    source: 'core.auth.security',
    severity: 'error' as const,
    version: '1.0.0'
  },

  /**
   * Refresh token storage error event
   * Triggered when error occurs during refresh token storage
   * severity: error - includes user UUID and error details
   */
  REFRESH_TOKEN_STORAGE_ERROR: {
    eventName: 'auth.security.refresh.token.storage.error',
    eventMessage: 'Error storing refresh token',
    eventType: 'security' as const,
    source: 'core.auth.security',
    severity: 'error' as const,
    version: '1.0.0'
  },

  /**
   * Token pair generation error event
   * Triggered when error occurs during token pair generation
   * severity: error - includes username and error details
   */
  TOKEN_PAIR_GENERATION_ERROR: {
    eventName: 'auth.security.token.pair.generation.error',
    eventMessage: 'Error in token pair generation',
    eventType: 'security' as const,
    source: 'core.auth.security',
    severity: 'error' as const,
    version: '1.0.0'
  },

  /**
   * Refresh token validation error event
   * Triggered when error occurs during refresh token validation
   * severity: error - includes user UUID and error details
   */
  REFRESH_TOKEN_VALIDATION_ERROR: {
    eventName: 'auth.security.refresh.token.validation.error',
    eventMessage: 'Database error during token validation',
    eventType: 'security' as const,
    source: 'core.auth.security',
    severity: 'error' as const,
    version: '1.0.0'
  },

  /**
   * Username retrieval error event
   * Triggered when error occurs while getting username by UUID
   * severity: error - includes user UUID and error details
   */
  USERNAME_RETRIEVAL_ERROR: {
    eventName: 'auth.security.username.retrieval.error',
    eventMessage: 'Error getting username by UUID',
    eventType: 'security' as const,
    source: 'core.auth.security',
    severity: 'error' as const,
    version: '1.0.0'
  },

  /**
   * Device fingerprint mismatch event
   * Triggered when device fingerprint doesn't match stored one during refresh
   * severity: warning - includes user UUID and device info
   */
  DEVICE_FINGERPRINT_MISMATCH_REFRESH: {
    eventName: 'auth.security.device.fingerprint.mismatch.refresh',
    eventMessage: 'Device fingerprint mismatch during token refresh',
    eventType: 'security' as const,
    source: 'core.auth.security',
    severity: 'warning' as const,
    version: '1.0.0'
  },

  /**
   * Settings retrieval warning event
   * Triggered when failed to get refresh before expiry setting
   * severity: warning - includes error details
   */
  SETTINGS_RETRIEVAL_WARNING: {
    eventName: 'auth.security.settings.retrieval.warning',
    eventMessage: 'Failed to get refresh before expiry setting, using default',
    eventType: 'security' as const,
    source: 'core.auth.security',
    severity: 'warning' as const,
    version: '1.0.0'
  },

  /**
   * Logout token validation error event
   * Triggered when error occurs during token validation for logout
   * severity: error - includes error details
   */
  LOGOUT_TOKEN_VALIDATION_ERROR: {
    eventName: 'auth.security.logout.token.validation.error',
    eventMessage: 'Database error during token validation for logout',
    eventType: 'security' as const,
    source: 'core.auth.security',
    severity: 'error' as const,
    version: '1.0.0'
  },

  /**
   * Logout token revocation error event
   * Triggered when error occurs during token revocation for logout
   * severity: error - includes error details
   */
  LOGOUT_TOKEN_REVOCATION_ERROR: {
    eventName: 'auth.security.logout.token.revocation.error',
    eventMessage: 'Error revoking refresh token for logout',
    eventType: 'security' as const,
    source: 'core.auth.security',
    severity: 'error' as const,
    version: '1.0.0'
  },

  /**
   * Account disabled event
   * Triggered when login attempt is made to disabled account
   * severity: warning - includes username and user UUID
   */
  ACCOUNT_DISABLED: {
    eventName: 'auth.login.account.disabled',
    eventMessage: 'Login attempt to disabled account',
    eventType: 'security' as const,
    source: 'core.auth.login',
    severity: 'warning' as const,
    version: '1.0.0'
  },

  /**
   * Account requires action event
   * Triggered when login attempt is made to account requiring user action
   * severity: warning - includes username and user UUID
   */
  ACCOUNT_REQUIRES_ACTION: {
    eventName: 'auth.login.account.requires.action',
    eventMessage: 'Login attempt to account requiring user action',
    eventType: 'security' as const,
    source: 'core.auth.login',
    severity: 'warning' as const,
    version: '1.0.0'
  }

};

/**
 * Device Fingerprint Events
 * Events related to device fingerprint operations
 */
export const AUTH_DEVICE_EVENTS = {
  
  /**
   * Device fingerprint logged event
   * Triggered when device fingerprint is logged for security
   * severity: debug - includes full device fingerprint details
   */
  DEVICE_FINGERPRINT_LOGGED: {
    eventName: 'auth.device.fingerprint.logged',
    eventMessage: 'Device fingerprint logged for security monitoring',
    eventType: 'security' as const,
    source: 'core.auth.device',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * Device fingerprint validation failed event
   * Triggered when device fingerprint validation fails
   * severity: warning - includes user UUID and validation error
   */
  DEVICE_FINGERPRINT_VALIDATION_FAILED: {
    eventName: 'auth.device.fingerprint.validation.failed',
    eventMessage: 'Device fingerprint validation failed',
    eventType: 'security' as const,
    source: 'core.auth.device',
    severity: 'warning' as const,
    version: '1.0.0'
  },

  /**
   * Device fingerprint validation result event
   * Triggered when device fingerprint validation completes
   * severity: debug - includes validation details
   */
  DEVICE_FINGERPRINT_VALIDATION_RESULT: {
    eventName: 'auth.device.fingerprint.validation.result',
    eventMessage: 'Device fingerprint validation result',
    eventType: 'security' as const,
    source: 'core.auth.device',
    severity: 'debug' as const,
    version: '1.0.0'
  }
};

/**
 * Internal System Events
 * Events related to internal authentication system operations
 */
export const AUTH_INTERNAL_EVENTS = {
  
  /**
   * Token limit exceeded event
   * Triggered when user exceeds maximum token limit
   * severity: debug - includes user UUID and token count
   */
  TOKEN_LIMIT_EXCEEDED: {
    eventName: 'auth.internal.token.limit.exceeded',
    eventMessage: 'User exceeded maximum token limit',
    eventType: 'system' as const,
    source: 'core.auth.internal',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * Oldest tokens revoked event
   * Triggered when oldest tokens are revoked to make space
   * severity: debug - includes user UUID and revoked token count
   */
  OLDEST_TOKENS_REVOKED: {
    eventName: 'auth.internal.oldest.tokens.revoked',
    eventMessage: 'Oldest tokens revoked to make space for new token',
    eventType: 'system' as const,
    source: 'core.auth.internal',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * Token limit managed event
   * Triggered when token limit management occurs
   * severity: debug - includes full management details
   */
  TOKEN_LIMIT_MANAGED: {
    eventName: 'auth.internal.token.limit.managed',
    eventMessage: 'Token limit management operation performed',
    eventType: 'system' as const,
    source: 'core.auth.internal',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * Old tokens cleaned event
   * Triggered when old tokens are cleaned up
   * severity: debug - includes cleanup details
   */
  OLD_TOKENS_CLEANED: {
    eventName: 'auth.internal.old.tokens.cleaned',
    eventMessage: 'Old tokens cleaned up from database',
    eventType: 'system' as const,
    source: 'core.auth.internal',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * Token count check event
   * Triggered when checking current token count for user
   * severity: debug - includes user UUID and token count
   */
  TOKEN_COUNT_CHECK: {
    eventName: 'auth.internal.token.count.check',
    eventMessage: 'Checking current token count for user',
    eventType: 'system' as const,
    source: 'core.auth.internal',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * Token revocation needed event
   * Triggered when token revocation is needed to make space
   * severity: debug - includes user UUID and tokens to revoke count
   */
  TOKEN_REVOCATION_NEEDED: {
    eventName: 'auth.internal.token.revocation.needed',
    eventMessage: 'Token revocation needed to make space for new token',
    eventType: 'system' as const,
    source: 'core.auth.internal',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * Token revoked event
   * Triggered when specific token is revoked
   * severity: debug - includes user UUID and token ID
   */
  TOKEN_REVOKED: {
    eventName: 'auth.internal.token.revoked',
    eventMessage: 'Specific token revoked for user',
    eventType: 'system' as const,
    source: 'core.auth.internal',
    severity: 'debug' as const,
    version: '1.0.0'
  }
};

/**
 * Quick access to event names for use in code
 */
export const AUTH_EVENT_NAMES = {
  // Login events
  LOGIN_ATTEMPT: AUTH_LOGIN_EVENTS.LOGIN_ATTEMPT.eventName,
  LOGIN_SUCCESS: AUTH_LOGIN_EVENTS.LOGIN_SUCCESS.eventName,
  LOGIN_FAILED: AUTH_LOGIN_EVENTS.LOGIN_FAILED.eventName,
  LOGIN_BLOCKED: AUTH_LOGIN_EVENTS.LOGIN_BLOCKED.eventName,
  CREDENTIALS_VALIDATION_ATTEMPT: AUTH_LOGIN_EVENTS.CREDENTIALS_VALIDATION_ATTEMPT.eventName,
  CREDENTIALS_VALIDATION_SUCCESS: AUTH_LOGIN_EVENTS.CREDENTIALS_VALIDATION_SUCCESS.eventName,
  DATABASE_QUERY_COMPLETED: AUTH_LOGIN_EVENTS.DATABASE_QUERY_COMPLETED.eventName,
  USER_NOT_FOUND: AUTH_LOGIN_EVENTS.USER_NOT_FOUND.eventName,
  USER_FOUND_PASSWORD_COMPARISON: AUTH_LOGIN_EVENTS.USER_FOUND_PASSWORD_COMPARISON.eventName,
  
  // Logout events
  LOGOUT_ATTEMPT: AUTH_LOGOUT_EVENTS.LOGOUT_ATTEMPT.eventName,
  LOGOUT_FAILED: AUTH_LOGOUT_EVENTS.LOGOUT_FAILED.eventName,
  LOGOUT_PROCESSING_ATTEMPT: AUTH_LOGOUT_EVENTS.LOGOUT_PROCESSING_ATTEMPT.eventName,
  LOGOUT_SUCCESS: AUTH_LOGOUT_EVENTS.LOGOUT_SUCCESS.eventName,
  LOGOUT_REFRESH_TOKEN_EXTRACTION_ATTEMPT: AUTH_LOGOUT_EVENTS.LOGOUT_REFRESH_TOKEN_EXTRACTION_ATTEMPT.eventName,
  LOGOUT_REFRESH_TOKEN_FOUND_COOKIE: AUTH_LOGOUT_EVENTS.LOGOUT_REFRESH_TOKEN_FOUND_COOKIE.eventName,
  LOGOUT_REFRESH_TOKEN_FOUND_BODY: AUTH_LOGOUT_EVENTS.LOGOUT_REFRESH_TOKEN_FOUND_BODY.eventName,
  LOGOUT_REFRESH_TOKEN_NOT_FOUND: AUTH_LOGOUT_EVENTS.LOGOUT_REFRESH_TOKEN_NOT_FOUND.eventName,
  LOGOUT_REFRESH_TOKEN_COOKIE_CLEARED: AUTH_LOGOUT_EVENTS.LOGOUT_REFRESH_TOKEN_COOKIE_CLEARED.eventName,
  LOGOUT_INVALID_REFRESH_TOKEN_FORMAT: AUTH_LOGOUT_EVENTS.LOGOUT_INVALID_REFRESH_TOKEN_FORMAT.eventName,
  LOGOUT_INVALID_REFRESH_TOKEN: AUTH_LOGOUT_EVENTS.LOGOUT_INVALID_REFRESH_TOKEN.eventName,
  LOGOUT_REFRESH_TOKEN_REVOKED: AUTH_LOGOUT_EVENTS.LOGOUT_REFRESH_TOKEN_REVOKED.eventName,
  
  // Token events
  TOKEN_REFRESH_ATTEMPT: AUTH_TOKEN_EVENTS.TOKEN_REFRESH_ATTEMPT.eventName,
  TOKEN_REFRESH_SUCCESS: AUTH_TOKEN_EVENTS.TOKEN_REFRESH_SUCCESS.eventName,
  TOKEN_REFRESH_FAILED: AUTH_TOKEN_EVENTS.TOKEN_REFRESH_FAILED.eventName,
  TOKEN_REFRESH_EXPIRED: AUTH_TOKEN_EVENTS.TOKEN_REFRESH_EXPIRED.eventName,
  TOKEN_ISSUE_ATTEMPT: AUTH_TOKEN_EVENTS.TOKEN_ISSUE_ATTEMPT.eventName,
  TOKEN_ISSUE_SUCCESS: AUTH_TOKEN_EVENTS.TOKEN_ISSUE_SUCCESS.eventName,
  TOKEN_ISSUE_FAILED: AUTH_TOKEN_EVENTS.TOKEN_ISSUE_FAILED.eventName,
  TOKEN_REVOKE_SUCCESS: AUTH_TOKEN_EVENTS.TOKEN_REVOKE_SUCCESS.eventName,
  REFRESH_TOKEN_COOKIE_SET: AUTH_TOKEN_EVENTS.REFRESH_TOKEN_COOKIE_SET.eventName,
  TOKEN_PAIR_GENERATION_ATTEMPT: AUTH_TOKEN_EVENTS.TOKEN_PAIR_GENERATION_ATTEMPT.eventName,
  TOKEN_PAIR_GENERATION_SUCCESS: AUTH_TOKEN_EVENTS.TOKEN_PAIR_GENERATION_SUCCESS.eventName,
  REFRESH_TOKEN_STORAGE_ATTEMPT: AUTH_TOKEN_EVENTS.REFRESH_TOKEN_STORAGE_ATTEMPT.eventName,
  REFRESH_TOKEN_STORAGE_SUCCESS: AUTH_TOKEN_EVENTS.REFRESH_TOKEN_STORAGE_SUCCESS.eventName,
  TOKEN_REFRESH_PROCESSING_ATTEMPT: AUTH_TOKEN_EVENTS.TOKEN_REFRESH_PROCESSING_ATTEMPT.eventName,
  REFRESH_TOKEN_EXTRACTION_ATTEMPT: AUTH_TOKEN_EVENTS.REFRESH_TOKEN_EXTRACTION_ATTEMPT.eventName,
  REFRESH_TOKEN_FOUND_COOKIE: AUTH_TOKEN_EVENTS.REFRESH_TOKEN_FOUND_COOKIE.eventName,
  REFRESH_TOKEN_FOUND_BODY: AUTH_TOKEN_EVENTS.REFRESH_TOKEN_FOUND_BODY.eventName,
  REFRESH_TOKEN_NOT_FOUND: AUTH_TOKEN_EVENTS.REFRESH_TOKEN_NOT_FOUND.eventName,
  NEW_REFRESH_TOKEN_COOKIE_SET: AUTH_TOKEN_EVENTS.NEW_REFRESH_TOKEN_COOKIE_SET.eventName,
  REFRESH_TOKEN_COOKIE_CLEARED: AUTH_TOKEN_EVENTS.REFRESH_TOKEN_COOKIE_CLEARED.eventName,
  DEVICE_FINGERPRINT_EXTRACTED: AUTH_TOKEN_EVENTS.DEVICE_FINGERPRINT_EXTRACTED.eventName,
  INVALID_REFRESH_TOKEN: AUTH_TOKEN_EVENTS.INVALID_REFRESH_TOKEN.eventName,
  
  // Security events
  BRUTE_FORCE_DETECTED: AUTH_SECURITY_EVENTS.BRUTE_FORCE_DETECTED.eventName,
  DEVICE_FINGERPRINT_MISMATCH: AUTH_SECURITY_EVENTS.DEVICE_FINGERPRINT_MISMATCH.eventName,
  INVALID_CREDENTIALS: AUTH_SECURITY_EVENTS.INVALID_CREDENTIALS.eventName,
  DATABASE_ERROR_CREDENTIALS: AUTH_SECURITY_EVENTS.DATABASE_ERROR_CREDENTIALS.eventName,
  TOKEN_LIMIT_MANAGEMENT_ERROR: AUTH_SECURITY_EVENTS.TOKEN_LIMIT_MANAGEMENT_ERROR.eventName,
  REFRESH_TOKEN_STORAGE_ERROR: AUTH_SECURITY_EVENTS.REFRESH_TOKEN_STORAGE_ERROR.eventName,
  TOKEN_PAIR_GENERATION_ERROR: AUTH_SECURITY_EVENTS.TOKEN_PAIR_GENERATION_ERROR.eventName,
  REFRESH_TOKEN_VALIDATION_ERROR: AUTH_SECURITY_EVENTS.REFRESH_TOKEN_VALIDATION_ERROR.eventName,
  USERNAME_RETRIEVAL_ERROR: AUTH_SECURITY_EVENTS.USERNAME_RETRIEVAL_ERROR.eventName,
  DEVICE_FINGERPRINT_MISMATCH_REFRESH: AUTH_SECURITY_EVENTS.DEVICE_FINGERPRINT_MISMATCH_REFRESH.eventName,
  SETTINGS_RETRIEVAL_WARNING: AUTH_SECURITY_EVENTS.SETTINGS_RETRIEVAL_WARNING.eventName,
    LOGOUT_TOKEN_VALIDATION_ERROR: AUTH_SECURITY_EVENTS.LOGOUT_TOKEN_VALIDATION_ERROR.eventName,
  LOGOUT_TOKEN_REVOCATION_ERROR: AUTH_SECURITY_EVENTS.LOGOUT_TOKEN_REVOCATION_ERROR.eventName,
  ACCOUNT_DISABLED: AUTH_SECURITY_EVENTS.ACCOUNT_DISABLED.eventName,
  ACCOUNT_REQUIRES_ACTION: AUTH_SECURITY_EVENTS.ACCOUNT_REQUIRES_ACTION.eventName,
    
    // Device events
  DEVICE_FINGERPRINT_LOGGED: AUTH_DEVICE_EVENTS.DEVICE_FINGERPRINT_LOGGED.eventName,
  DEVICE_FINGERPRINT_VALIDATION_FAILED: AUTH_DEVICE_EVENTS.DEVICE_FINGERPRINT_VALIDATION_FAILED.eventName,
  DEVICE_FINGERPRINT_VALIDATION_RESULT: AUTH_DEVICE_EVENTS.DEVICE_FINGERPRINT_VALIDATION_RESULT.eventName,
  
  // Internal events
  TOKEN_LIMIT_EXCEEDED: AUTH_INTERNAL_EVENTS.TOKEN_LIMIT_EXCEEDED.eventName,
  OLDEST_TOKENS_REVOKED: AUTH_INTERNAL_EVENTS.OLDEST_TOKENS_REVOKED.eventName,
  TOKEN_LIMIT_MANAGED: AUTH_INTERNAL_EVENTS.TOKEN_LIMIT_MANAGED.eventName,
  OLD_TOKENS_CLEANED: AUTH_INTERNAL_EVENTS.OLD_TOKENS_CLEANED.eventName,
  TOKEN_COUNT_CHECK: AUTH_INTERNAL_EVENTS.TOKEN_COUNT_CHECK.eventName,
  TOKEN_REVOCATION_NEEDED: AUTH_INTERNAL_EVENTS.TOKEN_REVOCATION_NEEDED.eventName,
  TOKEN_REVOKED: AUTH_INTERNAL_EVENTS.TOKEN_REVOKED.eventName
} as const; 