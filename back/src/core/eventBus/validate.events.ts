/**
 * validate.events.ts - backend file
 * version: 1.1.0
 * 
 * Event validator for ensuring events meet requirements before publishing.
 * Validates events against their schemas and notifies about validation failures.
 * Implements a feedback mechanism to report validation errors through the event bus.
 */

import { BaseEvent } from './types.events';
import { isValidEventType, getEventSchemaVersion, eventReferences } from './reference/index.reference.events';
import { EVENT_VALIDATION_EVENTS } from './reference/errors.reference.events';
import { eventBus } from './bus.events';
import fabricEvents from './fabric.events';

// Interface for validation result
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Required fields that must be present in every BaseEvent
 */
const REQUIRED_FIELDS: Array<keyof BaseEvent> = [
  'eventId',
  'eventName',
  'timestamp',
  'source',
  'eventType',
  'version'
];

/**
 * Validates a BaseEvent to ensure it meets the minimum requirements
 * and adheres to the schema for its event type
 * 
 * @param event The event to validate
 * @returns ValidationResult with validation status and any errors
 */
export const validateEvent = (event: BaseEvent): ValidationResult => {
  const errors: string[] = [];
  const missingFields: string[] = [];
  
  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!event[field]) {
      const errorMsg = `Event is missing required field: ${field}`;
      errors.push(errorMsg);
      missingFields.push(field as string);
    }
  }
  
  // Additional validations for specific fields
  if (event.timestamp) {
    // Validate timestamp format (ISO 8601)
    try {
      new Date(event.timestamp).toISOString();
    } catch (e) {
      const errorMsg = `Invalid timestamp format: ${event.timestamp}. Should be ISO 8601 format.`;
      errors.push(errorMsg);
    }
  }
  
  if (event.eventName) {
    // Validate event name is registered
    if (!isValidEventType(event.eventName)) {
      const errorMsg = `Invalid eventName: ${event.eventName}. This event type is not registered in the event catalog.`;
      errors.push(errorMsg);
    } else {
      // Check version matches the one in registry
      const expectedVersion = getEventSchemaVersion(event.eventName);
      if (event.version && event.version !== expectedVersion) {
        const errorMsg = `Event version mismatch: ${event.version} provided, but registry specifies ${expectedVersion}`;
        errors.push(errorMsg);
      }
      
      // Validate payload against schema if available
      if (isValidEventType(event.eventName)) {
        const [domain, ...rest] = event.eventName.split('.');
        const eventKey = rest.join('.');
        
        // Get the domain registry
        const domainRegistry = eventReferences[domain as keyof typeof eventReferences];
        
        if (domainRegistry && domainRegistry[eventKey] && domainRegistry[eventKey].payloadSchema) {
          // Basic payload validation - in a real implementation, this would use a JSON Schema validator
          const schema = domainRegistry[eventKey].payloadSchema;
          
          if (schema.required && Array.isArray(schema.required)) {
            for (const requiredField of schema.required as string[]) {
              // Check if payload exists and has required field
              if (!event.payload || !Object.prototype.hasOwnProperty.call(event.payload, requiredField)) {
                const errorMsg = `Event payload is missing required field: ${requiredField}`;
                errors.push(errorMsg);
              }
            }
          }
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates an event and publishes it if valid
 * If invalid, creates and publishes a validation error event
 * 
 * @param event The event to validate and publish
 * @returns Promise<boolean> True if event was valid and published
 */
export const validateAndPublishEvent = async (event: BaseEvent): Promise<boolean> => {
  const validation = validateEvent(event);
  
  if (validation.isValid) {
    // Event is valid, publish it
    eventBus.publish(event);
    return true;
  } else {
    // Event is invalid, create and publish a validation error event
    console.warn(`Event validation failed for ${event.eventName}:`, validation.errors);
    
    // Extract missing fields from errors
    const missingFields = validation.errors
      .filter(err => err.startsWith('Event is missing required field:'))
      .map(err => err.replace('Event is missing required field: ', ''));
    
    // Create validation error event
    try {
      // Use Algorithm 2 from the factory to create and publish a system error event
      // directly to the event bus, bypassing validation
      await fabricEvents.createAndPublishSystemErrorEvent({
        eventName: EVENT_VALIDATION_EVENTS.VALIDATION_FAILED.eventName,
        payload: {
          originalEventName: event.eventName || 'unknown',
          originalEventId: event.eventId || 'unknown',
          missingFields,
          errors: validation.errors
        },
        errorData: validation.errors.join('; '),
        severity: 'warning'
      });
    } catch (error) {
      console.error('Failed to create validation error event:', error);
    }
    
    return false;
  }
};

/**
 * Throws an error if the event is invalid, otherwise returns true
 * Useful for fail-fast validation in event creation
 * 
 * @param event The event to validate
 * @returns true if valid
 * @throws Error with validation errors if invalid
 */
export const assertValidEvent = (event: BaseEvent): boolean => {
  const validation = validateEvent(event);
  
  if (!validation.isValid) {
    throw new Error(`Event validation failed: ${validation.errors.join('; ')}`);
  }
  
  return true;
};