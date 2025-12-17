/**
 * events.catalog.products.ts - backend file
 * version: 1.2.0
 * 
 * Purpose: Event reference catalog for catalog products operations
 * Logic: Defines event schemas for product fetching operations in public catalog
 * File type: Backend TypeScript (events.catalog.products.ts)
 * 
 * Changes in v1.1.0:
 * - Added validation error events for region parameter validation
 * 
 * Changes in v1.2.0:
 * - Fixed event names to match domain.eventKey format (products.products.fetch...)
 * - Event names now correctly match the event reference system's naming convention
 */

import { EventCollection } from '../../core/eventBus/types.events';

/**
 * Catalog products events collection
 * Events related to public catalog products operations
 */
export const EVENTS_CATALOG_PRODUCTS: EventCollection = {
  // Validation error: Region parameter is required but not provided
  'products.fetch.validation.region.required': {
    eventName: 'products.products.fetch.validation.region.required',
    source: 'catalog-products',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Region parameter is required for fetching products. User must select their location before products can be loaded.',
    version: '1.2.0',
  },

  // Validation error: Region name provided but not found in database
  'products.fetch.validation.region.notFound': {
    eventName: 'products.products.fetch.validation.region.notFound',
    source: 'catalog-products',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Region specified by user was not found in database. User needs to select a valid region.',
    version: '1.2.0',
  },

  // Internal error: Failed to resolve region name to region_id
  'products.fetch.validation.region.resolveError': {
    eventName: 'products.products.fetch.validation.region.resolveError',
    source: 'catalog-products',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Failed to resolve user region to database identifier. This is a system error that requires investigation.',
    version: '1.2.0',
  },
};

export default EVENTS_CATALOG_PRODUCTS;

