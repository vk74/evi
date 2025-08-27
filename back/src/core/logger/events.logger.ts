/**
 * events.logger.ts - backend file
 * version: 1.0.0
 * 
 * This file contains event definitions for the logger service module.
 * It serves as a reference for creating and publishing logger-related events to the event bus.
 * Each event includes standard properties like eventName, eventType, severity, etc.
 * 
 * These events are used to track and react to logger operations
 * such as initialization, transport management, and settings configuration.
 */

/**
 * Logger Service Initialization Events
 * Events related to logger service startup and initialization
 */
export const LOGGER_INITIALIZATION_EVENTS = {
  // When logger service initialization is started
  SERVICE_INIT_STARTED: {
    eventName: 'logger.service.init.started',
    source: 'logger service module',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Logger service initialization started',
    payload: null, // Will be of type { transportsCount: number }
    version: '1.0.0'
  },
  
  // When logger service initialization is completed successfully
  SERVICE_INIT_SUCCESS: {
    eventName: 'logger.service.init.success',
    source: 'logger service module',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Logger service initialized successfully',
    payload: null, // Will be of type { transportsCount: number, initializedTransports: string[] }
    version: '1.0.0'
  },
  
  // When logger subscriptions initialization is started
  SUBSCRIPTIONS_INIT_STARTED: {
    eventName: 'logger.subscriptions.init.started',
    source: 'logger subscriptions module',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Logger subscriptions initialization started',
    payload: null, // Will be of type { rulesCount: number }
    version: '1.0.0'
  },
  
  // When logger subscriptions initialization is completed
  SUBSCRIPTIONS_INIT_SUCCESS: {
    eventName: 'logger.subscriptions.init.success',
    source: 'logger subscriptions module',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Logger subscriptions initialized successfully',
    payload: null, // Will be of type { subscriptionsCount: number, patterns: string[] }
    version: '1.0.0'
  }
};

/**
 * Logger Transport Management Events
 * Events related to transport registration and management
 */
export const LOGGER_TRANSPORT_EVENTS = {
  // When a transport is registered
  TRANSPORT_REGISTERED: {
    eventName: 'logger.transport.registered',
    source: 'logger service module',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Logger transport registered',
    payload: null, // Will be of type { transportName: string }
    version: '1.0.0'
  },
  
  // When a transport is unregistered
  TRANSPORT_UNREGISTERED: {
    eventName: 'logger.transport.unregistered',
    source: 'logger service module',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Logger transport unregistered',
    payload: null, // Will be of type { transportName: string, success: boolean }
    version: '1.0.0'
  },
  
  // When transport initialization fails
  TRANSPORT_INIT_ERROR: {
    eventName: 'logger.transport.init.error',
    source: 'logger service module',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Error initializing logger transport',
    payload: null, // Will be of type { transportName: string }
    errorData: null, // Will be filled with error details
    version: '1.0.0'
  },
  
  // When transport closing fails
  TRANSPORT_CLOSE_ERROR: {
    eventName: 'logger.transport.close.error',
    source: 'logger service module',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Error closing logger transport',
    payload: null, // Will be of type { transportName: string }
    errorData: null, // Will be filled with error details
    version: '1.0.0'
  },
  
  // When transport logging fails
  TRANSPORT_LOG_ERROR: {
    eventName: 'logger.transport.log.error',
    source: 'logger service module',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Error in transport logging',
    payload: null, // Will be of type { transportName: string }
    errorData: null, // Will be filled with error details
    version: '1.0.0'
  }
};

/**
 * Logger Settings Management Events
 * Events related to logger settings loading and configuration
 */
export const LOGGER_SETTINGS_EVENTS = {
  // When initial settings loading is started
  INITIAL_LOAD_STARTED: {
    eventName: 'logger.settings.initial.load.started',
    source: 'logger subscriptions module',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Loading initial logger settings',
    payload: null, // Will be of type { settingsToLoad: string[] }
    version: '1.0.0'
  },
  
  // When initial settings loading is completed
  INITIAL_LOAD_SUCCESS: {
    eventName: 'logger.settings.initial.load.success',
    source: 'logger subscriptions module',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Initial logger settings loaded successfully',
    payload: null, // Will be of type { consoleLogging: boolean, debugEvents: boolean, infoEvents: boolean, errorEvents: boolean }
    version: '1.0.0'
  },
  
  // When console logging is enabled
  CONSOLE_LOGGING_ENABLED: {
    eventName: 'logger.settings.console.enabled',
    source: 'logger service module',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Console logging enabled',
    payload: null, // Will be of type { previousState: boolean }
    version: '1.0.0'
  },
  
  // When console logging is disabled
  CONSOLE_LOGGING_DISABLED: {
    eventName: 'logger.settings.console.disabled',
    source: 'logger service module',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Console logging disabled',
    payload: null, // Will be of type { previousState: boolean }
    version: '1.0.0'
  },
  
  // When debug events logging is enabled
  DEBUG_EVENTS_ENABLED: {
    eventName: 'logger.settings.debug.enabled',
    source: 'logger service module',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Debug events logging enabled',
    payload: null, // Will be of type { consoleLoggingEnabled: boolean }
    version: '1.0.0'
  },
  
  // When debug events logging is disabled
  DEBUG_EVENTS_DISABLED: {
    eventName: 'logger.settings.debug.disabled',
    source: 'logger service module',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Debug events logging disabled',
    payload: null, // Will be of type { consoleLoggingEnabled: boolean }
    version: '1.0.0'
  },
  
  // When info events logging is enabled
  INFO_EVENTS_ENABLED: {
    eventName: 'logger.settings.info.enabled',
    source: 'logger service module',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Info events logging enabled',
    payload: null, // Will be of type { consoleLoggingEnabled: boolean }
    version: '1.0.0'
  },
  
  // When info events logging is disabled
  INFO_EVENTS_DISABLED: {
    eventName: 'logger.settings.info.disabled',
    source: 'logger service module',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Info events logging disabled',
    payload: null, // Will be of type { consoleLoggingEnabled: boolean }
    version: '1.0.0'
  },
  
  // When error events logging is enabled
  ERROR_EVENTS_ENABLED: {
    eventName: 'logger.settings.error.enabled',
    source: 'logger service module',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Error events logging enabled',
    payload: null, // Will be of type { consoleLoggingEnabled: boolean }
    version: '1.0.0'
  },
  
  // When error events logging is disabled
  ERROR_EVENTS_DISABLED: {
    eventName: 'logger.settings.error.disabled',
    source: 'logger service module',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Error events logging disabled',
    payload: null, // Will be of type { consoleLoggingEnabled: boolean }
    version: '1.0.0'
  },
  
  // When settings change processing starts
  CHANGE_PROCESSING_STARTED: {
    eventName: 'logger.settings.change.processing.started',
    source: 'logger subscriptions module',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Processing logger settings change',
    payload: null, // Will be of type { sectionPath: string, settingName: string }
    version: '1.0.0'
  },
  
  // When settings change processing is completed
  CHANGE_PROCESSING_SUCCESS: {
    eventName: 'logger.settings.change.processing.success',
    source: 'logger subscriptions module',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Logger settings change processed successfully',
    payload: null, // Will be of type { sectionPath: string, settingName: string, newValue: any }
    version: '1.0.0'
  }
};

/**
 * Logger Error Events
 * Events related to logger configuration and operational errors
 */
export const LOGGER_ERROR_EVENTS = {
  // When settings processing fails
  SETTINGS_PROCESSING_ERROR: {
    eventName: 'logger.error.settings.processing',
    source: 'logger subscriptions module',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Error processing logger settings change',
    payload: null, // Will be of type { sectionPath?: string, settingName?: string }
    errorData: null, // Will be filled with error details
    version: '1.0.0'
  },
  
  // When setting is not found in cache
  SETTING_NOT_FOUND: {
    eventName: 'logger.error.setting.not.found',
    source: 'logger subscriptions module',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Logger setting not found in cache',
    payload: null, // Will be of type { sectionPath: string, settingName: string }
    version: '1.0.0'
  },
  
  // When invalid payload is received in settings event
  INVALID_SETTINGS_PAYLOAD: {
    eventName: 'logger.error.invalid.settings.payload',
    source: 'logger subscriptions module',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Invalid payload in logger settings update event',
    payload: null, // Will be of type { eventName: string, receivedPayload: any }
    version: '1.0.0'
  },
  
  // When unknown setting name is encountered
  UNKNOWN_SETTING: {
    eventName: 'logger.error.unknown.setting',
    source: 'logger subscriptions module',
    eventType: 'app' as const,
    severity: 'warning' as const,
    eventMessage: 'Unknown logger setting encountered',
    payload: null, // Will be of type { settingName: string, sectionPath: string }
    version: '1.0.0'
  },
  
  // When initial settings loading fails
  INITIAL_LOAD_ERROR: {
    eventName: 'logger.error.initial.load',
    source: 'logger subscriptions module',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Error loading initial logger settings',
    payload: null, // Will be of type error details
    errorData: null, // Will be filled with error details
    version: '1.0.0'
  }
};

/**
 * Logger Subscription Management Events
 * Events related to event bus subscription management
 */
export const LOGGER_SUBSCRIPTION_EVENTS = {
  // When subscription to event pattern is created
  PATTERN_SUBSCRIBED: {
    eventName: 'logger.subscription.pattern.subscribed',
    source: 'logger subscriptions module',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Logger subscribed to event pattern',
    payload: null, // Will be of type { pattern: string, subscriptionId: string }
    version: '1.0.0'
  },
  
  // When settings subscription is initialized
  SETTINGS_SUBSCRIPTION_INIT: {
    eventName: 'logger.subscription.settings.init',
    source: 'logger subscriptions module',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Logger settings subscription initialized',
    payload: null, // Will be of type { pattern: string, subscriptionId: string }
    version: '1.0.0'
  },
  
  // When subscriptions are cleared
  SUBSCRIPTIONS_CLEARED: {
    eventName: 'logger.subscription.cleared',
    source: 'logger subscriptions module',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Logger subscriptions cleared',
    payload: null, // Will be of type { clearedCount: number }
    version: '1.0.0'
  }
}; 