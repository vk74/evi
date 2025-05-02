// Event Factory for creating standardized event instances that conform to BaseEvent interface
// Provides methods for creating basic events, related events, and causal events with proper metadata

const { v4: uuidv4 } = require('uuid');
import { BaseEvent, EventFactoryConfig, CreateEventOptions } from './types.events';
import { getEventSchemaVersion, isValidEventType } from './reference/index.reference.events';
import { assertValidEvent } from './validate.events';
import os from 'os';

/**
 * Factory for creating standardized event objects
 */
export const createEventFactory = (config: EventFactoryConfig) => {
  // Default configuration
  const factoryConfig: Required<EventFactoryConfig> = {
    source: config.source,
    environment: config.environment || process.env.NODE_ENV || 'development',
    validateOnCreate: config.validateOnCreate !== undefined ? config.validateOnCreate : true
  };

  // Basic host information for all events
  const hostInfo = {
    hostname: os.hostname(),
    processId: process.pid
  };

  /**
   * Get the default event type based on the event name pattern
   * This is a helper function to determine the event type if not explicitly provided
   */
  const getDefaultEventType = (eventName: string): 'app' | 'system' | 'security' | 'integration' | 'performance' => {
    // Simple pattern matching based on event name prefixes
    if (eventName.startsWith('security.') || eventName.includes('.auth.')) {
      return 'security';
    } else if (eventName.startsWith('system.') || eventName.includes('.startup.') || eventName.includes('.shutdown.')) {
      return 'system';
    } else if (eventName.startsWith('perf.') || eventName.includes('.performance.')) {
      return 'performance';
    } else if (eventName.startsWith('integration.') || eventName.includes('.external.')) {
      return 'integration';
    } else {
      // Default to 'app' for most business-related events
      return 'app';
    }
  };

  /**
   * Creates a basic event with the specified type and payload
   */
  const createEvent = (
    eventName: string,
    payload?: unknown,
    options: CreateEventOptions = {}
  ): BaseEvent => {
    // Verify that the event type is registered
    if (!isValidEventType(eventName)) {
      console.log(`Warning: Creating event with unregistered type: ${eventName}`);
    }

    // Get version from registry if not specified
    const version = options.version || getEventSchemaVersion(eventName);
    
    // Get event type (category) from options or determine based on event name
    const eventType = options.eventType || getDefaultEventType(eventName);

    // Create the event with required fields
    const event: BaseEvent = {
      eventId: `event-${uuidv4()}`,
      eventName,
      eventType,
      version,
      timestamp: new Date().toISOString(),
      source: options.source || factoryConfig.source,
      payload,
      hostInfo,
      environment: factoryConfig.environment,
    };

    // Add optional fields if provided
    if (options.correlationId) event.correlationId = options.correlationId;
    if (options.causationId) event.causationId = options.causationId;
    if (options.userId) event.userId = options.userId;
    if (options.severity) event.severity = options.severity;
    if (options.duration) event.duration = options.duration;
    if (options.traceId) event.traceId = options.traceId;
    if (options.spanId) event.spanId = options.spanId;
    if (options.ipAddress) event.ipAddress = options.ipAddress;
    if (options.sessionId) event.sessionId = options.sessionId;
    if (options.requestPath) event.requestPath = options.requestPath;
    if (options.tags) event.tags = options.tags;
    if (options.metadata) event.metadata = options.metadata;
    if (options.searchableFields) event.searchableFields = options.searchableFields;

    // Validate the event if validation is enabled
    if (factoryConfig.validateOnCreate) {
      assertValidEvent(event);
    }

    return event;
  };

  /**
   * Creates an event related to an existing event (shares correlation ID)
   */
  const createRelatedEvent = (
    baseEvent: BaseEvent,
    eventName: string,
    payload?: unknown,
    options: Omit<CreateEventOptions, 'correlationId'> = {}
  ): BaseEvent => {
    // Use the correlation ID from the base event
    // If base event doesn't have a correlation ID, use its event ID
    const correlationId = baseEvent.correlationId || baseEvent.eventId;

    return createEvent(eventName, payload, {
      ...options,
      correlationId,
      // Inherit tracing context if not explicitly provided
      traceId: options.traceId || baseEvent.traceId,
      spanId: options.spanId || baseEvent.spanId,
      // Inherit user context if not explicitly provided
      userId: options.userId || baseEvent.userId,
      sessionId: options.sessionId || baseEvent.sessionId,
      ipAddress: options.ipAddress || baseEvent.ipAddress
    });
  };

  /**
   * Creates an event caused by an existing event (causal relationship)
   */
  const createCausedEvent = (
    causingEvent: BaseEvent,
    eventName: string,
    payload?: unknown,
    options: Omit<CreateEventOptions, 'causationId' | 'correlationId'> = {}
  ): BaseEvent => {
    return createRelatedEvent(causingEvent, eventName, payload, {
      ...options,
      // Set causation ID to the causing event's ID
      causationId: causingEvent.eventId
    });
  };

  /**
   * Creates an error event with appropriate error details
   */
  const createErrorEvent = (
    eventName: string,
    error: Error,
    options: CreateEventOptions = {}
  ): BaseEvent => {
    return createEvent(
      eventName,
      {
        message: error.message,
        name: error.name,
        ...(options.payload || {})
      },
      {
        ...options,
        severity: options.severity || 'error',
        stackTrace: error.stack,
        tags: [...(options.tags || []), 'error']
      }
    );
  };

  // Return the factory methods
  return {
    createEvent,
    createRelatedEvent,
    createCausedEvent,
    createErrorEvent
  };
};

/**
 * Type for the EventFactory object
 */
export type EventFactory = ReturnType<typeof createEventFactory>;