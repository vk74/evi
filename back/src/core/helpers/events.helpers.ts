/**
 * @file events.helpers.ts
 * @version 1.0.0
 * @description Backend file. Contains event definitions for helper services.
 * These events track various helper operations including cache operations,
 * user/group existence checks, and other utility functions.
 */

/**
 * Cache Helper Events
 * Events for tracking cache operations in helpers
 */
export const CACHE_HELPER_EVENTS = {
  // When cache is initialized successfully
  INIT_SUCCESS: {
    eventName: 'helpers.cache.init',
    source: 'helpers cache service',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Helper cache initialized successfully',
    payload: null, // Will contain: { cacheTypes, config }
    version: '1.0.0'
  },

  // When cache statistics are logged
  STATS_REPORT: {
    eventName: 'helpers.cache.stats',
    source: 'helpers cache service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Helper cache statistics report',
    payload: null, // Will contain: { stats }
    version: '1.0.0'
  }
};

/**
 * Group Existence Check Events
 * Events for tracking group existence checks
 */
export const GROUP_EXISTS_EVENTS = {
  // When group existence check starts
  START: {
    eventName: 'helpers.group.exists.start',
    source: 'helpers group exists service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Checking if group exists',
    payload: null, // Will contain: { uuid }
    version: '1.0.0'
  },

  // When group is found in database
  FOUND: {
    eventName: 'helpers.group.exists.found',
    source: 'helpers group exists service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Group found in database',
    payload: null, // Will contain: { uuid, exists: true }
    version: '1.0.0'
  },

  // When group is not found in database
  NOT_FOUND: {
    eventName: 'helpers.group.exists.not_found',
    source: 'helpers group exists service',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Group not found in database',
    payload: null, // Will contain: { uuid, exists: false }
    version: '1.0.0'
  },

  // When error occurs during group existence check
  ERROR: {
    eventName: 'helpers.group.exists.error',
    source: 'helpers group exists service',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Error checking group existence',
    payload: null, // Will contain: { uuid, error }
    version: '1.0.0'
  }
};

/**
 * User Existence Check Events
 * Events for tracking user existence checks
 */
export const USER_EXISTS_EVENTS = {
  // When user existence check starts
  START: {
    eventName: 'helpers.user.exists.start',
    source: 'helpers user exists service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Checking if user exists',
    payload: null, // Will contain: { uuid }
    version: '1.0.0'
  },

  // When user is found in database
  FOUND: {
    eventName: 'helpers.user.exists.found',
    source: 'helpers user exists service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'User found in database',
    payload: null, // Will contain: { uuid, exists: true }
    version: '1.0.0'
  },

  // When user is not found in database
  NOT_FOUND: {
    eventName: 'helpers.user.exists.not_found',
    source: 'helpers user exists service',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'User not found in database',
    payload: null, // Will contain: { uuid, exists: false }
    version: '1.0.0'
  },

  // When error occurs during user existence check
  ERROR: {
    eventName: 'helpers.user.exists.error',
    source: 'helpers user exists service',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Error checking user existence',
    payload: null, // Will contain: { uuid, error }
    version: '1.0.0'
  }
};

/**
 * Get UUID by Username Events
 * Events for tracking UUID retrieval by username
 */
export const GET_UUID_BY_USERNAME_EVENTS = {
  // When UUID search by username starts
  START: {
    eventName: 'helpers.get.uuid.by.username.start',
    source: 'helpers get uuid by username service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Getting UUID for username',
    payload: null, // Will contain: { username }
    version: '1.0.0'
  },

  // When user is not found in database
  NOT_FOUND: {
    eventName: 'helpers.get.uuid.by.username.not_found',
    source: 'helpers get uuid by username service',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'User not found in database',
    payload: null, // Will contain: { username, found: false }
    version: '1.0.0'
  },

  // When UUID is successfully found
  SUCCESS: {
    eventName: 'helpers.get.uuid.by.username.success',
    source: 'helpers get uuid by username service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'UUID found for user',
    payload: null, // Will contain: { username, uuid }
    version: '1.0.0'
  },

  // When error occurs during UUID retrieval
  ERROR: {
    eventName: 'helpers.get.uuid.by.username.error',
    source: 'helpers get uuid by username service',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Error getting user UUID',
    payload: null, // Will contain: { username, error }
    version: '1.0.0'
  }
};

/**
 * Get Groupname by UUID Events
 * Events for tracking group name retrieval by UUID
 */
export const GET_GROUPNAME_BY_UUID_EVENTS = {
  // When group name retrieval starts
  START: {
    eventName: 'helpers.get.groupname.by.uuid.start',
    source: 'helpers get groupname by uuid service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Getting group name by UUID',
    payload: null, // Will contain: { uuid }
    version: '1.0.0'
  },

  // When group name retrieved from cache
  SUCCESS_CACHE: {
    eventName: 'helpers.get.groupname.by.uuid.success_cache',
    source: 'helpers get groupname by uuid service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Group name retrieved from cache',
    payload: null, // Will contain: { uuid, groupname, source: 'cache' }
    version: '1.0.0'
  },

  // When group not found
  NOT_FOUND: {
    eventName: 'helpers.get.groupname.by.uuid.not_found',
    source: 'helpers get groupname by uuid service',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Group not found with UUID',
    payload: null, // Will contain: { uuid }
    version: '1.0.0'
  },

  // When group name retrieved from database
  SUCCESS_DB: {
    eventName: 'helpers.get.groupname.by.uuid.success_db',
    source: 'helpers get groupname by uuid service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Group name retrieved from database',
    payload: null, // Will contain: { uuid, groupname, source: 'database' }
    version: '1.0.0'
  },

  // When error occurs during group name retrieval
  ERROR: {
    eventName: 'helpers.get.groupname.by.uuid.error',
    source: 'helpers get groupname by uuid service',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Error getting group name by UUID',
    payload: null, // Will contain: { uuid, error }
    version: '1.0.0'
  }
};

/**
 * Check Is User Admin Events
 * Events for tracking user admin status checks
 */
export const CHECK_IS_USER_ADMIN_EVENTS = {
  // When admin status check starts
  START: {
    eventName: 'helpers.check.is.user.admin.start',
    source: 'helpers check is user admin service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Checking if user is an administrator',
    payload: null, // Will contain: { userId }
    version: '1.0.0'
  },

  // When admin status retrieved from cache
  SUCCESS_CACHE: {
    eventName: 'helpers.check.is.user.admin.success_cache',
    source: 'helpers check is user admin service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Admin status retrieved from cache',
    payload: null, // Will contain: { userId, isAdmin, source: 'cache' }
    version: '1.0.0'
  },

  // When administrators group not found
  GROUP_NOT_FOUND: {
    eventName: 'helpers.check.is.user.admin.group_not_found',
    source: 'helpers check is user admin service',
    eventType: 'app' as const,
    severity: 'warn' as const,
    eventMessage: 'Administrators group not found in the system',
    payload: null, // Will contain: { administratorsGroupName }
    version: '1.0.0'
  },

  // When user is confirmed as administrator
  USER_IS_ADMIN: {
    eventName: 'helpers.check.is.user.admin.user_is_admin',
    source: 'helpers check is user admin service',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'User is an administrator',
    payload: null, // Will contain: { userId, groupId }
    version: '1.0.0'
  },

  // When user is confirmed as not administrator
  USER_NOT_ADMIN: {
    eventName: 'helpers.check.is.user.admin.user_not_admin',
    source: 'helpers check is user admin service',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'User is not an administrator',
    payload: null, // Will contain: { userId, groupId }
    version: '1.0.0'
  },

  // When admin status check completed from database
  SUCCESS_DB: {
    eventName: 'helpers.check.is.user.admin.success_db',
    source: 'helpers check is user admin service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Admin status check completed',
    payload: null, // Will contain: { userId, isAdmin, source: 'database' }
    version: '1.0.0'
  },

  // When error occurs during admin status check
  ERROR: {
    eventName: 'helpers.check.is.user.admin.error',
    source: 'helpers check is user admin service',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Error checking admin status',
    payload: null, // Will contain: { userId, error }
    version: '1.0.0'
  }
};

/**
 * Get User Account Status Events
 * Events for tracking user account status retrieval
 */
export const GET_USER_ACCOUNT_STATUS_EVENTS = {
  // When account status retrieval starts
  START: {
    eventName: 'helpers.get.user.account.status.start',
    source: 'helpers get user account status service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Getting user account status',
    payload: null, // Will contain: { userId }
    version: '1.0.0'
  },

  // When account status retrieved from cache
  SUCCESS_CACHE: {
    eventName: 'helpers.get.user.account.status.success_cache',
    source: 'helpers get user account status service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Account status retrieved from cache',
    payload: null, // Will contain: { userId, accountStatus, source: 'cache' }
    version: '1.0.0'
  },

  // When user not found
  NOT_FOUND: {
    eventName: 'helpers.get.user.account.status.not_found',
    source: 'helpers get user account status service',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'User not found with UUID',
    payload: null, // Will contain: { userId }
    version: '1.0.0'
  },

  // When account status retrieved from database
  SUCCESS_DB: {
    eventName: 'helpers.get.user.account.status.success_db',
    source: 'helpers get user account status service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Account status retrieved from database',
    payload: null, // Will contain: { userId, accountStatus, source: 'database' }
    version: '1.0.0'
  },

  // When error occurs during account status retrieval
  ERROR: {
    eventName: 'helpers.get.user.account.status.error',
    source: 'helpers get user account status service',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Error getting account status',
    payload: null, // Will contain: { userId, error }
    version: '1.0.0'
  }
};

/**
 * Get Username by UUID Events
 * Events for tracking username retrieval by UUID
 */
export const GET_USERNAME_BY_UUID_EVENTS = {
  // When username retrieval starts
  START: {
    eventName: 'helpers.get.username.by.uuid.start',
    source: 'helpers get username by uuid service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Getting username by UUID',
    payload: null, // Will contain: { uuid }
    version: '1.0.0'
  },

  // When username retrieved from cache
  SUCCESS_CACHE: {
    eventName: 'helpers.get.username.by.uuid.success_cache',
    source: 'helpers get username by uuid service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Username retrieved from cache',
    payload: null, // Will contain: { uuid, username, source: 'cache' }
    version: '1.0.0'
  },

  // When user not found
  NOT_FOUND: {
    eventName: 'helpers.get.username.by.uuid.not_found',
    source: 'helpers get username by uuid service',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'User not found with UUID',
    payload: null, // Will contain: { uuid }
    version: '1.0.0'
  },

  // When username retrieved from database
  SUCCESS_DB: {
    eventName: 'helpers.get.username.by.uuid.success_db',
    source: 'helpers get username by uuid service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Username retrieved from database',
    payload: null, // Will contain: { uuid, username, source: 'database' }
    version: '1.0.0'
  },

  // When error occurs during username retrieval
  ERROR: {
    eventName: 'helpers.get.username.by.uuid.error',
    source: 'helpers get username by uuid service',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Error getting username by UUID',
    payload: null, // Will contain: { uuid, error }
    version: '1.0.0'
  }
};

/**
 * Get UUID by Group Name Events
 * Events for tracking UUID retrieval by group name
 */
export const GET_UUID_BY_GROUP_NAME_EVENTS = {
  // When UUID retrieval starts
  START: {
    eventName: 'helpers.get.uuid.by.group.name.start',
    source: 'helpers get uuid by group name service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Getting UUID by group name',
    payload: null, // Will contain: { groupName }
    version: '1.0.0'
  },

  // When UUID retrieved from cache
  SUCCESS_CACHE: {
    eventName: 'helpers.get.uuid.by.group.name.success_cache',
    source: 'helpers get uuid by group name service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'UUID retrieved from cache',
    payload: null, // Will contain: { groupName, groupId, source: 'cache' }
    version: '1.0.0'
  },

  // When group not found
  NOT_FOUND: {
    eventName: 'helpers.get.uuid.by.group.name.not_found',
    source: 'helpers get uuid by group name service',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Group not found with name',
    payload: null, // Will contain: { groupName }
    version: '1.0.0'
  },

  // When UUID retrieved from database
  SUCCESS_DB: {
    eventName: 'helpers.get.uuid.by.group.name.success_db',
    source: 'helpers get uuid by group name service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'UUID retrieved from database',
    payload: null, // Will contain: { groupName, groupId, source: 'database' }
    version: '1.0.0'
  },

  // When error occurs during UUID retrieval
  ERROR: {
    eventName: 'helpers.get.uuid.by.group.name.error',
    source: 'helpers get uuid by group name service',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Error getting UUID by group name',
    payload: null, // Will contain: { groupName, error }
    version: '1.0.0'
  }
};

/**
 * Get Client IP Events
 * Events for tracking client IP address extraction
 */
export const GET_CLIENT_IP_EVENTS = {
  // When IP extraction starts
  START: {
    eventName: 'helpers.get.client.ip.start',
    source: 'helpers get client ip service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Extracting client IP address',
    payload: null, // Will contain: { method }
    version: '1.0.0'
  },

  // When IP successfully extracted
  SUCCESS: {
    eventName: 'helpers.get.client.ip.success',
    source: 'helpers get client ip service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Client IP address extracted successfully',
    payload: null, // Will contain: { ip, method }
    version: '1.0.0'
  },

  // When fallback method used
  FALLBACK: {
    eventName: 'helpers.get.client.ip.fallback',
    source: 'helpers get client ip service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Using fallback method for IP extraction',
    payload: null, // Will contain: { ip, method, fallbackMethod }
    version: '1.0.0'
  },

  // When IP cannot be determined
  UNKNOWN: {
    eventName: 'helpers.get.client.ip.unknown',
    source: 'helpers get client ip service',
    eventType: 'app' as const,
    severity: 'warn' as const,
    eventMessage: 'Unable to determine client IP address',
    payload: null, // Will contain: { attemptedMethods }
    version: '1.0.0'
  }
};

/**
 * Cache Operations Events
 * Events for tracking individual cache operations
 */
export const CACHE_OPERATION_EVENTS = {
  // Cache GET operations
  GET_INVALID_KEY: {
    eventName: 'helpers.cache.get.invalid_key',
    source: 'helpers cache service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Invalid cache key format for GET operation',
    payload: null, // Will contain: { key }
    version: '1.0.0'
  },

  GET_MISS: {
    eventName: 'helpers.cache.get.miss',
    source: 'helpers cache service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Cache miss for key',
    payload: null, // Will contain: { key, type, id }
    version: '1.0.0'
  },

  GET_EXPIRED: {
    eventName: 'helpers.cache.get.expired',
    source: 'helpers cache service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Cache entry expired',
    payload: null, // Will contain: { key, type, id, expiredAt }
    version: '1.0.0'
  },

  GET_HIT: {
    eventName: 'helpers.cache.get.hit',
    source: 'helpers cache service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Cache hit for key',
    payload: null, // Will contain: { key, type, id }
    version: '1.0.0'
  },

  // Cache SET operations
  SET_INVALID_KEY: {
    eventName: 'helpers.cache.set.invalid_key',
    source: 'helpers cache service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Invalid cache key format for SET operation',
    payload: null, // Will contain: { key, value }
    version: '1.0.0'
  },

  SET_EVICT: {
    eventName: 'helpers.cache.set.evict',
    source: 'helpers cache service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Cache entry evicted due to size limit',
    payload: null, // Will contain: { type, key, lastAccessed }
    version: '1.0.0'
  },

  SET_SUCCESS: {
    eventName: 'helpers.cache.set.success',
    source: 'helpers cache service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Cache entry set successfully',
    payload: null, // Will contain: { key, type, id, expiresAt, isUpdate }
    version: '1.0.0'
  },

  // Cache DELETE operations
  DELETE_INVALID_KEY: {
    eventName: 'helpers.cache.delete.invalid_key',
    source: 'helpers cache service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Invalid cache key format for DELETE operation',
    payload: null, // Will contain: { key }
    version: '1.0.0'
  },

  DELETE_NOT_FOUND: {
    eventName: 'helpers.cache.delete.not_found',
    source: 'helpers cache service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Cache entry not found for deletion',
    payload: null, // Will contain: { key, type, id }
    version: '1.0.0'
  },

  DELETE_SUCCESS: {
    eventName: 'helpers.cache.delete.success',
    source: 'helpers cache service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Cache entry deleted successfully',
    payload: null, // Will contain: { key, type, id }
    version: '1.0.0'
  },

  // Cache CLEAR operations
  CLEAR_TYPE_NOT_FOUND: {
    eventName: 'helpers.cache.clear.type_not_found',
    source: 'helpers cache service',
    eventType: 'app' as const,
    severity: 'warn' as const,
    eventMessage: 'Cache type not found for clearing',
    payload: null, // Will contain: { type }
    version: '1.0.0'
  },

  CLEAR_TYPE: {
    eventName: 'helpers.cache.clear.type',
    source: 'helpers cache service',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Cleared all cache entries for type',
    payload: null, // Will contain: { type, entriesCount }
    version: '1.0.0'
  },

  CLEAR_ALL: {
    eventName: 'helpers.cache.clear.all',
    source: 'helpers cache service',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Cleared all cache entries from all types',
    payload: null, // Will contain: { types }
    version: '1.0.0'
  }
};

/**
 * Is User Active Events
 * Events for tracking user activity status checks
 */
export const IS_USER_ACTIVE_EVENTS = {
  // When user activity check starts
  START: {
    eventName: 'helpers.is.user.active.start',
    source: 'helper function for quick check of current user status',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Checking user activity status',
    payload: null, // Will contain: { userId }
    version: '1.0.0'
  },

  // When user activity status retrieved from cache
  SUCCESS_CACHE: {
    eventName: 'helpers.is.user.active.success_cache',
    source: 'helper function for quick check of current user status',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'User activity status retrieved from cache',
    payload: null, // Will contain: { userId, isActive, source: 'cache' }
    version: '1.0.0'
  },

  // When user not found
  NOT_FOUND: {
    eventName: 'helpers.is.user.active.not_found',
    source: 'helper function for quick check of current user status',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'User not found with UUID',
    payload: null, // Will contain: { userId }
    version: '1.0.0'
  },

  // When user activity status retrieved from database
  SUCCESS_DB: {
    eventName: 'helpers.is.user.active.success_db',
    source: 'helper function for quick check of current user status',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'User activity status retrieved from database',
    payload: null, // Will contain: { userId, isActive, source: 'database' }
    version: '1.0.0'
  },

  // When error occurs during user activity check
  ERROR: {
    eventName: 'helpers.is.user.active.error',
    source: 'helper function for quick check of current user status',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Error checking user activity status',
    payload: null, // Will contain: { userId, error }
    version: '1.0.0'
  }
};

/**
 * Get Requestor UUID From Request Events
 * Events for tracking UUID extraction from request objects
 */
export const GET_REQUESTOR_UUID_EVENTS = {
  // When unable to extract UUID from request
  UNABLE_TO_EXTRACT: {
    eventName: 'helpers.get.requestor.uuid.unable_to_extract',
    source: 'helper function for extracting UUID from request',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Unable to extract UUID: invalid request or missing user data',
    payload: null, // Will contain: { requestInfo }
    version: '1.0.0'
  }
};