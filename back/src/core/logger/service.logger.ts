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

// Map to store registered transports
const transports = new Map<string, LoggerTransport>();

// Register the default console transport
transports.set('console', consoleTransport);

// Track current logger settings
// Note: Settings hierarchy - console-dependent settings only work when console logging is enabled
let currentSettings = {
  consoleLoggingEnabled: true,
  debugEventsEnabled: true  // Depends on consoleLoggingEnabled
  // Future console-dependent settings should be added here with similar dependency
};

/**
 * Initialize the logger service
 */
export const initialize = (): void => {
  console.log('Logger service initialized');

  // Initialize all transports that have an initialize method
  for (const transport of transports.values()) {
    if (typeof transport.initialize === 'function') {
      transport.initialize();
    }
  }
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
  // 2. Debug events setting only works when console logging is enabled
  // 3. Future console-dependent settings should follow the same pattern
  
  const isDebugEvent = event.severity === 'debug';
  
  // If console logging is disabled and this is a debug event, skip completely
  // (debug events are primarily for console output)
  if (!currentSettings.consoleLoggingEnabled && isDebugEvent) {
    return;
  }
  
  // If console logging is enabled but debug events are disabled, skip debug events
  if (currentSettings.consoleLoggingEnabled && !currentSettings.debugEventsEnabled && isDebugEvent) {
    return;
  }

  // TODO: Add similar hierarchical checks for future console-dependent settings here

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
  console.log(`[Logger] ${enabled ? 'Enabling' : 'Disabling'} console logging`);
  
  currentSettings.consoleLoggingEnabled = enabled;
  
  if (enabled) {
    // Ensure console transport is registered
    if (!transports.has('console')) {
      transports.set('console', consoleTransport);
      console.log('[Logger] Console transport registered');
    }
  } else {
    // Remove console transport
    const removed = transports.delete('console');
    if (removed) {
      console.log('[Logger] Console transport unregistered');
    }
  }
};

/**
 * Apply debug events logging setting change
 * Controls whether debug-level events are processed and logged
 * Note: This setting only works when console logging is enabled (hierarchical dependency)
 */
export const applyDebugEventsSetting = (enabled: boolean): void => {
  console.log(`[Logger] ${enabled ? 'Enabling' : 'Disabling'} debug events logging`);
  
  currentSettings.debugEventsEnabled = enabled;
  
  // Debug filtering is handled in processEvent method with console logging dependency
  if (!currentSettings.consoleLoggingEnabled) {
    console.log('[Logger] Note: Debug events setting will not take effect until console logging is enabled');
  } else {
    console.log('[Logger] Debug events setting applied');
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
        console.error(`Error closing transport '${transport.name}':`, error);
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
  getCurrentSettings,
  close
};