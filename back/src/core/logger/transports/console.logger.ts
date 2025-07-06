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
  id: '\x1b[90m',       // Gray
  // Rainbow colors for structured logging
  eventTime: '\x1b[34m', // Blue
  source: '\x1b[32m',    // Green
  event: '\x1b[35m',     // Magenta
  level: '\x1b[33m',     // Yellow
  eventUuid: '\x1b[36m', // Cyan
  userUuid: '\x1b[31m',  // Red
  payload: '\x1b[38;5;208m', // Orange
  metadata: '\x1b[90m'   // Gray
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
      
      const useColors = transportConfig.useColors || false;
      
      // Log separator line before event
      console[consoleMethod]('----');
      
      // Log each field as separate line
      console[consoleMethod](
        useColors ? `${colors.eventTime}event time:${colors.reset}` : 'event time:',
        timestamp ? formatTimestamp(timestamp, false) : 'null'
      );
      
      console[consoleMethod](
        useColors ? `${colors.source}source:${colors.reset}` : 'source:',
        source || 'null'
      );
      
      console[consoleMethod](
        useColors ? `${colors.event}event:${colors.reset}` : 'event:',
        eventName || 'null'
      );
      
      console[consoleMethod](
        useColors ? `${colors.level}level:${colors.reset}` : 'level:',
        severity || 'null'
      );
      
      console[consoleMethod](
        useColors ? `${colors.eventUuid}event UUID:${colors.reset}` : 'event UUID:',
        eventId || 'null'
      );
      
      console[consoleMethod](
        useColors ? `${colors.userUuid}user UUID:${colors.reset}` : 'user UUID:',
        requestorId || 'null'
      );
      
      // Log payload
      console[consoleMethod](
        useColors ? `${colors.payload}payload:${colors.reset}` : 'payload:',
        payload !== undefined ? formatObject(payload, transportConfig.prettyPrint || false) : 'null'
      );
      
      // Log metadata
      console[consoleMethod](
        useColors ? `${colors.metadata}metadata:${colors.reset}` : 'metadata:',
        metadata && Object.keys(metadata).length > 0 ? formatObject(metadata, transportConfig.prettyPrint || false) : 'null'
      );
    }
  };
};

// Export a default instance with standard configuration
export default consoleTransport();