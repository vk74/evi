/**
 * events.users.list.ts - backend file
 * version: 1.0.0
 * 
 * This file contains event definitions for the users list management domain with server-side processing.
 * It serves as a reference for creating and publishing users list-related events to the event bus.
 * Each event includes standard properties like eventName, eventType, severity, etc.
 * 
 * These events are used to track and react to users list operations
 * such as fetching users lists, deleting users, and cache operations.
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
    payload: null, // Will be of type { count: number, total: number }
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
  
  // When users list data from cache is used
  CACHE_HIT: {
    eventName: 'usersList.fetch.cache.hit',
    source: 'users list admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Using cached users list data',
    payload: null, // Will be of type { cacheKey: string }
    version: '1.0.0'
  },
  
  // When users list data needs to be fetched from database (cache miss)
  CACHE_MISS: {
    eventName: 'usersList.fetch.cache.miss',
    source: 'users list admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Fetching users list from database (cache miss)',
    payload: null, // Will be of type { cacheKey: string, params: IUsersFetchParams }
    version: '1.0.0'
  }
};

/**
 * Users Delete Events
 * Events related to deleting users
 */
export const USERS_DELETE_EVENTS = {
  // When users deletion is completed successfully
  COMPLETE: {
    eventName: 'usersList.delete.complete',
    source: 'users list admin submodule',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Users deleted successfully',
    payload: null, // Will be of type { requested: number, deleted: number }
    version: '1.0.0'
  },
  
  // When a users deletion operation fails
  FAILED: {
    eventName: 'usersList.delete.failed',
    source: 'users list admin submodule',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Failed to delete users',
    payload: null, // Will be of type { userIds: string[], error: ServiceError }
    errorData: null, // Will be filled with error details
    version: '1.0.0'
  },
  
  // When cache is invalidated after user deletion
  CACHE_INVALIDATED: {
    eventName: 'usersList.delete.cache.invalidated',
    source: 'users list admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Cache invalidated after user deletion',
    payload: null, // Will be of type { deletedCount: number }
    version: '1.0.0'
  }
};
