/**
 * events.middleware.ts - backend file
 * version: 1.0.0
 * 
 * This file contains event definitions for the middleware domain.
 * It serves as a reference for creating and publishing middleware-related events to the event bus.
 * Each event includes standard properties like eventName, eventType, severity, etc.
 * 
 * These events are used to track and react to middleware operations
 * such as request handling, validation, and responses.
 */

/**
 * Username By UUID Events
 * Events related to fetching username by UUID operations
 */
export const USERNAME_BY_UUID_EVENTS = {
  // Request received for username by UUID
  REQUEST_RECEIVED: {
    eventName: 'middleware.usernameByUuid.request.received',
    source: 'middleware controller',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Request received to fetch username by UUID',
    payload: null, // { userId: string, requestPath: string }
    version: '1.0.0'
  },
  
  // Validation error for username by UUID request
  VALIDATION_ERROR: {
    eventName: 'middleware.usernameByUuid.validation.error',
    source: 'middleware controller',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Validation error in username by UUID request',
    payload: null, // { userId: string, request: object }
    errorData: null, // Validation error details
    version: '1.0.0'
  },
  
  // Success response for username by UUID
  RESPONSE_SUCCESS: {
    eventName: 'middleware.usernameByUuid.response.success',
    source: 'middleware controller',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Successfully retrieved username by UUID',
    payload: null, // { userId: string, username: string }
    version: '1.0.0'
  },
  
  // Not found response for username by UUID
  RESPONSE_NOT_FOUND: {
    eventName: 'middleware.usernameByUuid.response.notFound',
    source: 'middleware controller',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'User not found by UUID',
    payload: null, // { userId: string }
    errorData: null, // Not found details
    version: '1.0.0'
  },
  
  // Error response for username by UUID
  RESPONSE_ERROR: {
    eventName: 'middleware.usernameByUuid.response.error',
    source: 'middleware controller',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Error fetching username by UUID',
    payload: null, // { userId: string, errorMessage: string }
    errorData: null, // Error details
    version: '1.0.0'
  }
}; 