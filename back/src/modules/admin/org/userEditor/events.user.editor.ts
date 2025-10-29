/**
 * events.user.editor.ts - backend file
 * version: 1.0.08
 * 
 * This file contains event definitions for the user management domain within the user editor admin submodule.
 * It serves as a reference for creating and publishing user-related events to the event bus.
 * Each event includes standard properties like eventName, eventType, severity, etc.
 * 
 * These events are used to track and react to user management operations
 * such as creation, updates, and status changes.
 * 
 * Note: HTTP request/response events are now handled by the universal connection handler.
 */

/**
 * User Creation Events
 * Events related to user account creation processes
 */
export const USER_CREATION_EVENTS = {
  // Validation passed for user creation
  VALIDATION_PASSED: {
    eventName: 'userEditor.creation.validation.passed',
    source: 'user editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'User creation validation passed',
    payload: null, // { username: string, email: string }
    version: '1.0.0'
  },
  
  // Validation failed for user creation
  VALIDATION_FAILED: {
    eventName: 'userEditor.creation.validation.failed',
    source: 'user editor admin submodule',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'User creation validation failed',
    payload: null, // { field: string, message: string }
    errorData: null, // Validation error details
    version: '1.0.0'
  },
  
  // Password policy check started
  PASSWORD_POLICY_CHECK_START: {
    eventName: 'userEditor.creation.password.policy.check.start',
    source: 'user editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Password policy validation started',
    payload: null, // { username: string }
    version: '1.0.0'
  },
  
  // Password passed policy check
  PASSWORD_POLICY_CHECK_PASSED: {
    eventName: 'userEditor.creation.password.policy.check.passed',
    source: 'user editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Password passed policy validation',
    payload: null, // { username: string }
    version: '1.0.0'
  },
  
  // Password failed policy check
  PASSWORD_POLICY_CHECK_FAILED: {
    eventName: 'userEditor.creation.password.policy.check.failed',
    source: 'user editor admin submodule',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Password failed policy validation',
    payload: null, // { username: string, policyViolations: string[] }
    errorData: null, // Validation error details
    version: '1.0.0'
  },
  
  // Password policy settings not found
  PASSWORD_POLICY_SETTINGS_NOT_FOUND: {
    eventName: 'userEditor.creation.password.policy.settings.not.found',
    source: 'user editor admin submodule',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Password policy settings not found in cache',
    payload: null, // { username: string }
    errorData: null, // Error details
    version: '1.0.0'
  },
  
  // User creation completed successfully
  COMPLETE: {
    eventName: 'userEditor.creation.complete',
    source: 'user editor admin submodule',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'User account created successfully',
    payload: null, // { userId: string, username: string }
    version: '1.0.0'
  },
  
  // User creation failed
  FAILED: {
    eventName: 'userEditor.creation.failed',
    source: 'user editor admin submodule',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'User account creation failed',
    payload: null, // ServiceError
    errorData: null, // Error details
    version: '1.0.0'
  }
};

/**
 * User Update Events
 * Events related to updating existing user accounts
 */
export const USER_UPDATE_EVENTS = {
  // Validation passed for user update
  VALIDATION_PASSED: {
    eventName: 'userEditor.update.validation.passed',
    source: 'user editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'User update validation passed',
    payload: null, // { userId: string, updatedFields: string[] }
    version: '1.0.0'
  },
  
  // Validation failed for user update
  VALIDATION_FAILED: {
    eventName: 'userEditor.update.validation.failed',
    source: 'user editor admin submodule',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'User update validation failed',
    payload: null, // { userId: string, field: string, message: string }
    errorData: null, // Validation error details
    version: '1.0.0'
  },
  
  // User update completed successfully
  COMPLETE: {
    eventName: 'userEditor.update.complete',
    source: 'user editor admin submodule',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'User account updated successfully',
    payload: null, // { userId: string, updatedFields: string[] }
    version: '1.0.0'
  },
  
  // User update failed
  FAILED: {
    eventName: 'userEditor.update.failed',
    source: 'user editor admin submodule',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'User account update failed',
    payload: null, // { userId: string, error: ServiceError }
    errorData: null, // Error details
    version: '1.0.0'
  },
  
  // Forbidden operation attempted on system user
  FORBIDDEN_OPERATION: {
    eventName: 'userEditor.update.forbidden.operation',
    source: 'user editor admin submodule',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Forbidden operation attempted on system user account',
    payload: null, // { userId: string, attemptedFields: string[], requestorUuid: string }
    errorData: null, // Error details
    version: '1.0.0'
  }
};

/**
 * User Loading Events
 * Events related to loading/fetching user data
 */
export const USER_LOAD_EVENTS = {
  // When a user is successfully loaded from the database
  COMPLETE: {
    eventName: 'userEditor.load.complete',
    source: 'user editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'User data loaded successfully',
    payload: null, // Will be of type { userId: string, username: string }
    version: '1.0.0'
  },
  
  // When a user load operation fails
  FAILED: {
    eventName: 'userEditor.load.failed',
    source: 'user editor admin submodule',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Failed to load user data',
    payload: null, // Will be of type { userId: string, error: ServiceError }
    errorData: null, // Will be filled with error details
    version: '1.0.0'
  },
  
  // When user data is not found
  NOT_FOUND: {
    eventName: 'userEditor.load.not.found',
    source: 'user editor admin submodule',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'User not found',
    payload: null, // Will be of type { userId: string }
    errorData: null, // Will be filled with details
    version: '1.0.0'
  }
};

/**
 * User Groups Removal Events
 * Events related to removing user from groups
 */
export const USER_GROUPS_REMOVE_EVENTS = {
  // When a request to remove user from groups is received
  REQUEST_RECEIVED: {
    eventName: 'userEditor.groups.remove.request.received',
    source: 'user editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'User groups removal request received',
    payload: null, // Will be of type { userId: string, groupIdsCount: number, requestorUuid: string }
    version: '1.0.0'
  },
  
  // When validation of removal data is successful
  VALIDATION_PASSED: {
    eventName: 'userEditor.groups.remove.validation.passed',
    source: 'user editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'User groups removal validation passed',
    payload: null, // Will be of type { userId: string, groupIdsCount: number }
    version: '1.0.0'
  },
  
  // When validation of removal data fails
  VALIDATION_FAILED: {
    eventName: 'userEditor.groups.remove.validation.failed',
    source: 'user editor admin submodule',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'User groups removal validation failed',
    payload: null, // Will be of type { userId: string, field: string, message: string }
    errorData: null, // Will be filled with validation error details
    version: '1.0.0'
  },
  
  // When database transaction starts
  TRANSACTION_START: {
    eventName: 'userEditor.groups.remove.transaction.start',
    source: 'user editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Starting database transaction for user groups removal',
    payload: null, // Will be of type { userId: string, requestorUuid: string }
    version: '1.0.0'
  },
  
  // When user groups removal is successfully completed
  COMPLETE: {
    eventName: 'userEditor.groups.remove.complete',
    source: 'user editor admin submodule',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'User successfully removed from groups',
    payload: null, // Will be of type { userId: string, removedCount: number, removedGroupIds: string[], requestorUuid: string }
    version: '1.0.0'
  },
  
  // When user groups removal process fails
  FAILED: {
    eventName: 'userEditor.groups.remove.failed',
    source: 'user editor admin submodule',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'User groups removal failed',
    payload: null, // Will be of type { userId: string, error: ServiceError }
    errorData: null, // Will be filled with error details
    version: '1.0.0'
  }
};