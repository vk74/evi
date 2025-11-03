/**
 * version: 1.2.6
 * Event reference catalog for admin pricing operations (backend).
 * Defines events for pricing management operations (currencies and price lists).
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
    eventType: 'app',
    severity: 'debug',
    eventMessage: 'Currencies fetched successfully',
    version: '1.0.0'
  },

  'currencies.fetch.database_error': {
    eventName: 'adminPricing.currencies.fetch.database_error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'warning',
    eventMessage: 'Database error during currencies fetch',
    version: '1.0.0'
  },

  'currencies.fetch.error': {
    eventName: 'adminPricing.currencies.fetch.error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'warning',
    eventMessage: 'Error during currencies fetch operation',
    version: '1.0.0'
  },

  // ========== Update Currencies - Transaction Events ==========
  
  'currencies.update.transaction.commit': {
    eventName: 'adminPricing.currencies.update.transaction.commit',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'debug',
    eventMessage: 'Transaction committed successfully',
    version: '1.0.0'
  },

  'currencies.update.transaction.rollback': {
    eventName: 'adminPricing.currencies.update.transaction.rollback',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'warning',
    eventMessage: 'Transaction rolled back',
    version: '1.0.0'
  },

  // ========== Update Currencies - General Events ==========
  
  'currencies.update.success': {
    eventName: 'adminPricing.currencies.update.success',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'info',
    eventMessage: 'Currencies updated successfully',
    version: '1.0.0'
  },

  'currencies.update.validation.error': {
    eventName: 'adminPricing.currencies.update.validation.error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Validation error in currencies update payload',
    version: '1.0.0'
  },

  'currencies.update.database_error': {
    eventName: 'adminPricing.currencies.update.database_error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'warning',
    eventMessage: 'Database error during currencies update',
    version: '1.0.0'
  },

  'currencies.update.error': {
    eventName: 'adminPricing.currencies.update.error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'warning',
    eventMessage: 'Error during currencies update operation',
    version: '1.0.0'
  },

  // ========== Create Currency Events ==========
  
  'currencies.create.validation.error': {
    eventName: 'adminPricing.currencies.create.validation.error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Validation error creating currency',
    version: '1.0.0'
  },

  'currencies.create.success': {
    eventName: 'adminPricing.currencies.create.success',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'info',
    eventMessage: 'Currency created successfully',
    version: '1.0.0'
  },

  'currencies.create.database_error': {
    eventName: 'adminPricing.currencies.create.database_error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Database error creating currency',
    version: '1.0.0'
  },

  // ========== Update Single Currency Events ==========
  
  'currencies.update.currency.not_found': {
    eventName: 'adminPricing.currencies.update.currency.not_found',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Currency not found for update',
    version: '1.0.0'
  },

  'currencies.update.currency.validation.error': {
    eventName: 'adminPricing.currencies.update.currency.validation.error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Validation error updating currency',
    version: '1.0.0'
  },

  'currencies.update.currency.code_change_error': {
    eventName: 'adminPricing.currencies.update.currency.code_change_error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Attempt to change currency code (not supported)',
    version: '1.0.0'
  },

  'currencies.update.currency.success': {
    eventName: 'adminPricing.currencies.update.currency.success',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'info',
    eventMessage: 'Currency updated successfully',
    version: '1.0.0'
  },

  'currencies.update.currency.database_error': {
    eventName: 'adminPricing.currencies.update.currency.database_error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Database error updating currency',
    version: '1.0.0'
  },

  // ========== Delete Currency Events ==========
  
  'currencies.delete.not_found': {
    eventName: 'adminPricing.currencies.delete.not_found',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Currency not found for deletion',
    version: '1.0.0'
  },

  'currencies.delete.validation.error': {
    eventName: 'adminPricing.currencies.delete.validation.error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Validation error deleting currency',
    version: '1.0.0'
  },

  'currencies.delete.integrity_error': {
    eventName: 'adminPricing.currencies.delete.integrity_error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Cannot delete currency: used in price lists',
    version: '1.0.0'
  },

  'currencies.delete.success': {
    eventName: 'adminPricing.currencies.delete.success',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'info',
    eventMessage: 'Currency deleted successfully',
    version: '1.0.0'
  },

  'currencies.delete.database_error': {
    eventName: 'adminPricing.currencies.delete.database_error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Database error deleting currency',
    version: '1.0.0'
  },

  // ========== Price Lists - Fetch All Events ==========
  
  'pricelists.fetchall.success': {
    eventName: 'adminPricing.pricelists.fetchall.success',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'debug',
    eventMessage: 'Price lists fetched successfully',
    version: '1.0.0'
  },

  'pricelists.fetchall.database_error': {
    eventName: 'adminPricing.pricelists.fetchall.database_error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'warning',
    eventMessage: 'Database error during price lists fetch',
    version: '1.0.0'
  },

  'pricelists.fetchall.error': {
    eventName: 'adminPricing.pricelists.fetchall.error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'warning',
    eventMessage: 'Error during price lists fetch operation',
    version: '1.0.0'
  },

  // ========== Price Lists - Fetch Single Events ==========
  
  'pricelists.fetch.success': {
    eventName: 'adminPricing.pricelists.fetch.success',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'debug',
    eventMessage: 'Price list fetched successfully',
    version: '1.0.0'
  },

  'pricelists.fetch.not_found': {
    eventName: 'adminPricing.pricelists.fetch.not_found',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Price list not found',
    version: '1.0.0'
  },

  'pricelists.fetch.database_error': {
    eventName: 'adminPricing.pricelists.fetch.database_error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'warning',
    eventMessage: 'Database error during price list fetch',
    version: '1.0.0'
  },

  'pricelists.fetch.error': {
    eventName: 'adminPricing.pricelists.fetch.error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'warning',
    eventMessage: 'Error during price list fetch operation',
    version: '1.0.0'
  },

  // ========== Price Lists - Create Events ==========
  
  'pricelists.create.validation.error': {
    eventName: 'adminPricing.pricelists.create.validation.error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Validation error creating price list',
    version: '1.0.0'
  },

  'pricelists.create.owner.validation_error': {
    eventName: 'adminPricing.pricelists.create.owner.validation_error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Owner validation error creating price list',
    version: '1.0.0'
  },

  'pricelists.create.currency.not_found': {
    eventName: 'adminPricing.pricelists.create.currency.not_found',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Currency not found for price list creation',
    version: '1.0.0'
  },

  'pricelists.create.country.invalid': {
    eventName: 'adminPricing.pricelists.create.country.invalid',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Invalid country value for price list creation',
    version: '1.0.0'
  },

  'pricelists.create.name.duplicate': {
    eventName: 'adminPricing.pricelists.create.name.duplicate',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Price list name already exists',
    version: '1.0.0'
  },

  'pricelists.create.success': {
    eventName: 'adminPricing.pricelists.create.success',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'info',
    eventMessage: 'Price list created successfully',
    version: '1.0.0'
  },

  'pricelists.create.database_error': {
    eventName: 'adminPricing.pricelists.create.database_error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'warning',
    eventMessage: 'Database error creating price list',
    version: '1.0.0'
  },

  'pricelists.create.error': {
    eventName: 'adminPricing.pricelists.create.error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'warning',
    eventMessage: 'Error during price list creation operation',
    version: '1.0.0'
  },

  // ========== Price Lists - Update Events ==========
  
  'pricelists.update.not_found': {
    eventName: 'adminPricing.pricelists.update.not_found',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Price list not found for update',
    version: '1.0.0'
  },

  'pricelists.update.validation.error': {
    eventName: 'adminPricing.pricelists.update.validation.error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Validation error updating price list',
    version: '1.0.0'
  },

  'pricelists.update.owner.validation_error': {
    eventName: 'adminPricing.pricelists.update.owner.validation_error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Owner validation error updating price list',
    version: '1.0.0'
  },

  'pricelists.update.currency.not_found': {
    eventName: 'adminPricing.pricelists.update.currency.not_found',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Currency not found for price list update',
    version: '1.0.0'
  },

  'pricelists.update.name.duplicate': {
    eventName: 'adminPricing.pricelists.update.name.duplicate',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Price list name already exists',
    version: '1.0.0'
  },

  'pricelists.update.success': {
    eventName: 'adminPricing.pricelists.update.success',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'info',
    eventMessage: 'Price list updated successfully',
    version: '1.0.0'
  },

  'pricelists.update.database_error': {
    eventName: 'adminPricing.pricelists.update.database_error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'warning',
    eventMessage: 'Database error updating price list',
    version: '1.0.0'
  },

  'pricelists.update.error': {
    eventName: 'adminPricing.pricelists.update.error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'warning',
    eventMessage: 'Error during price list update operation',
    version: '1.0.0'
  },

  // ========== Price Lists - Delete Events ==========
  
  'pricelists.delete.validation.error': {
    eventName: 'adminPricing.pricelists.delete.validation.error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Validation error deleting price lists',
    version: '1.0.0'
  },

  'pricelists.delete.not_found': {
    eventName: 'adminPricing.pricelists.delete.not_found',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'warning',
    eventMessage: 'Price list not found for deletion',
    version: '1.0.0'
  },

  'pricelists.delete.success': {
    eventName: 'adminPricing.pricelists.delete.success',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'info',
    eventMessage: 'Price list deleted successfully',
    version: '1.0.0'
  },

  'pricelists.delete.database_error': {
    eventName: 'adminPricing.pricelists.delete.database_error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'warning',
    eventMessage: 'Database error deleting price list',
    version: '1.0.0'
  },

  'pricelists.delete.error': {
    eventName: 'adminPricing.pricelists.delete.error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'warning',
    eventMessage: 'Error during price list deletion operation',
    version: '1.0.0'
  },

  // ========== Price Lists - Partition Deletion Events ==========
  
  'pricelists.delete.partition.success': {
    eventName: 'adminPricing.pricelists.delete.partition.success',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'info',
    eventMessage: 'Price list partition deleted successfully',
    version: '1.0.0'
  },

  'pricelists.delete.partition.error': {
    eventName: 'adminPricing.pricelists.delete.partition.error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'warning',
    eventMessage: 'Error deleting price list partition',
    version: '1.0.0'
  },

  'pricelists.delete.partition.not_found': {
    eventName: 'adminPricing.pricelists.delete.partition.not_found',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'debug',
    eventMessage: 'Price list partition not found (already deleted)',
    version: '1.0.0'
  },

  // ========== Price List Items - Create Events ==========
  
  'pricelist.items.create.success': {
    eventName: 'adminPricing.pricelist.items.create.success',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'info',
    eventMessage: 'Price list item created successfully',
    version: '1.0.0'
  },

  'pricelist.items.create.validation.error': {
    eventName: 'adminPricing.pricelist.items.create.validation.error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Validation error creating price list item',
    version: '1.0.0'
  },

  'pricelist.items.create.not_found': {
    eventName: 'adminPricing.pricelist.items.create.not_found',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Price list not found for item creation',
    version: '1.0.0'
  },

  'pricelist.items.create.code.duplicate': {
    eventName: 'adminPricing.pricelist.items.create.code.duplicate',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Item code already exists in this price list',
    version: '1.0.0'
  },

  'pricelist.items.create.type.not_found': {
    eventName: 'adminPricing.pricelist.items.create.type.not_found',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Price item type not found or inactive',
    version: '1.0.0'
  },

  'pricelist.items.create.database_error': {
    eventName: 'adminPricing.pricelist.items.create.database_error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'warning',
    eventMessage: 'Database error creating price list item',
    version: '1.0.0'
  },

  'pricelist.items.create.error': {
    eventName: 'adminPricing.pricelist.items.create.error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'warning',
    eventMessage: 'Error during price list item creation operation',
    version: '1.0.0'
  },

  // ========== Price Item Types - Fetch Events ==========
  
  'pricelist.item.types.fetch.success': {
    eventName: 'adminPricing.pricelist.item.types.fetch.success',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'debug',
    eventMessage: 'Price item types fetched successfully',
    version: '1.0.0'
  },

  'pricelist.item.types.fetch.database_error': {
    eventName: 'adminPricing.pricelist.item.types.fetch.database_error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'warning',
    eventMessage: 'Database error fetching price item types',
    version: '1.0.0'
  },

  'pricelist.item.types.fetch.error': {
    eventName: 'adminPricing.pricelist.item.types.fetch.error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'warning',
    eventMessage: 'Error during price item types fetch operation',
    version: '1.0.0'
  },

  // ========== Price List Items - Delete Events ==========
  
  'pricelist.items.delete.success': {
    eventName: 'adminPricing.pricelist.items.delete.success',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'info',
    eventMessage: 'Price list items deleted successfully',
    version: '1.0.0'
  },

  'pricelist.items.delete.validation.error': {
    eventName: 'adminPricing.pricelist.items.delete.validation.error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Validation error deleting price list items',
    version: '1.0.0'
  },

  'pricelist.items.delete.not_found': {
    eventName: 'adminPricing.pricelist.items.delete.not_found',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'warning',
    eventMessage: 'Some price list items not found for deletion',
    version: '1.0.0'
  },

  'pricelist.items.delete.database_error': {
    eventName: 'adminPricing.pricelist.items.delete.database_error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'warning',
    eventMessage: 'Database error deleting price list items',
    version: '1.0.0'
  },

  'pricelist.items.delete.error': {
    eventName: 'adminPricing.pricelist.items.delete.error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'warning',
    eventMessage: 'Error during price list items deletion operation',
    version: '1.0.0'
  },

  // ========== Price List Items - Update Events ==========
  
  'pricelist.items.update.success': {
    eventName: 'adminPricing.pricelist.items.update.success',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'info',
    eventMessage: 'Price list items updated successfully',
    version: '1.0.0'
  },

  'pricelist.items.update.validation.error': {
    eventName: 'adminPricing.pricelist.items.update.validation.error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Validation error updating price list items',
    version: '1.0.0'
  },

  'pricelist.items.update.not_found': {
    eventName: 'adminPricing.pricelist.items.update.not_found',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'warning',
    eventMessage: 'Some price list items not found for update',
    version: '1.0.0'
  },

  'pricelist.items.update.code.duplicate': {
    eventName: 'adminPricing.pricelist.items.update.code.duplicate',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Item code already exists in this price list',
    version: '1.0.0'
  },

  'pricelist.items.update.type.not_found': {
    eventName: 'adminPricing.pricelist.items.update.type.not_found',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'error',
    eventMessage: 'Price item type not found or inactive',
    version: '1.0.0'
  },

  'pricelist.items.update.database_error': {
    eventName: 'adminPricing.pricelist.items.update.database_error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'warning',
    eventMessage: 'Database error updating price list items',
    version: '1.0.0'
  },

  'pricelist.items.update.error': {
    eventName: 'adminPricing.pricelist.items.update.error',
    source: 'admin-pricing',
    eventType: 'app',
    severity: 'warning',
    eventMessage: 'Error during price list items update operation',
    version: '1.0.0'
  }
}

// Export for backward compatibility
export const eventsAdminPricing = EVENTS_ADMIN_PRICING
