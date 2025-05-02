// version: 1.1
// Console transport for logger system
// Formats and outputs log events to the Node.js console

import { BaseEvent } from '../../eventBus/types.events';
import { LoggerTransport, ConsoleTransportConfig } from '../types.logger';

// Default configuration for console transport
const defaultConfig: ConsoleTransportConfig = {
  useColors: true,
  showTimestamp: true,
  showEventId: false,
  prettyPrint: true
};

// ANSI color codes for different log levels
const colors = {
  reset: '\x1b[0m',
  debug: '\x1b[90m',    // Gray
  info: '\x1b[36m',     // Cyan
  warn: '\x1b[33m',     // Yellow
  error: '\x1b[31m',    // Red
  critical: '\x1b[41m', // Red background
  eventName: '\x1b[35m',// Magenta
  time: '\x1b[90m',     // Gray
  id: '\x1b[90m'        // Gray
};

/**
 * Format log level for display
 */
const formatLevel = (severity: string | undefined, useColors: boolean): string => {
  const level = severity?.toLowerCase() || 'info';
  
  // Map to standard log level if needed
  let logLevel: string;
  switch (level) {
    case 'debug': 
    case 'info':
    case 'warn':
    case 'warning':
    case 'error':
    case 'critical':
      logLevel = level === 'warning' ? 'warn' : level;
      break;
    default:
      logLevel = 'info';
  }
  
  // Standardize the display format
  let displayLevel = logLevel.toUpperCase().padEnd(8);
  
  // Apply colors if enabled
  if (useColors) {
    const colorCode = colors[logLevel as keyof typeof colors] || colors.info;
    displayLevel = `${colorCode}${displayLevel}${colors.reset}`;
  }
  
  return displayLevel;
};

/**
 * Format event name for display
 */
const formatEventName = (eventName: string, useColors: boolean): string => {
  if (useColors) {
    return `${colors.eventName}${eventName}${colors.reset}`;
  }
  return eventName;
};

/**
 * Format timestamp for display
 */
const formatTimestamp = (timestamp: string, useColors: boolean): string => {
  try {
    const date = new Date(timestamp);
    const timeStr = date.toISOString().replace('T', ' ').substring(0, 23);
    
    if (useColors) {
      return `${colors.time}[${timeStr}]${colors.reset}`;
    }
    return `[${timeStr}]`;
  } catch (e) {
    // Fallback if timestamp is invalid
    return useColors ? `${colors.time}[${timestamp}]${colors.reset}` : `[${timestamp}]`;
  }
};

/**
 * Format event ID for display
 */
const formatEventId = (eventId: string, useColors: boolean): string => {
  const shortId = eventId.substring(eventId.lastIndexOf('-') + 1);
  
  if (useColors) {
    return `${colors.id}(${shortId})${colors.reset}`;
  }
  return `(${shortId})`;
};

/**
 * Format object for display
 */
const formatObject = (obj: unknown, prettyPrint: boolean): string => {
  if (!obj) return '';
  
  try {
    if (prettyPrint) {
      return JSON.stringify(obj, null, 2);
    }
    return JSON.stringify(obj);
  } catch (e) {
    return String(obj);
  }
};

/**
 * Console transport for the logger
 */
export const consoleTransport = (config: Partial<ConsoleTransportConfig> = {}): LoggerTransport => {
  // Merge default config with provided config
  const transportConfig: ConsoleTransportConfig = {
    ...defaultConfig,
    ...config
  };
  
  return {
    name: 'console',
    
    log(event: BaseEvent): void {
      // Extract relevant properties
      const { 
        eventId, 
        eventName, 
        timestamp, 
        source, 
        payload, 
        severity, 
        requestorId, 
        metadata 
      } = event;
      
      // Build log parts array
      const logParts: string[] = [];
      
      // Add timestamp if configured
      if (transportConfig.showTimestamp && timestamp) {
        logParts.push(formatTimestamp(timestamp, transportConfig.useColors || false));
      }
      
      // Add log level
      logParts.push(formatLevel(severity, transportConfig.useColors || false));
      
      // Add event name
      logParts.push(formatEventName(eventName, transportConfig.useColors || false));
      
      // Add event ID if configured
      if (transportConfig.showEventId && eventId) {
        logParts.push(formatEventId(eventId, transportConfig.useColors || false));
      }
      
      // Source if available
      if (source) {
        logParts.push(`from ${source}`);
      }
      
      // User ID if available
      if (requestorId) {
        logParts.push(`user: ${requestorId}`);
      }
      
      // Build main log message
      const logMessage = logParts.join(' ');
      
      // Determine console method to use
      let consoleMethod: keyof typeof console = 'log';
      switch (severity?.toLowerCase()) {
        case 'debug':
          consoleMethod = 'debug';
          break;
        case 'warn':
        case 'warning':
          consoleMethod = 'warn';
          break;
        case 'error':
        case 'critical':
          consoleMethod = 'error';
          break;
        default:
          consoleMethod = 'log';
      }
      
      // Log the main message
      console[consoleMethod](logMessage);
      
      // Log payload if present
      if (payload !== undefined) {
        console[consoleMethod]('Payload:', formatObject(payload, transportConfig.prettyPrint || false));
      }
      
      // Log metadata if present
      if (metadata && Object.keys(metadata).length > 0) {
        console[consoleMethod]('Metadata:', formatObject(metadata, transportConfig.prettyPrint || false));
      }
    }
  };
};

// Export a default instance with standard configuration
export default consoleTransport();