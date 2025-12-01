/**
 * events.admin.regions.ts
 * Version: 1.2.0
 * Description: Event reference catalog for admin regions operations
 * Purpose: Defines events for admin regions management operations
 * Backend file - events.admin.regions.ts
 * 
 * Changes in v1.2.0:
 * - Removed individual create/update/delete events
 * - Added batch update events following taxableCategories pattern
 * - Unified update service now handles create, update, delete in one operation
 */

import { EventCollection } from '../../../core/eventBus/types.events'

/**
 * Event reference catalog for admin regions operations
 * Contains all events related to regions management in admin module
 */
export const EVENTS_ADMIN_REGIONS: EventCollection = {
  // ========== Region Fetch Events ==========
  
  'region.fetch.success': {
    eventName: 'system.region.fetch.success',
    source: 'system',
    eventType: 'app',
    severity: 'info',
    eventMessage: 'Regions fetched successfully',
    version: '1.0.0'
  },

  'region.fetch.data_error': {
    eventName: 'system.region.fetch.data_error',
    source: 'system',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Region data error occurred during fetch operation',
    version: '1.0.0'
  },

  // ========== Regions Update Events (Batch) ==========
  
  'regions.update.transaction.rollback': {
    eventName: 'system.regions.update.transaction.rollback',
    source: 'system',
    eventType: 'app',
    severity: 'warning',
    eventMessage: 'Regions update transaction rolled back',
    version: '2.0.0'
  },

  'regions.update.success': {
    eventName: 'system.regions.update.success',
    source: 'system',
    eventType: 'app',
    severity: 'info',
    eventMessage: 'Regions updated successfully',
    version: '2.0.0'
  },

  'regions.update.validation.error': {
    eventName: 'system.regions.update.validation.error',
    source: 'system',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Validation error in regions update payload',
    version: '2.0.0'
  },

  'regions.update.database_error': {
    eventName: 'system.regions.update.database_error',
    source: 'system',
    eventType: 'app',
    severity: 'warning',
    eventMessage: 'Database error during regions update',
    version: '2.0.0'
  }
}

