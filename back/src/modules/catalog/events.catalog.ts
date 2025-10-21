/**
 * events.catalog.ts - backend file
 * version: 1.1.0
 * 
 * Purpose: Event reference catalog for general catalog module operations
 * Logic: Defines event schemas for catalog-wide operations (sections, common errors)
 * File type: Backend TypeScript (events.catalog.ts)
 * 
 * Note: Specific events for services and products are in separate files:
 * - events.catalog.services.ts - for catalog services events
 * - events.catalog.products.ts - for catalog products events
 */

import { EventCollection } from '../../core/eventBus/types.events';

/**
 * General catalog events collection
 * Events related to catalog-wide operations
 */
export const EVENTS_CATALOG: EventCollection = {
  // Placeholder for general catalog events
  // When catalog-wide functionality is implemented, add events here following the pattern:
  // 
  // 'sections.fetch.started': {
  //   eventName: 'catalog.sections.fetch.started',
  //   source: 'catalog',
  //   eventType: 'system',
  //   severity: 'info',
  //   eventMessage: 'Started fetching catalog sections',
  //   version: '1.0.0',
  // },
};

export default EVENTS_CATALOG;


