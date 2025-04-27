// version: 1.1
// Logger service implementation
// Handles routing of log events to the appropriate transports

import { BaseEvent } from '../eventBus/types.events';
import { LoggerTransport } from './types.logger';
import consoleTransport from './transports/console.logger';

// Map to store registered transports
const transports = new Map<string, LoggerTransport>();

// Register the default console transport
transports.set('console', consoleTransport);

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
 */
export const processEvent = (event: BaseEvent): void => {
  // Send to each transport
  for (const transport of transports.values()) {
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
  close
};