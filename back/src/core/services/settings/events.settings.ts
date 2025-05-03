/**
 * events.settings.ts - backend file
 * version: 1.0.0
 * 
 * This file contains event definitions for the settings management module.
 * It serves as a reference for creating and publishing settings-related events to the event bus.
 * Each event includes standard properties like eventName, eventType, severity, etc.
 * 
 * These events are used to track and react to settings operations
 * such as fetching, updating, and caching settings.
 */

/**
 * Settings Fetch Events
 * Events related to fetching settings processes
 */
export const SETTINGS_FETCH_EVENTS = {
  // When a request to fetch settings is initiated
  REQUEST_INITIATED: {
    eventName: 'settings.fetch.request.initiated',
    source: 'settings service module',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Settings fetch operation initiated',
    payload: null, // Will be of type { fetchType: string, environment?: string }
    version: '1.0.0'
  },
  
  // When a settings fetch operation is completed successfully
  SUCCESS: {
    eventName: 'settings.fetch.success',
    source: 'settings service module',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Settings fetch operation completed successfully',
    payload: null, // Will be of type { settingsCount: number, includedConfidential: boolean }
    version: '1.0.0'
  },
  
  // When settings are not found
  NOT_FOUND: {
    eventName: 'settings.fetch.not.found',
    source: 'settings service module',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Settings not found',
    payload: null, // Will be of type { sectionPath?: string, settingName?: string }
    version: '1.0.0'
  },
  
  // When a settings fetch operation fails
  ERROR: {
    eventName: 'settings.fetch.error',
    source: 'settings service module',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Error occurred during settings fetch operation',
    payload: null, // Will be of type error details
    errorData: null, // Will be filled with error details
    version: '1.0.0'
  }
};

/**
 * Settings By Name Fetch Events
 * Events specific to fetching a single setting by name
 */
export const SETTINGS_FETCH_BY_NAME_EVENTS = {
  // When a request to fetch a setting by name is initiated
  REQUEST_INITIATED: {
    eventName: 'settings.fetch.byname.initiated',
    source: 'settings service module',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Fetching setting by name initiated',
    payload: null, // Will be of type { sectionPath: string, settingName: string, environment?: string }
    version: '1.0.0'
  },
  
  // When a setting fetch by name is completed successfully
  SUCCESS: {
    eventName: 'settings.fetch.byname.success',
    source: 'settings service module',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Setting successfully fetched by name',
    payload: null, // Will be of type { sectionPath: string, settingName: string }
    version: '1.0.0'
  },
  
  // When a setting is not found by name
  NOT_FOUND: {
    eventName: 'settings.fetch.byname.not.found',
    source: 'settings service module',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Setting not found by name',
    payload: null, // Will be of type { sectionPath: string, settingName: string }
    version: '1.0.0'
  },
  
  // When a setting is confidential and cannot be accessed
  CONFIDENTIAL: {
    eventName: 'settings.fetch.byname.confidential',
    source: 'settings service module',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Setting is confidential and cannot be accessed',
    payload: null, // Will be of type { sectionPath: string, settingName: string }
    version: '1.0.0'
  }
};

/**
 * Settings By Section Fetch Events
 * Events specific to fetching settings by section
 */
export const SETTINGS_FETCH_BY_SECTION_EVENTS = {
  // When a request to fetch settings by section is initiated
  REQUEST_INITIATED: {
    eventName: 'settings.fetch.bysection.initiated',
    source: 'settings service module',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Fetching settings by section initiated',
    payload: null, // Will be of type { sectionPath: string, environment?: string }
    version: '1.0.0'
  },
  
  // When settings fetch by section is completed successfully
  SUCCESS: {
    eventName: 'settings.fetch.bysection.success',
    source: 'settings service module',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Settings successfully fetched by section',
    payload: null, // Will be of type { sectionPath: string, settingsCount: number }
    version: '1.0.0'
  }
};

/**
 * Settings All Fetch Events
 * Events specific to fetching all settings
 */
export const SETTINGS_FETCH_ALL_EVENTS = {
  // When a request to fetch all settings is initiated
  REQUEST_INITIATED: {
    eventName: 'settings.fetch.all.initiated',
    source: 'settings service module',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Fetching all settings initiated',
    payload: null, // Will be of type { environment?: string }
    version: '1.0.0'
  },
  
  // When all settings fetch is completed successfully
  SUCCESS: {
    eventName: 'settings.fetch.all.success',
    source: 'settings service module',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'All settings fetched successfully',
    payload: null, // Will be of type { settingsCount: number }
    version: '1.0.0'
  }
};

/**
 * Settings Update Events
 * Events related to updating settings
 */
export const SETTINGS_UPDATE_EVENTS = {
  // When a settings update request is initiated
  REQUEST_INITIATED: {
    eventName: 'settings.update.initiated',
    source: 'settings service module',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Settings update operation initiated',
    payload: null, // Will be of type { sectionPath: string, settingName: string }
    version: '1.0.0'
  },
  
  // When validation of settings update passes
  VALIDATION_PASSED: {
    eventName: 'settings.update.validation.passed',
    source: 'settings service module',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Settings update validation passed',
    payload: null, // Will be of type { sectionPath: string, settingName: string }
    version: '1.0.0'
  },
  
  // When validation of settings update fails
  VALIDATION_FAILED: {
    eventName: 'settings.update.validation.failed',
    source: 'settings service module',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Settings update validation failed',
    payload: null, // Will be of type { sectionPath: string, settingName: string, errors: string[] }
    errorData: null, // Will be filled with validation error details
    version: '1.0.0'
  },
  
  // When a settings update is completed successfully
  SUCCESS: {
    eventName: 'settings.update.success',
    source: 'settings service module',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Setting updated successfully',
    payload: null, // Will be of type { sectionPath: string, settingName: string }
    version: '1.0.0'
  },
  
  // When a settings update fails
  ERROR: {
    eventName: 'settings.update.error',
    source: 'settings service module',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Error occurred during settings update',
    payload: null, // Will be of type error details
    errorData: null, // Will be filled with error details
    version: '1.0.0'
  }
};

/**
 * Settings Cache Events
 * Events related to settings cache operations
 */
export const SETTINGS_CACHE_EVENTS = {
  // When settings cache is initialized
  INITIALIZED: {
    eventName: 'settings.cache.initialized',
    source: 'settings cache module',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Settings cache initialized',
    payload: null, // Will be of type { settingsCount: number }
    version: '1.0.0'
  },
  
  // When settings cache is refreshed
  REFRESHED: {
    eventName: 'settings.cache.refreshed',
    source: 'settings cache module',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Settings cache refreshed',
    payload: null, // Will be of type { settingsCount: number }
    version: '1.0.0'
  },
  
  // When settings cache refresh fails
  REFRESH_ERROR: {
    eventName: 'settings.cache.refresh.error',
    source: 'settings cache module',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Error refreshing settings cache',
    payload: null, // Will be of type error details
    errorData: null, // Will be filled with error details
    version: '1.0.0'
  },
  
  // When a setting is updated in the cache
  SETTING_UPDATED: {
    eventName: 'settings.cache.setting.updated',
    source: 'settings cache module',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Setting updated in cache',
    payload: null, // Will be of type { sectionPath: string, settingName: string }
    version: '1.0.0'
  },
  
  // When a setting is not found in the cache
  SETTING_NOT_FOUND: {
    eventName: 'settings.cache.setting.not.found',
    source: 'settings cache module',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Setting not found in cache',
    payload: null, // Will be of type { sectionPath: string, settingName: string }
    version: '1.0.0'
  }
};

/**
 * Controller Events for Settings Fetch
 * Events related to HTTP controller processing for settings fetch
 */
export const SETTINGS_FETCH_CONTROLLER_EVENTS = {
  // When HTTP request is received by controller
  HTTP_REQUEST_RECEIVED: {
    eventName: 'settings.controller.fetch.request.received',
    source: 'settings controller module',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP request received to fetch settings',
    payload: null, // Will be of type { method: string, url: string, fetchType: string }
    version: '1.0.0'
  },
  
  // When validation of fetch request fails
  VALIDATION_ERROR: {
    eventName: 'settings.controller.fetch.validation.error',
    source: 'settings controller module',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Settings fetch request validation failed',
    payload: null, // Will be of type { error: string, body: any }
    version: '1.0.0'
  },
  
  // When controller successfully processes the request and sends response
  HTTP_RESPONSE_SENT: {
    eventName: 'settings.controller.fetch.response.sent',
    source: 'settings controller module',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP response sent for settings fetch',
    payload: null, // Will be of type { fetchType: string, settingsCount: number, statusCode: number }
    version: '1.0.0'
  },
  
  // When controller encounters an error processing the request
  HTTP_ERROR: {
    eventName: 'settings.controller.fetch.error',
    source: 'settings controller module',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Error in settings fetch controller',
    payload: null, // Will be of type { errorCode: string, statusCode: number }
    errorData: null, // Will be filled with error details
    version: '1.0.0'
  }
};

/**
 * Controller Events for Settings Update
 * Events related to HTTP controller processing for settings update
 */
export const SETTINGS_UPDATE_CONTROLLER_EVENTS = {
  // When HTTP request is received by controller
  HTTP_REQUEST_RECEIVED: {
    eventName: 'settings.controller.update.request.received',
    source: 'settings controller module',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP request received to update setting',
    payload: null, // Will be of type { method: string, url: string, sectionPath: string, settingName: string }
    version: '1.0.0'
  },
  
  // When validation of update request fails
  VALIDATION_ERROR: {
    eventName: 'settings.controller.update.validation.error',
    source: 'settings controller module',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Settings update request validation failed',
    payload: null, // Will be of type { error: string, body: any }
    version: '1.0.0'
  },
  
  // When controller successfully processes the request and sends response
  HTTP_RESPONSE_SENT: {
    eventName: 'settings.controller.update.response.sent',
    source: 'settings controller module',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP response sent for settings update',
    payload: null, // Will be of type { sectionPath: string, settingName: string, statusCode: number }
    version: '1.0.0'
  },
  
  // When controller encounters an error processing the request
  HTTP_ERROR: {
    eventName: 'settings.controller.update.error',
    source: 'settings controller module',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Error in settings update controller',
    payload: null, // Will be of type { sectionPath: string, settingName: string, errorCode: string, statusCode: number }
    errorData: null, // Will be filled with error details
    version: '1.0.0'
  }
};