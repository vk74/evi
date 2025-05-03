// filepath: /Users/vk/Library/Mobile Documents/com~apple~CloudDocs/code/ev2/back/src/core/eventBus/reference/index.reference.events.ts
// version: 1.2.3
// Central registry for all event domain catalogs in the application
// This file serves as a registry for all event references across different modules

import path from 'path';
import { EventSchema, EventObject, EventCollection } from '../types.events';
import { initializeEventCache } from './cache.reference.events';

/**
 * Registry of event reference files
 * Each entry contains the path to a file containing event definitions
 */
export const eventReferenceFiles: Record<string, string[]> = {
  // User editor events
  userEditor: [
    path.resolve(__dirname, '../../../features/admin/users/userEditor/events.user.editor.ts')
  ],
  
  // Users list events
  usersList: [
    path.resolve(__dirname, '../../../features/admin/users/usersList/events.users.list.ts')
  ],
  
  // System events - events for internal system operations
  system: [
    path.resolve(__dirname, './errors.reference.events.ts')
  ],
  
  // Add other domains here as they are created
};

/**
 * Lazy-loaded cache of event references
 * Will be populated on first access by the cache module
 */
let eventReferencesCache: Record<string, Record<string, EventSchema>> | null = null;

/**
 * Actively initializes the event reference system
 * Scans all event reference files, builds the index and initializes the cache
 * Should be called during application startup for active initialization
 * 
 * @returns A promise that resolves when initialization is complete
 */
export const initializeEventReferenceSystem = async (): Promise<void> => {
  try {
    console.log('Starting event reference system initialization...');
    
    // Force clear any existing cache
    eventReferencesCache = null;
    
    // Actively build references
    const references = buildEventReferences();
    
    console.log(`Event references built successfully with ${Object.keys(references).length} domains`);
    
    // Count total events across all domains
    let totalEvents = 0;
    Object.values(references).forEach(domainEvents => {
      totalEvents += Object.keys(domainEvents).length;
    });
    
    console.log(`Found ${totalEvents} events across all domains`);
    
    // After index is built, initialize the cache
    initializeEventCache();
    
    console.log('Event reference system initialized successfully');
  } catch (error) {
    console.error('Failed to initialize event reference system:', error);
    throw new Error(`Event reference system initialization failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Builds event references from the registered files
 * This is called by the cache module when needed
 */
export const buildEventReferences = (): Record<string, Record<string, EventSchema>> => {
  if (eventReferencesCache) {
    return eventReferencesCache;
  }
  
  const references: Record<string, Record<string, EventSchema>> = {};
  
  // Process each domain
  Object.entries(eventReferenceFiles).forEach(([domain, files]) => {
    if (!references[domain]) {
      references[domain] = {};
    }
    
    // Process each file in the domain
    files.forEach(filePath => {
      try {
        // Dynamically import the module
        const eventModule = require(filePath);
        
        // Find all exported constants that look like event collections
        const collections = Object.entries(eventModule)
          .filter(([key, value]) => 
            key.toUpperCase() === key && // All uppercase indicates a constant
            typeof value === 'object' && 
            value !== null &&
            !Array.isArray(value))
          .map(([_, value]) => value as EventCollection);
        
        // Process each collection
        collections.forEach(collection => {
          if (collection && typeof collection === 'object') {
            Object.entries(collection).forEach(([eventKey, event]) => {
              if (typeof event === 'object' && event !== null && 'eventName' in event) {
                const eventName = event.eventName as string;
                const eventParts = eventName.split('.');
                if (eventParts.length > 1) {
                  const eventKey = eventParts.slice(1).join('.');
                  references[domain][eventKey] = {
                    version: event.version || '1.0.0',
                    description: event.eventMessage || ''
                  };
                }
              }
            });
          }
        });
      } catch (error) {
        console.error(`Error loading event references from ${filePath}:`, error);
      }
    });
  });
  
  eventReferencesCache = references;
  return references;
};

/**
 * Gets all event references
 * Lazily builds the references on first access
 */
export const getEventReferences = (): Record<string, Record<string, EventSchema>> => {
  if (!eventReferencesCache) {
    return buildEventReferences();
  }
  return eventReferencesCache;
};

// Export utility type for referencing event types across the application
export type EventType = keyof typeof eventReferenceFiles;

/**
 * Validates if an event name exists in the registry
 * 
 * @param eventName The full event name to validate (e.g., "userEditor.creation.complete")
 * @returns boolean indicating if the event name is registered
 */
export const isValidEventType = (eventName: string): boolean => {
  // Split the event name into domain and specific event
  const [domain, ...rest] = eventName.split('.');
  
  if (!rest.length) {
    return false;
  }
  
  const references = getEventReferences();
  
  if (!references[domain]) {
    return false;
  }
  
  // Join back the event part
  const eventKey = rest.join('.');
  
  // Check if this specific event exists in the domain
  return Object.prototype.hasOwnProperty.call(references[domain], eventKey);
};

/**
 * Gets the event schema version by event name
 * 
 * @param eventName The full event name (e.g., "userEditor.creation.complete")
 * @returns The schema version for the event, or '1.0' if not found
 */
export const getEventSchemaVersion = (eventName: string): string => {
  const [domain, ...rest] = eventName.split('.');
  
  if (!rest.length) {
    return '1.0'; // Default to 1.0 if not formatted correctly
  }
  
  const references = getEventReferences();
  
  if (!references[domain]) {
    return '1.0'; // Default to 1.0 if domain not found
  }
  
  const eventKey = rest.join('.');
  
  if (!references[domain][eventKey]) {
    return '1.0'; // Default to 1.0 if event not found
  }
  
  return references[domain][eventKey].version || '1.0';
};

/**
 * Gets an event schema by event name
 * 
 * @param eventName The full event name
 * @returns The event schema, or undefined if not found
 */
export const getEventSchema = (eventName: string): EventSchema | undefined => {
  const [domain, ...rest] = eventName.split('.');
  
  if (!rest.length) {
    return undefined;
  }
  
  const references = getEventReferences();
  
  if (!references[domain]) {
    return undefined;
  }
  
  const eventKey = rest.join('.');
  
  return references[domain][eventKey];
};

/**
 * Gets all event names for a specific domain
 * 
 * @param domain The domain to get events for
 * @returns Array of full event names
 */
export const getEventNamesForDomain = (domain: string): string[] => {
  const references = getEventReferences();
  
  if (!references[domain]) {
    return [];
  }
  
  return Object.keys(references[domain]).map(eventKey => `${domain}.${eventKey}`);
};

/**
 * Gets all registered event domains
 * 
 * @returns Array of domain names
 */
export const getAllEventDomains = (): string[] => {
  return Object.keys(getEventReferences());
};

/**
 * Gets all registered events across all domains
 * 
 * @returns Array of full event names
 */
export const getAllEventNames = (): string[] => {
  const events: string[] = [];
  const references = getEventReferences();
  
  Object.entries(references).forEach(([domain, domainEvents]) => {
    Object.keys(domainEvents).forEach(eventKey => {
      events.push(`${domain}.${eventKey}`);
    });
  });
  
  return events;
};

/**
 * Clears the event references cache
 * Useful for testing or when events are dynamically added
 */
export const clearEventReferencesCache = (): void => {
  eventReferencesCache = null;
};

/**
 * Adds a new event reference file to the registry
 * 
 * @param domain The domain for the events
 * @param filePath The path to the file containing event definitions
 */
export const registerEventReferenceFile = (domain: string, filePath: string): void => {
  if (!eventReferenceFiles[domain]) {
    eventReferenceFiles[domain] = [];
  }
  
  // Check if file is already registered
  if (!eventReferenceFiles[domain].includes(filePath)) {
    eventReferenceFiles[domain].push(filePath);
    // Clear cache to force rebuild on next access
    clearEventReferencesCache();
  }
};