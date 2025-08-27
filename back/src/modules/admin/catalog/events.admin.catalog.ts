/**
 * events.admin.catalog.ts
 * Version: 1.0.0
 * Description: Event reference catalog for admin catalog operations
 * Purpose: Defines events for admin catalog management operations (sections, services)
 * Backend file - events.admin.catalog.ts
 * Created: 2024-12-19
 * Last Updated: 2024-12-19
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
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Section create validation error occurred',
    version: '1.0.0'
  },

  // Section create database error
  'section.create.database_error': {
    eventName: 'adminCatalog.section.create.database_error',
    source: 'admin-catalog',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Database error occurred during section creation',
    version: '1.0.0'
  },

  // Section update validation error
  'section.update.validation.error': {
    eventName: 'adminCatalog.section.update.validation.error',
    source: 'admin-catalog',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Section update validation error occurred',
    version: '1.0.0'
  },

  // Section update database error
  'section.update.database_error': {
    eventName: 'adminCatalog.section.update.database_error',
    source: 'admin-catalog',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Database error occurred during section update',
    version: '1.0.0'
  },

  // Section delete validation error
  'section.delete.validation.error': {
    eventName: 'adminCatalog.section.delete.validation.error',
    source: 'admin-catalog',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Section delete validation error occurred',
    version: '1.0.0'
  },

  // Section delete database error
  'section.delete.database_error': {
    eventName: 'adminCatalog.section.delete.database_error',
    source: 'admin-catalog',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Database error occurred during section deletion',
    version: '1.0.0'
  },

  // Section delete started
  'section.delete.started': {
    eventName: 'adminCatalog.section.delete.started',
    source: 'admin-catalog',
    eventType: 'system',
    severity: 'debug',
    eventMessage: 'Section deletion started',
    version: '1.0.0'
  },

  // Section delete success
  'section.delete.success': {
    eventName: 'adminCatalog.section.delete.success',
    source: 'admin-catalog',
    eventType: 'system',
    severity: 'debug',
    eventMessage: 'Sections deleted successfully',
    version: '1.0.0'
  },

  // Section fetch started
  'section.fetch.started': {
    eventName: 'adminCatalog.section.fetch.started',
    source: 'admin-catalog',
    eventType: 'system',
    severity: 'debug',
    eventMessage: 'Section fetch started',
    version: '1.0.0'
  },

  // Section fetch success
  'section.fetch.success': {
    eventName: 'adminCatalog.section.fetch.success',
    source: 'admin-catalog',
    eventType: 'system',
    severity: 'debug',
    eventMessage: 'Sections fetched successfully',
    version: '1.0.0'
  },

  // Section fetch not found
  'section.fetch.not_found': {
    eventName: 'adminCatalog.section.fetch.not_found',
    source: 'admin-catalog',
    eventType: 'system',
    severity: 'debug',
    eventMessage: 'Section not found during fetch',
    version: '1.0.0'
  },

  // Section fetch error
  'section.fetch.error': {
    eventName: 'adminCatalog.section.fetch.error',
    source: 'admin-catalog',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Error occurred during section fetch',
    version: '1.0.0'
  },

  // Section create started
  'section.create.started': {
    eventName: 'adminCatalog.section.create.started',
    source: 'admin-catalog',
    eventType: 'system',
    severity: 'debug',
    eventMessage: 'Section creation started',
    version: '1.0.0'
  },

  // Section create success
  'section.create.success': {
    eventName: 'adminCatalog.section.create.success',
    source: 'admin-catalog',
    eventType: 'system',
    severity: 'info',
    eventMessage: 'Section created successfully',
    version: '1.0.0'
  },

  // Section update started
  'section.update.started': {
    eventName: 'adminCatalog.section.update.started',
    source: 'admin-catalog',
    eventType: 'system',
    severity: 'debug',
    eventMessage: 'Section update started',
    version: '1.0.0'
  },

  // Section update success
  'section.update.success': {
    eventName: 'adminCatalog.section.update.success',
    source: 'admin-catalog',
    eventType: 'system',
    severity: 'info',
    eventMessage: 'Section updated successfully',
    version: '1.0.0'
  },

  // Services publish fetch started
  'services.publish.fetch.started': {
    eventName: 'adminCatalog.services.publish.fetch.started',
    source: 'admin-catalog',
    eventType: 'system',
    severity: 'debug',
    eventMessage: 'Services publish fetch started',
    version: '1.0.0'
  },

  // Services publish fetch success
  'services.publish.fetch.success': {
    eventName: 'adminCatalog.services.publish.fetch.success',
    source: 'admin-catalog',
    eventType: 'system',
    severity: 'debug',
    eventMessage: 'Services publish fetch completed successfully',
    version: '1.0.0'
  },

  // Services publish fetch validation error
  'services.publish.fetch.validation_error': {
    eventName: 'adminCatalog.services.publish.fetch.validation_error',
    source: 'admin-catalog',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Services publish fetch validation error',
    version: '1.0.0'
  },

  // Services publish update started
  'services.publish.update.started': {
    eventName: 'adminCatalog.services.publish.update.started',
    source: 'admin-catalog',
    eventType: 'system',
    severity: 'debug',
    eventMessage: 'Services publish update started',
    version: '1.0.0'
  },

  // Services publish update success
  'services.publish.update.success': {
    eventName: 'adminCatalog.services.publish.update.success',
    source: 'admin-catalog',
    eventType: 'system',
    severity: 'info',
    eventMessage: 'Services publish updated successfully',
    version: '1.0.0'
  },

  // Services publish update database error
  'services.publish.update.database_error': {
    eventName: 'adminCatalog.services.publish.update.database_error',
    source: 'admin-catalog',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Database error during services publish update',
    version: '1.0.0'
  },

  // Controller unexpected error
  'controller.unexpected_error': {
    eventName: 'adminCatalog.controller.unexpected_error',
    source: 'admin-catalog',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Unexpected error in controller',
    version: '1.0.0'
  }
}

// Export for backward compatibility
export const eventsAdminCatalog = EVENTS_ADMIN_CATALOG
