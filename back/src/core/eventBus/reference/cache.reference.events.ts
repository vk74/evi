/**
 * cache.reference.events.ts - backend file
 * version: 1.0.4
 * 
 * This file implements a caching mechanism for event references.
 * It loads all event reference data at server startup and provides
 * fast in-memory access to event definitions throughout the application lifecycle.
 * Cache remains unchanged during application runtime until server restart.
 */

import { BaseEvent, CachedEventSchema, EventSchema, EventObject, EventCollection } from '../types.events';
import { 
  getEventReferences, 
  getEventSchema, 
  buildEventReferences,
  eventReferenceFiles
} from './index.reference.events';
import fs from 'fs';

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
 * Resolves a module path to the correct runtime file.
 * When running compiled JS in Docker (dist), event reference files are .js.
 * During development they may be .ts. This helper maps .ts → .js if the .js file exists.
 */
const resolveRuntimeModulePath = (tsFilePath: string): string => {
  const jsFilePath = tsFilePath.replace(/\.ts$/, '.js');
  if (fs.existsSync(jsFilePath)) {
    return jsFilePath;
  }
  return tsFilePath;
};

/**
 * Initializes the event reference cache
 * Should be called during application startup
 */
export const initializeEventCache = async (): Promise<void> => {
  if (cacheInitialized) {
    return;
  }
  
  try {
    // Clear existing cache if any
    eventSchemaCache = {};
    
    // Force building the references to ensure we have the latest data - now with await
    const references = await buildEventReferences();
    
    // Process each domain and its events
    for (const [domain, domainEvents] of Object.entries(references)) {
      for (const [eventKey, schema] of Object.entries(domainEvents)) {
        const fullEventName = `${domain}.${eventKey}`;
        
        // Explicitly type the schema to EventSchema
        const typedSchema = schema as EventSchema;
        
        // Get the actual event template from source files
        const eventTemplate = await findSourceEventTemplate(fullEventName);
        
        if (eventTemplate) {
          eventSchemaCache[fullEventName] = {
            eventName: fullEventName,
            source: eventTemplate.source || '',
            eventType: eventTemplate.eventType || 'app',
            severity: eventTemplate.severity,
            eventMessage: eventTemplate.eventMessage,
            version: eventTemplate.version || typedSchema.version || '1.0',
            description: typedSchema.description || ''
          };
        } else {
          // Create a basic schema if no template is found
          eventSchemaCache[fullEventName] = {
            eventName: fullEventName,
            source: 'unknown',
            eventType: 'app',
            version: typedSchema.version || '1.0',
            description: typedSchema.description || ''
          };
          
          console.warn(`Warning: No template found for event ${fullEventName}`);
        }
      }
    }
    
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
const findSourceEventTemplate = async (fullEventName: string): Promise<Partial<BaseEvent> | null> => {
  try {
    const [domain, ...rest] = fullEventName.split('.');
    
    if (!eventReferenceFiles[domain]) {
      console.warn(`No reference files registered for domain: ${domain}`);
      return null;
    }
    
    // Iterate through all files registered for this domain
    for (const filePath of eventReferenceFiles[domain]) {
      try {
        const modulePath = resolveRuntimeModulePath(filePath);
        if (!fs.existsSync(modulePath)) {
          console.error(`Error importing from ${modulePath}: File not found`);
          continue;
        }
        const moduleExports = await import(modulePath);
        
        // Find all exported event collections (constants with UPPERCASE names)
        for (const [collectionName, collection] of Object.entries(moduleExports)) {
          if (typeof collection === 'object' && 
              collection !== null && 
              !Array.isArray(collection) &&
              collectionName === collectionName.toUpperCase()) {
            
            const eventCollection = collection as EventCollection;
            
            // Look through all events in the collection
            for (const [eventKey, event] of Object.entries(eventCollection)) {
              if (typeof event === 'object' && 
                  event !== null && 
                  'eventName' in event &&
                  event.eventName === fullEventName) {
                return event as Partial<BaseEvent>;
              }
            }
          }
        }
        } catch (error) {
          console.error(`Error importing from ${resolveRuntimeModulePath(filePath)}:`, error);
      }
    }
    
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
 * Gets the schema version for an event from cache
 * 
 * @param eventName The full event name
 * @returns The schema version or null if event not found
 */
export const getEventSchemaVersion = (eventName: string): string | null => {
  if (!cacheInitialized) {
    throw new Error('Event cache has not been initialized. Call initializeEventCache() first.');
  }
  
  const schema = eventSchemaCache[eventName];
  if (!schema) {
    return null;
  }
  
  return schema.version || null;
};

/**
 * Refreshes the cache by clearing it and reinitializing
 * Useful when new event types are added dynamically
 */
export const refreshEventCache = async (): Promise<void> => {
  cacheInitialized = false;
  eventSchemaCache = {};
  await initializeEventCache();
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