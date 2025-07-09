/**
 * service.logger.ts - backend file
 * version: 1.2.0
 * Logger service implementation that handles routing of log events to appropriate transports.
 * Provides methods for transport management and settings-based reconfiguration.
 * Supports dynamic enable/disable of console logging and debug events filtering.
 */

import { BaseEvent } from '../eventBus/types.events';
import { LoggerTransport } from './types.logger';
import consoleTransport from './transports/console.logger';
import fabricEvents from '../eventBus/fabric.events';
import { 
  LOGGER_INITIALIZATION_EVENTS,
  LOGGER_TRANSPORT_EVENTS,
  LOGGER_SETTINGS_EVENTS
} from './events.logger';

// Map to store registered transports
const transports = new Map<string, LoggerTransport>();

// Register the default console transport
transports.set('console', consoleTransport);

// Track current logger settings
// Note: Settings hierarchy - console-dependent settings only work when console logging is enabled
let currentSettings = {
  consoleLoggingEnabled: true,
  debugEventsEnabled: true,  // Depends on consoleLoggingEnabled
  infoEventsEnabled: true,   // Depends on consoleLoggingEnabled
  errorEventsEnabled: true   // Depends on consoleLoggingEnabled
};

/**
 * Initialize the logger service
 */
export const initialize = (): void => {
  const initialTransportsCount = transports.size;
  const transportNames = Array.from(transports.keys());
  
  fabricEvents.createAndPublishEvent({
    eventName: LOGGER_INITIALIZATION_EVENTS.SERVICE_INIT_STARTED.eventName,
    payload: {
      transportsCount: initialTransportsCount,
      transportNames
    }
  });

  const initializedTransports: string[] = [];
  
  // Initialize all transports that have an initialize method
  for (const transport of transports.values()) {
    if (typeof transport.initialize === 'function') {
      try {
        transport.initialize();
        initializedTransports.push(transport.name);
      } catch (error) {
        fabricEvents.createAndPublishEvent({
          eventName: LOGGER_TRANSPORT_EVENTS.TRANSPORT_INIT_ERROR.eventName,
          payload: {
            transportName: transport.name
          },
          errorData: error instanceof Error ? error.message : String(error)
        });
      }
    } else {
      initializedTransports.push(transport.name);
    }
  }
  
  fabricEvents.createAndPublishEvent({
    eventName: LOGGER_INITIALIZATION_EVENTS.SERVICE_INIT_SUCCESS.eventName,
    payload: {
      transportsCount: transports.size,
      initializedTransports
    }
  });
};

/**
 * Register a new transport
 */
export const registerTransport = (transport: LoggerTransport): void => {
  if (!transport.name) {
    throw new Error('Transport must have a name');
  }
  
  transports.set(transport.name, transport);
};

/**
 * Unregister a transport
 */
export const unregisterTransport = (transportName: string): boolean => {
  return transports.delete(transportName);
};

/**
 * Process a log event and send to appropriate transports
 * Applies hierarchical settings filtering where console-dependent settings 
 * only work when console logging is enabled
 */
export const processEvent = (event: BaseEvent): void => {
  // Apply hierarchical settings logic:
  // 1. If console logging is disabled, all console-dependent settings are ignored
  // 2. Level-specific settings (debug, info, error) only work when console logging is enabled
  
  const eventSeverity = event.severity?.toLowerCase();
  const isDebugEvent = eventSeverity === 'debug';
  const isInfoEvent = eventSeverity === 'info';
  const isErrorEvent = eventSeverity === 'error' || eventSeverity === 'critical';
  
  // If console logging is disabled, apply level-specific filtering for console-dependent events
  if (!currentSettings.consoleLoggingEnabled) {
    // Skip debug, info, and error events when console logging is disabled
    // (these events are primarily for console output)
    if (isDebugEvent || isInfoEvent || isErrorEvent) {
      return;
    }
  }
  
  // If console logging is enabled, apply level-specific settings
  if (currentSettings.consoleLoggingEnabled) {
    // Skip debug events if debug events are disabled
    if (!currentSettings.debugEventsEnabled && isDebugEvent) {
      return;
    }
    
    // Skip info events if info events are disabled
    if (!currentSettings.infoEventsEnabled && isInfoEvent) {
      return;
    }
    
    // Skip error/critical events if error events are disabled
    if (!currentSettings.errorEventsEnabled && isErrorEvent) {
      return;
    }
  }

  // Send to each transport that should receive this event
  for (const transport of transports.values()) {
    // Skip console transport if console logging is disabled
    if (transport.name === 'console' && !currentSettings.consoleLoggingEnabled) {
      continue;
    }
    
    try {
      transport.log(event);
    } catch (error) {
      console.error(`Error in transport '${transport.name}':`, error);
    }
  }
};

/**
 * Get registered transports list
 */
export const getTransports = (): string[] => {
  return Array.from(transports.keys());
};

/**
 * Apply console logging setting change
 * Enables or disables console transport based on setting value
 */
export const applyConsoleLoggingSetting = (enabled: boolean): void => {
  const previousState = currentSettings.consoleLoggingEnabled;
  currentSettings.consoleLoggingEnabled = enabled;
  
  if (enabled) {
    fabricEvents.createAndPublishEvent({
      eventName: LOGGER_SETTINGS_EVENTS.CONSOLE_LOGGING_ENABLED.eventName,
      payload: {
        previousState
      }
    });
    
    // Ensure console transport is registered
    if (!transports.has('console')) {
      transports.set('console', consoleTransport);
      fabricEvents.createAndPublishEvent({
        eventName: LOGGER_TRANSPORT_EVENTS.TRANSPORT_REGISTERED.eventName,
        payload: {
          transportName: 'console'
        }
      });
    }
  } else {
    fabricEvents.createAndPublishEvent({
      eventName: LOGGER_SETTINGS_EVENTS.CONSOLE_LOGGING_DISABLED.eventName,
      payload: {
        previousState
      }
    });
    
    // Remove console transport
    const removed = transports.delete('console');
    if (removed) {
      fabricEvents.createAndPublishEvent({
        eventName: LOGGER_TRANSPORT_EVENTS.TRANSPORT_UNREGISTERED.eventName,
        payload: {
          transportName: 'console',
          success: true
        }
      });
    }
  }
};

/**
 * Apply debug events logging setting change
 * Controls whether debug-level events are processed and logged
 * Note: This setting only works when console logging is enabled (hierarchical dependency)
 */
export const applyDebugEventsSetting = (enabled: boolean): void => {
  currentSettings.debugEventsEnabled = enabled;
  
  if (enabled) {
    fabricEvents.createAndPublishEvent({
      eventName: LOGGER_SETTINGS_EVENTS.DEBUG_EVENTS_ENABLED.eventName,
      payload: {
        consoleLoggingEnabled: currentSettings.consoleLoggingEnabled
      }
    });
  } else {
    fabricEvents.createAndPublishEvent({
      eventName: LOGGER_SETTINGS_EVENTS.DEBUG_EVENTS_DISABLED.eventName,
      payload: {
        consoleLoggingEnabled: currentSettings.consoleLoggingEnabled
      }
    });
  }
};

/**
 * Apply info events logging setting change
 * Controls whether info-level events are processed and logged
 * Note: This setting only works when console logging is enabled (hierarchical dependency)
 */
export const applyInfoEventsSetting = (enabled: boolean): void => {
  currentSettings.infoEventsEnabled = enabled;
  
  if (enabled) {
    fabricEvents.createAndPublishEvent({
      eventName: LOGGER_SETTINGS_EVENTS.INFO_EVENTS_ENABLED.eventName,
      payload: {
        consoleLoggingEnabled: currentSettings.consoleLoggingEnabled
      }
    });
  } else {
    fabricEvents.createAndPublishEvent({
      eventName: LOGGER_SETTINGS_EVENTS.INFO_EVENTS_DISABLED.eventName,
      payload: {
        consoleLoggingEnabled: currentSettings.consoleLoggingEnabled
      }
    });
  }
};

/**
 * Apply error events logging setting change
 * Controls whether error/critical-level events are processed and logged
 * Note: This setting only works when console logging is enabled (hierarchical dependency)
 */
export const applyErrorEventsSetting = (enabled: boolean): void => {
  currentSettings.errorEventsEnabled = enabled;
  
  if (enabled) {
    fabricEvents.createAndPublishEvent({
      eventName: LOGGER_SETTINGS_EVENTS.ERROR_EVENTS_ENABLED.eventName,
      payload: {
        consoleLoggingEnabled: currentSettings.consoleLoggingEnabled
      }
    });
  } else {
    fabricEvents.createAndPublishEvent({
      eventName: LOGGER_SETTINGS_EVENTS.ERROR_EVENTS_DISABLED.eventName,
      payload: {
        consoleLoggingEnabled: currentSettings.consoleLoggingEnabled
      }
    });
  }
};

/**
 * Get current logger settings
 */
export const getCurrentSettings = () => {
  return { ...currentSettings };
};

/**
 * Close all transports
 */
export const close = async (): Promise<void> => {
  const promises: Promise<void>[] = [];
  
  for (const transport of transports.values()) {
    if (typeof transport.close === 'function') {
      try {
        const result = transport.close();
        if (result instanceof Promise) {
          promises.push(result);
        }
      } catch (error) {
        fabricEvents.createAndPublishEvent({
          eventName: LOGGER_TRANSPORT_EVENTS.TRANSPORT_CLOSE_ERROR.eventName,
          payload: {
            transportName: transport.name
          },
          errorData: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }
  
  if (promises.length > 0) {
    await Promise.all(promises);
  }
};

// Export service functions
export default {
  initialize,
  processEvent,
  registerTransport,
  unregisterTransport,
  getTransports,
  applyConsoleLoggingSetting,
  applyDebugEventsSetting,
  applyInfoEventsSetting,
  applyErrorEventsSetting,
  getCurrentSettings,
  close
};