// filepath: /Users/vk/Library/Mobile Documents/com~apple~CloudDocs/code/ev2/back/src/core/eventBus/reference/index.ts
// version: 1.1.0
// Central registry for all event domain catalogs in the application
// This file serves as a registry for all event references across different modules

import { USER_CREATION_EVENTS, USER_UPDATE_EVENTS, USER_LOAD_EVENTS } from '../../../features/admin/users/userEditor/events.user.editor';

/**
 * Registry structure for event references
 * Each domain contains a record of event definitions
 */
export interface EventSchema {
  version: string;
  description?: string;
  payloadSchema?: Record<string, unknown>; // Optional JSON Schema for payload validation
}

/**
 * Central registry of all event references grouped by domain
 * Each domain contains a set of event definitions keyed by their event key
 */
export const eventReferences: Record<string, Record<string, EventSchema>> = {
  // User editor events
  userEditor: {
    // Creation events
    ...Object.entries(USER_CREATION_EVENTS).reduce((acc, [key, event]) => {
      const eventKey = event.eventName.split('.').slice(1).join('.');
      return {
        ...acc,
        [eventKey]: {
          version: event.version,
          description: event.eventMessage
        }
      };
    }, {}),
    
    // Update events
    ...Object.entries(USER_UPDATE_EVENTS).reduce((acc, [key, event]) => {
      const eventKey = event.eventName.split('.').slice(1).join('.');
      return {
        ...acc,
        [eventKey]: {
          version: event.version,
          description: event.eventMessage
        }
      };
    }, {}),
    
    // Load events
    ...Object.entries(USER_LOAD_EVENTS).reduce((acc, [key, event]) => {
      const eventKey = event.eventName.split('.').slice(1).join('.');
      return {
        ...acc,
        [eventKey]: {
          version: event.version,
          description: event.eventMessage
        }
      };
    }, {}),
  },
  
  // Add other domains here as they are created
};

// Export utility type for referencing event types across the application
export type EventType = keyof typeof eventReferences;

/**
 * Validates if an event name exists in the registry
 * 
 * @param eventName The full event name to validate (e.g., "userEditor.creation.complete")
 * @returns boolean indicating if the event name is registered
 */
export const isValidEventType = (eventName: string): boolean => {
  // Split the event name into domain and specific event
  // Example: "userEditor.creation.complete" -> ["userEditor", "creation.complete"]
  const [domain, ...rest] = eventName.split('.');
  
  if (!rest.length || !eventReferences[domain]) {
    return false;
  }
  
  // Join back the event part
  const eventKey = rest.join('.');
  
  // Check if this specific event exists in the domain
  return Object.prototype.hasOwnProperty.call(eventReferences[domain], eventKey);
};

/**
 * Gets the event schema version by event name
 * 
 * @param eventName The full event name (e.g., "userEditor.creation.complete")
 * @returns The schema version for the event, or '1.0' if not found
 */
export const getEventSchemaVersion = (eventName: string): string => {
  const [domain, ...rest] = eventName.split('.');
  
  if (!rest.length || !eventReferences[domain]) {
    return '1.0'; // Default to 1.0 if not found
  }
  
  const eventKey = rest.join('.');
  
  if (!eventReferences[domain][eventKey]) {
    return '1.0'; // Default to 1.0 if not found
  }
  
  return eventReferences[domain][eventKey].version || '1.0';
};

/**
 * Gets an event schema by event name
 * 
 * @param eventName The full event name
 * @returns The event schema, or undefined if not found
 */
export const getEventSchema = (eventName: string): EventSchema | undefined => {
  const [domain, ...rest] = eventName.split('.');
  
  if (!rest.length || !eventReferences[domain]) {
    return undefined;
  }
  
  const eventKey = rest.join('.');
  
  return eventReferences[domain][eventKey];
};

/**
 * Gets all event names for a specific domain
 * 
 * @param domain The domain to get events for
 * @returns Array of full event names
 */
export const getEventNamesForDomain = (domain: string): string[] => {
  if (!eventReferences[domain]) {
    return [];
  }
  
  return Object.keys(eventReferences[domain]).map(eventKey => `${domain}.${eventKey}`);
};

/**
 * Gets all registered event domains
 * 
 * @returns Array of domain names
 */
export const getAllEventDomains = (): string[] => {
  return Object.keys(eventReferences);
};

/**
 * Gets all registered events across all domains
 * 
 * @returns Array of full event names
 */
export const getAllEventNames = (): string[] => {
  const events: string[] = [];
  
  Object.entries(eventReferences).forEach(([domain, domainEvents]) => {
    Object.keys(domainEvents).forEach(eventKey => {
      events.push(`${domain}.${eventKey}`);
    });
  });
  
  return events;
};