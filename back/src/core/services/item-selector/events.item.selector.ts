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