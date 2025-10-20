/**
 * version: 1.0.0
 * Event reference catalog for work module operations (backend).
 * Placeholder for future work management events.
 * File: events.work.ts (backend)
 */

import { EventCollection } from '../../core/eventBus/types.events'

/**
 * Event reference catalog for work module operations
 * Contains placeholder events for work management
 */
export const EVENTS_WORK: EventCollection = {
  // Placeholder events - to be implemented when work management is added
  
  'work.placeholder.started': {
    eventName: 'work.work.placeholder.started',
    source: 'work',
    eventType: 'system',
    severity: 'debug',
    eventMessage: 'Work module placeholder event',
    version: '1.0.0'
  }
}

// Export for backward compatibility
export const eventsWork = EVENTS_WORK
