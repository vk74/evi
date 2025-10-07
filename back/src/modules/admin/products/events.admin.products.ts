/**
 * events.admin.products.ts - version 1.0.3
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
        payload: null,
        version: '1.0.0'
    },

    VALIDATION_STARTED: {
        eventName: 'products.create.validation_started',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product creation validation started',
        payload: null,
        version: '1.0.0'
    },

    CODE_CHECK_STARTED: {
        eventName: 'products.create.code_check_started',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product code uniqueness check started',
        payload: null,
        version: '1.0.0'
    },

    CODE_CHECK_SUCCESS: {
        eventName: 'products.create.code_check_success',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product code uniqueness check passed',
        payload: null,
        version: '1.0.0'
    },

    CODE_CHECK_ERROR: {
        eventName: 'products.create.code_check_error',
        source: 'admin-products',
        eventType: 'system',
        severity: 'error',
        eventMessage: 'Product code uniqueness check failed',
        payload: null,
        errorData: null,
        version: '1.0.0'
    },

    TRANSLATION_KEY_CHECK_STARTED: {
        eventName: 'products.create.translation_key_check_started',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Translation key uniqueness check started',
        payload: null,
        version: '1.0.0'
    },

    TRANSLATION_KEY_CHECK_SUCCESS: {
        eventName: 'products.create.translation_key_check_success',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Translation key uniqueness check passed',
        payload: null,
        version: '1.0.0'
    },

    TRANSLATION_KEY_CHECK_ERROR: {
        eventName: 'products.create.translation_key_check_error',
        source: 'admin-products',
        eventType: 'system',
        severity: 'error',
        eventMessage: 'Translation key uniqueness check failed',
        payload: null, // Will be of type { translationKey: string, error: string }
        errorData: null,
        version: '1.0.0'
    },

    INSERTING_DATA: {
        eventName: 'products.create.inserting_data',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Inserting product data into database',
        payload: null,
        version: '1.0.0'
    },

    SUCCESS: {
        eventName: 'products.create.success',
        source: 'admin-products',
        eventType: 'system',
        severity: 'info',
        eventMessage: 'Product created successfully',
        payload: null,
        version: '1.0.0'
    },

    TRANSLATION_CREATED: {
        eventName: 'products.create.translation_created',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product translation created successfully',
        payload: null,
        version: '1.0.0'
    },

    TRANSLATION_ERROR: {
        eventName: 'products.create.translation_error',
        source: 'admin-products',
        eventType: 'system',
        severity: 'error',
        eventMessage: 'Product translation creation failed',
        payload: null,
        errorData: null,
        version: '1.0.0'
    },

    DATABASE_ERROR: {
        eventName: 'products.create.database_error',
        source: 'admin-products',
        eventType: 'system',
        severity: 'error',
        eventMessage: 'Database error during product creation',
        payload: null,
        errorData: null,
        version: '1.0.0'
    },

    TRANSACTION_ROLLBACK: {
        eventName: 'products.create.transaction_rollback',
        source: 'admin-products',
        eventType: 'system',
        severity: 'error',
        eventMessage: 'Transaction rolled back during product creation',
        payload: null,
        errorData: null,
        version: '1.0.0'
    },

    ERROR: {
        eventName: 'products.create.error',
        source: 'admin-products',
        eventType: 'system',
        severity: 'error',
        eventMessage: 'Product creation failed',
        payload: null,
        errorData: null,
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
        payload: null,
        version: '1.0.0'
    },

    VALIDATION_STARTED: {
        eventName: 'products.update.validation_started',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product update validation started',
        payload: null,
        version: '1.0.0'
    },

    NOT_FOUND: {
        eventName: 'products.update.not_found',
        source: 'admin-products',
        eventType: 'system',
        severity: 'warning',
        eventMessage: 'Product not found for update',
        payload: null,
        version: '1.0.0'
    },

    MAIN_DATA_UPDATED: {
        eventName: 'products.update.main_data_updated',
        source: 'admin-products',
        eventType: 'system',
        severity: 'info',
        eventMessage: 'Product main data updated successfully',
        payload: null,
        version: '1.0.0'
    },

    TRANSLATIONS_UPDATED: {
        eventName: 'products.update.translations_updated',
        source: 'admin-products',
        eventType: 'system',
        severity: 'info',
        eventMessage: 'Product translations updated successfully',
        payload: null,
        version: '1.0.0'
    },

    OWNERS_UPDATED: {
        eventName: 'products.update.owners_updated',
        source: 'admin-products',
        eventType: 'system',
        severity: 'info',
        eventMessage: 'Product owners updated successfully',
        payload: null,
        version: '1.0.0'
    },

    GROUPS_UPDATED: {
        eventName: 'products.update.groups_updated',
        source: 'admin-products',
        eventType: 'system',
        severity: 'info',
        eventMessage: 'Product specialist groups updated successfully',
        payload: null,
        version: '1.0.0'
    },

    // Product update preferences field changed
    PREFERENCES_FIELD_CHANGED: {
        eventName: 'products.update.preferences.field_changed',
        source: 'admin-products',
        eventType: 'system',
        severity: 'info',
        eventMessage: 'Product preferences updated successfully',
        payload: null,
        version: '1.0.0'
    },

    SUCCESS: {
        eventName: 'products.update.success',
        source: 'admin-products',
        eventType: 'system',
        severity: 'info',
        eventMessage: 'Product updated successfully',
        payload: null,
        version: '1.0.0'
    },

    ERROR: {
        eventName: 'products.update.error',
        source: 'admin-products',
        eventType: 'system',
        severity: 'error',
        eventMessage: 'Product update failed',
        payload: null,
        errorData: null,
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
        payload: null,
        version: '1.0.0'
    },

    VALIDATION_STARTED: {
        eventName: 'products.fetch.validation_started',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product fetch validation started',
        payload: null,
        version: '1.0.0'
    },

    NOT_FOUND: {
        eventName: 'products.fetch.not_found',
        source: 'admin-products',
        eventType: 'system',
        severity: 'warning',
        eventMessage: 'Product not found',
        payload: null,
        version: '1.0.0'
    },

    TRANSLATIONS_FETCHED: {
        eventName: 'products.fetch.translations_fetched',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product translations fetched successfully',
        payload: null,
        version: '1.0.0'
    },

    OWNERS_FETCHED: {
        eventName: 'products.fetch.owners_fetched',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product owners fetched successfully',
        payload: null,
        version: '1.0.0'
    },

    GROUPS_FETCHED: {
        eventName: 'products.fetch.groups_fetched',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product specialist groups fetched successfully',
        payload: null,
        version: '1.0.0'
    },

    COUNT_COMPLETED: {
        eventName: 'products.fetch.count_completed',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product count query completed successfully',
        payload: null,
        version: '1.0.0'
    },

    SUCCESS: {
        eventName: 'products.fetch.success',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product fetched successfully',
        payload: null,
        version: '1.0.0'
    },

    ERROR: {
        eventName: 'products.fetch.error',
        source: 'admin-products',
        eventType: 'system',
        severity: 'error',
        eventMessage: 'Product fetch failed',
        payload: null,
        errorData: null,
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
        payload: null,
        version: '1.0.0'
    },

    VALIDATION_SUCCESS: {
        eventName: 'products.delete.validation.success',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product deletion validation successful',
        payload: null,
        version: '1.0.0'
    },

    VALIDATION_ERROR: {
        eventName: 'products.delete.validation.error',
        source: 'admin-products',
        eventType: 'system',
        severity: 'error',
        eventMessage: 'Product deletion validation failed',
        payload: null,
        errorData: null,
        version: '1.0.0'
    },

    SUCCESS: {
        eventName: 'products.delete.success',
        source: 'admin-products',
        eventType: 'system',
        severity: 'info',
        eventMessage: 'Products deleted successfully',
        payload: null,
        version: '1.0.0'
    },

    DATABASE_ERROR: {
        eventName: 'products.delete.database_error',
        source: 'admin-products',
        eventType: 'system',
        severity: 'error',
        eventMessage: 'Database error during product deletion',
        payload: null,
        errorData: null,
        version: '1.0.0'
    },

    PARTIAL_SUCCESS: {
        eventName: 'products.delete.partial_success',
        source: 'admin-products',
        eventType: 'system',
        severity: 'warning',
        eventMessage: 'Partial success during product deletion',
        payload: null,
        version: '1.0.0'
    }
};

// Options fetch events
export const OPTIONS_FETCH_EVENTS = {
    STARTED: {
        eventName: 'products.options.fetch.started',
        source: 'admin-products',
        eventType: 'app' as const,
        severity: 'debug' as const,
        eventMessage: 'Options fetch started',
        payload: null, // Will be of type { page: number, itemsPerPage: number, searchQuery?: string, sortBy?: string, sortDesc?: boolean, languageCode: string }
        version: '1.0.0'
    },

    COUNT_COMPLETED: {
        eventName: 'products.options.fetch.count_completed',
        source: 'admin-products',
        eventType: 'app' as const,
        severity: 'info' as const,
        eventMessage: 'Options count completed',
        payload: null, // Will be of type { totalItems: number, searchQuery?: string }
        version: '1.0.0'
    },

    SUCCESS: {
        eventName: 'products.options.fetch.success',
        source: 'admin-products',
        eventType: 'app' as const,
        severity: 'info' as const,
        eventMessage: 'Options fetched successfully',
        payload: null, // Will be of type { optionsCount: number, totalItems: number, totalPages: number, currentPage: number, itemsPerPage: number, searchQuery?: string, sortBy?: string, sortDesc?: boolean }
        version: '1.0.0'
    },

    ERROR: {
        eventName: 'products.options.fetch.error',
        source: 'admin-products',
        eventType: 'app' as const,
        severity: 'error' as const,
        eventMessage: 'Options fetch failed',
        payload: null, // Will be of type { query: any, error: string }
        errorData: null,
        version: '1.0.0'
    }
};

// Product option pairs events
export const PRODUCT_OPTION_PAIRS_EVENTS = {
    READ_STARTED: {
        eventName: 'products.pairs.read.started',
        source: 'admin-products',
        eventType: 'app' as const,
        severity: 'debug' as const,
        eventMessage: 'Pairs read started',
        payload: null,
        version: '1.0.0'
    },
    READ_SUCCESS: {
        eventName: 'products.pairs.read.success',
        source: 'admin-products',
        eventType: 'app' as const,
        severity: 'debug' as const,
        eventMessage: 'Pairs read success',
        payload: null,
        version: '1.0.0'
    },
    READ_ERROR: {
        eventName: 'products.pairs.read.error',
        source: 'admin-products',
        eventType: 'app' as const,
        severity: 'error' as const,
        eventMessage: 'Pairs read error',
        payload: null,
        errorData: null,
        version: '1.0.0'
    },
    CREATE_CONFLICT: {
        eventName: 'products.pairs.create.conflict',
        source: 'admin-products',
        eventType: 'app' as const,
        severity: 'error' as const,
        eventMessage: 'Pairs create conflict',
        payload: null,
        version: '1.0.0'
    },
    CREATE_SUCCESS: {
        eventName: 'products.pairs.create.success',
        source: 'admin-products',
        eventType: 'app' as const,
        severity: 'info' as const,
        eventMessage: 'Pairs created successfully',
        payload: null,
        version: '1.0.0'
    },
    CREATE_ERROR: {
        eventName: 'products.pairs.create.error',
        source: 'admin-products',
        eventType: 'app' as const,
        severity: 'error' as const,
        eventMessage: 'Pairs create error',
        payload: null,
        errorData: null,
        version: '1.0.0'
    },
    UPDATE_NOT_FOUND: {
        eventName: 'products.pairs.update.not_found',
        source: 'admin-products',
        eventType: 'app' as const,
        severity: 'error' as const,
        eventMessage: 'Pairs update missing some records',
        payload: null,
        version: '1.0.0'
    },
    UPDATE_SUCCESS: {
        eventName: 'products.pairs.update.success',
        source: 'admin-products',
        eventType: 'app' as const,
        severity: 'info' as const,
        eventMessage: 'Pairs updated successfully',
        payload: null,
        version: '1.0.0'
    },
    UPDATE_ERROR: {
        eventName: 'products.pairs.update.error',
        source: 'admin-products',
        eventType: 'app' as const,
        severity: 'error' as const,
        eventMessage: 'Pairs update error',
        payload: null,
        errorData: null,
        version: '1.0.0'
    }
};

export const PRODUCT_OPTION_PAIRS_DELETE_EVENTS = {
    SUCCESS: {
        eventName: 'products.pairs.delete.success',
        source: 'admin-products',
        eventType: 'app' as const,
        severity: 'info' as const,
        eventMessage: 'Pairs deleted successfully',
        payload: null,
        version: '1.0.0'
    },
    PARTIAL_SUCCESS: {
        eventName: 'products.pairs.delete.partial_success',
        source: 'admin-products',
        eventType: 'app' as const,
        severity: 'warning' as const,
        eventMessage: 'Pairs delete partial success',
        payload: null,
        version: '1.0.0'
    },
    ERROR: {
        eventName: 'products.pairs.delete.error',
        source: 'admin-products',
        eventType: 'app' as const,
        severity: 'error' as const,
        eventMessage: 'Pairs delete error',
        payload: null,
        errorData: null,
        version: '1.0.0'
    }
}

// Product catalog publication fetch events
export const PRODUCT_CATALOG_PUBLICATION_FETCH_EVENTS = {
    STARTED: {
        eventName: 'products.catalog_publication.fetch.started',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product catalog publication sections fetch started',
        payload: null,
        version: '1.0.0'
    },

    VALIDATION_STARTED: {
        eventName: 'products.catalog_publication.fetch.validation_started',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product catalog publication fetch validation started',
        payload: null,
        version: '1.0.0'
    },

    SUCCESS: {
        eventName: 'products.catalog_publication.fetch.success',
        source: 'admin-products',
        eventType: 'system',
        severity: 'info',
        eventMessage: 'Product catalog publication sections fetched successfully',
        payload: null,
        version: '1.0.0'
    },

    ERROR: {
        eventName: 'products.catalog_publication.fetch.error',
        source: 'admin-products',
        eventType: 'system',
        severity: 'error',
        eventMessage: 'Product catalog publication sections fetch failed',
        payload: null,
        errorData: null,
        version: '1.0.0'
    }
};

// Product catalog publication update events
export const PRODUCT_CATALOG_PUBLICATION_UPDATE_EVENTS = {
    STARTED: {
        eventName: 'products.catalog_publication.update.started',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product catalog publication update started',
        payload: null,
        version: '1.0.0'
    },

    VALIDATION_STARTED: {
        eventName: 'products.catalog_publication.update.validation_started',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product catalog publication update validation started',
        payload: null,
        version: '1.0.0'
    },

    DATABASE_UPDATE_STARTED: {
        eventName: 'products.catalog_publication.update.database_started',
        source: 'admin-products',
        eventType: 'system',
        severity: 'debug',
        eventMessage: 'Product catalog publication database update started',
        payload: null,
        version: '1.0.0'
    },

    PUBLISHED_TO_CATALOG: {
        eventName: 'products.catalog_publication.update.published_to_catalog',
        source: 'admin-products',
        eventType: 'system',
        severity: 'info',
        eventMessage: 'Product published to catalog sections',
        payload: null,
        version: '1.0.0'
    },

    UNPUBLISHED_FROM_CATALOG: {
        eventName: 'products.catalog_publication.update.unpublished_from_catalog',
        source: 'admin-products',
        eventType: 'system',
        severity: 'info',
        eventMessage: 'Product unpublished from catalog sections',
        payload: null,
        version: '1.0.0'
    },

    SUCCESS: {
        eventName: 'products.catalog_publication.update.success',
        source: 'admin-products',
        eventType: 'system',
        severity: 'info',
        eventMessage: 'Product catalog publication updated successfully',
        payload: null,
        version: '1.0.0'
    },

    ERROR: {
        eventName: 'products.catalog_publication.update.error',
        source: 'admin-products',
        eventType: 'system',
        severity: 'error',
        eventMessage: 'Product catalog publication update failed',
        payload: null,
        errorData: null,
        version: '1.0.0'
    }
};

