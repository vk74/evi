/**
 * protoEvents.users.list.ts - backend file
 * version: 1.0.0
 * 
 * This file contains event definitions for the prototype users list management domain with server-side processing.
 * It serves as a reference for creating and publishing users list-related events to the event bus.
 * Each event includes standard properties like eventName, eventType, severity, etc.
 * 
 * These events are used to track and react to users list operations
 * such as fetching users lists, deleting users, and cache operations.
 */

/**
 * Users Fetch Events
 * Events related to fetching users list data
 */
export const USERS_FETCH_EVENTS = {
  // When a request to fetch users list is received
  REQUEST_RECEIVED: {
    eventName: 'usersListProto.fetch.request.received',
    source: 'prototype users list admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Proto users list fetch request received',
    payload: null, // Will be of type { search: string, page: number, itemsPerPage: number }
    version: '1.0.0'
  },
  
  // When users list is successfully loaded from the database
  COMPLETE: {
    eventName: 'usersListProto.fetch.complete',
    source: 'prototype users list admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Proto users list data loaded successfully',
    payload: null, // Will be of type { count: number, total: number }
    version: '1.0.0'
  },
  
  // When a users list load operation fails
  FAILED: {
    eventName: 'usersListProto.fetch.failed',
    source: 'prototype users list admin submodule',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Failed to load proto users list data',
    payload: null, // Will be of type { error: ServiceError }
    errorData: null, // Will be filled with error details
    version: '1.0.0'
  },
  
  // When users list data from cache is used
  CACHE_HIT: {
    eventName: 'usersListProto.fetch.cache.hit',
    source: 'prototype users list admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Using cached proto users list data',
    payload: null, // Will be of type { cacheKey: string }
    version: '1.0.0'
  },
  
  // When users list data needs to be fetched from database (cache miss)
  CACHE_MISS: {
    eventName: 'usersListProto.fetch.cache.miss',
    source: 'prototype users list admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Fetching proto users list from database (cache miss)',
    payload: null, // Will be of type { cacheKey: string, params: IUsersFetchParams }
    version: '1.0.0'
  }
};

/**
 * Users Delete Events
 * Events related to deleting users
 */
export const USERS_DELETE_EVENTS = {
  // When a request to delete users is received
  REQUEST_RECEIVED: {
    eventName: 'usersListProto.delete.request.received',
    source: 'prototype users list admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Proto users delete request received',
    payload: null, // Will be of type { userCount: number }
    version: '1.0.0'
  },
  
  // When users deletion is completed successfully
  COMPLETE: {
    eventName: 'usersListProto.delete.complete',
    source: 'prototype users list admin submodule',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Proto users deleted successfully',
    payload: null, // Will be of type { requested: number, deleted: number }
    version: '1.0.0'
  },
  
  // When a users deletion operation fails
  FAILED: {
    eventName: 'usersListProto.delete.failed',
    source: 'prototype users list admin submodule',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Failed to delete proto users',
    payload: null, // Will be of type { userIds: string[], error: ServiceError }
    errorData: null, // Will be filled with error details
    version: '1.0.0'
  },
  
  // When cache is invalidated after user deletion
  CACHE_INVALIDATED: {
    eventName: 'usersListProto.delete.cache.invalidated',
    source: 'prototype users list admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Cache invalidated after proto user deletion',
    payload: null, // Will be of type { deletedCount: number }
    version: '1.0.0'
  }
};

/**
 * Controller Events for Users Fetch
 * Events related to HTTP controller processing for fetching users list
 */
export const USERS_FETCH_CONTROLLER_EVENTS = {
  // When HTTP request is received by controller
  HTTP_REQUEST_RECEIVED: {
    eventName: 'usersListProto.controller.fetch.request.received',
    source: 'prototype users list admin controller',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP request received to fetch proto users list',
    payload: null, // Will be of type { method: string, url: string, query: object }
    version: '1.0.0'
  },
  
  // When controller successfully processes the request and sends response
  HTTP_RESPONSE_SENT: {
    eventName: 'usersListProto.controller.fetch.response.sent',
    source: 'prototype users list admin controller',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP response sent for proto users list data',
    payload: null, // Will be of type { resultCount: number, totalCount: number }
    version: '1.0.0'
  },
  
  // When search query is invalid
  INVALID_SEARCH: {
    eventName: 'usersListProto.controller.fetch.invalid.search',
    source: 'prototype users list admin controller',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Invalid search query (too short) in proto users list',
    payload: null, // Will be of type { search: string }
    version: '1.0.0'
  },
  
  // When controller encounters an error processing the request
  HTTP_ERROR: {
    eventName: 'usersListProto.controller.fetch.error',
    source: 'prototype users list admin controller',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Error in proto users list fetch controller',
    payload: null, // Will be of type { query: object, errorCode: string }
    errorData: null, // Will be filled with error details
    version: '1.0.0'
  }
};

/**
 * Controller Events for Users Delete
 * Events related to HTTP controller processing for deleting users
 */
export const USERS_DELETE_CONTROLLER_EVENTS = {
  // When HTTP request is received by controller
  HTTP_REQUEST_RECEIVED: {
    eventName: 'usersListProto.controller.delete.request.received',
    source: 'prototype users list admin controller',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP request received to delete proto users',
    payload: null, // Will be of type { method: string, url: string, userIds: number }
    version: '1.0.0'
  },
  
  // When controller successfully processes the request and sends response
  HTTP_RESPONSE_SENT: {
    eventName: 'usersListProto.controller.delete.response.sent',
    source: 'prototype users list admin controller',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP response sent for proto users deletion',
    payload: null, // Will be of type { requestedCount: number, actuallyDeleted: number }
    version: '1.0.0'
  },
  
  // When request has invalid parameters
  INVALID_REQUEST: {
    eventName: 'usersListProto.controller.delete.invalid.request',
    source: 'prototype users list admin controller',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Invalid delete request (no valid user IDs) in proto users list',
    payload: null, // Will be null or minimal metadata
    version: '1.0.0'
  },
  
  // When controller encounters an error processing the request
  HTTP_ERROR: {
    eventName: 'usersListProto.controller.delete.error',
    source: 'prototype users list admin controller',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Error in proto users delete controller',
    payload: null, // Will be of type { userIds: number, errorCode: string }
    errorData: null, // Will be filled with error details
    version: '1.0.0'
  }
};
