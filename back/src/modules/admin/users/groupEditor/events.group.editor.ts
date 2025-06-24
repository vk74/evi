/**
 * events.group.editor.ts - backend file
 * version: 1.0.02
 * 
 * This file contains event definitions for the group editor management domain.
 * It serves as a reference for creating and publishing group editor-related events to the event bus.
 * Each event includes standard properties like eventName, eventType, severity, etc.
 * 
 * These events are used to track and react to group management operations
 * such as creating groups, updating groups, and managing group members.
 * 
 * Note: HTTP request/response events are now handled by the universal connection handler.
 */

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
  
  // When group fetch operation fails
  FAILED: {
    eventName: 'groupEditor.fetch.failed',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Failed to fetch group data',
    payload: null, // Will be of type { groupId: string, error: ServiceError }
    errorData: null, // Will be filled with error message
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
  
  // When controller encounters an error
  HTTP_ERROR: {
    eventName: 'groupEditor.controller.fetch.error',
    source: 'group editor admin controller',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'HTTP error occurred while fetching group',
    payload: null, // Will be of type { groupId: string, errorCode: string }
    errorData: null, // Will be filled with error message
    version: '1.0.0'
  }
};

/**
 * Group Creation Events
 * Events related to creating new groups
 */
export const GROUP_CREATION_EVENTS = {
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
    errorData: null, // Will be filled with error message
    version: '1.0.0'
  }
};

/**
 * Group Update Events
 * Events related to updating existing groups
 */
export const GROUP_UPDATE_EVENTS = {
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
    eventMessage: 'Failed to clear group list cache',
    payload: null, // Will be of type { error: string }
    errorData: null, // Will be filled with error message
    version: '1.0.0'
  }
};

/**
 * Controller Events for Group Update
 * Events related to HTTP controller processing for updating group data
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
    payload: null, // Will be of type { groupId: string, success: boolean }
    version: '1.0.0'
  },
  
  // When controller encounters an error
  HTTP_ERROR: {
    eventName: 'groupEditor.controller.update.error',
    source: 'group editor admin controller',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'HTTP error occurred while updating group',
    payload: null, // Will be of type { groupId: string, errorCode: string }
    errorData: null, // Will be filled with error message
    version: '1.0.0'
  }
};

/**
 * Group Delete Events
 * Events related to deleting groups
 */
export const GROUP_DELETE_EVENTS = {
  // When validation of delete data is successful
  VALIDATION_PASSED: {
    eventName: 'groupEditor.delete.validation.passed',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Group delete data validation passed',
    payload: null, // Will be of type { groupId: string }
    version: '1.0.0'
  },
  
  // When validation of delete data fails
  VALIDATION_FAILED: {
    eventName: 'groupEditor.delete.validation.failed',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Group delete data validation failed',
    payload: null, // Will be of type { field: string, message: string }
    errorData: null, // Will be filled with error message
    version: '1.0.0'
  },
  
  // When database transaction starts
  TRANSACTION_START: {
    eventName: 'groupEditor.delete.transaction.start',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Starting database transaction for group deletion',
    payload: null, // Will be of type { groupId: string, requestorUuid: string }
    version: '1.0.0'
  },
  
  // When group deletion is successfully completed
  COMPLETE: {
    eventName: 'groupEditor.delete.complete',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Group deleted successfully',
    payload: null, // Will be of type { groupId: string }
    version: '1.0.0'
  },
  
  // When group deletion process fails
  FAILED: {
    eventName: 'groupEditor.delete.failed',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Group deletion failed',
    payload: null, // Will be of type { groupId: string, error: ServiceError }
    errorData: null, // Will be filled with error message
    version: '1.0.0'
  },
  
  // When cache is cleared after group deletion
  CACHE_CLEARED: {
    eventName: 'groupEditor.delete.cache.cleared',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Group list cache cleared after deletion',
    payload: null, // Will be of type { groupId: string }
    version: '1.0.0'
  },
  
  // When cache clearing fails
  CACHE_CLEAR_FAILED: {
    eventName: 'groupEditor.delete.cache.clear.failed',
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
 * Group Members Events
 * Events related to fetching group members
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
 * Controller Events for Group Members
 * Events related to HTTP controller processing for group members
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
    errorData: null, // Will be filled with error message
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
    errorData: null, // Will be filled with error message
    version: '1.0.0'
  }
};

/**
 * Group Members Add Events
 * Events related to adding members to groups
 */
export const GROUP_MEMBERS_ADD_EVENTS = {
  // When validation of add members data is successful
  VALIDATION_PASSED: {
    eventName: 'groupEditor.members.add.validation.passed',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Add members data validation passed',
    payload: null, // Will be of type { groupId: string, userIds: string[] }
    version: '1.0.0'
  },
  
  // When validation of add members data fails
  VALIDATION_FAILED: {
    eventName: 'groupEditor.members.add.validation.failed',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Add members data validation failed',
    payload: null, // Will be of type { field: string, message: string }
    errorData: null, // Will be filled with error message
    version: '1.0.0'
  },
  
  // When database transaction starts
  TRANSACTION_START: {
    eventName: 'groupEditor.members.add.transaction.start',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Starting database transaction for adding members',
    payload: null, // Will be of type { groupId: string, userIds: string[] }
    version: '1.0.0'
  },
  
  // When members are successfully added to group
  COMPLETE: {
    eventName: 'groupEditor.members.add.complete',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Members added to group successfully',
    payload: null, // Will be of type { groupId: string, addedCount: number }
    version: '1.0.0'
  },
  
  // When adding members to group fails
  FAILED: {
    eventName: 'groupEditor.members.add.failed',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Failed to add members to group',
    payload: null, // Will be of type { groupId: string, error: ServiceError }
    errorData: null, // Will be filled with error message
    version: '1.0.0'
  }
};

/**
 * Group Members Remove Events
 * Events related to removing members from groups
 */
export const GROUP_MEMBERS_REMOVE_EVENTS = {
  // When validation of remove members data is successful
  VALIDATION_PASSED: {
    eventName: 'groupEditor.members.remove.validation.passed',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Remove members data validation passed',
    payload: null, // Will be of type { groupId: string, userIds: string[] }
    version: '1.0.0'
  },
  
  // When validation of remove members data fails
  VALIDATION_FAILED: {
    eventName: 'groupEditor.members.remove.validation.failed',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Remove members data validation failed',
    payload: null, // Will be of type { field: string, message: string }
    errorData: null, // Will be filled with error message
    version: '1.0.0'
  },
  
  // When database transaction starts
  TRANSACTION_START: {
    eventName: 'groupEditor.members.remove.transaction.start',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Starting database transaction for removing members',
    payload: null, // Will be of type { groupId: string, userIds: string[] }
    version: '1.0.0'
  },
  
  // When members are successfully removed from group
  COMPLETE: {
    eventName: 'groupEditor.members.remove.complete',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Members removed from group successfully',
    payload: null, // Will be of type { groupId: string, removedCount: number }
    version: '1.0.0'
  },
  
  // When removing members from group fails
  FAILED: {
    eventName: 'groupEditor.members.remove.failed',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Failed to remove members from group',
    payload: null, // Will be of type { groupId: string, error: ServiceError }
    errorData: null, // Will be filled with error message
    version: '1.0.0'
  }
};

/**
 * Group Owner Change Events
 * Events related to changing group ownership
 */
export const GROUP_OWNER_CHANGE_EVENTS = {
  // When validation of owner change data is successful
  VALIDATION_PASSED: {
    eventName: 'groupEditor.owner.change.validation.passed',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Owner change data validation passed',
    payload: null, // Will be of type { groupId: string, newOwnerId: string }
    version: '1.0.0'
  },
  
  // When validation of owner change data fails
  VALIDATION_FAILED: {
    eventName: 'groupEditor.owner.change.validation.failed',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Owner change data validation failed',
    payload: null, // Will be of type { field: string, message: string }
    errorData: null, // Will be filled with error message
    version: '1.0.0'
  },
  
  // When database transaction starts
  TRANSACTION_START: {
    eventName: 'groupEditor.owner.change.transaction.start',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Starting database transaction for owner change',
    payload: null, // Will be of type { groupId: string, newOwnerId: string }
    version: '1.0.0'
  },
  
  // When group ownership is successfully changed
  COMPLETE: {
    eventName: 'groupEditor.owner.change.complete',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Group ownership changed successfully',
    payload: null, // Will be of type { groupId: string, newOwnerId: string }
    version: '1.0.0'
  },
  
  // When group ownership change fails
  FAILED: {
    eventName: 'groupEditor.owner.change.failed',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Failed to change group ownership',
    payload: null, // Will be of type { groupId: string, error: ServiceError }
    errorData: null, // Will be filled with error message
    version: '1.0.0'
  }
};

/**
 * User Search Events
 * Events related to searching users
 */
export const USER_SEARCH_EVENTS = {
  // When user search is successfully completed
  COMPLETE: {
    eventName: 'groupEditor.user.search.complete',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'User search completed successfully',
    payload: null, // Will be of type { searchTerm: string, resultCount: number }
    version: '1.0.0'
  },
  
  // When user search operation fails
  FAILED: {
    eventName: 'groupEditor.user.search.failed',
    source: 'group editor admin submodule',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'User search failed',
    payload: null, // Will be of type { searchTerm: string, error: ServiceError }
    errorData: null, // Will be filled with error message
    version: '1.0.0'
  }
};