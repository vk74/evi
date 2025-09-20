/**
 * events.admin.products.ts - version 1.0.0
 * Event definitions for products administration module.
 * 
 * Contains event templates for products admin functionality.
 * Used by event bus factory for generating and publishing events.
 * 
 * File: events.admin.products.ts
 */

import { EventCollection } from '../../../core/eventBus/types.events'

/**
 * Event reference catalog for admin products operations
 * Contains all events related to product management in admin module
 */
export const EVENTS_ADMIN_PRODUCTS: EventCollection = {
    // Product creation events
    'product.create.started': {
        eventName: 'products.create.started',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product creation process started',
        version: '1.0.0'
    },

    'product.create.validation_started': {
        eventName: 'products.create.validation_started',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product creation validation started',
        version: '1.0.0'
    },

    'product.create.code_check_started': {
        eventName: 'products.create.code_check_started',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product code uniqueness check started',
        version: '1.0.0'
    },

    'product.create.code_check_success': {
        eventName: 'products.create.code_check_success',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product code uniqueness check passed',
        version: '1.0.0'
    },

    'product.create.code_check_error': {
        eventName: 'products.create.code_check_error',
        source: 'admin-products',
        eventType: 'system',
        severity: 'error',
        eventMessage: 'Product code uniqueness check failed',
        version: '1.0.0'
    },

    'product.create.translation_key_check_started': {
        eventName: 'products.create.translation_key_check_started',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Translation key uniqueness check started',
        version: '1.0.0'
    },

    'product.create.translation_key_check_success': {
        eventName: 'products.create.translation_key_check_success',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Translation key uniqueness check passed',
        version: '1.0.0'
    },

    'product.create.translation_key_check_error': {
        eventName: 'products.create.translation_key_check_error',
        source: 'admin-products',
        eventType: 'system',
        severity: 'error',
        eventMessage: 'Translation key uniqueness check failed',
        version: '1.0.0'
    },

    'product.create.inserting_data': {
        eventName: 'products.create.inserting_data',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Inserting product data into database',
        version: '1.0.0'
    },

    'product.create.success': {
        eventName: 'products.create.success',
        source: 'admin-products',
        eventType: 'system',
        severity: 'info',
        eventMessage: 'Product created successfully',
        version: '1.0.0'
    },

    'product.create.translation_created': {
        eventName: 'products.create.translation_created',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product translation created successfully',
        version: '1.0.0'
    },

    'product.create.translation_error': {
        eventName: 'products.create.translation_error',
        source: 'admin-products',
        eventType: 'system',
        severity: 'error',
        eventMessage: 'Product translation creation failed',
        version: '1.0.0'
    },

    'product.create.database_error': {
        eventName: 'products.create.database_error',
        source: 'admin-products',
        eventType: 'system',
        severity: 'error',
        eventMessage: 'Database error during product creation',
        version: '1.0.0'
    },

    'product.create.transaction_rollback': {
        eventName: 'products.create.transaction_rollback',
        source: 'admin-products',
        eventType: 'system',
        severity: 'error',
        eventMessage: 'Transaction rolled back during product creation',
        version: '1.0.0'
    },

    'product.create.error': {
        eventName: 'products.create.error',
        source: 'admin-products',
        eventType: 'system',
        severity: 'error',
        eventMessage: 'Product creation failed',
        version: '1.0.0'
    },

    // Product update events (for future use)
    'product.update.started': {
        eventName: 'products.update.started',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product update process started',
        version: '1.0.0'
    },

    'product.update.validation_started': {
        eventName: 'products.update.validation_started',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product update validation started',
        version: '1.0.0'
    },

    'product.update.not_found': {
        eventName: 'products.update.not_found',
        source: 'admin-products',
        eventType: 'system',
        severity: 'warning',
        eventMessage: 'Product not found for update',
        version: '1.0.0'
    },

    'product.update.main_data_updated': {
        eventName: 'products.update.main_data_updated',
        source: 'admin-products',
        eventType: 'system',
        severity: 'info',
        eventMessage: 'Product main data updated successfully',
        version: '1.0.0'
    },

    'product.update.translations_updated': {
        eventName: 'products.update.translations_updated',
        source: 'admin-products',
        eventType: 'system',
        severity: 'info',
        eventMessage: 'Product translations updated successfully',
        version: '1.0.0'
    },

    'product.update.owners_updated': {
        eventName: 'products.update.owners_updated',
        source: 'admin-products',
        eventType: 'system',
        severity: 'info',
        eventMessage: 'Product owners updated successfully',
        version: '1.0.0'
    },

    'product.update.groups_updated': {
        eventName: 'products.update.groups_updated',
        source: 'admin-products',
        eventType: 'system',
        severity: 'info',
        eventMessage: 'Product specialist groups updated successfully',
        version: '1.0.0'
    },

    'product.update.success': {
        eventName: 'products.update.success',
        source: 'admin-products',
        eventType: 'system',
        severity: 'info',
        eventMessage: 'Product updated successfully',
        version: '1.0.0'
    },

    'product.update.error': {
        eventName: 'products.update.error',
        source: 'admin-products',
        eventType: 'system',
        severity: 'error',
        eventMessage: 'Product update failed',
        version: '1.0.0'
    },

    // Product fetch events
    'product.fetch.started': {
        eventName: 'products.fetch.started',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product fetch process started',
        version: '1.0.0'
    },

    'product.fetch.validation_started': {
        eventName: 'products.fetch.validation_started',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product fetch validation started',
        version: '1.0.0'
    },

    'product.fetch.not_found': {
        eventName: 'products.fetch.not_found',
        source: 'admin-products',
        eventType: 'system',
        severity: 'warning',
        eventMessage: 'Product not found',
        version: '1.0.0'
    },

    'product.fetch.translations_fetched': {
        eventName: 'products.fetch.translations_fetched',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product translations fetched successfully',
        version: '1.0.0'
    },

    'product.fetch.owners_fetched': {
        eventName: 'products.fetch.owners_fetched',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product owners fetched successfully',
        version: '1.0.0'
    },

    'product.fetch.groups_fetched': {
        eventName: 'products.fetch.groups_fetched',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product specialist groups fetched successfully',
        version: '1.0.0'
    },

    'product.fetch.count_completed': {
        eventName: 'products.fetch.count_completed',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product count query completed successfully',
        version: '1.0.0'
    },

    // Delete events
    'product.delete.started': {
        eventName: 'products.delete.started',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product deletion started',
        version: '1.0.0'
    },

    'product.delete.validation.success': {
        eventName: 'products.delete.validation.success',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product deletion validation successful',
        version: '1.0.0'
    },

    'product.delete.validation.error': {
        eventName: 'products.delete.validation.error',
        source: 'admin-products',
        eventType: 'system',
        severity: 'error',
        eventMessage: 'Product deletion validation failed',
        version: '1.0.0'
    },

    'product.delete.success': {
        eventName: 'products.delete.success',
        source: 'admin-products',
        eventType: 'system',
        severity: 'info',
        eventMessage: 'Products deleted successfully',
        version: '1.0.0'
    },

    'product.delete.database_error': {
        eventName: 'products.delete.database_error',
        source: 'admin-products',
        eventType: 'system',
        severity: 'error',
        eventMessage: 'Database error during product deletion',
        version: '1.0.0'
    },

    'product.delete.partial_success': {
        eventName: 'products.delete.partial_success',
        source: 'admin-products',
        eventType: 'system',
        severity: 'warning',
        eventMessage: 'Partial success during product deletion',
        version: '1.0.0'
    },

    'product.fetch.success': {
        eventName: 'products.fetch.success',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product fetched successfully',
        version: '1.0.0'
    },

    'product.fetch.error': {
        eventName: 'products.fetch.error',
        source: 'admin-products',
        eventType: 'system',
        severity: 'error',
        eventMessage: 'Product fetch failed',
        version: '1.0.0'
    }
};
