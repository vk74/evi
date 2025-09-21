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
// Product creation events
export const PRODUCT_CREATE_EVENTS = {
    STARTED: {
        eventName: 'products.create.started',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product creation process started',
        version: '1.0.0'
    },

    VALIDATION_STARTED: {
        eventName: 'products.create.validation_started',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product creation validation started',
        version: '1.0.0'
    },

    CODE_CHECK_STARTED: {
        eventName: 'products.create.code_check_started',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product code uniqueness check started',
        version: '1.0.0'
    },

    CODE_CHECK_SUCCESS: {
        eventName: 'products.create.code_check_success',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product code uniqueness check passed',
        version: '1.0.0'
    },

    CODE_CHECK_ERROR: {
        eventName: 'products.create.code_check_error',
        source: 'admin-products',
        eventType: 'system',
        severity: 'error',
        eventMessage: 'Product code uniqueness check failed',
        version: '1.0.0'
    },

    TRANSLATION_KEY_CHECK_STARTED: {
        eventName: 'products.create.translation_key_check_started',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Translation key uniqueness check started',
        version: '1.0.0'
    },

    TRANSLATION_KEY_CHECK_SUCCESS: {
        eventName: 'products.create.translation_key_check_success',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Translation key uniqueness check passed',
        version: '1.0.0'
    },

    TRANSLATION_KEY_CHECK_ERROR: {
        eventName: 'products.create.translation_key_check_error',
        source: 'admin-products',
        eventType: 'system',
        severity: 'error',
        eventMessage: 'Translation key uniqueness check failed',
        version: '1.0.0'
    },

    INSERTING_DATA: {
        eventName: 'products.create.inserting_data',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Inserting product data into database',
        version: '1.0.0'
    },

    SUCCESS: {
        eventName: 'products.create.success',
        source: 'admin-products',
        eventType: 'system',
        severity: 'info',
        eventMessage: 'Product created successfully',
        version: '1.0.0'
    },

    TRANSLATION_CREATED: {
        eventName: 'products.create.translation_created',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product translation created successfully',
        version: '1.0.0'
    },

    TRANSLATION_ERROR: {
        eventName: 'products.create.translation_error',
        source: 'admin-products',
        eventType: 'system',
        severity: 'error',
        eventMessage: 'Product translation creation failed',
        version: '1.0.0'
    },

    DATABASE_ERROR: {
        eventName: 'products.create.database_error',
        source: 'admin-products',
        eventType: 'system',
        severity: 'error',
        eventMessage: 'Database error during product creation',
        version: '1.0.0'
    },

    TRANSACTION_ROLLBACK: {
        eventName: 'products.create.transaction_rollback',
        source: 'admin-products',
        eventType: 'system',
        severity: 'error',
        eventMessage: 'Transaction rolled back during product creation',
        version: '1.0.0'
    },

    ERROR: {
        eventName: 'products.create.error',
        source: 'admin-products',
        eventType: 'system',
        severity: 'error',
        eventMessage: 'Product creation failed',
        version: '1.0.0'
    }
};

// Product update events
export const PRODUCT_UPDATE_EVENTS = {
    STARTED: {
        eventName: 'products.update.started',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product update process started',
        version: '1.0.0'
    },

    VALIDATION_STARTED: {
        eventName: 'products.update.validation_started',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product update validation started',
        version: '1.0.0'
    },

    NOT_FOUND: {
        eventName: 'products.update.not_found',
        source: 'admin-products',
        eventType: 'system',
        severity: 'warning',
        eventMessage: 'Product not found for update',
        version: '1.0.0'
    },

    MAIN_DATA_UPDATED: {
        eventName: 'products.update.main_data_updated',
        source: 'admin-products',
        eventType: 'system',
        severity: 'info',
        eventMessage: 'Product main data updated successfully',
        version: '1.0.0'
    },

    TRANSLATIONS_UPDATED: {
        eventName: 'products.update.translations_updated',
        source: 'admin-products',
        eventType: 'system',
        severity: 'info',
        eventMessage: 'Product translations updated successfully',
        version: '1.0.0'
    },

    OWNERS_UPDATED: {
        eventName: 'products.update.owners_updated',
        source: 'admin-products',
        eventType: 'system',
        severity: 'info',
        eventMessage: 'Product owners updated successfully',
        version: '1.0.0'
    },

    GROUPS_UPDATED: {
        eventName: 'products.update.groups_updated',
        source: 'admin-products',
        eventType: 'system',
        severity: 'info',
        eventMessage: 'Product specialist groups updated successfully',
        version: '1.0.0'
    },

    SUCCESS: {
        eventName: 'products.update.success',
        source: 'admin-products',
        eventType: 'system',
        severity: 'info',
        eventMessage: 'Product updated successfully',
        version: '1.0.0'
    },

    ERROR: {
        eventName: 'products.update.error',
        source: 'admin-products',
        eventType: 'system',
        severity: 'error',
        eventMessage: 'Product update failed',
        version: '1.0.0'
    }
};

// Product fetch events
export const PRODUCT_FETCH_EVENTS = {
    STARTED: {
        eventName: 'products.fetch.started',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product fetch process started',
        version: '1.0.0'
    },

    VALIDATION_STARTED: {
        eventName: 'products.fetch.validation_started',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product fetch validation started',
        version: '1.0.0'
    },

    NOT_FOUND: {
        eventName: 'products.fetch.not_found',
        source: 'admin-products',
        eventType: 'system',
        severity: 'warning',
        eventMessage: 'Product not found',
        version: '1.0.0'
    },

    TRANSLATIONS_FETCHED: {
        eventName: 'products.fetch.translations_fetched',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product translations fetched successfully',
        version: '1.0.0'
    },

    OWNERS_FETCHED: {
        eventName: 'products.fetch.owners_fetched',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product owners fetched successfully',
        version: '1.0.0'
    },

    GROUPS_FETCHED: {
        eventName: 'products.fetch.groups_fetched',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product specialist groups fetched successfully',
        version: '1.0.0'
    },

    COUNT_COMPLETED: {
        eventName: 'products.fetch.count_completed',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product count query completed successfully',
        version: '1.0.0'
    },

    SUCCESS: {
        eventName: 'products.fetch.success',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product fetched successfully',
        version: '1.0.0'
    },

    ERROR: {
        eventName: 'products.fetch.error',
        source: 'admin-products',
        eventType: 'system',
        severity: 'error',
        eventMessage: 'Product fetch failed',
        version: '1.0.0'
    }
};

// Product delete events
export const PRODUCT_DELETE_EVENTS = {
    STARTED: {
        eventName: 'products.delete.started',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product deletion started',
        version: '1.0.0'
    },

    VALIDATION_SUCCESS: {
        eventName: 'products.delete.validation.success',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product deletion validation successful',
        version: '1.0.0'
    },

    VALIDATION_ERROR: {
        eventName: 'products.delete.validation.error',
        source: 'admin-products',
        eventType: 'system',
        severity: 'error',
        eventMessage: 'Product deletion validation failed',
        version: '1.0.0'
    },

    SUCCESS: {
        eventName: 'products.delete.success',
        source: 'admin-products',
        eventType: 'system',
        severity: 'info',
        eventMessage: 'Products deleted successfully',
        version: '1.0.0'
    },

    DATABASE_ERROR: {
        eventName: 'products.delete.database_error',
        source: 'admin-products',
        eventType: 'system',
        severity: 'error',
        eventMessage: 'Database error during product deletion',
        version: '1.0.0'
    },

    PARTIAL_SUCCESS: {
        eventName: 'products.delete.partial_success',
        source: 'admin-products',
        eventType: 'system',
        severity: 'warning',
        eventMessage: 'Partial success during product deletion',
        version: '1.0.0'
    }
};

// Options fetch events
export const OPTIONS_FETCH_EVENTS = {
    STARTED: {
        eventName: 'options.fetch.started',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Options fetch started',
        version: '1.0.0'
    },

    COUNT_COMPLETED: {
        eventName: 'options.fetch.count_completed',
        source: 'admin-products',
        eventType: 'system',
        severity: 'info',
        eventMessage: 'Options count completed',
        version: '1.0.0'
    },

    SUCCESS: {
        eventName: 'options.fetch.success',
        source: 'admin-products',
        eventType: 'system',
        severity: 'info',
        eventMessage: 'Options fetched successfully',
        version: '1.0.0'
    },

    ERROR: {
        eventName: 'options.fetch.error',
        source: 'admin-products',
        eventType: 'system',
        severity: 'error',
        eventMessage: 'Options fetch failed',
        version: '1.0.0'
    }
};

// Export individual event constants for compatibility
export const OPTIONS_FETCH_STARTED = OPTIONS_FETCH_EVENTS.STARTED;
export const OPTIONS_FETCH_COUNT_COMPLETED = OPTIONS_FETCH_EVENTS.COUNT_COMPLETED;
export const OPTIONS_FETCH_SUCCESS = OPTIONS_FETCH_EVENTS.SUCCESS;
export const OPTIONS_FETCH_ERROR = OPTIONS_FETCH_EVENTS.ERROR;
