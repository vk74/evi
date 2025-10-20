/**
 * version: 2.0.0
 * Event reference catalog for admin pricing operations (backend).
 * Defines events for pricing management operations (currencies).
 * File: events.admin.pricing.ts (backend)
 */

import { EventCollection } from '../../../core/eventBus/types.events'

/**
 * Event reference catalog for admin pricing operations
 * Contains all events related to pricing management in admin module
 */
export const EVENTS_ADMIN_PRICING: EventCollection = {
  // ========== Fetch Currencies Events ==========
  
  'currencies.fetch.success': {
    eventName: 'adminPricing.currencies.fetch.success',
    source: 'admin-pricing',
    eventType: 'system',
    severity: 'debug',
    eventMessage: 'Currencies fetched successfully',
    version: '1.0.0'
  },

  'currencies.fetch.database_error': {
    eventName: 'adminPricing.currencies.fetch.database_error',
    source: 'admin-pricing',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Database error during currencies fetch',
    version: '1.0.0'
  },

  'currencies.fetch.error': {
    eventName: 'adminPricing.currencies.fetch.error',
    source: 'admin-pricing',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Error during currencies fetch operation',
    version: '1.0.0'
  },

  // ========== Update Currencies - Transaction Events ==========
  
  'currencies.update.transaction.commit': {
    eventName: 'adminPricing.currencies.update.transaction.commit',
    source: 'admin-pricing',
    eventType: 'system',
    severity: 'debug',
    eventMessage: 'Transaction committed successfully',
    version: '1.0.0'
  },

  'currencies.update.transaction.rollback': {
    eventName: 'adminPricing.currencies.update.transaction.rollback',
    source: 'admin-pricing',
    eventType: 'system',
    severity: 'warning',
    eventMessage: 'Transaction rolled back',
    version: '1.0.0'
  },

  // ========== Update Currencies - General Events ==========
  
  'currencies.update.success': {
    eventName: 'adminPricing.currencies.update.success',
    source: 'admin-pricing',
    eventType: 'system',
    severity: 'info',
    eventMessage: 'Currencies updated successfully',
    version: '1.0.0'
  },

  'currencies.update.validation.error': {
    eventName: 'adminPricing.currencies.update.validation.error',
    source: 'admin-pricing',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Validation error in currencies update payload',
    version: '1.0.0'
  },

  'currencies.update.database_error': {
    eventName: 'adminPricing.currencies.update.database_error',
    source: 'admin-pricing',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Database error during currencies update',
    version: '1.0.0'
  },

  'currencies.update.error': {
    eventName: 'adminPricing.currencies.update.error',
    source: 'admin-pricing',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Error during currencies update operation',
    version: '1.0.0'
  },

  // ========== Create Currency Events ==========
  
  'currencies.create.validation.error': {
    eventName: 'adminPricing.currencies.create.validation.error',
    source: 'admin-pricing',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Validation error creating currency',
    version: '1.0.0'
  },

  'currencies.create.success': {
    eventName: 'adminPricing.currencies.create.success',
    source: 'admin-pricing',
    eventType: 'system',
    severity: 'debug',
    eventMessage: 'Currency created successfully',
    version: '1.0.0'
  },

  'currencies.create.database_error': {
    eventName: 'adminPricing.currencies.create.database_error',
    source: 'admin-pricing',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Database error creating currency',
    version: '1.0.0'
  },

  // ========== Update Single Currency Events ==========
  
  'currencies.update.currency.not_found': {
    eventName: 'adminPricing.currencies.update.currency.not_found',
    source: 'admin-pricing',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Currency not found for update',
    version: '1.0.0'
  },

  'currencies.update.currency.validation.error': {
    eventName: 'adminPricing.currencies.update.currency.validation.error',
    source: 'admin-pricing',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Validation error updating currency',
    version: '1.0.0'
  },

  'currencies.update.currency.code_change_error': {
    eventName: 'adminPricing.currencies.update.currency.code_change_error',
    source: 'admin-pricing',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Attempt to change currency code (not supported)',
    version: '1.0.0'
  },

  'currencies.update.currency.success': {
    eventName: 'adminPricing.currencies.update.currency.success',
    source: 'admin-pricing',
    eventType: 'system',
    severity: 'debug',
    eventMessage: 'Currency updated successfully',
    version: '1.0.0'
  },

  'currencies.update.currency.database_error': {
    eventName: 'adminPricing.currencies.update.currency.database_error',
    source: 'admin-pricing',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Database error updating currency',
    version: '1.0.0'
  },

  // ========== Delete Currency Events ==========
  
  'currencies.delete.not_found': {
    eventName: 'adminPricing.currencies.delete.not_found',
    source: 'admin-pricing',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Currency not found for deletion',
    version: '1.0.0'
  },

  'currencies.delete.validation.error': {
    eventName: 'adminPricing.currencies.delete.validation.error',
    source: 'admin-pricing',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Validation error deleting currency',
    version: '1.0.0'
  },

  'currencies.delete.integrity_error': {
    eventName: 'adminPricing.currencies.delete.integrity_error',
    source: 'admin-pricing',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Cannot delete currency: used in price lists',
    version: '1.0.0'
  },

  'currencies.delete.success': {
    eventName: 'adminPricing.currencies.delete.success',
    source: 'admin-pricing',
    eventType: 'system',
    severity: 'debug',
    eventMessage: 'Currency deleted successfully',
    version: '1.0.0'
  },

  'currencies.delete.database_error': {
    eventName: 'adminPricing.currencies.delete.database_error',
    source: 'admin-pricing',
    eventType: 'system',
    severity: 'error',
    eventMessage: 'Database error deleting currency',
    version: '1.0.0'
  }
}

// Export for backward compatibility
export const eventsAdminPricing = EVENTS_ADMIN_PRICING
