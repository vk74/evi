/**
 * events.catalog.services.ts - backend file
 * version: 1.0.0
 * 
 * Purpose: Event reference catalog for catalog services operations
 * Logic: Defines event schemas for service fetching operations in public catalog
 * File type: Backend TypeScript (events.catalog.services.ts)
 */

import { EventCollection } from '../../core/eventBus/types.events';

/**
 * Catalog services events collection
 * Events related to public catalog services operations
 */
export const EVENTS_CATALOG_SERVICES: EventCollection = {
  // Empty result set when fetching active services
  'services.fetch.empty': {
    eventName: 'catalog.services.fetch.empty',
    source: 'catalog-services',
    eventType: 'system',
    severity: 'warning',
    eventMessage: 'No active services found during catalog fetch operation',
    version: '1.0.0',
  },

  // General error during services fetch
  'services.fetch.error': {
    eventName: 'catalog.services.fetch.error',
    source: 'catalog-services',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'General error occurred during catalog services fetch operation',
    version: '1.0.0',
  },
};

export default EVENTS_CATALOG_SERVICES;

