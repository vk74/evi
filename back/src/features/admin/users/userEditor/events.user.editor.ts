/**
 * events.user.editor.ts - backend file
 * version: 1.0.04
 * 
 * This file contains event definitions for the user management domain within the user editor admin submodule.
 * It serves as a reference for creating and publishing user-related events to the event bus.
 * Each event includes standard properties like eventName, eventType, severity, etc.
 * 
 * These events are used to track and react to user management operations
 * such as creation, updates, and status changes.
 */

/**
 * User Creation Events
 * Events related to user account creation processes
 */
export const USER_CREATION_EVENTS = {
  // When a request to create a user is received
  REQUEST_RECEIVED: {
    eventName: 'userEditor.creation.request.received',
    source: 'user editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'User creation request received',
    payload: null, // Will be of type CreateUserRequest
    version: '1.0'
  },
  
  // When a user creation request passes validation
  VALIDATION_PASSED: {
    eventName: 'userEditor.creation.validation.passed',
    source: 'user editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'User creation validation successful',
    payload: null, // Will be of type { username: string, email: string }
    version: '1.0'
  },
  
  // When a user creation request fails validation
  VALIDATION_FAILED: {
    eventName: 'userEditor.creation.validation.failed',
    source: 'user editor admin submodule',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'User creation validation failed',
    payload: null, // Will be of type { field: string, message: string }
    errorData: null, // Will be filled with validation error details
    version: '1.0'
  },
  
  // When a user creation operation is completed successfully
  COMPLETE: {
    eventName: 'userEditor.creation.complete',
    source: 'user editor admin submodule',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'User account created successfully',
    payload: null, // Will be of type { userId: string, username: string }
    version: '1.0'
  },
  
  // When a user creation operation fails
  FAILED: {
    eventName: 'userEditor.creation.failed',
    source: 'user editor admin submodule',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'User account creation failed',
    payload: null, // Will be of type ServiceError
    errorData: null, // Will be filled with error details
    version: '1.0'
  }
};

/**
 * User Update Events
 * Events related to updating existing user accounts
 */
export const USER_UPDATE_EVENTS = {
  // When a request to update a user is received
  REQUEST_RECEIVED: {
    eventName: 'userEditor.update.request.received',
    source: 'user editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'User update request received',
    payload: null, // Will be of type { userId: string, updatedFields: string[] }
    version: '1.0'
  },
  
  // When a user update request passes validation
  VALIDATION_PASSED: {
    eventName: 'userEditor.update.validation.passed',
    source: 'user editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'User update validation successful',
    payload: null, // Will be of type { userId: string, updatedFields: string[] }
    version: '1.0'
  },
  
  // When a user update request fails validation
  VALIDATION_FAILED: {
    eventName: 'userEditor.update.validation.failed',
    source: 'user editor admin submodule',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'User update validation failed',
    payload: null, // Will be of type { userId: string, field: string, message: string }
    errorData: null, // Will be filled with validation error details
    version: '1.0'
  },
  
  // When a user update operation is completed successfully
  COMPLETE: {
    eventName: 'userEditor.update.complete',
    source: 'user editor admin submodule',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'User account updated successfully',
    payload: null, // Will be of type { userId: string, updatedFields: string[] }
    version: '1.0'
  },
  
  // When a user update operation fails
  FAILED: {
    eventName: 'userEditor.update.failed',
    source: 'user editor admin submodule',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'User account update failed',
    payload: null, // Will be of type { userId: string, error: ServiceError }
    errorData: null, // Will be filled with error details
    version: '1.0'
  }
};

/**
 * User Loading Events
 * Events related to loading/fetching user data
 */
export const USER_LOAD_EVENTS = {
  // When a request to load user data is received
  REQUEST_RECEIVED: {
    eventName: 'userEditor.load.request.received',
    source: 'user editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'User load request received',
    payload: null, // Will be of type { userId: string }
    version: '1.0'
  },
  
  // When a user is successfully loaded from the database
  COMPLETE: {
    eventName: 'userEditor.load.complete',
    source: 'user editor admin submodule',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'User data loaded successfully',
    payload: null, // Will be of type { userId: string, username: string }
    version: '1.0'
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
    version: '1.0'
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
    version: '1.0'
  }
};