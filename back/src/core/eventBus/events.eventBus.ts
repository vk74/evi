/**
 * events.eventBus.ts - backend file
 * version: 1.0.0
 * 
 * This file contains event definitions for the event bus service module.
 * It serves as a reference for creating and publishing event bus-related events.
 * Each event includes standard properties like eventName, eventType, severity, etc.
 * 
 * These events are used to track and react to event bus operations
 * such as initialization, settings management, and domain configuration.
 */

/**
 * Event Bus Service Initialization Events
 * Events related to event bus service startup and initialization
 */
export const EVENTBUS_INITIALIZATION_EVENTS = {
  // When event bus service initialization is started
  SERVICE_INIT_STARTED: {
    eventName: 'eventBus.initialization.service.started',
    source: 'eventBus service module',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Event Bus service initialization started',
    payload: null, // Will be of type { domainsCount: number, domains: string[] }
    version: '1.0.0'
  },
  
  // When event bus service initialization is completed successfully
  SERVICE_INIT_SUCCESS: {
    eventName: 'eventBus.initialization.service.success',
    source: 'eventBus service module',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Event Bus service initialized successfully',
    payload: null, // Will be of type { domainsCount: number, enabledDomains: string[] }
    version: '1.0.0'
  },
  
  // When event bus subscriptions initialization is started
  SUBSCRIPTIONS_INIT_STARTED: {
    eventName: 'eventBus.initialization.subscriptions.started',
    source: 'eventBus subscriptions module',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Event Bus subscriptions initialization started',
    payload: null, // Will be of type { subscriptionType: string }
    version: '1.0.0'
  },
  
  // When event bus subscriptions initialization is completed
  SUBSCRIPTIONS_INIT_SUCCESS: {
    eventName: 'eventBus.initialization.subscriptions.success',
    source: 'eventBus subscriptions module',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Event Bus subscriptions initialized successfully',
    payload: null, // Will be of type { pattern: string, subscriptionId: string }
    version: '1.0.0'
  }
};

/**
 * Event Bus Settings Management Events
 * Events related to settings loading and domain configuration
 */
export const EVENTBUS_SETTINGS_EVENTS = {
  // When initial settings load is started
  INITIAL_LOAD_STARTED: {
    eventName: 'eventBus.settings.initial.load.started',
    source: 'eventBus subscriptions module',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Event Bus settings initial load started',
    payload: null, // Will be of type { settingsToLoad: string[] }
    version: '1.0.0'
  },
  
  // When initial settings load is completed successfully
  INITIAL_LOAD_SUCCESS: {
    eventName: 'eventBus.settings.initial.load.success',
    source: 'eventBus subscriptions module',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Event Bus settings loaded successfully',
    payload: null, // Will be of type { processedSettings: number, totalSettings: number }
    version: '1.0.0'
  },
  
  // When settings change processing is started
  CHANGE_PROCESSING_STARTED: {
    eventName: 'eventBus.settings.change.processing.started',
    source: 'eventBus subscriptions module',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Event Bus settings change processing started',
    payload: null, // Will be of type { sectionPath: string, settingName: string }
    version: '1.0.0'
  },
  
  // When settings change processing is completed successfully
  CHANGE_PROCESSING_SUCCESS: {
    eventName: 'eventBus.settings.change.processing.success',
    source: 'eventBus subscriptions module',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Event Bus settings change processed successfully',
    payload: null, // Will be of type { sectionPath: string, settingName: string, domain: string, newValue: boolean }
    version: '1.0.0'
  },
  
  // When a domain setting is changed
  DOMAIN_SETTING_CHANGED: {
    eventName: 'eventBus.settings.domain.setting.changed',
    source: 'eventBus service module',
    eventType: 'app' as const,
    severity: 'info' as const,
    eventMessage: 'Event Bus domain setting changed',
    payload: null, // Will be of type { domain: string, oldValue: boolean, newValue: boolean }
    version: '1.0.0'
  },
  

};

/**
 * Event Bus Error Events
 * Events related to error handling and troubleshooting
 */
export const EVENTBUS_ERROR_EVENTS = {
  // When invalid settings payload is received
  INVALID_SETTINGS_PAYLOAD: {
    eventName: 'eventBus.error.invalid.settings.payload',
    source: 'eventBus subscriptions module',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Invalid settings payload received',
    payload: null, // Will be of type { eventName: string, receivedPayload: any }
    errorData: null, // Will be filled with error details
    version: '1.0.0'
  },
  
  // When a setting is not found in cache
  SETTING_NOT_FOUND: {
    eventName: 'eventBus.error.setting.not.found',
    source: 'eventBus subscriptions module',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Event Bus setting not found',
    payload: null, // Will be of type { sectionPath: string, settingName: string }
    version: '1.0.0'
  },
  
  // When settings processing encounters an error
  SETTINGS_PROCESSING_ERROR: {
    eventName: 'eventBus.error.settings.processing',
    source: 'eventBus subscriptions module',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Error processing Event Bus settings',
    payload: null, // Will be of type { sectionPath?: string, settingName?: string }
    errorData: null, // Will be filled with error details
    version: '1.0.0'
  },
  
  // When an unknown domain is encountered
  UNKNOWN_DOMAIN: {
    eventName: 'eventBus.error.unknown.domain',
    source: 'eventBus service module',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Unknown domain in Event Bus settings',
    payload: null, // Will be of type { domain: string, availableDomains: string[] }
    version: '1.0.0'
  }
}; 