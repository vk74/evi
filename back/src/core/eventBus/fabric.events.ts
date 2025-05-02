/**
 * fabric.events.ts - backend file
 * version: 1.0.01
 * 
 * Event Factory for creating standardized event instances
 * that conform to BaseEvent interface.
 * 
 * This module is responsible for creating event objects based on templates 
 * stored in the events cache. It follows a modular approach with separate 
 * functions for each step of event creation and enrichment:
 * 
 * 1. getEventTemplateFromCache - Gets event template from cache or creates minimal template
 * 2. createBaseEvent - Creates base event with required core properties
 * 3. enrichWithPayload - Adds business data to the event
 * 4. enrichWithRequestorInfo - Adds user context from request object
 * 
 * The factory is designed to be resilient and continue to function even if
 * some data is missing. It integrates with the event validation system
 * but does not stop execution on validation issues.
 */

import { v4 as uuidv4 } from 'uuid';
import { BaseEvent, CreateEventOptions } from './types.events';
import { getEventTemplate, hasEventInCache } from './reference/cache.reference.events';
import { assertValidEvent } from './validate.events';
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
 * Factory for creating standardized event objects with a modular approach
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
    
    // Return the created event for validation and publishing
    return event;
  } catch (error) {
    console.error(`Error creating event ${params.eventName}:`, error);
    throw new Error(`Failed to create event: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Step 1: Get event template from cache based on event name or event key
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
 * Step 2: Create the base event structure with core properties
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
 * Step 3: Enrich the event with payload data
 */
export const enrichWithPayload = (event: BaseEvent, payload?: unknown): BaseEvent => {
  if (payload !== undefined) {
    event.payload = payload;
  }
  return event;
};

/**
 * Step 4: Enrich the event with requestor information
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

/**
 * Creates and validates an event, then returns it for publishing
 */
export const createAndValidateEvent = async (params: CreateEventParams): Promise<BaseEvent> => {
  const event = await createEvent(params);
  
  // Validation will be implemented separately
  // This is a placeholder for future validation integration
  
  return event;
};

export default {
  createEvent,
  createAndValidateEvent,
  // Export individual steps for testing and flexibility
  getEventTemplateFromCache,
  createBaseEvent,
  enrichWithPayload,
  enrichWithRequestorInfo
};