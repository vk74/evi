/**
 * events.catalog.ts - backend file
 * version: 1.0.0
 * 
 * Purpose: Event reference catalog for catalog module operations
 * Logic: Defines event schemas for service fetching operations in catalog
 * File type: Backend TypeScript (events.catalog.ts)
 */

import { EventCollection } from '../../core/eventBus/types.events';

export const EVENTS_CATALOG: EventCollection = {
  // Empty result set when fetching active services
  'services.fetch.empty': {
    eventName: 'catalog.services.fetch.empty',
    source: 'catalog',
    eventType: 'system',
    severity: 'warning',
    eventMessage: 'No active services found during catalog fetch operation',
    version: '1.0.0',
  },

  // General error during services fetch
  'services.fetch.error': {
    eventName: 'catalog.services.fetch.error',
    source: 'catalog',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'General error occurred during catalog services fetch operation',
    version: '1.0.0',
  },
};

export default EVENTS_CATALOG;


