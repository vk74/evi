/**
 * events.group.editor.ts - backend file
 * version: 1.0.0
 * 
 * This file contains event definitions for the group editor management domain.
 * It serves as a reference for creating and publishing group editor-related events to the event bus.
 * Each event includes standard properties like eventName, eventType, severity, etc.
 * 
 * These events are used to track and react to group management operations
 * such as creating groups, updating groups, and managing group members.
 */

/**
 * Group Creation Events
 * Events related to creating new groups
 */
export const GROUP_CREATION_EVENTS = {
  // When a request to create a group is received
  REQUEST_RECEIVED: {
    eventName: 'groupEditor.creation.request.received',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Group creation request received',
    payload: null, // Will be of type { groupName: string, owner: string }
    version: '1.0.0'
  },
  
  // When validation of input data is successful
  VALIDATION_PASSED: {
    eventName: 'groupEditor.creation.validation.passed',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Group data validation passed',
    payload: null, // Will be of type { groupName: string }
    version: '1.0.0'
  },
  
  // When validation of input data fails
  VALIDATION_FAILED: {
    eventName: 'groupEditor.creation.validation.failed',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Group data validation failed',
    payload: null, // Will be of type { field: string, message: string }
    errorData: null, // Will be filled with error message
    version: '1.0.0'
  },
  
  // When checking if a group name already exists
  NAME_CHECK: {
    eventName: 'groupEditor.creation.name.check',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Checking group name uniqueness',
    payload: null, // Will be of type { groupName: string }
    version: '1.0.0'
  },
  
  // When owner existence check is performed
  OWNER_CHECK: {
    eventName: 'groupEditor.creation.owner.check',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Checking if owner exists',
    payload: null, // Will be of type { ownerUsername: string }
    version: '1.0.0'
  },
  
  // When database transaction starts
  TRANSACTION_START: {
    eventName: 'groupEditor.creation.transaction.start',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Starting database transaction for group creation',
    payload: null, // Will be of type { requestorUuid: string }
    version: '1.0.0'
  },
  
  // When group creation process is successfully completed
  COMPLETE: {
    eventName: 'groupEditor.creation.complete',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Group created successfully',
    payload: null, // Will be of type { groupId: string, groupName: string }
    version: '1.0.0'
  },
  
  // When group creation process fails
  FAILED: {
    eventName: 'groupEditor.creation.failed',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Group creation failed',
    payload: null, // Will be of type { groupName: string, error: ServiceError }
    errorData: null, // Will be filled with error message
    version: '1.0.0'
  },
  
  // When cache is cleared after group creation
  CACHE_CLEARED: {
    eventName: 'groupEditor.creation.cache.cleared',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Group list cache cleared after creation',
    payload: null, // Will be of type { groupId: string }
    version: '1.0.0'
  },
  
  // When cache clearing fails
  CACHE_CLEAR_FAILED: {
    eventName: 'groupEditor.creation.cache.clear.failed',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Failed to clear group list cache',
    payload: null, // Will be of type { error: string }
    errorData: null, // Will be filled with error message
    version: '1.0.0'
  }
};

/**
 * Group Update Events
 * Events related to updating existing groups
 */
export const GROUP_UPDATE_EVENTS = {
  // When a request to update a group is received
  REQUEST_RECEIVED: {
    eventName: 'groupEditor.update.request.received',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Group update request received',
    payload: null, // Will be of type { groupId: string, requestorUuid: string }
    version: '1.0.0'
  },
  
  // When validation of update data is successful
  VALIDATION_PASSED: {
    eventName: 'groupEditor.update.validation.passed',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Group update data validation passed',
    payload: null, // Will be of type { groupId: string }
    version: '1.0.0'
  },
  
  // When validation of update data fails
  VALIDATION_FAILED: {
    eventName: 'groupEditor.update.validation.failed',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Group update data validation failed',
    payload: null, // Will be of type { field: string, message: string }
    errorData: null, // Will be filled with error message
    version: '1.0.0'
  },
  
  // When database transaction starts
  TRANSACTION_START: {
    eventName: 'groupEditor.update.transaction.start',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Starting database transaction for group update',
    payload: null, // Will be of type { groupId: string, requestorUuid: string }
    version: '1.0.0'
  },
  
  // When group update is successfully completed
  COMPLETE: {
    eventName: 'groupEditor.update.complete',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Group updated successfully',
    payload: null, // Will be of type { groupId: string }
    version: '1.0.0'
  },
  
  // When group update process fails
  FAILED: {
    eventName: 'groupEditor.update.failed',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Group update failed',
    payload: null, // Will be of type { groupId: string, error: ServiceError }
    errorData: null, // Will be filled with error message
    version: '1.0.0'
  },
  
  // When cache is cleared after group update
  CACHE_CLEARED: {
    eventName: 'groupEditor.update.cache.cleared',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Group list cache cleared after update',
    payload: null, // Will be of type { groupId: string }
    version: '1.0.0'
  },
  
  // When cache clearing fails
  CACHE_CLEAR_FAILED: {
    eventName: 'groupEditor.update.cache.clear.failed',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Failed to clear group list cache after update',
    payload: null, // Will be of type { groupId: string, error: string }
    errorData: null, // Will be filled with error message
    version: '1.0.0'
  }
};

/**
 * Group Fetch Events
 * Events related to fetching group data
 */
export const GROUP_FETCH_EVENTS = {
  // When a request to fetch a group is received
  REQUEST_RECEIVED: {
    eventName: 'groupEditor.fetch.request.received',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Group fetch request received',
    payload: null, // Will be of type { groupId: string, requestorUuid: string }
    version: '1.0.0'
  },
  
  // When group fetch is successfully completed
  COMPLETE: {
    eventName: 'groupEditor.fetch.complete',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Group data fetched successfully',
    payload: null, // Will be of type { groupId: string, groupName: string }
    version: '1.0.0'
  },
  
  // When group fetch fails
  FAILED: {
    eventName: 'groupEditor.fetch.failed',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Group fetch failed',
    payload: null, // Will be of type { groupId: string, error: string }
    errorData: null, // Will be filled with error message
    version: '1.0.0'
  }
};

/**
 * Group Members Events
 * Events related to managing group members
 */
export const GROUP_MEMBERS_EVENTS = {
  // When a request to fetch group members is received
  FETCH_REQUEST_RECEIVED: {
    eventName: 'groupEditor.members.fetch.request.received',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Group members fetch request received',
    payload: null, // Will be of type { groupId: string, requestorUuid: string }
    version: '1.0.0'
  },
  
  // When group members fetch is successfully completed
  FETCH_COMPLETE: {
    eventName: 'groupEditor.members.fetch.complete',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Group members fetched successfully',
    payload: null, // Will be of type { groupId: string, memberCount: number }
    version: '1.0.0'
  },
  
  // When group members fetch fails
  FETCH_FAILED: {
    eventName: 'groupEditor.members.fetch.failed',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Group members fetch failed',
    payload: null, // Will be of type { groupId: string, error: string }
    errorData: null, // Will be filled with error message
    version: '1.0.0'
  },
  
  // When a request to remove group members is received
  REMOVE_REQUEST_RECEIVED: {
    eventName: 'groupEditor.members.remove.request.received',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Group members remove request received',
    payload: null, // Will be of type { groupId: string, userIdsCount: number, requestorUuid: string }
    version: '1.0.0'
  },
  
  // When group members removal is successfully completed
  REMOVE_COMPLETE: {
    eventName: 'groupEditor.members.remove.complete',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Group members removed successfully',
    payload: null, // Will be of type { groupId: string, removedCount: number }
    version: '1.0.0'
  },
  
  // When group members removal fails
  REMOVE_FAILED: {
    eventName: 'groupEditor.members.remove.failed',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Group members removal failed',
    payload: null, // Will be of type { groupId: string, error: string }
    errorData: null, // Will be filled with error message
    version: '1.0.0'
  }
};

/**
 * Controller Events for Group Creation
 * Events related to HTTP controller processing for creating groups
 */
export const GROUP_CREATION_CONTROLLER_EVENTS = {
  // When HTTP request is received by controller
  HTTP_REQUEST_RECEIVED: {
    eventName: 'groupEditor.controller.creation.request.received',
    source: 'group editor admin controller',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP request received to create group',
    payload: null, // Will be of type { groupName: string, method: string, url: string }
    version: '1.0.0'
  },
  
  // When controller successfully processes the request and sends response
  HTTP_RESPONSE_SENT: {
    eventName: 'groupEditor.controller.creation.response.sent',
    source: 'group editor admin controller',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP response sent for group creation',
    payload: null, // Will be of type { groupId: string, groupName: string }
    version: '1.0.0'
  },
  
  // When controller encounters an error processing the request
  HTTP_ERROR: {
    eventName: 'groupEditor.controller.creation.error',
    source: 'group editor admin controller',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Error in group creation controller',
    payload: null, // Will be of type { groupName: string, errorCode: string }
    errorData: null, // Will be filled with error details
    version: '1.0.0'
  }
};

/**
 * Controller Events for Group Update
 * Events related to HTTP controller processing for updating groups
 */
export const GROUP_UPDATE_CONTROLLER_EVENTS = {
  // When HTTP request is received by controller
  HTTP_REQUEST_RECEIVED: {
    eventName: 'groupEditor.controller.update.request.received',
    source: 'group editor admin controller',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP request received to update group',
    payload: null, // Will be of type { groupId: string, method: string, url: string }
    version: '1.0.0'
  },
  
  // When controller successfully processes the request and sends response
  HTTP_RESPONSE_SENT: {
    eventName: 'groupEditor.controller.update.response.sent',
    source: 'group editor admin controller',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP response sent for group update',
    payload: null, // Will be of type { groupId: string }
    version: '1.0.0'
  },
  
  // When controller encounters an error processing the request
  HTTP_ERROR: {
    eventName: 'groupEditor.controller.update.error',
    source: 'group editor admin controller',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Error in group update controller',
    payload: null, // Will be of type { groupId: string, errorCode: string }
    errorData: null, // Will be filled with error details
    version: '1.0.0'
  }
};

/**
 * Controller Events for Group Fetch
 * Events related to HTTP controller processing for fetching group data
 */
export const GROUP_FETCH_CONTROLLER_EVENTS = {
  // When HTTP request is received by controller
  HTTP_REQUEST_RECEIVED: {
    eventName: 'groupEditor.controller.fetch.request.received',
    source: 'group editor admin controller',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP request received to fetch group',
    payload: null, // Will be of type { groupId: string, method: string, url: string }
    version: '1.0.0'
  },
  
  // When controller successfully processes the request and sends response
  HTTP_RESPONSE_SENT: {
    eventName: 'groupEditor.controller.fetch.response.sent',
    source: 'group editor admin controller',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP response sent for group data',
    payload: null, // Will be of type { groupId: string, groupName: string }
    version: '1.0.0'
  },
  
  // When controller encounters an error processing the request
  HTTP_ERROR: {
    eventName: 'groupEditor.controller.fetch.error',
    source: 'group editor admin controller',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Error in group fetch controller',
    payload: null, // Will be of type { groupId: string, errorCode: string }
    errorData: null, // Will be filled with error details
    version: '1.0.0'
  }
};

/**
 * Controller Events for Group Members
 * Events related to HTTP controller processing for group members operations
 */
export const GROUP_MEMBERS_CONTROLLER_EVENTS = {
  // When HTTP request is received to fetch members
  FETCH_HTTP_REQUEST_RECEIVED: {
    eventName: 'groupEditor.controller.members.fetch.request.received',
    source: 'group editor admin controller',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP request received to fetch group members',
    payload: null, // Will be of type { groupId: string, method: string, url: string }
    version: '1.0.0'
  },
  
  // When controller successfully processes the fetch request and sends response
  FETCH_HTTP_RESPONSE_SENT: {
    eventName: 'groupEditor.controller.members.fetch.response.sent',
    source: 'group editor admin controller',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP response sent for group members data',
    payload: null, // Will be of type { groupId: string, memberCount: number }
    version: '1.0.0'
  },
  
  // When controller encounters an error processing the fetch request
  FETCH_HTTP_ERROR: {
    eventName: 'groupEditor.controller.members.fetch.error',
    source: 'group editor admin controller',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Error in group members fetch controller',
    payload: null, // Will be of type { groupId: string, errorCode: string }
    errorData: null, // Will be filled with error details
    version: '1.0.0'
  },
  
  // When HTTP request is received to remove members
  REMOVE_HTTP_REQUEST_RECEIVED: {
    eventName: 'groupEditor.controller.members.remove.request.received',
    source: 'group editor admin controller',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP request received to remove group members',
    payload: null, // Will be of type { groupId: string, userIdsCount: number, method: string, url: string }
    version: '1.0.0'
  },
  
  // When controller successfully processes the remove request and sends response
  REMOVE_HTTP_RESPONSE_SENT: {
    eventName: 'groupEditor.controller.members.remove.response.sent',
    source: 'group editor admin controller',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP response sent for group members removal',
    payload: null, // Will be of type { groupId: string, removedCount: number }
    version: '1.0.0'
  },
  
  // When controller encounters an error processing the remove request
  REMOVE_HTTP_ERROR: {
    eventName: 'groupEditor.controller.members.remove.error',
    source: 'group editor admin controller',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Error in group members remove controller',
    payload: null, // Will be of type { groupId: string, errorCode: string }
    errorData: null, // Will be filled with error details
    version: '1.0.0'
  }
};