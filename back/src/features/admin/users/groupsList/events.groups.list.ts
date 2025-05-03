/**
 * events.groups.list.ts - backend file
 * version: 1.0.0
 * 
 * This file contains event definitions for the groups list management domain.
 * It serves as a reference for creating and publishing groups list-related events to the event bus.
 * Each event includes standard properties like eventName, eventType, severity, etc.
 * 
 * These events are used to track and react to groups list operations
 * such as fetching groups lists, deleting groups, and cache operations.
 */

/**
 * Groups Fetch Events
 * Events related to fetching groups list data
 */
export const GROUPS_FETCH_EVENTS = {
  // When a request to fetch groups list is received
  REQUEST_RECEIVED: {
    eventName: 'groupsList.fetch.request.received',
    source: 'groups list admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Groups list fetch request received',
    payload: null, // Will be of type { requestorUuid: string }
    version: '1.0.0'
  },
  
  // When groups list is successfully loaded from the database
  COMPLETE: {
    eventName: 'groupsList.fetch.complete',
    source: 'groups list admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Groups list data loaded successfully',
    payload: null, // Will be of type { count: number, requestorUuid: string }
    version: '1.0.0'
  },
  
  // When a groups list load operation fails
  FAILED: {
    eventName: 'groupsList.fetch.failed',
    source: 'groups list admin submodule',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Failed to load groups list data',
    payload: null, // Will be of type { error: ServiceError }
    errorData: null, // Will be filled with error details
    version: '1.0.0'
  },
  
  // When groups list data from cache is used
  CACHE_HIT: {
    eventName: 'groupsList.fetch.cache.hit',
    source: 'groups list admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Using cached groups list data',
    payload: null, // Will be of type { requestorUuid: string, groupCount: number }
    version: '1.0.0'
  },
  
  // When groups list data needs to be fetched from database (cache miss)
  CACHE_MISS: {
    eventName: 'groupsList.fetch.cache.miss',
    source: 'groups list admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Fetching groups list from database (cache miss)',
    payload: null, // Will be of type { requestorUuid: string }
    version: '1.0.0'
  }
};

/**
 * Groups Delete Events
 * Events related to deleting groups
 */
export const GROUPS_DELETE_EVENTS = {
  // When a request to delete groups is received
  REQUEST_RECEIVED: {
    eventName: 'groupsList.delete.request.received',
    source: 'groups list admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Groups delete request received',
    payload: null, // Will be of type { groupIds: string[], requestorUuid: string }
    version: '1.0.0'
  },
  
  // When groups deletion is completed successfully
  COMPLETE: {
    eventName: 'groupsList.delete.complete',
    source: 'groups list admin submodule',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Groups deleted successfully',
    payload: null, // Will be of type { deletedCount: number, requestorUuid: string }
    version: '1.0.0'
  },
  
  // When a groups deletion operation fails
  FAILED: {
    eventName: 'groupsList.delete.failed',
    source: 'groups list admin submodule',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Failed to delete groups',
    payload: null, // Will be of type { error: string }
    errorData: null, // Will be filled with error details
    version: '1.0.0'
  },
  
  // When cache is invalidated after group deletion
  CACHE_INVALIDATED: {
    eventName: 'groupsList.delete.cache.invalidated',
    source: 'groups list admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Cache invalidated after group deletion',
    payload: null, // Will be of type { requestorUuid: string }
    version: '1.0.0'
  },
  
  // When cache fails to be cleared
  CACHE_INVALIDATION_FAILED: {
    eventName: 'groupsList.delete.cache.invalidation.failed',
    source: 'groups list admin submodule',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Cache was not cleared successfully',
    payload: null, // Will be of type { requestorUuid: string }
    version: '1.0.0'
  }
};

/**
 * Controller Events for Groups Fetch
 * Events related to HTTP controller processing for fetching groups list
 */
export const GROUPS_FETCH_CONTROLLER_EVENTS = {
  // When HTTP request is received by controller
  HTTP_REQUEST_RECEIVED: {
    eventName: 'groupsList.controller.fetch.request.received',
    source: 'groups list admin controller',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP request received to fetch groups list',
    payload: null, // Will be of type { method: string, url: string, query: object }
    version: '1.0.0'
  },
  
  // When controller successfully processes the request and sends response
  HTTP_RESPONSE_SENT: {
    eventName: 'groupsList.controller.fetch.response.sent',
    source: 'groups list admin controller',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP response sent for groups list data',
    payload: null, // Will be of type { groupCount: number }
    version: '1.0.0'
  },
  
  // When controller encounters an error processing the request
  HTTP_ERROR: {
    eventName: 'groupsList.controller.fetch.error',
    source: 'groups list admin controller',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Error in groups list fetch controller',
    payload: null, // Will be of type { errorCode: string }
    errorData: null, // Will be filled with error details
    version: '1.0.0'
  }
};

/**
 * Controller Events for Groups Delete
 * Events related to HTTP controller processing for deleting groups
 */
export const GROUPS_DELETE_CONTROLLER_EVENTS = {
  // When HTTP request is received by controller
  HTTP_REQUEST_RECEIVED: {
    eventName: 'groupsList.controller.delete.request.received',
    source: 'groups list admin controller',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP request received to delete groups',
    payload: null, // Will be of type { method: string, url: string, body: object }
    version: '1.0.0'
  },
  
  // When controller successfully processes the request and sends response
  HTTP_RESPONSE_SENT: {
    eventName: 'groupsList.controller.delete.response.sent',
    source: 'groups list admin controller',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP response sent for groups deletion',
    payload: null, // Will be of type { deletedCount: number }
    version: '1.0.0'
  },
  
  // When request has invalid parameters
  INVALID_REQUEST: {
    eventName: 'groupsList.controller.delete.invalid.request',
    source: 'groups list admin controller',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Invalid delete request (no valid group IDs)',
    payload: null, // Will be null or contain error details
    version: '1.0.0'
  },
  
  // When controller encounters an error processing the request
  HTTP_ERROR: {
    eventName: 'groupsList.controller.delete.error',
    source: 'groups list admin controller',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Error in groups delete controller',
    payload: null, // Will be of type { error: string }
    errorData: null, // Will be filled with error details
    version: '1.0.0'
  }
};