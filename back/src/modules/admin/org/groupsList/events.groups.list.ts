/**
 * events.groups.list.ts - backend file
 * version: 1.0.1
 * 
 * This file contains event definitions for the groups list management domain.
 * It serves as a reference for creating and publishing groups list-related events to the event bus.
 * Each event includes standard properties like eventName, eventType, severity, etc.
 * 
 * These events are used to track and react to groups list operations
 * such as fetching groups lists, deleting groups, and cache operations.
 */

/**
 * Groups Fetch Controller Events
 * Events related to HTTP request/response handling
 */
export const GROUPS_FETCH_CONTROLLER_EVENTS = {
  // When HTTP request is received
  HTTP_REQUEST_RECEIVED: {
    eventName: 'groupsList.http.request.received',
    source: 'groups list admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP request received for groups list',
    payload: null, // Will be of type { method: string, url: string, query: object }
    version: '1.0.0'
  },

  // When HTTP response is sent
  HTTP_RESPONSE_SENT: {
    eventName: 'groupsList.http.response.sent',
    source: 'groups list admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP response sent for groups list',
    payload: null, // Will be of type { groupCount: number }
    version: '1.0.0'
  },

  // When HTTP error occurs
  HTTP_ERROR: {
    eventName: 'groupsList.http.error',
    source: 'groups list admin submodule',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'HTTP error occurred while processing groups list request',
    payload: null, // Will be of type { errorCode: string }
    errorData: null, // Will be filled with error details
    version: '1.0.0'
  }
};

/**
 * Groups Fetch Events
 * Events related to fetching groups list data
 */
export const GROUPS_FETCH_EVENTS = {
  // When request is received
  REQUEST_RECEIVED: {
    eventName: 'groupsList.fetch.request.received',
    source: 'groups list admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Request received to fetch groups list',
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
  // When deletion is forbidden due to system groups in request
  FORBIDDEN: {
    eventName: 'groupsList.delete.forbidden',
    source: 'groups list admin submodule',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Deletion is forbidden for system groups',
    payload: null, // Will be of type { blockedGroupIds: string[], blockedGroupNames: string[], reason: 'SYSTEM_GROUPS_NOT_DELETABLE' }
    version: '1.0.0'
  },
  // When groups deletion is completed successfully
  COMPLETE: {
    eventName: 'groupsList.delete.complete',
    source: 'groups list admin submodule',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Groups deleted successfully',
    payload: null, // Will be of type { deletedCount: number, deletedGroupIds: string[], deletedGroupNames: string[] }
    version: '1.0.0'
  },
  
  // When there is nothing to delete
  NOOP: {
    eventName: 'groupsList.delete.noop',
    source: 'groups list admin submodule',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Nothing to delete',
    payload: null, // Will be of type { reason: 'NOTHING_TO_DELETE', groupIds: string[] }
    version: '1.0.0'
  },
  
  // When a groups deletion operation fails
  FAILED: {
    eventName: 'groupsList.delete.failed',
    source: 'groups list admin submodule',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Failed to delete groups',
    payload: null, // Will be of type { error: string, groupIds: string[] }
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
    payload: null, // Will be of type {}
    version: '1.0.0'
  },
  
  // When cache fails to be cleared
  CACHE_INVALIDATION_FAILED: {
    eventName: 'groupsList.delete.cache.invalidation.failed',
    source: 'groups list admin submodule',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Cache was not cleared successfully',
    payload: null, // Will be of type {}
    version: '1.0.0'
  }
};