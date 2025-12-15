/**
 * @file events.authorization.ts
 * Version: 1.1.0
 * Event definitions for authorization operations (RBAC/ABAC).
 * Backend file.
 * 
 * Changes in v1.1.0:
 * - Removed redundant load events (start/success)
 * - Updated eventType to 'authorization'
 * - Enhanced error event payload
 */

/**
 * Permission Service Events
 */
export const PERMISSION_SERVICE_EVENTS = {
  LOAD_ERROR: {
    eventName: 'authorization.permissions.load.error',
    source: 'permission service',
    eventType: 'authorization' as const,
    severity: 'error' as const,
    eventMessage: 'Error loading system permissions',
    payload: null, // { error, attemptedAt }
    version: '1.0.0'
  }
};

/**
 * Permission Check Events (Guard)
 */
export const PERMISSION_CHECK_EVENTS = {
  CHECK_ACCESS_DENIED: {
    eventName: 'authorization.check.denied',
    source: 'permission guard',
    eventType: 'authorization' as const,
    severity: 'warning' as const,
    eventMessage: 'Access denied: insufficient permissions',
    // Payload should answer: WHO tried to do WHAT on WHICH resource and WHY it failed
    payload: null, // { userUuid, requiredPermission, method, path, ip, resourceId? }
    version: '1.1.0'
  },

  CHECK_ACCESS_GRANTED: {
    eventName: 'authorization.check.granted',
    source: 'permission guard',
    eventType: 'authorization' as const,
    severity: 'debug' as const, // Debug severity as this is a high-volume event
    eventMessage: 'Access granted',
    // Payload should answer: WHO was granted access to WHAT on WHICH resource
    payload: null, // { userUuid, permission, scope, method, path, resourceId? }
    version: '1.1.0'
  },
  
  CHECK_ERROR: {
    eventName: 'authorization.check.error',
    source: 'permission guard',
    eventType: 'authorization' as const,
    severity: 'error' as const,
    eventMessage: 'Error checking permissions',
    payload: null, // { error, userUuid, requiredPermission, method, path }
    version: '1.1.0'
  }
};
