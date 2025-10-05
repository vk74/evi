/**
 * events.item.selector.ts - backend file
 * version: 1.0.0
 * 
 * This file contains event definitions for the item-selector domain.
 * It serves as a reference for creating and publishing item-selector-related events to the event bus.
 * Each event includes standard properties like eventName, eventType, severity, etc.
 * 
 * These events are used to track and react to item-selector operations
 * such as adding users to groups, searching users/groups, and changing group ownership.
 */

/**
 * Add Users To Group Events
 * Events related to adding users to group operations
 */
export const ADD_USERS_TO_GROUP_EVENTS = {
  // Request received for adding users to group
  REQUEST_RECEIVED: {
    eventName: 'itemSelector.addUsersToGroup.request.received',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Request received to add users to group',
    payload: null, // { groupId: string, userCount: number, requestedBy: string }
    version: '1.0.0'
  },
  
  // Validation error for adding users to group
  VALIDATION_ERROR: {
    eventName: 'itemSelector.addUsersToGroup.validation.error',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Validation error in add users to group request',
    payload: null, // { groupId: string, userIds: string[] }
    errorData: null, // Validation error details
    version: '1.0.0'
  },
  
  // Success response for adding users to group
  RESPONSE_SUCCESS: {
    eventName: 'itemSelector.addUsersToGroup.response.success',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Successfully added users to group',
    payload: null, // { groupId: string, addedCount: number }
    version: '1.0.0'
  },
  
  // Validation error response
  RESPONSE_VALIDATION_ERROR: {
    eventName: 'itemSelector.addUsersToGroup.response.validationError',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Validation error occurred while adding users to group',
    payload: null, // { groupId: string, error: ServiceError }
    errorData: null, // Error details
    version: '1.0.0'
  },
  
  // Not found error response
  RESPONSE_NOT_FOUND_ERROR: {
    eventName: 'itemSelector.addUsersToGroup.response.notFoundError',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Group or users not found while adding users to group',
    payload: null, // { groupId: string, error: ServiceError }
    errorData: null, // Error details
    version: '1.0.0'
  },
  
  // Permission error response
  RESPONSE_PERMISSION_ERROR: {
    eventName: 'itemSelector.addUsersToGroup.response.permissionError',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Permission denied while adding users to group',
    payload: null, // { groupId: string, error: ServiceError }
    errorData: null, // Error details
    version: '1.0.0'
  },
  
  // General error response
  RESPONSE_ERROR: {
    eventName: 'itemSelector.addUsersToGroup.response.error',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Error occurred while adding users to group',
    payload: null, // { groupId: string, error: ServiceError }
    errorData: null, // Error details
    version: '1.0.0'
  }
};

/**
 * Change Group Owner Events
 * Events related to changing group owner operations
 */
export const CHANGE_GROUP_OWNER_EVENTS = {
  // Request received for changing group owner
  REQUEST_RECEIVED: {
    eventName: 'itemSelector.changeGroupOwner.request.received',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Request received to change group owner',
    payload: null, // { groupId: string, newOwnerId: string, requestedBy: string }
    version: '1.0.0'
  },
  
  // Validation error for changing group owner
  VALIDATION_ERROR: {
    eventName: 'itemSelector.changeGroupOwner.validation.error',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Validation error in change group owner request',
    payload: null, // { groupId: string, newOwnerId: string, missingField: string }
    errorData: null, // Validation error details
    version: '1.0.0'
  },
  
  // Success response for changing group owner
  RESPONSE_SUCCESS: {
    eventName: 'itemSelector.changeGroupOwner.response.success',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Successfully changed group owner',
    payload: null, // { groupId: string, newOwnerId: string, oldOwnerId: string }
    version: '1.0.0'
  },
  
  // Validation error response
  RESPONSE_VALIDATION_ERROR: {
    eventName: 'itemSelector.changeGroupOwner.response.validationError',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Validation error occurred while changing group owner',
    payload: null, // { groupId: string, newOwnerId: string, error: ServiceError }
    errorData: null, // Error details
    version: '1.0.0'
  },
  
  // Not found error response
  RESPONSE_NOT_FOUND_ERROR: {
    eventName: 'itemSelector.changeGroupOwner.response.notFoundError',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Group or user not found while changing group owner',
    payload: null, // { groupId: string, newOwnerId: string, error: ServiceError }
    errorData: null, // Error details
    version: '1.0.0'
  },
  
  // Permission error response
  RESPONSE_PERMISSION_ERROR: {
    eventName: 'itemSelector.changeGroupOwner.response.permissionError',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Permission denied while changing group owner',
    payload: null, // { groupId: string, newOwnerId: string, error: ServiceError }
    errorData: null, // Error details
    version: '1.0.0'
  },
  
  // Internal error response
  RESPONSE_INTERNAL_ERROR: {
    eventName: 'itemSelector.changeGroupOwner.response.internalError',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Internal server error occurred while changing group owner',
    payload: null, // { groupId: string, newOwnerId: string, error: ServiceError }
    errorData: null, // Error details
    version: '1.0.0'
  },
  
  // General error response
  RESPONSE_ERROR: {
    eventName: 'itemSelector.changeGroupOwner.response.error',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Error occurred while changing group owner',
    payload: null, // { groupId: string, newOwnerId: string, error: ServiceError }
    errorData: null, // Error details
    version: '1.0.0'
  }
};

/**
 * Change Group Owner Service Events
 * Events related to service operations for changing group owner
 */
export const CHANGE_GROUP_OWNER_SERVICE_EVENTS = {
  // Service initiated
  SERVICE_INITIATED: {
    eventName: 'itemSelector.changeGroupOwner.service.initiated',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Service initiated for changing group owner',
    payload: null, // { groupId: string, newOwnerId: string, changedBy: string }
    version: '1.0.0'
  },
  
  // Group validation
  VALIDATION_GROUP: {
    eventName: 'itemSelector.changeGroupOwner.validation.group',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Validating group existence and getting current owner',
    payload: null, // { groupId: string }
    version: '1.0.0'
  },
  
  // User validation
  VALIDATION_USER: {
    eventName: 'itemSelector.changeGroupOwner.validation.user',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Validating new owner existence',
    payload: null, // { userId: string }
    version: '1.0.0'
  },
  
  // Validation success
  VALIDATION_SUCCESS: {
    eventName: 'itemSelector.changeGroupOwner.validation.success',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Validation completed successfully',
    payload: null, // { groupId: string, currentOwner: string } or { userId: string }
    version: '1.0.0'
  },
  
  // Database transaction start
  DATABASE_TRANSACTION_START: {
    eventName: 'itemSelector.changeGroupOwner.database.transactionStart',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Database transaction started for group owner change',
    payload: null, // { groupId: string }
    version: '1.0.0'
  },
  
  // Database update
  DATABASE_UPDATE: {
    eventName: 'itemSelector.changeGroupOwner.database.update',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Updating group owner',
    payload: null, // { groupId: string, currentOwnerId: string, newOwnerId: string }
    version: '1.0.0'
  },
  
  // Database success
  DATABASE_SUCCESS: {
    eventName: 'itemSelector.changeGroupOwner.database.success',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Database operation completed successfully',
    payload: null, // { groupId: string, changedBy: string, detailsUpdated: boolean }
    version: '1.0.0'
  },
  
  // Service response success
  SERVICE_RESPONSE_SUCCESS: {
    eventName: 'itemSelector.changeGroupOwner.response.serviceSuccess',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Group owner successfully changed',
    payload: null, // { groupId: string, oldOwnerId: string, newOwnerId: string }
    version: '1.0.0'
  },
  
  // Service response no change
  SERVICE_RESPONSE_NO_CHANGE: {
    eventName: 'itemSelector.changeGroupOwner.response.noChange',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'New owner is the same as current owner, no update needed',
    payload: null, // { groupId: string, ownerId: string }
    version: '1.0.0'
  },
  
  // Service response error
  SERVICE_RESPONSE_ERROR: {
    eventName: 'itemSelector.changeGroupOwner.response.serviceError',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Failed to change group owner',
    payload: null, // { groupId: string, newOwnerId: string, errorCode: string }
    errorData: null, // Error details
    version: '1.0.0'
  }
};

/**
 * Add Users To Group Service Events
 * Events related to service operations for adding users to group
 */
export const ADD_USERS_TO_GROUP_SERVICE_EVENTS = {
  // Service initiated
  SERVICE_INITIATED: {
    eventName: 'itemSelector.addUsersToGroup.service.initiated',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Service initiated for adding users to group',
    payload: null, // { groupId: string, usersCount: number, addedBy: string }
    version: '1.0.0'
  },
  
  // Group validation
  VALIDATION_GROUP: {
    eventName: 'itemSelector.addUsersToGroup.validation.group',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Validating group existence',
    payload: null, // { groupId: string }
    version: '1.0.0'
  },
  
  // Users validation
  VALIDATION_USERS: {
    eventName: 'itemSelector.addUsersToGroup.validation.users',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Validating user existence',
    payload: null, // { userCount: number }
    version: '1.0.0'
  },
  
  // Account status validation
  VALIDATION_ACCOUNT_STATUS: {
    eventName: 'itemSelector.addUsersToGroup.validation.accountStatus',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Validating user account status',
    payload: null, // { userId: string }
    version: '1.0.0'
  },
  
  // Database transaction start
  DATABASE_TRANSACTION_START: {
    eventName: 'itemSelector.addUsersToGroup.database.transactionStart',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Database transaction started for adding users to group',
    payload: null, // { groupId: string }
    version: '1.0.0'
  },
  
  // Database update
  DATABASE_UPDATE: {
    eventName: 'itemSelector.addUsersToGroup.database.update',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Adding users to group',
    payload: null, // { groupId: string, userCount: number }
    version: '1.0.0'
  },
  
  // Database success
  DATABASE_SUCCESS: {
    eventName: 'itemSelector.addUsersToGroup.database.success',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Database operation completed successfully',
    payload: null, // { groupId: string, addedCount: number, skippedCount: number }
    version: '1.0.0'
  },
  
  // Service response success
  SERVICE_RESPONSE_SUCCESS: {
    eventName: 'itemSelector.addUsersToGroup.response.serviceSuccess',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Users successfully added to group',
    payload: null, // { groupId: string, addedCount: number, skippedCount: number }
    version: '1.0.0'
  },
  
  // Service response no change
  SERVICE_RESPONSE_NO_CHANGE: {
    eventName: 'itemSelector.addUsersToGroup.response.noChange',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'No new users to add, all are already members',
    payload: null, // { groupId: string }
    version: '1.0.0'
  },
  
  // Service response error
  SERVICE_RESPONSE_ERROR: {
    eventName: 'itemSelector.addUsersToGroup.response.serviceError',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Failed to add users to group',
    payload: null, // { groupId: string, errorCode: string }
    errorData: null, // Error details
    version: '1.0.0'
  }
};

/**
 * Search Users Events
 * Events related to searching users operations
 */
export const SEARCH_USERS_EVENTS = {
  // Request received for searching users
  REQUEST_RECEIVED: {
    eventName: 'itemSelector.searchUsers.request.received',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Request received to search users',
    payload: null, // { searchTerm: string, limit: number, requestedBy: string }
    version: '1.0.0'
  },
  
  // Success response for searching users
  RESPONSE_SUCCESS: {
    eventName: 'itemSelector.searchUsers.response.success',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Successfully searched users',
    payload: null, // { searchTerm: string, resultCount: number }
    version: '1.0.0'
  },
  
  // Error response for searching users
  RESPONSE_ERROR: {
    eventName: 'itemSelector.searchUsers.response.error',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Error occurred while searching users',
    payload: null, // { searchTerm: string, error: ServiceError }
    errorData: null, // Error details
    version: '1.0.0'
  }
};

/**
 * Search Groups Events
 * Events related to searching groups operations
 */
export const SEARCH_GROUPS_EVENTS = {
  // Request received for searching groups
  REQUEST_RECEIVED: {
    eventName: 'itemSelector.searchGroups.request.received',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Request received to search groups',
    payload: null, // { searchTerm: string, limit: number, requestedBy: string }
    version: '1.0.0'
  },
  
  // Success response for searching groups
  RESPONSE_SUCCESS: {
    eventName: 'itemSelector.searchGroups.response.success',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Successfully searched groups',
    payload: null, // { searchTerm: string, resultCount: number }
    version: '1.0.0'
  },
  
  // Error response for searching groups
  RESPONSE_ERROR: {
    eventName: 'itemSelector.searchGroups.response.error',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Error occurred while searching groups',
    payload: null, // { searchTerm: string, error: ServiceError }
    errorData: null, // Error details
    version: '1.0.0'
  }
};

/**
 * Add User To Groups Events
 * Events related to adding a user to multiple groups operations
 */
export const ADD_USER_TO_GROUPS_EVENTS = {
  // Request received for adding user to groups
  REQUEST_RECEIVED: {
    eventName: 'itemSelector.addUserToGroups.request.received',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Request received to add user to groups',
    payload: null, // { userId: string, groupCount: number, requestedBy: string }
    version: '1.0.0'
  },
  
  // Validation error for adding user to groups
  VALIDATION_ERROR: {
    eventName: 'itemSelector.addUserToGroups.validation.error',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Validation error in add user to groups request',
    payload: null, // { userId: string, groupIds: string[] }
    errorData: null, // Validation error details
    version: '1.0.0'
  },
  
  // Success response for adding user to groups
  RESPONSE_SUCCESS: {
    eventName: 'itemSelector.addUserToGroups.response.success',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Successfully added user to groups',
    payload: null, // { userId: string, addedCount: number }
    version: '1.0.0'
  },
  
  // Validation error response
  RESPONSE_VALIDATION_ERROR: {
    eventName: 'itemSelector.addUserToGroups.response.validationError',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Validation error occurred while adding user to groups',
    payload: null, // { userId: string, error: ServiceError }
    errorData: null, // Error details
    version: '1.0.0'
  },
  
  // Not found error response
  RESPONSE_NOT_FOUND_ERROR: {
    eventName: 'itemSelector.addUserToGroups.response.notFoundError',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'User or groups not found while adding user to groups',
    payload: null, // { userId: string, error: ServiceError }
    errorData: null, // Error details
    version: '1.0.0'
  },
  
  // Permission error response
  RESPONSE_PERMISSION_ERROR: {
    eventName: 'itemSelector.addUserToGroups.response.permissionError',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Permission denied while adding user to groups',
    payload: null, // { userId: string, error: ServiceError }
    errorData: null, // Error details
    version: '1.0.0'
  },
  
  // General error response
  RESPONSE_ERROR: {
    eventName: 'itemSelector.addUserToGroups.response.error',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Error occurred while adding user to groups',
    payload: null, // { userId: string, error: ServiceError }
    errorData: null, // Error details
    version: '1.0.0'
  }
};

/**
 * Add User To Groups Service Events
 * Events related to service operations for adding user to groups
 */
export const ADD_USER_TO_GROUPS_SERVICE_EVENTS = {
  // Service initiated
  SERVICE_INITIATED: {
    eventName: 'itemSelector.addUserToGroups.service.initiated',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Service initiated for adding user to groups',
    payload: null, // { userId: string, groupsCount: number, addedBy: string }
    version: '1.0.0'
  },
  
  // User validation
  VALIDATION_USER: {
    eventName: 'itemSelector.addUserToGroups.validation.user',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Validating user existence',
    payload: null, // { userId: string }
    version: '1.0.0'
  },
  
  // Groups validation
  VALIDATION_GROUPS: {
    eventName: 'itemSelector.addUserToGroups.validation.groups',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Validating groups existence',
    payload: null, // { groupCount: number }
    version: '1.0.0'
  },
  
  // Account status validation
  VALIDATION_ACCOUNT_STATUS: {
    eventName: 'itemSelector.addUserToGroups.validation.accountStatus',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Validating user account status',
    payload: null, // { userId: string }
    version: '1.0.0'
  },
  
  // Database transaction start
  DATABASE_TRANSACTION_START: {
    eventName: 'itemSelector.addUserToGroups.database.transactionStart',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Database transaction started for adding user to groups',
    payload: null, // { userId: string }
    version: '1.0.0'
  },
  
  // Database update
  DATABASE_UPDATE: {
    eventName: 'itemSelector.addUserToGroups.database.update',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Adding user to groups',
    payload: null, // { userId: string, groupCount: number }
    version: '1.0.0'
  },
  
  // Database success
  DATABASE_SUCCESS: {
    eventName: 'itemSelector.addUserToGroups.database.success',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Database operation completed successfully',
    payload: null, // { userId: string, addedCount: number, skippedCount: number }
    version: '1.0.0'
  },
  
  // Service response success
  SERVICE_RESPONSE_SUCCESS: {
    eventName: 'itemSelector.addUserToGroups.response.serviceSuccess',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'User successfully added to groups',
    payload: null, // { userId: string, addedCount: number, skippedCount: number }
    version: '1.0.0'
  },
  
  // Service response no change
  SERVICE_RESPONSE_NO_CHANGE: {
    eventName: 'itemSelector.addUserToGroups.response.noChange',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'No new groups to add, user is already a member of all selected groups',
    payload: null, // { userId: string }
    version: '1.0.0'
  },
  
  // Service response error
  SERVICE_RESPONSE_ERROR: {
    eventName: 'itemSelector.addUserToGroups.response.serviceError',
    source: 'item-selector service',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Failed to add user to groups',
    payload: null, // { userId: string, errorCode: string }
    errorData: null, // Error details
    version: '1.0.0'
  }
};