/**
 * validate.events.ts - backend file
 * version: 1.1.02
 * 
 * Event validator for ensuring events meet requirements before publishing.
 * Validates events against their schemas and notifies about validation failures.
 * Uses event cache for performance and consistency checks.
 * Performs schema version validation to ensure compatibility.
 */

import { BaseEvent } from './types.events';
import { hasEventInCache, getEventSchemaVersion } from './reference/cache.reference.events';
import { EVENT_VALIDATION_EVENTS } from './reference/errors.reference.events';
import { eventBus } from './bus.events';
import fabricEvents from './fabric.events';

// Minimum required event schema version for compatibility
const MIN_SCHEMA_VERSION = '1.0';

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
 * Compares semantic versions to determine if version A is greater than or equal to version B
 * @param versionA First version to compare
 * @param versionB Second version to compare
 * @returns True if versionA >= versionB
 */
const isVersionCompatible = (versionA: string, versionB: string): boolean => {
  const partsA = versionA.split('.').map(part => parseInt(part, 10));
  const partsB = versionB.split('.').map(part => parseInt(part, 10));

  // Ensure both arrays have same length
  while (partsA.length < partsB.length) partsA.push(0);
  while (partsB.length < partsA.length) partsB.push(0);

  // Compare major.minor.patch parts
  for (let i = 0; i < partsA.length; i++) {
    if (partsA[i] > partsB[i]) return true;
    if (partsA[i] < partsB[i]) return false;
  }

  // Versions are exactly the same
  return true;
};

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
    // Validate event name is registered in the cache
    if (!hasEventInCache(event.eventName)) {
      const errorMsg = `Invalid eventName: ${event.eventName}. This event type is not registered in the event cache.`;
      errors.push(errorMsg);
    } else {
      // Get cached schema version
      const expectedVersion = getEventSchemaVersion(event.eventName);
      
      // Check if event has a version
      if (!event.version) {
        const errorMsg = `Event is missing version field`;
        errors.push(errorMsg);
      } 
      // Check if event version matches cached version
      else if (expectedVersion && event.version !== expectedVersion) {
        const errorMsg = `Event version mismatch: ${event.version} provided, but cache specifies ${expectedVersion}`;
        errors.push(errorMsg);
      }
      
      // Check if event version meets minimum version requirement
      if (event.version && !isVersionCompatible(event.version, MIN_SCHEMA_VERSION)) {
        const errorMsg = `Event schema version ${event.version} is outdated. Minimum required version is ${MIN_SCHEMA_VERSION}`;
        errors.push(errorMsg);
      }
      
      // Additional payload validation could be added here based on schema from cache
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
    
    // Check for schema version errors
    const versionErrors = validation.errors
      .filter(err => err.includes('outdated') || err.includes('version mismatch'));
    
    // Create appropriate error event based on the type of validation failure
    try {
      if (versionErrors.length > 0) {
        // If there are version errors, create a schema version error event
        await fabricEvents.createAndPublishSystemErrorEvent({
          eventName: EVENT_VALIDATION_EVENTS.SCHEMA_VERSION_ERROR.eventName,
          payload: {
            originalEventName: event.eventName || 'unknown',
            originalEventId: event.eventId || 'unknown',
            eventVersion: event.version || 'missing',
            minRequiredVersion: MIN_SCHEMA_VERSION,
            errors: versionErrors
          },
          errorData: versionErrors.join('; '),
          severity: 'error'
        });
      } else {
        // For other validation errors, create a general validation error event
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
      }
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