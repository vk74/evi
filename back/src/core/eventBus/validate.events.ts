// version: 1.0
// Event validator for ensuring events meet requirements before publishing
import { BaseEvent } from './types.events';
import { isValidEventType, getEventSchemaVersion, eventReferences } from './reference';

// Interface for validation result
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates a BaseEvent to ensure it meets the minimum requirements
 * and adheres to the schema for its event type
 * 
 * @param event The event to validate
 * @returns ValidationResult with validation status and any errors
 */
export const validateEvent = (event: BaseEvent): ValidationResult => {
  const errors: string[] = [];
  
  // Check required fields
  if (!event.eventId) {
    errors.push('Event is missing required eventId');
  }
  
  if (!event.eventType) {
    errors.push('Event is missing required eventType');
  } else if (!isValidEventType(event.eventType)) {
    errors.push(`Invalid eventType: ${event.eventType}. This event type is not registered in the event catalog.`);
  }
  
  if (!event.timestamp) {
    errors.push('Event is missing required timestamp');
  } else {
    // Validate timestamp format (ISO 8601)
    try {
      new Date(event.timestamp).toISOString();
    } catch (e) {
      errors.push(`Invalid timestamp format: ${event.timestamp}. Should be ISO 8601 format.`);
    }
  }
  
  if (!event.source) {
    errors.push('Event is missing required source');
  }
  
  if (!event.version) {
    errors.push('Event is missing required version');
  } else {
    // Check if version matches the one in registry
    const expectedVersion = getEventSchemaVersion(event.eventType);
    if (event.version !== expectedVersion) {
      errors.push(`Event version mismatch: ${event.version} provided, but registry specifies ${expectedVersion}`);
    }
  }
  
  // Validate payload against schema if available
  if (event.eventType && isValidEventType(event.eventType)) {
    const [domain, ...rest] = event.eventType.split('.');
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
            errors.push(`Event payload is missing required field: ${requiredField}`);
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