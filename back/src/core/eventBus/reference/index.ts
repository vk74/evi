// Reference index for event domain catalogs
// This file acts as a central registry for all event domains

import { userEvents } from './domain.user';
import { authEvents } from './domain.auth';

// Export all domain events for easy access
export const eventReferences = {
  user: userEvents,
  auth: authEvents,
  // Add other domains here as they are created
};

// Export utility type for referencing event types across the application
export type EventType = keyof typeof eventReferences;

// Export function to validate if an event name exists in the registry
export const isValidEventType = (eventName: string): boolean => {
  // Split the event name into domain and specific event
  // Example: "user.newaccount.created" -> ["user", "newaccount.created"]
  const [domain, ...rest] = eventName.split('.');
  
  if (!rest.length || !eventReferences[domain as EventType]) {
    return false;
  }
  
  // Join back the event part
  const eventKey = rest.join('.');
  
  // Check if this specific event exists in the domain
  return eventReferences[domain as EventType].hasOwnProperty(eventKey);
};

// Helper function to get event schema version by event name
export const getEventSchemaVersion = (eventName: string): string => {
  const [domain, ...rest] = eventName.split('.');
  
  if (!rest.length || !eventReferences[domain as EventType]) {
    return 'v1'; // Default to v1 if not found
  }
  
  const eventKey = rest.join('.');
  
  if (!eventReferences[domain as EventType][eventKey]) {
    return 'v1'; // Default to v1 if not found
  }
  
  return eventReferences[domain as EventType][eventKey].version || 'v1';
};