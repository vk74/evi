/**
 * version: 1.0.0
 * Event reference catalog for reports module operations (backend).
 * Placeholder for future reporting events.
 * File: events.reports.ts (backend)
 */

import { EventCollection } from '../../core/eventBus/types.events'

/**
 * Event reference catalog for reports module operations
 * Contains placeholder events for reporting
 */
export const EVENTS_REPORTS: EventCollection = {
  // Placeholder events - to be implemented when reporting is added
  
  'reports.placeholder.started': {
    eventName: 'reports.reports.placeholder.started',
    source: 'reports',
    eventType: 'system',
    severity: 'debug',
    eventMessage: 'Reports module placeholder event',
    version: '1.0.0'
  }
}

// Export for backward compatibility
export const eventsReports = EVENTS_REPORTS
