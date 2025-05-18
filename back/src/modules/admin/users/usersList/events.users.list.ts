/**
 * events.users.list.ts - backend file
 * version: 1.0.01
 * 
 * This file contains event definitions for the users list management domain.
 * It serves as a reference for creating and publishing users list-related events to the event bus.
 * Each event includes standard properties like eventName, eventType, severity, etc.
 * 
 * These events are used to track and react to users list operations
 * such as fetching users lists, deleting users, cache operations, and cache refresh operations.
 */

/**
 * Users Fetch Events
 * Events related to fetching users list data
 */
export const USERS_FETCH_EVENTS = {
  // When a request to fetch users list is received
  REQUEST_RECEIVED: {
    eventName: 'usersList.fetch.request.received',
    source: 'users list admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Users list fetch request received',
    payload: null, // Will be of type { requestorUuid: string, refresh: boolean }
    version: '1.0.1'
  },
  
  // When users list is successfully loaded from the database
  COMPLETE: {
    eventName: 'usersList.fetch.complete',
    source: 'users list admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Users list data loaded successfully',
    payload: null, // Will be of type { count: number, requestorUuid: string }
    version: '1.0.0'
  },
  
  // When a users list load operation fails
  FAILED: {
    eventName: 'usersList.fetch.failed',
    source: 'users list admin submodule',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Failed to load users list data',
    payload: null, // Will be of type { error: ServiceError }
    errorData: null, // Will be filled with error details
    version: '1.0.0'
  },
  
  // When accessing cached users list data
  CACHE_HIT: {
    eventName: 'usersList.cache.hit',
    source: 'users list admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Using cached users list data',
    payload: null, // Will be of type { requestorUuid: string }
    version: '1.0.0'
  },
  
  // When cache is empty or invalid and DB must be queried
  CACHE_MISS: {
    eventName: 'usersList.cache.miss',
    source: 'users list admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Users list cache miss, querying database',
    payload: null, // Will be of type { requestorUuid: string }
    version: '1.0.0'
  },
  
  // When cache is updated with fresh data
  CACHE_UPDATE: {
    eventName: 'usersList.cache.update',
    source: 'users list admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Users list cache updated with fresh data',
    payload: null, // Will be of type { count: number }
    version: '1.0.0'
  },
  
  // When cache is invalidated (timeout or manual clear)
  CACHE_INVALIDATE: {
    eventName: 'usersList.cache.invalidate',
    source: 'users list admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Users list cache invalidated',
    payload: null, // Will be of type { reason: string, requestorUuid?: string }
    version: '1.0.1'
  }
};

/**
 * Users Delete Events
 * Events related to user deletion operations
 */
export const USERS_DELETE_EVENTS = {
  // When a request to delete users is received
  REQUEST_RECEIVED: {
    eventName: 'usersList.delete.request.received',
    source: 'users list admin submodule',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Request to delete users received',
    payload: null, // Will be of type { userIds: string[], requestorUuid: string }
    version: '1.0.0'
  },
  
  // When validation errors occur
  VALIDATION_FAILED: {
    eventName: 'usersList.delete.validation.failed',
    source: 'users list admin submodule',
    eventType: 'app' as const,
    severity: 'warn' as const,
    eventMessage: 'Users deletion request validation failed',
    payload: null, // Will contain validation error details
    version: '1.0.0'
  },
  
  // When the delete operation is completed successfully
  COMPLETE: {
    eventName: 'usersList.delete.complete',
    source: 'users list admin submodule',
    eventType: 'app' as const, 
    severity: 'info' as const,
    eventMessage: 'Users successfully deleted',
    payload: null, // Will be of type { deletedCount: number, requestorUuid: string }
    version: '1.0.0'
  },
  
  // When the delete operation fails
  FAILED: {
    eventName: 'usersList.delete.failed',
    source: 'users list admin submodule',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Failed to delete users',
    payload: null, // Will be of type { error: ServiceError }
    errorData: null, // Will be filled with error details
    version: '1.0.0'
  },
  
  // When cache is invalidated after successful deletion
  CACHE_INVALIDATE: {
    eventName: 'usersList.delete.cache.invalidate',
    source: 'users list admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Users list cache invalidated after deletion',
    payload: null,
    version: '1.0.0'
  }
};

/**
 * HTTP Controller Events for Users Fetch
 */
export const USERS_FETCH_CONTROLLER_EVENTS = {
  // When an HTTP request is received by the controller
  HTTP_REQUEST_RECEIVED: {
    eventName: 'usersList.controller.fetch.request.received',
    source: 'users list controller',
    eventType: 'http' as const,
    severity: 'debug' as const,
    eventMessage: 'Users list HTTP fetch request received',
    payload: null, // Will contain request details including refresh parameter
    version: '1.0.1'
  },
  
  // When an HTTP response is sent by the controller
  HTTP_RESPONSE_SENT: {
    eventName: 'usersList.controller.fetch.response.sent',
    source: 'users list controller',
    eventType: 'http' as const,
    severity: 'debug' as const,
    eventMessage: 'Users list HTTP fetch response sent',
    payload: null, // Will contain high-level response info
    version: '1.0.0'
  },
  
  // When an HTTP error response is sent by the controller
  HTTP_ERROR_SENT: {
    eventName: 'usersList.controller.fetch.error.sent',
    source: 'users list controller',
    eventType: 'http' as const,
    severity: 'error' as const,
    eventMessage: 'Users list HTTP fetch error response sent',
    payload: null, // Will contain error details
    errorData: null, // Will be filled with error details
    version: '1.0.0'
  }
};

/**
 * HTTP Controller Events for Users Delete
 */
export const USERS_DELETE_CONTROLLER_EVENTS = {
  // When an HTTP request to delete users is received
  HTTP_REQUEST_RECEIVED: {
    eventName: 'usersList.controller.delete.request.received',
    source: 'users list controller',
    eventType: 'http' as const,
    severity: 'debug' as const,
    eventMessage: 'Users delete HTTP request received',
    payload: null, // Will contain request details
    version: '1.0.0'
  },
  
  // When an HTTP response for delete operation is sent
  HTTP_RESPONSE_SENT: {
    eventName: 'usersList.controller.delete.response.sent',
    source: 'users list controller',
    eventType: 'http' as const,
    severity: 'debug' as const,
    eventMessage: 'Users delete HTTP response sent',
    payload: null, // Will contain high-level response info
    version: '1.0.0'
  },
  
  // When an HTTP error response for delete operation is sent
  HTTP_ERROR_SENT: {
    eventName: 'usersList.controller.delete.error.sent',
    source: 'users list controller',
    eventType: 'http' as const,
    severity: 'error' as const,
    eventMessage: 'Users delete HTTP error response sent',
    payload: null, // Will contain error details
    errorData: null, // Will be filled with error details
    version: '1.0.0'
  }
};
