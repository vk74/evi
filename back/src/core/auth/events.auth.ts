/**
 * events.auth.ts - backend file
 * version: 1.0.0
 * Event definitions for authentication operations.
 * Contains event types for login, logout, token management, and security events.
 * 
 * Payload Guidelines:
 * - severity 'info'/'warning'/'error': Only user UUID and basic info
 * - severity 'trace': Full details including IP, device fingerprint, timestamps
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
   * severity: trace - includes full request details
   */
  LOGIN_ATTEMPT: {
    eventName: 'auth.login.attempt',
    eventMessage: 'User login attempt initiated',
    eventType: 'security' as const,
    source: 'core.auth.login',
    severity: 'trace' as const,
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
   * severity: trace - includes full request details
   */
  LOGOUT_ATTEMPT: {
    eventName: 'auth.logout.attempt',
    eventMessage: 'User logout attempt initiated',
    eventType: 'security' as const,
    source: 'core.auth.logout',
    severity: 'trace' as const,
    version: '1.0.0'
  },

  /**
   * Successful logout event
   * Triggered when user successfully logs out
   * severity: info - includes only user UUID
   */
  LOGOUT_SUCCESS: {
    eventName: 'auth.logout.success',
    eventMessage: 'User logout successful',
    eventType: 'security' as const,
    source: 'core.auth.logout',
    severity: 'info' as const,
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
   * severity: trace - includes full request details
   */
  TOKEN_REFRESH_ATTEMPT: {
    eventName: 'auth.token.refresh.attempt',
    eventMessage: 'Token refresh attempt initiated',
    eventType: 'security' as const,
    source: 'core.auth.token.refresh',
    severity: 'trace' as const,
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
   * severity: trace - includes full request details
   */
  TOKEN_ISSUE_ATTEMPT: {
    eventName: 'auth.token.issue.attempt',
    eventMessage: 'Token issuance attempt initiated',
    eventType: 'security' as const,
    source: 'core.auth.token.issue',
    severity: 'trace' as const,
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
   * severity: trace - includes full device fingerprint details
   */
  DEVICE_FINGERPRINT_LOGGED: {
    eventName: 'auth.device.fingerprint.logged',
    eventMessage: 'Device fingerprint logged for security monitoring',
    eventType: 'security' as const,
    source: 'core.auth.device',
    severity: 'trace' as const,
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
   * severity: trace - includes validation details
   */
  DEVICE_FINGERPRINT_VALIDATION_RESULT: {
    eventName: 'auth.device.fingerprint.validation.result',
    eventMessage: 'Device fingerprint validation result',
    eventType: 'security' as const,
    source: 'core.auth.device',
    severity: 'trace' as const,
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
   * severity: trace - includes full management details
   */
  TOKEN_LIMIT_MANAGED: {
    eventName: 'auth.internal.token.limit.managed',
    eventMessage: 'Token limit management operation performed',
    eventType: 'system' as const,
    source: 'core.auth.internal',
    severity: 'trace' as const,
    version: '1.0.0'
  },

  /**
   * Old tokens cleaned event
   * Triggered when old tokens are cleaned up
   * severity: trace - includes cleanup details
   */
  OLD_TOKENS_CLEANED: {
    eventName: 'auth.internal.old.tokens.cleaned',
    eventMessage: 'Old tokens cleaned up from database',
    eventType: 'system' as const,
    source: 'core.auth.internal',
    severity: 'trace' as const,
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
  
  // Logout events
  LOGOUT_ATTEMPT: AUTH_LOGOUT_EVENTS.LOGOUT_ATTEMPT.eventName,
  LOGOUT_SUCCESS: AUTH_LOGOUT_EVENTS.LOGOUT_SUCCESS.eventName,
  LOGOUT_FAILED: AUTH_LOGOUT_EVENTS.LOGOUT_FAILED.eventName,
  
  // Token events
  TOKEN_REFRESH_ATTEMPT: AUTH_TOKEN_EVENTS.TOKEN_REFRESH_ATTEMPT.eventName,
  TOKEN_REFRESH_SUCCESS: AUTH_TOKEN_EVENTS.TOKEN_REFRESH_SUCCESS.eventName,
  TOKEN_REFRESH_FAILED: AUTH_TOKEN_EVENTS.TOKEN_REFRESH_FAILED.eventName,
  TOKEN_REFRESH_EXPIRED: AUTH_TOKEN_EVENTS.TOKEN_REFRESH_EXPIRED.eventName,
  TOKEN_ISSUE_ATTEMPT: AUTH_TOKEN_EVENTS.TOKEN_ISSUE_ATTEMPT.eventName,
  TOKEN_ISSUE_SUCCESS: AUTH_TOKEN_EVENTS.TOKEN_ISSUE_SUCCESS.eventName,
  TOKEN_ISSUE_FAILED: AUTH_TOKEN_EVENTS.TOKEN_ISSUE_FAILED.eventName,
  TOKEN_REVOKE_SUCCESS: AUTH_TOKEN_EVENTS.TOKEN_REVOKE_SUCCESS.eventName,
  
  // Security events
  BRUTE_FORCE_DETECTED: AUTH_SECURITY_EVENTS.BRUTE_FORCE_DETECTED.eventName,
  DEVICE_FINGERPRINT_MISMATCH: AUTH_SECURITY_EVENTS.DEVICE_FINGERPRINT_MISMATCH.eventName,
  INVALID_CREDENTIALS: AUTH_SECURITY_EVENTS.INVALID_CREDENTIALS.eventName,
  
  // Device events
  DEVICE_FINGERPRINT_LOGGED: AUTH_DEVICE_EVENTS.DEVICE_FINGERPRINT_LOGGED.eventName,
  DEVICE_FINGERPRINT_VALIDATION_FAILED: AUTH_DEVICE_EVENTS.DEVICE_FINGERPRINT_VALIDATION_FAILED.eventName,
  DEVICE_FINGERPRINT_VALIDATION_RESULT: AUTH_DEVICE_EVENTS.DEVICE_FINGERPRINT_VALIDATION_RESULT.eventName,
  
  // Internal events
  TOKEN_LIMIT_EXCEEDED: AUTH_INTERNAL_EVENTS.TOKEN_LIMIT_EXCEEDED.eventName,
  OLDEST_TOKENS_REVOKED: AUTH_INTERNAL_EVENTS.OLDEST_TOKENS_REVOKED.eventName,
  TOKEN_LIMIT_MANAGED: AUTH_INTERNAL_EVENTS.TOKEN_LIMIT_MANAGED.eventName,
  OLD_TOKENS_CLEANED: AUTH_INTERNAL_EVENTS.OLD_TOKENS_CLEANED.eventName
} as const; 