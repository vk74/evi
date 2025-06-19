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
