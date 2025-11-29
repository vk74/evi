/**
 * events.admin.regions.ts
 * Version: 1.0.0
 * Description: Event reference catalog for admin regions operations
 * Purpose: Defines events for admin regions management operations
 * Backend file - events.admin.regions.ts
 */

import { EventCollection } from '../../../core/eventBus/types.events'

/**
 * Event reference catalog for admin regions operations
 * Contains all events related to regions management in admin module
 */
export const EVENTS_ADMIN_REGIONS: EventCollection = {
  // Region fetch validation error
  'region.fetch.validation.error': {
    eventName: 'system.region.fetch.validation.error',
    source: 'system',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Region fetch validation error occurred',
    version: '1.0.0'
  },

  // Region fetch success
  'region.fetch.success': {
    eventName: 'system.region.fetch.success',
    source: 'system',
    eventType: 'app',
    severity: 'info',
    eventMessage: 'Regions fetched successfully',
    version: '1.0.0'
  },

  // Region fetch data error
  'region.fetch.data_error': {
    eventName: 'system.region.fetch.data_error',
    source: 'system',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Region data error occurred during fetch operation',
    version: '1.0.0'
  },

  // Region create started
  'region.create.started': {
    eventName: 'system.region.create.started',
    source: 'system',
    eventType: 'app',
    severity: 'info',
    eventMessage: 'Region creation started',
    version: '1.0.0'
  },

  // Region create validation error
  'region.create.validation.error': {
    eventName: 'system.region.create.validation.error',
    source: 'system',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Region creation validation error occurred',
    version: '1.0.0'
  },

  // Region create duplicate error
  'region.create.duplicate_error': {
    eventName: 'system.region.create.duplicate_error',
    source: 'system',
    eventType: 'app',
    severity: 'warning',
    eventMessage: 'Region with this name already exists',
    version: '1.0.0'
  },

  // Region create success
  'region.create.success': {
    eventName: 'system.region.create.success',
    source: 'system',
    eventType: 'app',
    severity: 'info',
    eventMessage: 'Region created successfully',
    version: '1.0.0'
  },

  // Region create database error
  'region.create.database_error': {
    eventName: 'system.region.create.database_error',
    source: 'system',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Database error occurred during region creation',
    version: '1.0.0'
  },

  // Region create error
  'region.create.error': {
    eventName: 'system.region.create.error',
    source: 'system',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Error occurred during region creation',
    version: '1.0.0'
  },

  // Region update started
  'region.update.started': {
    eventName: 'system.region.update.started',
    source: 'system',
    eventType: 'app',
    severity: 'info',
    eventMessage: 'Region update started',
    version: '1.0.0'
  },

  // Region update validation error
  'region.update.validation.error': {
    eventName: 'system.region.update.validation.error',
    source: 'system',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Region update validation error occurred',
    version: '1.0.0'
  },

  // Region update not found
  'region.update.not_found': {
    eventName: 'system.region.update.not_found',
    source: 'system',
    eventType: 'app',
    severity: 'warning',
    eventMessage: 'Region not found during update operation',
    version: '1.0.0'
  },

  // Region update duplicate error
  'region.update.duplicate_error': {
    eventName: 'system.region.update.duplicate_error',
    source: 'system',
    eventType: 'app',
    severity: 'warning',
    eventMessage: 'Region with this name already exists',
    version: '1.0.0'
  },

  // Region update success
  'region.update.success': {
    eventName: 'system.region.update.success',
    source: 'system',
    eventType: 'app',
    severity: 'info',
    eventMessage: 'Region updated successfully',
    version: '1.0.0'
  },

  // Region update database error
  'region.update.database_error': {
    eventName: 'system.region.update.database_error',
    source: 'system',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Database error occurred during region update',
    version: '1.0.0'
  },

  // Region update error
  'region.update.error': {
    eventName: 'system.region.update.error',
    source: 'system',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Error occurred during region update',
    version: '1.0.0'
  },

  // Region delete validation success
  'region.delete.validation.success': {
    eventName: 'system.region.delete.validation.success',
    source: 'system',
    eventType: 'app',
    severity: 'info',
    eventMessage: 'Region deletion validation passed',
    version: '1.0.0'
  },

  // Region delete validation error
  'region.delete.validation.error': {
    eventName: 'system.region.delete.validation.error',
    source: 'system',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Region deletion validation error occurred',
    version: '1.0.0'
  },

  // Region delete exists
  'region.delete.exists': {
    eventName: 'system.region.delete.exists',
    source: 'system',
    eventType: 'app',
    severity: 'debug',
    eventMessage: 'Region exists before deletion',
    version: '1.0.0'
  },

  // Region delete not found
  'region.delete.not_found': {
    eventName: 'system.region.delete.not_found',
    source: 'system',
    eventType: 'app',
    severity: 'debug',
    eventMessage: 'Region not found during deletion operation',
    version: '1.0.0'
  },

  // Region delete success
  'region.delete.success': {
    eventName: 'system.region.delete.success',
    source: 'system',
    eventType: 'app',
    severity: 'info',
    eventMessage: 'Region deleted successfully',
    version: '1.0.0'
  },

  // Region delete partial success
  'region.delete.partial_success': {
    eventName: 'system.region.delete.partial_success',
    source: 'system',
    eventType: 'app',
    severity: 'warning',
    eventMessage: 'Partial success during batch region deletion',
    version: '1.0.0'
  },

  // Region delete database error
  'region.delete.database_error': {
    eventName: 'system.region.delete.database_error',
    source: 'system',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Database error occurred during region deletion',
    version: '1.0.0'
  }
}

