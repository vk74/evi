/**
 * fabric.events.ts - backend file
 * version: 1.0.03
 * 
 * Event Factory for creating standardized event instances
 * that conform to BaseEvent interface.
 * 
 * This module provides two distinct algorithms:
 * 1. Regular event creation path: creates events and sends them to validator
 * 2. System error event path: creates events and sends them directly to event bus,
 *    bypassing validation to avoid infinite loops
 * 
 * The factory creates events in a modular way with separate functions
 * for each step of event creation and enrichment:
 * - getEventTemplateFromCache - Gets event template from cache
 * - createBaseEvent - Creates base event with required core properties
 * - enrichWithPayload - Adds business data to the event
 * - enrichWithRequestorInfo - Adds user context from request object
 */

import { v4 as uuidv4 } from 'uuid';
import { BaseEvent, CreateEventOptions, CreateSystemErrorEventParams } from './types.events';
import { getEventTemplate, hasEventInCache } from './reference/cache.reference.events';
import { validateAndPublishEvent } from './validate.events';
import { eventBus } from './bus.events';
import getRequestorUuidFromReq from '../helpers/get.requestor.uuid.from.req';
import os from 'os';

/**
 * Input parameters for creating an event
 */
export interface CreateEventParams {
  // Express request object for extracting user context
  req?: any;
  
  // Event name or event key from predefined constants (e.g. USER_CREATION_EVENTS.VALIDATION_PASSED)
  eventName: string;
  
  // Business data to include in the event
  payload?: unknown;
  
  // Optional error data for error events
  errorData?: string;
}

/**
 * ALGORITHM 1: Regular event creation process with validation
 * 
 * 1. Creates an event based on the provided parameters
 * 2. Sends the event to validator
 * 3. If valid, validator will publish it to the event bus
 * 4. If invalid, validator will create and publish a validation error event
 * 
 * @param params Event creation parameters
 * @returns A promise that resolves when the event has been created and sent to validator
 */
export const createAndPublishEvent = async (params: CreateEventParams): Promise<void> => {
  try {
    // Create the event
    const event = await createEvent(params);
    
    // Send to validator for validation and publishing
    await validateAndPublishEvent(event);
    
    console.log(`Event '${params.eventName}' created and sent to validator`);
  } catch (error) {
    console.error(`Failed to create and publish event '${params.eventName}':`, error);
    throw error;
  }
};

/**
 * ALGORITHM 2: System error event creation - bypasses validation
 * 
 * 1. Creates a system error event based on provided parameters
 * 2. Publishes directly to event bus WITHOUT validation
 * 3. Designed specifically for system-level errors, especially validation errors
 * 
 * @param params System error event parameters
 * @returns A promise that resolves to true if published successfully
 */
export const createAndPublishSystemErrorEvent = async (params: CreateSystemErrorEventParams): Promise<boolean> => {
  try {
    // Create the system error event
    const errorEvent = await createSystemErrorEvent(params);
    
    // Publish directly to event bus, bypassing validation
    eventBus.publish(errorEvent);
    
    console.log(`System error event '${params.eventName}' published directly to event bus`);
    return true;
  } catch (error) {
    console.error(`Failed to publish system error event '${params.eventName}':`, error);
    return false;
  }
};

/**
 * Core event creation function - creates event object based on templates
 */
export const createEvent = async (params: CreateEventParams): Promise<BaseEvent> => {
  try {
    // Step 1: Get event template from cache
    const eventTemplate = getEventTemplateFromCache(params.eventName);
    
    // Step 2: Create basic event with core properties
    let event = createBaseEvent(eventTemplate, params.eventName);
    
    // Step 3: Enrich event with payload
    event = enrichWithPayload(event, params.payload);
    
    // Step 4: Enrich event with requestor information
    event = enrichWithRequestorInfo(event, params.req);
    
    // Step 5: Add error data if provided
    if (params.errorData) {
      event.errorData = params.errorData;
    }
    
    // Return the created event
    return event;
  } catch (error) {
    console.error(`Error creating event ${params.eventName}:`, error);
    throw new Error(`Failed to create event: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Creates system error events (validation errors, bus errors)
 */
export const createSystemErrorEvent = async (params: CreateSystemErrorEventParams): Promise<BaseEvent> => {
  try {
    // Step 1: Get event template from cache or create minimal template
    const eventTemplate = getEventTemplateFromCache(params.eventName);
    
    // Step 2: Create basic event with core properties
    let event = createBaseEvent(eventTemplate, params.eventName);
    
    // Override severity if provided
    if (params.severity) {
      event.severity = params.severity;
    }
    
    // Step 3: Enrich with payload
    event = enrichWithPayload(event, params.payload);
    
    // Step 4: Add error data if provided
    if (params.errorData) {
      event.errorData = params.errorData;
    }
    
    return event;
  } catch (error) {
    console.error(`Error creating system error event ${params.eventName}:`, error);
    
    // Create a minimal valid event as fallback
    return {
      eventId: `event-${uuidv4()}`,
      timestamp: new Date().toISOString(),
      eventName: params.eventName,
      source: 'event system',
      eventType: 'system',
      version: '1.0.0',
      severity: 'error',
      payload: {
        originalError: error instanceof Error ? error.message : String(error),
        failurePoint: 'createSystemErrorEvent',
        attemptedEventName: params.eventName
      },
      errorData: `Failed to create system error event: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

/**
 * Gets event template from cache based on event name or event key
 */
export const getEventTemplateFromCache = (eventNameOrKey: string): Partial<BaseEvent> => {
  // Check if the event name exists directly in the cache
  if (hasEventInCache(eventNameOrKey)) {
    const template = getEventTemplate(eventNameOrKey);
    if (template) {
      return template;
    }
  }
  
  // If event name wasn't found directly, it might be provided as a constant key
  // For example, USER_CREATION_EVENTS.VALIDATION_PASSED instead of "userEditor.creation.validation.passed"
  // In this case, we need to extract the actual event name
  
  console.log(`Event name "${eventNameOrKey}" not found directly in cache, trying to resolve...`);
  
  // The template wasn't found, create a minimal template
  return {
    eventName: eventNameOrKey,
    source: 'unknown',
    eventType: 'app',
    version: '1.0.0'
  };
};

/**
 * Creates the base event structure with core properties
 */
export const createBaseEvent = (template: Partial<BaseEvent>, eventName: string): BaseEvent => {
  // Basic host information
  const hostInfo = {
    hostname: os.hostname(),
    processId: process.pid
  };
  
  // Create the event with required fields
  const event: BaseEvent = {
    eventId: `event-${uuidv4()}`,
    timestamp: new Date().toISOString(),
    eventName: template.eventName || eventName,
    source: template.source || 'unknown',
    eventType: template.eventType || 'app',
    version: template.version || '1.0.0',
    severity: template.severity,
    eventMessage: template.eventMessage,
    hostInfo,
    environment: process.env.NODE_ENV || 'development'
  };
  
  return event;
};

/**
 * Enriches the event with payload data
 */
export const enrichWithPayload = (event: BaseEvent, payload?: unknown): BaseEvent => {
  if (payload !== undefined) {
    event.payload = payload;
  }
  return event;
};

/**
 * Enriches the event with requestor information
 */
export const enrichWithRequestorInfo = (event: BaseEvent, req?: any): BaseEvent => {
  if (req) {
    // Extract requestorId using helper
    const requestorId = getRequestorUuidFromReq(req);
    if (requestorId) {
      event.requestorId = requestorId;
    }
    
    // Extract IP address if available
    if (req.ip) {
      event.ipAddress = req.ip;
    } else if (req.connection && req.connection.remoteAddress) {
      event.ipAddress = req.connection.remoteAddress;
    }
    
    // Extract request path if available
    if (req.path) {
      event.requestPath = req.path;
    } else if (req.url) {
      event.requestPath = req.url;
    }
  }
  
  return event;
};

export default {
  // Main algorithms for external use
  createAndPublishEvent,        // Algorithm 1: Regular events with validation
  createAndPublishSystemErrorEvent, // Algorithm 2: System errors, bypass validation
  
  // Lower-level functions for advanced use cases
  createEvent,
  createSystemErrorEvent,
  
  // Helper functions (mainly for testing)
  getEventTemplateFromCache,
  createBaseEvent,
  enrichWithPayload,
  enrichWithRequestorInfo
};