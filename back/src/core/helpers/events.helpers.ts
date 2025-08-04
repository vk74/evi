/**
 * @file events.helpers.ts
 * @version 1.0.0
 * @description Backend file. Contains event definitions for the connection handler domain.
 * These events track HTTP connection handling operations including request processing,
 * business logic execution, response generation, and error handling.
 */

/**
 * Connection Handler Events
 * Events for tracking HTTP connection handling operations
 */
export const CONNECTION_HANDLER_EVENTS = {
  // Request lifecycle events
  REQUEST_RECEIVED: {
    eventName: 'connectionHandler.request.received',
    source: 'connection handler',
    eventType: 'http' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP request received by connection handler',
    payload: null, // Will contain: { method, url, controllerName, requestId, userAgent, ipAddress }
    version: '1.0.0'
  },

  REQUEST_VALIDATED: {
    eventName: 'connectionHandler.request.validated',
    source: 'connection handler',
    eventType: 'http' as const,
    severity: 'debug' as const,
    eventMessage: 'Request validation completed',
    payload: null, // Will contain: { controllerName, requestId, validationResult }
    version: '1.0.0'
  },

  REQUEST_AUTHENTICATED: {
    eventName: 'connectionHandler.request.authenticated',
    source: 'connection handler',
    eventType: 'security' as const,
    severity: 'debug' as const,
    eventMessage: 'Request authentication completed',
    payload: null, // Will contain: { controllerName, requestId, userId, authMethod }
    version: '1.0.0'
  },

  REQUEST_AUTHORIZED: {
    eventName: 'connectionHandler.request.authorized',
    source: 'connection handler',
    eventType: 'security' as const,
    severity: 'debug' as const,
    eventMessage: 'Request authorization completed',
    payload: null, // Will contain: { controllerName, requestId, userId, permissions }
    version: '1.0.0'
  },

  // HTTP method specific events
  REQUEST_GET: {
    eventName: 'connectionHandler.request.get',
    source: 'connection handler',
    eventType: 'http' as const,
    severity: 'debug' as const,
    eventMessage: 'GET request processed',
    payload: null, // Will contain: { url, controllerName, requestId, queryParams }
    version: '1.0.0'
  },

  REQUEST_POST: {
    eventName: 'connectionHandler.request.post',
    source: 'connection handler',
    eventType: 'http' as const,
    severity: 'debug' as const,
    eventMessage: 'POST request processed',
    payload: null, // Will contain: { url, controllerName, requestId, bodySize }
    version: '1.0.0'
  },

  REQUEST_PUT: {
    eventName: 'connectionHandler.request.put',
    source: 'connection handler',
    eventType: 'http' as const,
    severity: 'debug' as const,
    eventMessage: 'PUT request processed',
    payload: null, // Will contain: { url, controllerName, requestId, bodySize }
    version: '1.0.0'
  },

  REQUEST_DELETE: {
    eventName: 'connectionHandler.request.delete',
    source: 'connection handler',
    eventType: 'http' as const,
    severity: 'debug' as const,
    eventMessage: 'DELETE request processed',
    payload: null, // Will contain: { url, controllerName, requestId }
    version: '1.0.0'
  },

  // Business logic events
  BUSINESS_LOGIC_START: {
    eventName: 'connectionHandler.businessLogic.start',
    source: 'connection handler',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Business logic execution started',
    payload: null, // Will contain: { controllerName, requestId }
    version: '1.0.0'
  },

  BUSINESS_LOGIC_COMPLETE: {
    eventName: 'connectionHandler.businessLogic.complete',
    source: 'connection handler',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Business logic completed successfully',
    payload: null, // Will contain: { controllerName, responseSize, duration }
    version: '1.0.0'
  },

  BUSINESS_LOGIC_ERROR: {
    eventName: 'connectionHandler.businessLogic.error',
    source: 'connection handler',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Business logic execution failed',
    payload: null, // Will contain: { controllerName, errorCode, errorType, duration }
    errorData: null, // Will contain error details
    version: '1.0.0'
  },

  // Response events by status code
  RESPONSE_SENT_200: {
    eventName: 'connectionHandler.response.sent.200',
    source: 'connection handler',
    eventType: 'http' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP 200 response sent successfully',
    payload: null, // Will contain: { controllerName, responseSize, duration }
    version: '1.0.0'
  },

  RESPONSE_SENT_201: {
    eventName: 'connectionHandler.response.sent.201',
    source: 'connection handler',
    eventType: 'http' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP 201 response sent successfully',
    payload: null, // Will contain: { controllerName, responseSize, duration, resourceId }
    version: '1.0.0'
  },

  RESPONSE_SENT_400: {
    eventName: 'connectionHandler.response.sent.400',
    source: 'connection handler',
    eventType: 'http' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP 400 response sent',
    payload: null, // Will contain: { controllerName, errorCode, errorType, duration }
    version: '1.0.0'
  },

  RESPONSE_SENT_401: {
    eventName: 'connectionHandler.response.sent.401',
    source: 'connection handler',
    eventType: 'security' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP 401 response sent',
    payload: null, // Will contain: { controllerName, errorCode, errorType, duration }
    version: '1.0.0'
  },

  RESPONSE_SENT_403: {
    eventName: 'connectionHandler.response.sent.403',
    source: 'connection handler',
    eventType: 'security' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP 403 response sent',
    payload: null, // Will contain: { controllerName, errorCode, errorType, duration }
    version: '1.0.0'
  },

  RESPONSE_SENT_404: {
    eventName: 'connectionHandler.response.sent.404',
    source: 'connection handler',
    eventType: 'http' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP 404 response sent',
    payload: null, // Will contain: { controllerName, errorCode, errorType, duration }
    version: '1.0.0'
  },

  RESPONSE_SENT_500: {
    eventName: 'connectionHandler.response.sent.500',
    source: 'connection handler',
    eventType: 'http' as const,
    severity: 'error' as const,
    eventMessage: 'HTTP 500 response sent',
    payload: null, // Will contain: { controllerName, errorCode, errorType, duration }
    version: '1.0.0'
  },

  // Error handling events
  VALIDATION_ERROR: {
    eventName: 'connectionHandler.validation.error',
    source: 'connection handler',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Request validation failed',
    payload: null, // Will contain: { controllerName, errorCode, errorType, duration, validationErrors }
    errorData: null, // Will contain error details
    version: '1.0.0'
  },

  AUTHENTICATION_ERROR: {
    eventName: 'connectionHandler.authentication.error',
    source: 'connection handler',
    eventType: 'security' as const,
    severity: 'debug' as const,
    eventMessage: 'Request authentication failed',
    payload: null, // Will contain: { controllerName, errorCode, errorType, duration, authMethod }
    errorData: null, // Will contain error details
    version: '1.0.0'
  },

  AUTHORIZATION_ERROR: {
    eventName: 'connectionHandler.authorization.error',
    source: 'connection handler',
    eventType: 'security' as const,
    severity: 'debug' as const,
    eventMessage: 'Request authorization failed',
    payload: null, // Will contain: { controllerName, errorCode, errorType, duration, requiredPermissions }
    errorData: null, // Will contain error details
    version: '1.0.0'
  },

  // Security events
  SUSPICIOUS_REQUEST: {
    eventName: 'connectionHandler.suspicious.request',
    source: 'connection handler',
    eventType: 'security' as const,
    severity: 'debug' as const,
    eventMessage: 'Suspicious request detected',
    payload: null, // Will contain: { controllerName, requestId, suspiciousPattern, ipAddress }
    version: '1.0.0'
  },

  RATE_LIMIT_EXCEEDED: {
    eventName: 'connectionHandler.rate.limit.exceeded',
    source: 'connection handler',
    eventType: 'security' as const,
    severity: 'debug' as const,
    eventMessage: 'Rate limit exceeded',
    payload: null, // Will contain: { controllerName, requestId, ipAddress, limit, window }
    version: '1.0.0'
  },

  // Legacy events for backward compatibility
  RESPONSE_SENT: {
    eventName: 'connectionHandler.response.sent',
    source: 'connection handler',
    eventType: 'http' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP response sent successfully',
    payload: null, // Will contain: { statusCode, responseSize, duration }
    version: '1.0.0'
  },

  ERROR_RESPONSE_SENT: {
    eventName: 'connectionHandler.errorResponse.sent',
    source: 'connection handler',
    eventType: 'http' as const,
    severity: 'error' as const,
    eventMessage: 'HTTP error response sent',
    payload: null, // Will contain: { statusCode, errorCode, errorType, duration }
    errorData: null, // Will contain error details
    version: '1.0.0'
  },

  REQUEST_TIMEOUT: {
    eventName: 'connectionHandler.request.timeout',
    source: 'connection handler',
    eventType: 'http' as const,
    severity: 'warn' as const,
    eventMessage: 'Request processing timeout',
    payload: null, // Will contain: { controllerName, duration, timeout }
    version: '1.0.0'
  }
};

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