/**
 * events.core.controllers.ts - version 1.0.0
 * BACKEND file - Events for core controllers
 * 
 * This file contains event definitions for core controllers domain.
 * It serves as a reference for creating and publishing controller-related events to the event bus.
 * Each event includes standard properties like eventName, eventType, severity, etc.
 * 
 * These events are used to track and react to controller operations
 * such as request handling, validation, and responses.
 */

/**
 * Username By UUID Controller Events
 * Events related to fetching username by UUID controller operations
 */
export const USERNAME_BY_UUID_CONTROLLER_EVENTS = {
  // Request received for username by UUID
  REQUEST_RECEIVED: {
    eventName: 'core.controllers.usernameByUuid.request.received',
    source: 'core controller',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Request received to fetch username by UUID',
    payload: null, // { userId: string, requestPath: string }
    version: '1.0.0'
  },
  
  // Validation error for username by UUID request
  VALIDATION_ERROR: {
    eventName: 'core.controllers.usernameByUuid.validation.error',
    source: 'core controller',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Validation error in username by UUID request',
    payload: null, // { userId: string, request: object }
    errorData: null, // Validation error details
    version: '1.0.0'
  },
  
  // Success response for username by UUID
  RESPONSE_SUCCESS: {
    eventName: 'core.controllers.usernameByUuid.response.success',
    source: 'core controller',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Successfully retrieved username by UUID',
    payload: null, // { userId: string, username: string }
    version: '1.0.0'
  },
  
  // Not found response for username by UUID
  RESPONSE_NOT_FOUND: {
    eventName: 'core.controllers.usernameByUuid.response.notFound',
    source: 'core controller',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'User not found by UUID',
    payload: null, // { userId: string }
    errorData: null, // Not found details
    version: '1.0.0'
  },
  
  // Error response for username by UUID
  RESPONSE_ERROR: {
    eventName: 'core.controllers.usernameByUuid.response.error',
    source: 'core controller',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Error fetching username by UUID',
    payload: null, // { userId: string, errorMessage: string }
    errorData: null, // Error details
    version: '1.0.0'
  }
};
