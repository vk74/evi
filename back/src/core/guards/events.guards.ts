/**
 * events.guards.ts - backend file
 * version: 1.1.0
 * 
 * This file contains event definitions for the guards domain.
 * Events for JWT validation, user status checking, request security, and rate limiting guards.
 * 
 * Changes in v1.1.0:
 * - Added rate limit guard events (CONFIG_INITIALIZATION_FAILED, LIMIT_EXCEEDED)
 */

/**
 * Check User Status Active Events
 * Events for tracking user status checking operations
 */
export const CHECK_USER_STATUS_ACTIVE_EVENTS = {
  // Missing user_id from JWT
  MISSING_USER_ID: {
    eventName: 'guards.check.user.status.active.missing_user_id',
    source: 'user status active guard',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'User status check failed: Missing user_id from JWT',
    payload: null, // { requestInfo }
    version: '1.0.0'
  },
  
  // User not found in database
  USER_NOT_FOUND: {
    eventName: 'guards.check.user.status.active.user_not_found',
    source: 'user status active guard',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'User status check failed: User not found in database',
    payload: null, // { userId }
    version: '1.0.0'
  },
  
  // Account is disabled
  ACCOUNT_DISABLED: {
    eventName: 'guards.check.user.status.active.account_disabled',
    source: 'user status active guard',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'User status check failed: Account is disabled',
    payload: null, // { userId }
    version: '1.0.0'
  },
  
  // Database error
  DATABASE_ERROR: {
    eventName: 'guards.check.user.status.active.database_error',
    source: 'user status active guard',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Error checking user activity status',
    payload: null, // { userId, error }
    errorData: null, // Error details
    version: '1.0.0'
  }
};

/**
 * JWT Validation Events
 * Events for tracking JWT validation operations
 */
export const JWT_VALIDATION_EVENTS = {
  // Missing authorization header
  MISSING_AUTHORIZATION_HEADER: {
    eventName: 'guards.jwt.validation.missing_authorization_header',
    source: 'JWT validation guard',
    eventType: 'security' as const,
    severity: 'warning' as const,
    eventMessage: 'JWT validation failed: Authorization header is missing',
    payload: null, // { requestInfo }
    version: '1.0.0'
  },
  
  // Missing or invalid token
  MISSING_OR_INVALID_TOKEN: {
    eventName: 'guards.jwt.validation.missing_or_invalid_token',
    source: 'JWT validation guard',
    eventType: 'security' as const,
    severity: 'warning' as const,
    eventMessage: 'JWT validation failed: Token is missing or invalid',
    payload: null, // { requestInfo }
    version: '1.0.0'
  },
  
  // JWT validation successful
  VALIDATION_SUCCESS: {
    eventName: 'guards.jwt.validation.success',
    source: 'JWT validation guard',
    eventType: 'security' as const,
    severity: 'debug' as const,
    eventMessage: 'JWT validation successful for user',
    payload: null, // { username, userUuid }
    version: '1.0.0'
  },
  
  // JWT validation failed
  VALIDATION_FAILED: {
    eventName: 'guards.jwt.validation.failed',
    source: 'JWT validation guard',
    eventType: 'security' as const,
    severity: 'warning' as const,
    eventMessage: 'JWT validation failed',
    payload: null, // { error }
    errorData: null, // Error details
    version: '1.0.0'
  }
};

/**
 * Request Security Guard Events
 * Events for tracking hard-pattern request security checks
 */
export const REQUEST_SECURITY_GUARD_EVENTS = {
  // Request blocked by hard security rule
  BLOCKED: {
    eventName: 'guards.request.security.hard.blocked',
    source: 'request security hard guard',
    eventType: 'security' as const,
    severity: 'error' as const,
    eventMessage: 'Request blocked by hard security rule',
    payload: null, // { rule, location, method, url, contentType }
    version: '1.0.0'
  },

  // Internal error inside guard
  ERROR: {
    eventName: 'guards.request.security.hard.error',
    source: 'request security hard guard',
    eventType: 'security' as const,
    severity: 'error' as const,
    eventMessage: 'Error occurred in request security guard',
    payload: null, // { method, url }
    errorData: null, // Error details
    version: '1.0.0'
  }
};

/**
 * Rate Limit Guard Events
 * Events for tracking rate limiting operations
 * 
 * Note: LIMIT_EXCEEDED event removed to prevent performance degradation during DDoS attacks.
 * Only critical configuration errors are logged via event bus.
 */
export const RATE_LIMIT_GUARD_EVENTS = {
  // Config initialization failed - critical error
  CONFIG_INITIALIZATION_FAILED: {
    eventName: 'guards.rate.limit.config_initialization_failed',
    source: 'rate limit guard',
    eventType: 'security' as const,
    severity: 'error' as const,
    eventMessage: 'Failed to initialize rate limit configuration from application settings',
    payload: null, // { missingSettings: string[], error: string }
    errorData: null, // Error details
    version: '1.0.0'
  }
};
