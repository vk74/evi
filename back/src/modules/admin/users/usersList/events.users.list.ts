/**
 * events.users.list.ts - backend file
 * version: 1.0.02
 * 
 * This file contains event definitions for the users list management domain.
 * It serves as a reference for creating and publishing users list-related events to the event bus.
 * Each event includes standard properties like eventName, eventType, severity, etc.
 * 
 * These events are used to track and react to users list operations
 * such as fetching users lists, deleting users, cache operations, and cache refresh operations.
 * 
 * Note: HTTP request/response events are now handled by the universal connection handler.
 */

/**
 * Users Fetch Events
 * Events related to fetching users list data
 */
export const USERS_FETCH_EVENTS = {
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
