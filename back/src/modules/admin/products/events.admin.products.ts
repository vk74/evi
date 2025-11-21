/**
 * events.admin.products.ts - version 1.4.1
 * Event definitions for products administration module.
 * 
 * Contains event templates for products admin functionality.
 * Used by event bus factory for generating and publishing events.
 * 
 * Changes in v1.4.0:
 * - Removed PRODUCT_CATALOG_PUBLICATION_FETCH_EVENTS and PRODUCT_CATALOG_PUBLICATION_UPDATE_EVENTS (catalog publication functionality moved to separate module)
 * 
 * Updated v1.3.0: Changed eventType to 'app' for application lifecycle events
 * 
 * Updated v1.2.0: Major refactoring for better auditability
 * - Removed non-valuable debug events (STARTED, VALIDATION_STARTED, etc.)
 * - Added specific granular events for business changes
 * - Improved payload with oldValue/newValue for UPDATE operations
 * - Lowered severity for technical events (fetch operations)
 * - Better payload structure for detailed auditing
 * 
 * Changes in v1.4.1:
 * - Removed PRODUCT_TYPE_CHANGED event (legacy event for removed product type system)
 * 
 * Backend file - events.admin.products.ts
 */

import { EventCollection } from '../../../core/eventBus/types.events'

/**
 * Event reference catalog for admin products operations
 * Contains all events related to product management in admin module
 */
// Product creation events
export const PRODUCT_CREATE_EVENTS = {
    CODE_CHECK_ERROR: {
        eventName: 'adminProducts.create.code_check_error',
        source: 'admin-products',
        eventType: 'app',
        severity: 'error',
        eventMessage: 'Product code uniqueness check failed',
        payload: null, // Will be { productCode: string, error: string }
        errorData: null,
        version: '1.0.0'
    },

    TRANSLATION_KEY_CHECK_ERROR: {
        eventName: 'adminProducts.create.translation_key_check_error',
        source: 'admin-products',
        eventType: 'app',
        severity: 'error',
        eventMessage: 'Translation key uniqueness check failed',
        payload: null, // Will be { translationKey: string, error: string }
        errorData: null,
        version: '1.0.0'
    },

    TRANSLATION_CREATED: {
        eventName: 'adminProducts.create.translation_created',
        source: 'admin-products',
        eventType: 'app',
        severity: 'info',
        eventMessage: 'Product translation created successfully',
        payload: null, // Will be { productId: string, productCode: string, languageCode: string, translationName: string }
        version: '1.0.0'
    },

    TRANSLATION_ERROR: {
        eventName: 'adminProducts.create.translation_error',
        source: 'admin-products',
        eventType: 'app',
        severity: 'error',
        eventMessage: 'Product translation creation failed',
        payload: null, // Will be { productId: string, productCode: string, languageCode: string, error: string }
        errorData: null,
        version: '1.0.0'
    },

    SUCCESS: {
        eventName: 'adminProducts.create.success',
        source: 'admin-products',
        eventType: 'app',
        severity: 'info',
        eventMessage: 'Product created successfully',
        payload: null, // Will be { productId: string, productCode: string, translationKey: string }
        version: '1.0.0'
    },

    DATABASE_ERROR: {
        eventName: 'adminProducts.create.database_error',
        source: 'admin-products',
        eventType: 'app',
        severity: 'error',
        eventMessage: 'Database error during product creation',
        payload: null, // Will be { productCode: string, translationKey: string, error: string }
        errorData: null,
        version: '1.0.0'
    },

    TRANSACTION_ROLLBACK: {
        eventName: 'adminProducts.create.transaction_rollback',
        source: 'admin-products',
        eventType: 'app',
        severity: 'error',
        eventMessage: 'Transaction rolled back during product creation',
        payload: null, // Will be { productId: string, productCode: string, error: string }
        errorData: null,
        version: '1.0.0'
    },

    ERROR: {
        eventName: 'adminProducts.create.error',
        source: 'admin-products',
        eventType: 'app',
        severity: 'error',
        eventMessage: 'Product creation failed',
        payload: null, // Will be { error: string }
        errorData: null,
        version: '1.0.0'
    }
};

// Product update events
export const PRODUCT_UPDATE_EVENTS = {
    NOT_FOUND: {
        eventName: 'adminProducts.update.not_found',
        source: 'admin-products',
        eventType: 'app',
        severity: 'warning',
        eventMessage: 'Product not found for update',
        payload: null, // Will be { productId: string }
        version: '1.0.0'
    },

    MAIN_DATA_UPDATED: {
        eventName: 'adminProducts.update.main_data_updated',
        source: 'admin-products',
        eventType: 'app',
        severity: 'info',
        eventMessage: 'Product main data updated successfully',
        payload: null, // Will be { productId: string, productCode: string, changes: { productCode?: {old, new}, translationKey?: {old, new} } }
        version: '1.0.0'
    },

    TRANSLATIONS_UPDATED: {
        eventName: 'adminProducts.update.translations_updated',
        source: 'admin-products',
        eventType: 'app',
        severity: 'info',
        eventMessage: 'Product translations updated successfully',
        payload: null, // Will be { productId: string, productCode: string, languageCodes: string[], fieldsChanged: string[] }
        version: '1.0.0'
    },

    OWNERS_UPDATED: {
        eventName: 'adminProducts.update.owners_updated',
        source: 'admin-products',
        eventType: 'app',
        severity: 'info',
        eventMessage: 'Product owners updated successfully',
        payload: null, // Will be { productId: string, productCode: string, changes: { owner?: {old, new} } }
        version: '1.0.0'
    },

    GROUPS_UPDATED: {
        eventName: 'adminProducts.update.groups_updated',
        source: 'admin-products',
        eventType: 'app',
        severity: 'info',
        eventMessage: 'Product specialist groups updated successfully',
        payload: null, // Will be { productId: string, productCode: string, added: string[], removed: string[], total: string[] }
        version: '1.0.0'
    },

    PREFERENCES_FIELD_CHANGED: {
        eventName: 'adminProducts.update.preferences.field_changed',
        source: 'admin-products',
        eventType: 'app',
        severity: 'info',
        eventMessage: 'Product preferences updated successfully',
        payload: null, // Will be { productId: string, productCode: string, field: string, oldValue: any, newValue: any }
        version: '1.0.0'
    },

    // New granular events for detailed auditing
    PRODUCT_CODE_CHANGED: {
        eventName: 'adminProducts.update.product_code_changed',
        source: 'admin-products',
        eventType: 'app',
        severity: 'info',
        eventMessage: 'Product code changed',
        payload: null, // Will be { productId: string, oldProductCode: string, newProductCode: string }
        version: '1.0.0'
    },

    TRANSLATION_KEY_CHANGED: {
        eventName: 'adminProducts.update.translation_key_changed',
        source: 'admin-products',
        eventType: 'app',
        severity: 'info',
        eventMessage: 'Product translation key changed',
        payload: null, // Will be { productId: string, productCode: string, oldTranslationKey: string, newTranslationKey: string }
        version: '1.0.0'
    },

    OWNER_CHANGED: {
        eventName: 'adminProducts.update.owner_changed',
        source: 'admin-products',
        eventType: 'app',
        severity: 'info',
        eventMessage: 'Product owner changed',
        payload: null, // Will be { productId: string, productCode: string, oldOwner: string, newOwner: string }
        version: '1.0.0'
    },


    SPECIALIST_GROUPS_CHANGED: {
        eventName: 'adminProducts.update.specialist_groups_changed',
        source: 'admin-products',
        eventType: 'app',
        severity: 'info',
        eventMessage: 'Product specialist groups changed',
        payload: null, // Will be { productId: string, productCode: string, added: string[], removed: string[], all: string[] }
        version: '1.0.0'
    },

    TRANSLATION_FIELD_CHANGED: {
        eventName: 'adminProducts.update.translation_field_changed',
        source: 'admin-products',
        eventType: 'app',
        severity: 'info',
        eventMessage: 'Product translation field changed',
        payload: null, // Will be { productId: string, productCode: string, languageCode: string, field: string, oldValue: any, newValue: any }
        version: '1.0.0'
    },

    ERROR: {
        eventName: 'adminProducts.update.error',
        source: 'admin-products',
        eventType: 'app',
        severity: 'error',
        eventMessage: 'Product update failed',
        payload: null, // Will be { productId: string, error: string }
        errorData: null,
        version: '1.0.0'
    }
};

// Product fetch events
export const PRODUCT_FETCH_EVENTS = {
    STARTED: {
        eventName: 'adminProducts.fetch.started',
        source: 'admin-products',
        eventType: 'app',
        severity: 'debug',
        eventMessage: 'Product fetch process started',
        payload: null,
        version: '1.0.0'
    },

    NOT_FOUND: {
        eventName: 'adminProducts.fetch.not_found',
        source: 'admin-products',
        eventType: 'app',
        severity: 'warning',
        eventMessage: 'Product not found',
        payload: null, // Will be { productId: string }
        version: '1.0.0'
    },

    TRANSLATIONS_FETCHED: {
        eventName: 'adminProducts.fetch.translations_fetched',
        source: 'admin-products',
        eventType: 'app',
        severity: 'debug',
        eventMessage: 'Product translations fetched successfully',
        payload: null,
        version: '1.0.0'
    },

    OWNERS_FETCHED: {
        eventName: 'adminProducts.fetch.owners_fetched',
        source: 'admin-products',
        eventType: 'app',
        severity: 'debug',
        eventMessage: 'Product owners fetched successfully',
        payload: null,
        version: '1.0.0'
    },

    GROUPS_FETCHED: {
        eventName: 'adminProducts.fetch.groups_fetched',
        source: 'admin-products',
        eventType: 'app',
        severity: 'debug',
        eventMessage: 'Product specialist groups fetched successfully',
        payload: null,
        version: '1.0.0'
    },

    COUNT_COMPLETED: {
        eventName: 'adminProducts.fetch.count_completed',
        source: 'admin-products',
        eventType: 'app',
        severity: 'debug',
        eventMessage: 'Product count query completed successfully',
        payload: null,
        version: '1.0.0'
    },

    SUCCESS: {
        eventName: 'adminProducts.fetch.success',
        source: 'admin-products',
        eventType: 'app',
        severity: 'debug',
        eventMessage: 'Product fetched successfully',
        payload: null,
        version: '1.0.0'
    },

    ERROR: {
        eventName: 'adminProducts.fetch.error',
        source: 'admin-products',
        eventType: 'app',
        severity: 'error',
        eventMessage: 'Product fetch failed',
        payload: null,
        errorData: null,
        version: '1.0.0'
    }
};

// Product delete events
export const PRODUCT_DELETE_EVENTS = {
    VALIDATION_ERROR: {
        eventName: 'adminProducts.delete.validation.error',
        source: 'admin-products',
        eventType: 'app',
        severity: 'error',
        eventMessage: 'Product deletion validation failed',
        payload: null, // Will be { error: string }
        errorData: null,
        version: '1.0.0'
    },

    SUCCESS: {
        eventName: 'adminProducts.delete.success',
        source: 'admin-products',
        eventType: 'app',
        severity: 'info',
        eventMessage: 'Products deleted successfully',
        payload: null, // Will be { productIds: string[], productCodes: string[], totalDeleted: number }
        version: '1.0.0'
    },

    DATABASE_ERROR: {
        eventName: 'adminProducts.delete.database_error',
        source: 'admin-products',
        eventType: 'app',
        severity: 'error',
        eventMessage: 'Database error during product deletion',
        payload: null, // Will be { productIds: string[], error: string }
        errorData: null,
        version: '1.0.0'
    },

    PARTIAL_SUCCESS: {
        eventName: 'adminProducts.delete.partial_success',
        source: 'admin-products',
        eventType: 'app',
        severity: 'warning',
        eventMessage: 'Partial success during product deletion',
        payload: null, // Will be { productIds: string[], productCodes: string[], totalDeleted: number, totalErrors: number, deletedIds: string[], notFoundIds: string[] }
        version: '1.0.0'
    }
};

// Options fetch events
export const OPTIONS_FETCH_EVENTS = {
    STARTED: {
        eventName: 'adminProducts.options.fetch.started',
        source: 'admin-products',
        eventType: 'app',
        severity: 'debug',
        eventMessage: 'Options fetch started',
        payload: null,
        version: '1.0.0'
    },

    COUNT_COMPLETED: {
        eventName: 'adminProducts.options.fetch.count_completed',
        source: 'admin-products',
        eventType: 'app',
        severity: 'debug',
        eventMessage: 'Options count completed',
        payload: null,
        version: '1.0.0'
    },

    SUCCESS: {
        eventName: 'adminProducts.options.fetch.success',
        source: 'admin-products',
        eventType: 'app',
        severity: 'debug',
        eventMessage: 'Options fetched successfully',
        payload: null,
        version: '1.0.0'
    },

    ERROR: {
        eventName: 'adminProducts.options.fetch.error',
        source: 'admin-products',
        eventType: 'app',
        severity: 'error',
        eventMessage: 'Options fetch failed',
        payload: null,
        errorData: null,
        version: '1.0.0'
    }
};

// Product option pairs events
export const PRODUCT_OPTION_PAIRS_EVENTS = {
    CREATE_CONFLICT: {
        eventName: 'adminProducts.pairs.create.conflict',
        source: 'admin-products',
        eventType: 'app' as const,
        severity: 'error' as const,
        eventMessage: 'Pairs create conflict',
        payload: null, // Will be { mainProductId: string, mainProductCode: string, conflictingOptionIds: string[], conflictingOptionCodes: string[] }
        version: '1.0.0'
    },
    
    CREATE_SUCCESS: {
        eventName: 'adminProducts.pairs.create.success',
        source: 'admin-products',
        eventType: 'app' as const,
        severity: 'info' as const,
        eventMessage: 'Pairs created successfully',
        payload: null, // Will be { mainProductId: string, mainProductCode: string, createdCount: number, createdOptionIds: string[], createdOptionCodes: string[] }
        version: '1.0.0'
    },
    
    CREATE_ERROR: {
        eventName: 'adminProducts.pairs.create.error',
        source: 'admin-products',
        eventType: 'app' as const,
        severity: 'error' as const,
        eventMessage: 'Pairs create error',
        payload: null, // Will be { mainProductId: string, requestedCount: number, error: string }
        errorData: null,
        version: '1.0.0'
    },
    
    UPDATE_NOT_FOUND: {
        eventName: 'adminProducts.pairs.update.not_found',
        source: 'admin-products',
        eventType: 'app' as const,
        severity: 'error' as const,
        eventMessage: 'Pairs update missing some records',
        payload: null, // Will be { mainProductId: string, mainProductCode: string, missingOptionIds: string[] }
        version: '1.0.0'
    },
    
    UPDATE_SUCCESS: {
        eventName: 'adminProducts.pairs.update.success',
        source: 'admin-products',
        eventType: 'app' as const,
        severity: 'info' as const,
        eventMessage: 'Pairs updated successfully',
        payload: null, // Will be { mainProductId: string, mainProductCode: string, updatedCount: number, updatedOptionIds: string[], updatedOptionCodes: string[], changes: Array<{optionProductId, optionProductCode, isRequired?: {old, new}, unitsCount?: {old, new}}> }
        version: '1.0.0'
    },
    
    UPDATE_ERROR: {
        eventName: 'adminProducts.pairs.update.error',
        source: 'admin-products',
        eventType: 'app' as const,
        severity: 'error' as const,
        eventMessage: 'Pairs update error',
        payload: null, // Will be { mainProductId: string, requestedCount: number, error: string }
        errorData: null,
        version: '1.0.0'
    }
};

export const PRODUCT_OPTION_PAIRS_DELETE_EVENTS = {
    SUCCESS: {
        eventName: 'adminProducts.pairs.delete.success',
        source: 'admin-products',
        eventType: 'app' as const,
        severity: 'info' as const,
        eventMessage: 'Pairs deleted successfully',
        payload: null, // Will be { mainProductId: string, mainProductCode: string, mode: 'all' | 'selected', deletedOptionIds: string[], deletedOptionCodes: string[], totalDeleted: number }
        version: '1.0.0'
    },
    
    PARTIAL_SUCCESS: {
        eventName: 'adminProducts.pairs.delete.partial_success',
        source: 'admin-products',
        eventType: 'app' as const,
        severity: 'warning' as const,
        eventMessage: 'Pairs delete partial success',
        payload: null, // Will be { mainProductId: string, mainProductCode: string, mode: 'all' | 'selected', deletedOptionIds: string[], deletedOptionCodes: string[], missingOptionIds: string[], missingOptionCodes: string[] }
        version: '1.0.0'
    },
    
    ERROR: {
        eventName: 'adminProducts.pairs.delete.error',
        source: 'admin-products',
        eventType: 'app' as const,
        severity: 'error' as const,
        eventMessage: 'Pairs delete error',
        payload: null, // Will be { mainProductId: string, mode: 'all' | 'selected', error: string }
        errorData: null,
        version: '1.0.0'
    }
};

