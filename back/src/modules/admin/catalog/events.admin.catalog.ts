/**
 * events.admin.catalog.ts
 * Version: 1.1.0
 * Description: Event reference catalog for admin catalog operations
 * Purpose: Defines events for admin catalog management operations (sections, services)
 * Backend file - events.admin.catalog.ts
 * 
 * Changes in v1.1.0:
 * - Removed all "started" events (section.delete.started, section.fetch.started, section.create.started, 
 *   section.update.started, services.publish.fetch.started, services.publish.update.started, 
 *   services.publish.started, services.unpublish.started, services.sections.fetch.started)
 * - Enhanced payloads for remaining events with more detailed information
 */

import { EventCollection } from '../../../core/eventBus/types.events'

/**
 * Event reference catalog for admin catalog operations
 * Contains all events related to catalog management in admin module
 */
export const EVENTS_ADMIN_CATALOG: EventCollection = {
  // Section create validation error
  'section.create.validation.error': {
    eventName: 'adminCatalog.section.create.validation.error',
    source: 'admin-catalog',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Section create validation error occurred',
    version: '1.0.0'
  },

  // Section update validation error
  'section.update.validation.error': {
    eventName: 'adminCatalog.section.update.validation.error',
    source: 'admin-catalog',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Section update validation error occurred',
    version: '1.0.0'
  },

  // Section update database error
  'section.update.database_error': {
    eventName: 'adminCatalog.section.update.database_error',
    source: 'admin-catalog',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Database error occurred during section update',
    version: '1.0.0'
  },

  // Section delete validation error
  'section.delete.validation.error': {
    eventName: 'adminCatalog.section.delete.validation.error',
    source: 'admin-catalog',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Section delete validation error occurred',
    version: '1.0.0'
  },

  // Section delete database error
  'section.delete.database_error': {
    eventName: 'adminCatalog.section.delete.database_error',
    source: 'admin-catalog',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Database error occurred during section deletion',
    version: '1.0.0'
  },

  // Section delete success
  'section.delete.success': {
    eventName: 'adminCatalog.section.delete.success',
    source: 'admin-catalog',
    eventType: 'app',
    severity: 'debug',
    eventMessage: 'Sections deleted successfully',
    version: '1.0.0'
  },

  // Section fetch success
  'section.fetch.success': {
    eventName: 'adminCatalog.section.fetch.success',
    source: 'admin-catalog',
    eventType: 'app',
    severity: 'debug',
    eventMessage: 'Sections fetched successfully',
    version: '1.0.0'
  },

  // Section fetch not found
  'section.fetch.not_found': {
    eventName: 'adminCatalog.section.fetch.not_found',
    source: 'admin-catalog',
    eventType: 'app',
    severity: 'debug',
    eventMessage: 'Section not found during fetch',
    version: '1.0.0'
  },

  // Section fetch error
  'section.fetch.error': {
    eventName: 'adminCatalog.section.fetch.error',
    source: 'admin-catalog',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Error occurred during section fetch',
    version: '1.0.0'
  },

  // Section create success
  'section.create.success': {
    eventName: 'adminCatalog.section.create.success',
    source: 'admin-catalog',
    eventType: 'app',
    severity: 'info',
    eventMessage: 'Section created successfully',
    version: '1.0.0'
  },

  // Section update success
  'section.update.success': {
    eventName: 'adminCatalog.section.update.success',
    source: 'admin-catalog',
    eventType: 'app',
    severity: 'info',
    eventMessage: 'Section updated successfully',
    version: '1.0.0'
  },

  // Services publish fetch validation error
  'services.publish.fetch.validation_error': {
    eventName: 'adminCatalog.services.publish.fetch.validation_error',
    source: 'admin-catalog',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Services publish fetch validation error',
    version: '1.0.0'
  },

  // Services publish success
  'services.publish.success': {
    eventName: 'adminCatalog.services.publish.success',
    source: 'admin-catalog',
    eventType: 'app',
    severity: 'info',
    eventMessage: 'Services published successfully',
    version: '1.0.0'
  },

  // Services publish database error
  'services.publish.database_error': {
    eventName: 'adminCatalog.services.publish.database_error',
    source: 'admin-catalog',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Database error during services publish',
    version: '1.0.0'
  },

  // Services unpublish success
  'services.unpublish.success': {
    eventName: 'adminCatalog.services.unpublish.success',
    source: 'admin-catalog',
    eventType: 'app',
    severity: 'info',
    eventMessage: 'Services unpublished successfully',
    version: '1.0.0'
  },

  // Services unpublish database error
  'services.unpublish.database_error': {
    eventName: 'adminCatalog.services.unpublish.database_error',
    source: 'admin-catalog',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Database error during services unpublish',
    version: '1.0.0'
  },

  // Services sections fetch success
  'services.sections.fetch.success': {
    eventName: 'adminCatalog.services.sections.fetch.success',
    source: 'admin-catalog',
    eventType: 'app',
    severity: 'debug',
    eventMessage: 'Services sections fetch completed successfully',
    version: '1.0.0'
  },

  // Controller unexpected error
  'controller.unexpected_error': {
    eventName: 'adminCatalog.controller.unexpected_error',
    source: 'admin-catalog',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Unexpected error in controller',
    version: '1.0.0'
  }
}

// Export for backward compatibility
export const eventsAdminCatalog = EVENTS_ADMIN_CATALOG
