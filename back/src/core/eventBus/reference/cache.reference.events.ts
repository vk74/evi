/**
 * cache.reference.events.ts - backend file
 * version: 1.0.1
 * 
 * This file implements a caching mechanism for event references.
 * It loads all event reference data at server startup and provides
 * fast in-memory access to event definitions throughout the application lifecycle.
 * Cache remains unchanged during application runtime until server restart.
 */

import { BaseEvent } from '../types.events';
import { eventReferences, EventSchema, getEventSchema } from './index.reference.events';

/**
 * Enhanced schema that includes all properties needed for event creation
 */
interface CachedEventSchema extends EventSchema {
  eventName: string;
  source: string;
  eventType: 'app' | 'system' | 'security' | 'integration' | 'performance';
  severity?: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  eventMessage?: string;
  version: string; 
}

/**
 * Cache structure that stores fully resolved event schemas by event name
 */
type EventSchemaCache = {
  [eventName: string]: CachedEventSchema;
};

/**
 * The actual cache singleton that holds all event definitions
 * This is loaded at server startup and remains unchanged
 */
let eventSchemaCache: EventSchemaCache = {};

/**
 * Flag to track if the cache has been initialized
 */
let cacheInitialized = false;

/**
 * Initializes the event reference cache
 * Should be called during application startup
 */
export const initializeEventCache = (): void => {
  if (cacheInitialized) {
    return;
  }
  
  try {
    // Clear existing cache if any
    eventSchemaCache = {};
    
    // Fill cache with all event definitions from all domains
    Object.entries(eventReferences).forEach(([domain, domainEvents]) => {
      Object.entries(domainEvents).forEach(([eventKey, schema]) => {
        const fullEventName = `${domain}.${eventKey}`;
        
        // Get the actual event template from source files through index.reference.events.ts 
        // For example, from USER_CREATION_EVENTS.REQUEST_RECEIVED
        const eventTemplate = findSourceEventTemplate(fullEventName);
        
        if (eventTemplate) {
          eventSchemaCache[fullEventName] = {
            ...schema,
            eventName: fullEventName,
            source: eventTemplate.source || '',
            eventType: eventTemplate.eventType || 'app',
            severity: eventTemplate.severity,
            eventMessage: eventTemplate.eventMessage,
            version: eventTemplate.version || schema.version || '1.0' // Use version from template or schema
          };
        } else {
          // Create a basic schema if no template is found
          eventSchemaCache[fullEventName] = {
            ...schema,
            eventName: fullEventName,
            source: 'unknown',
            eventType: 'app',
            version: schema.version || '1.0' // Use version from schema or default to '1.0'
          };
          
          console.warn(`Warning: No template found for event ${fullEventName}`);
        }
      });
    });
    
    cacheInitialized = true;
    console.log(`Event reference cache initialized with ${Object.keys(eventSchemaCache).length} events`);
  } catch (error) {
    console.error('Failed to initialize event reference cache:', error);
    throw new Error('Event cache initialization failed');
  }
};

/**
 * Finds the original event template definition from the source modules
 * This provides access to event properties not stored in the reference index
 */
const findSourceEventTemplate = (fullEventName: string): Partial<BaseEvent> | null => {
  try {
    const [domain, ...rest] = fullEventName.split('.');
    
    // Get all domains from eventReferences
    const allDomains = Object.keys(eventReferences);
    
    // Check if the domain is registered
    if (allDomains.includes(domain)) {
      // Get the eventKey (everything after the domain prefix)
      const eventKey = rest.join('.');
      
      // Try to find the original event template by searching through all registered references
      // in the index.reference.events.ts
      for (const [moduleName, moduleEvents] of Object.entries(
        // This is a dynamic import of all event references at runtime
        // It uses the domains registered in the index.reference.events.ts
        require('./index.reference.events')
      )) {
        // Skip non-array entries like 'eventReferences', 'isValidEventType', etc.
        if (!Array.isArray(moduleEvents) && typeof moduleEvents === 'object' && moduleEvents !== null) {
          // Try to find event collections in the module
          for (const [collectionName, eventCollection] of Object.entries(moduleEvents)) {
            // Skip non-object properties and functions
            if (typeof eventCollection === 'object' && eventCollection !== null && 
                !Array.isArray(eventCollection) && collectionName.toUpperCase() === collectionName) {
              // This appears to be an event collection (like USER_CREATION_EVENTS)
              // Look for the event in this collection
              for (const event of Object.values(eventCollection)) {
                if (typeof event === 'object' && event !== null && 'eventName' in event) {
                  if ((event as any).eventName === fullEventName) {
                    return event as Partial<BaseEvent>;
                  }
                }
              }
            }
          }
        }
      }
      
      // As a fallback, try direct imports for known domains
      if (domain === 'userEditor') {
        const { USER_CREATION_EVENTS, USER_UPDATE_EVENTS, USER_LOAD_EVENTS } 
          = require('../../../features/admin/users/userEditor/events.user.editor');
        
        // Try each collection
        const collections = [USER_CREATION_EVENTS, USER_UPDATE_EVENTS, USER_LOAD_EVENTS];
        
        for (const collection of collections) {
          const foundEvent = Object.values(collection)
            .find((event: any) => event.eventName === fullEventName);
          
          if (foundEvent) {
            return foundEvent as Partial<BaseEvent>;
          }
        }
      } else if (domain === 'system') {
        const { EVENT_VALIDATION_EVENTS, EVENT_BUS_EVENTS } 
          = require('./errors.reference.events');
        
        // Try each collection
        const collections = [EVENT_VALIDATION_EVENTS, EVENT_BUS_EVENTS];
        
        for (const collection of collections) {
          const foundEvent = Object.values(collection)
            .find((event: any) => event.eventName === fullEventName);
          
          if (foundEvent) {
            return foundEvent as Partial<BaseEvent>;
          }
        }
      }
      
      // Add further domain-specific fallbacks here if needed
    }
    
    // If we couldn't find the event with any method, return null
    console.warn(`No source template found for event: ${fullEventName}`);
    return null;
  } catch (error) {
    console.error(`Error finding template for event ${fullEventName}:`, error);
    return null;
  }
};

/**
 * Gets the complete event schema from cache by event name
 * 
 * @param eventName Full event name (e.g. "userEditor.creation.complete")
 * @returns The cached event schema or undefined if not found
 */
export const getCachedEventSchema = (eventName: string): CachedEventSchema | undefined => {
  if (!cacheInitialized) {
    throw new Error('Event cache has not been initialized. Call initializeEventCache() first.');
  }
  
  return eventSchemaCache[eventName];
};

/**
 * Gets all cached event names
 * 
 * @returns Array of all event names in the cache
 */
export const getAllCachedEventNames = (): string[] => {
  if (!cacheInitialized) {
    throw new Error('Event cache has not been initialized. Call initializeEventCache() first.');
  }
  
  return Object.keys(eventSchemaCache);
};

/**
 * Gets all cached events for a specific domain
 * 
 * @param domain The domain to get events for (e.g. "userEditor")
 * @returns Object with event names as keys and schemas as values
 */
export const getCachedEventsByDomain = (domain: string): Record<string, CachedEventSchema> => {
  if (!cacheInitialized) {
    throw new Error('Event cache has not been initialized. Call initializeEventCache() first.');
  }
  
  return Object.entries(eventSchemaCache)
    .filter(([eventName]) => eventName.startsWith(`${domain}.`))
    .reduce((result, [eventName, schema]) => {
      result[eventName] = schema;
      return result;
    }, {} as Record<string, CachedEventSchema>);
};

/**
 * Checks if an event exists in the cache
 * 
 * @param eventName The event name to check
 * @returns Boolean indicating if the event exists
 */
export const hasEventInCache = (eventName: string): boolean => {
  if (!cacheInitialized) {
    throw new Error('Event cache has not been initialized. Call initializeEventCache() first.');
  }
  
  return eventName in eventSchemaCache;
};

/**
 * Gets event schemas matching a filter function
 * 
 * @param filterFn Function to filter events
 * @returns Filtered events as a record of event name to schema
 */
export const filterCachedEvents = (
  filterFn: (eventName: string, schema: CachedEventSchema) => boolean
): Record<string, CachedEventSchema> => {
  if (!cacheInitialized) {
    throw new Error('Event cache has not been initialized. Call initializeEventCache() first.');
  }
  
  return Object.entries(eventSchemaCache)
    .filter(([eventName, schema]) => filterFn(eventName, schema))
    .reduce((result, [eventName, schema]) => {
      result[eventName] = schema;
      return result;
    }, {} as Record<string, CachedEventSchema>);
};

/**
 * Generates a template event object based on event name
 * This is useful for creating new events based on a registered template
 * 
 * @param eventName The full event name
 * @returns A template event object or null if not found
 */
export const getEventTemplate = (eventName: string): Partial<BaseEvent> | null => {
  if (!cacheInitialized) {
    throw new Error('Event cache has not been initialized. Call initializeEventCache() first.');
  }
  
  const schema = eventSchemaCache[eventName];
  if (!schema) {
    return null;
  }
  
  return {
    eventName: schema.eventName,
    source: schema.source,
    eventType: schema.eventType,
    severity: schema.severity,
    eventMessage: schema.eventMessage,
    version: schema.version // Include version in the template
  };
};

/**
 * Debug function to dump the entire cache contents
 * Useful for development/debugging only
 */
export const dumpEventCache = (): EventSchemaCache => {
  if (!cacheInitialized) {
    throw new Error('Event cache has not been initialized. Call initializeEventCache() first.');
  }
  
  return { ...eventSchemaCache };
};