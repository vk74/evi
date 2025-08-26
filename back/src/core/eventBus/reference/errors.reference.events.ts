/**
 * errors.reference.events.ts - backend file
 * version: 1.0.02
 * 
 * This file contains event definitions for internal system errors 
 * related to the event bus and event validation.
 * It serves as a reference for creating and publishing error events to the event bus.
 * Each error event includes standard properties like eventName, eventType, severity, etc.
 * 
 * These events are used to track system-level issues with event processing,
 * especially validation failures.
 */

/**
 * Event Validation Error Events
 * Events related to failures in event validation process
 */
export const EVENT_VALIDATION_EVENTS = {
  // When an event fails validation checks
  VALIDATION_FAILED: {
    eventName: 'system.events.validation.failed',
    source: 'event validation system',
    eventType: 'system' as const,
    severity: 'warning' as const,
    eventMessage: 'Event validation failed due to missing or invalid fields',
    payload: null, // Will be of type { originalEventName: string, missingFields: string[] }
    errorData: null, // Will be filled with validation error details
    version: '1.0.0'
  },
  
  // When an event schema is missing or invalid
  SCHEMA_ERROR: {
    eventName: 'system.events.schema.error',
    source: 'event validation system',
    eventType: 'system' as const,
    severity: 'error' as const,
    eventMessage: 'Event schema error detected during validation',
    payload: null, // Will be of type { eventName: string, schemaIssue: string }
    errorData: null, // Will be filled with schema error details
    version: '1.0.0'
  },
  
  // When the event schema version is outdated or invalid
  SCHEMA_VERSION_ERROR: {
    eventName: 'system.events.schema.version.error',
    source: 'event validation system',
    eventType: 'system' as const,
    severity: 'error' as const,
    eventMessage: 'Event schema version is outdated or invalid',
    version: '1.0.0'
  }
};

/**
 * Event Bus Error Events
 * Events related to failures in event bus operations
 */
export const EVENT_BUS_EVENTS = {
  // When event publishing fails
  PUBLISH_FAILED: {
    eventName: 'system.events.publish.failed',
    source: 'event bus system',
    eventType: 'system' as const,
    severity: 'error' as const,
    eventMessage: 'Failed to publish event to event bus',
    payload: null, // Will be of type { originalEventName: string, reason: string }
    errorData: null, // Will be filled with error details
    version: '1.0.0'
  },
  
  // When an event handler throws an unhandled exception
  HANDLER_ERROR: {
    eventName: 'system.events.handler.error',
    source: 'event bus system',
    eventType: 'system' as const,
    severity: 'error' as const,
    eventMessage: 'Event handler threw an unhandled exception',
    payload: null, // Will be of type { originalEventName: string, handlerName: string }
    errorData: null, // Will be filled with error details
    version: '1.0.0'
  }
};

/**
 * System Error Events
 * Events related to internal system errors and template issues
 */
export const SYSTEM_ERROR_EVENTS = {
  // When an event template is not found in cache
  TEMPLATE_NOT_FOUND: {
    eventName: 'system.events.template.not.found',
    source: 'event factory system',
    eventType: 'system' as const,
    severity: 'error' as const,
    eventMessage: 'Event template not found in cache',
    version: '1.0.0'
  }
};

/**
 * Legacy export for backward compatibility
 */
export const EVENT_TEMPLATE_NOT_FOUND = SYSTEM_ERROR_EVENTS.TEMPLATE_NOT_FOUND;

