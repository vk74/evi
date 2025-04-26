// filepath: /Users/vk/Library/Mobile Documents/com~apple~CloudDocs/code/ev2/back/src/core/logger/types.logger.ts
// version: 1.1
// Types and interfaces for the logger system
// Contains definitions for transports and subscription configurations

import { BaseEvent } from '../eventBus/types.events';

/**
 * Log levels for filtering and formatting logs
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Interface for logger transport
 * All transports must implement this interface
 */
export interface LoggerTransport {
  // Unique name for the transport
  name: string;
  
  // Log a message
  log(event: BaseEvent): void | Promise<void>;
  
  // Optional initialization method
  initialize?(): void | Promise<void>;
  
  // Optional cleanup method
  close?(): void | Promise<void>;
}

/**
 * Interface for logger subscription rule
 * Used to define which events to subscribe to
 */
export interface LoggerSubscriptionRule {
  // Event pattern to subscribe to (e.g., '*', 'user.*', 'auth.login.*')
  pattern: string;
  
  // Minimum severity for the subscription
  minSeverity?: 'debug' | 'info' | 'warning' | 'error' | 'critical';
}

/**
 * Interface for logger configuration
 */
export interface LoggerConfig {
  // Whether the logger is enabled
  enabled: boolean;
  // Default minimum log level (can be overridden in subscription rules)
  defaultLevel: LogLevel;
  // Subscription rules
  subscriptions: LoggerSubscriptionRule[];
  // Enabled transports
  enabledTransports: string[];
}

/**
 * Interface for console transport configuration
 */
export interface ConsoleTransportConfig {
  // Whether to use colors in console output
  useColors?: boolean;
  
  // Whether to include timestamp in output
  showTimestamp?: boolean;
  
  // Whether to include event ID in output
  showEventId?: boolean;
  
  // Whether to print full objects for payload/metadata
  prettyPrint?: boolean;
}