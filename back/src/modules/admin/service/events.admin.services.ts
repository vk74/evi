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
export const EVENTS_ADMIN_SERVICES: EventCollection = {
  // Service fetch validation error
  'service.fetch.validation.error': {
    eventName: 'adminServices.service.fetch.validation.error',
    source: 'admin-service',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Service fetch validation error occurred',
    version: '1.0.0'
  },

  // Service not found
  'service.fetch.not_found': {
    eventName: 'adminServices.service.fetch.not_found',
    source: 'admin-service',
    eventType: 'system',
    severity: 'debug',
    eventMessage: 'Service not found during fetch operation',
    version: '1.0.0'
  },

  // Service data error
  'service.fetch.data_error': {
    eventName: 'adminServices.service.fetch.data_error',
    source: 'admin-service',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Service data error occurred during fetch operation',
    version: '1.0.0'
  },

  // Service fetch success
  'service.fetch.success': {
    eventName: 'adminServices.service.fetch.success',
    source: 'admin-service',
    eventType: 'system',
    severity: 'debug',
    eventMessage: 'Service data fetched successfully',
    version: '1.0.0'
  },

  // Service fetch general error
  'service.fetch.error': {
    eventName: 'adminServices.service.fetch.error',
    source: 'admin-service',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'General error occurred during service fetch operation',
    version: '1.0.0'
  },

  // Controller validation error
  'service.fetch.controller.validation.error': {
    eventName: 'adminServices.service.fetch.controller.validation.error',
    source: 'admin-service',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Controller validation error for service fetch request',
    version: '1.0.0'
  },

  // Controller fetch error
  'service.fetch.controller.fetch_error': {
    eventName: 'adminServices.service.fetch.controller.fetch_error',
    source: 'admin-service',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Controller fetch error for service data',
    version: '1.0.0'
  },

  // Controller success
  'service.fetch.controller.success': {
    eventName: 'adminServices.service.fetch.controller.success',
    source: 'admin-service',
    eventType: 'system',
    severity: 'debug',
    eventMessage: 'Controller successfully fetched service data',
    version: '1.0.0'
  },

  // Controller unexpected error
  'service.fetch.controller.unexpected_error': {
    eventName: 'adminServices.service.fetch.controller.unexpected_error',
    source: 'admin-service',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Unexpected error in service fetch controller',
    version: '1.0.0'
  },

  // Service update validation error
  'service.update.validation.error': {
    eventName: 'adminServices.service.update.validation.error',
    source: 'admin-service',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Service update validation error occurred',
    version: '1.0.0'
  },

  // Service update not found
  'service.update.not_found': {
    eventName: 'adminServices.service.update.not_found',
    source: 'admin-service',
    eventType: 'system',
    severity: 'debug',
    eventMessage: 'Service not found during update operation',
    version: '1.0.0'
  },

  // Service update success
  'service.update.success': {
    eventName: 'adminServices.service.update.success',
    source: 'admin-service',
    eventType: 'system',
    severity: 'debug',
    eventMessage: 'Service updated successfully',
    version: '1.0.0'
  },

  // Service update database error
  'service.update.database_error': {
    eventName: 'adminServices.service.update.database_error',
    source: 'admin-service',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Database error occurred during service update',
    version: '1.0.0'
  },

  // Service delete validation error
  'service.delete.validation.error': {
    eventName: 'adminServices.service.delete.validation.error',
    source: 'admin-service',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Service delete validation error occurred',
    version: '1.0.0'
  },

  // Service delete validation success
  'service.delete.validation.success': {
    eventName: 'adminServices.service.delete.validation.success',
    source: 'admin-service',
    eventType: 'system',
    severity: 'debug',
    eventMessage: 'Service delete validation successful',
    version: '1.0.0'
  },

  // Service delete not found
  'service.delete.not_found': {
    eventName: 'adminServices.service.delete.not_found',
    source: 'admin-service',
    eventType: 'system',
    severity: 'debug',
    eventMessage: 'Service not found during delete operation',
    version: '1.0.0'
  },

  // Service delete exists
  'service.delete.exists': {
    eventName: 'adminServices.service.delete.exists',
    source: 'admin-service',
    eventType: 'system',
    severity: 'debug',
    eventMessage: 'Service found during delete operation',
    version: '1.0.0'
  },

  // Service delete check error
  'service.delete.check_error': {
    eventName: 'adminServices.service.delete.check_error',
    source: 'admin-service',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Error occurred while checking service existence',
    version: '1.0.0'
  },

  // Service delete database error
  'service.delete.database_error': {
    eventName: 'adminServices.service.delete.database_error',
    source: 'admin-service',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Database error occurred during service delete',
    version: '1.0.0'
  },

  // Service delete success
  'service.delete.success': {
    eventName: 'adminServices.service.delete.success',
    source: 'admin-service',
    eventType: 'system',
    severity: 'debug',
    eventMessage: 'Service deleted successfully',
    version: '1.0.0'
  },

  // Service delete partial success
  'service.delete.partial_success': {
    eventName: 'adminServices.service.delete.partial_success',
    source: 'admin-service',
    eventType: 'system',
    severity: 'warning',
    eventMessage: 'Partial success during service delete operation',
    version: '1.0.0'
  },

  // Service update user role error
  'service.update.user_role_error': {
    eventName: 'adminServices.service.update.user_role_error',
    source: 'admin-service',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Error occurred while updating user role for service',
    version: '1.0.0'
  },

  // Service update group role error
  'service.update.group_role_error': {
    eventName: 'adminServices.service.update.group_role_error',
    source: 'admin-service',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Error occurred while updating group role for service',
    version: '1.0.0'
  },

  // Service update access allowed group error
  'service.update.access_allowed_group_error': {
    eventName: 'adminServices.service.update.access_allowed_group_error',
    source: 'admin-service',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Error occurred while updating access allowed group for service',
    version: '1.0.0'
  },

  // Service update access denied group error
  'service.update.access_denied_group_error': {
    eventName: 'adminServices.service.update.access_denied_group_error',
    source: 'admin-service',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Error occurred while updating access denied group for service',
    version: '1.0.0'
  },

  // Service update access denied user error
  'service.update.access_denied_user_error': {
    eventName: 'adminServices.service.update.access_denied_user_error',
    source: 'admin-service',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Error occurred while updating access denied user for service',
    version: '1.0.0'
  }
}

// Export for backward compatibility
export const eventsAdminServices = EVENTS_ADMIN_SERVICES 