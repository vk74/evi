/**
 * events.admin.services.ts
 * Version: 1.0.0
 * Description: Event reference catalog for admin service operations
 * Purpose: Defines events for admin service management operations
 * Backend file - events.admin.services.ts
 * Created: 2024-12-19
 * Last Updated: 2024-12-19
 */

import { EventCollection } from '../../../core/eventBus/types.events'

/**
 * Event reference catalog for admin service operations
 * Contains all events related to service management in admin module
 */
export const eventsAdminServices: EventCollection = {
  // Service fetch validation error
  'admin.service.fetch.validation.error': {
    eventName: 'admin.service.fetch.validation.error',
    source: 'admin-service',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Service fetch validation error occurred',
    version: '1.0.0'
  },

  // Service not found
  'admin.service.fetch.not_found': {
    eventName: 'admin.service.fetch.not_found',
    source: 'admin-service',
    eventType: 'system',
    severity: 'debug',
    eventMessage: 'Service not found during fetch operation',
    version: '1.0.0'
  },

  // Service data error
  'admin.service.fetch.data_error': {
    eventName: 'admin.service.fetch.data_error',
    source: 'admin-service',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Service data error occurred during fetch operation',
    version: '1.0.0'
  },

  // Service fetch success
  'admin.service.fetch.success': {
    eventName: 'admin.service.fetch.success',
    source: 'admin-service',
    eventType: 'system',
    severity: 'debug',
    eventMessage: 'Service data fetched successfully',
    version: '1.0.0'
  },

  // Service fetch general error
  'admin.service.fetch.error': {
    eventName: 'admin.service.fetch.error',
    source: 'admin-service',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'General error occurred during service fetch operation',
    version: '1.0.0'
  },

  // Controller validation error
  'admin.service.fetch.controller.validation.error': {
    eventName: 'admin.service.fetch.controller.validation.error',
    source: 'admin-service',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Controller validation error for service fetch request',
    version: '1.0.0'
  },

  // Controller fetch error
  'admin.service.fetch.controller.fetch_error': {
    eventName: 'admin.service.fetch.controller.fetch_error',
    source: 'admin-service',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Controller fetch error for service data',
    version: '1.0.0'
  },

  // Controller success
  'admin.service.fetch.controller.success': {
    eventName: 'admin.service.fetch.controller.success',
    source: 'admin-service',
    eventType: 'system',
    severity: 'debug',
    eventMessage: 'Controller successfully fetched service data',
    version: '1.0.0'
  },

  // Controller unexpected error
  'admin.service.fetch.controller.unexpected_error': {
    eventName: 'admin.service.fetch.controller.unexpected_error',
    source: 'admin-service',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Unexpected error in service fetch controller',
    version: '1.0.0'
  }
} 