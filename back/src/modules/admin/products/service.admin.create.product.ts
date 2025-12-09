/**
 * service.admin.create.product.ts - version 1.3.3
 * Service for creating products operations.
 * 
 * Functionality:
 * - Validates input data for creating products
 * - Checks existence of users for owners
 * - Validates unique constraints (product code, translation key)
 * - Creates new product in database with translations
 * - Handles data transformation and business logic
 * - Manages database interactions and error handling
 * 
 * Data flow:
 * 1. Receive request object with product data
 * 2. Validate required fields and data formats
 * 3. Check existence of referenced entities (users)
 * 4. Check unique constraints (product code, translation key)
 * 5. Create product in database with transaction
 * 6. Add translations for all languages
 * 7. Return formatted response
 * 
 * Changes in v1.3.1:
 * - Added status_code field support in product creation
 * - Uses default 'draft' status if statusCode not provided
 * 
 * Changes in v1.3.2:
 * - Removed backupOwner validation and handling
 * - Removed JSONB fields (areaSpecifics, industrySpecifics, keyFeatures, productOverview) from createProductTranslations
 * - Removed visibility flags (is_visible_area_specs, is_visible_industry_specs, is_visible_key_features, is_visible_overview) from createProductInDatabase
 * 
 * Changes in v1.3.3:
 * - Updated to use full language names: 'english', 'russian' instead of 'en', 'ru'
 * - Updated translations interface keys from 'en'/'ru' to 'english'/'russian'
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '@/core/db/maindb';
import { queries } from './queries.admin.products';
import type { 
    CreateProductRequest, 
    CreateProductResponse, 
    ProductError
} from './types.admin.products';
import { LanguageCode } from './types.admin.products';
import { getRequestorUuidFromReq } from '@/core/helpers/get.requestor.uuid.from.req';
import { getUuidByUsername } from '@/core/helpers/get.uuid.by.username';
import { getUuidByGroupName } from '@/core/helpers/get.uuid.by.group.name';
import { validateField } from '@/core/validation/service.validation';
import { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { PRODUCT_CREATE_EVENTS } from './events.admin.products';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Validates product creation data using validation service
 * @param data - Product data to validate
 * @throws {ProductError} When validation fails
 */
async function validateCreateProductData(data: CreateProductRequest, req: Request): Promise<void> {
    const errors: string[] = [];

    // Validate product code presence and uniqueness (format validation handled by DB)
    if (data.productCode) {
        try {
            const result = await pool.query(queries.checkProductCodeExists, [data.productCode.trim()]);
            if (result.rows.length > 0) {
                errors.push('Product with this code already exists');
            }
        } catch (error) {
            createAndPublishEvent({
                eventName: PRODUCT_CREATE_EVENTS.CODE_CHECK_ERROR.eventName,
                req: req,
                payload: {
                    productCode: data.productCode,
                    error: error instanceof Error ? error.message : String(error)
                },
                errorData: error instanceof Error ? error.message : String(error)
            });
            errors.push('Error checking product code existence');
        }
    } else {
        errors.push('Product code is required');
    }

    // Validate translation key presence and uniqueness (format validation handled by DB)
    if (data.translationKey) {
        try {
            const result = await pool.query(queries.checkTranslationKeyExists, [data.translationKey.trim()]);
            if (result.rows.length > 0) {
                errors.push('Product with this translation key already exists');
            }
        } catch (error) {
            createAndPublishEvent({
                eventName: PRODUCT_CREATE_EVENTS.TRANSLATION_KEY_CHECK_ERROR.eventName,
                req: req,
                payload: {
                    translationKey: data.translationKey,
                    error: error instanceof Error ? error.message : String(error)
                },
                errorData: error instanceof Error ? error.message : String(error)
            });
            errors.push('Error checking translation key existence');
        }
    } else {
        errors.push('Translation key is required');
    }

    // Owner is set automatically from requestorUuid, no validation needed

    // Validate translations - at least one language must be provided and complete
    if (data.translations && Object.keys(data.translations).length > 0) {
        let hasValidTranslation = false;

        // Check each provided language
        for (const [langCode, translation] of Object.entries(data.translations)) {
            if (translation && translation.name && translation.shortDesc) {
                const isValidName = translation.name.trim().length >= 2;
                const isValidShortDesc = translation.shortDesc.trim().length >= 10;
                
                if (isValidName && isValidShortDesc) {
                    hasValidTranslation = true;
                } else {
                    // Show specific errors for incomplete translation
                    if (!isValidName) {
                        errors.push(`${langCode.toUpperCase()} product name must be at least 2 characters`);
                    }
                    if (!isValidShortDesc) {
                        errors.push(`${langCode.toUpperCase()} short description must be at least 10 characters`);
                    }
                }
            }
        }

        if (!hasValidTranslation) {
            errors.push('At least one complete translation is required');
        }
    } else {
        errors.push('Translations are required');
    }

    if (errors.length > 0) {
        const error: ProductError = {
            code: 'VALIDATION_ERROR',
            message: errors.join('; '),
            details: { errors }
        };
        throw error;
    }
}

/**
 * Creates product translations for provided languages only
 * @param client - Database client for transaction
 * @param productId - Product ID
 * @param productCode - Product code
 * @param translations - Product translations data
 * @param requestorUuid - UUID of the user creating the product
 */
async function createProductTranslations(client: any, productId: string, productCode: string, translations: CreateProductRequest['translations'], requestorUuid: string, req: Request): Promise<void> {
    // Create translations only for provided languages
    const languages: { code: LanguageCode; data: any }[] = [];
    
    if (translations.english) {
        languages.push({ code: LanguageCode.ENGLISH, data: translations.english });
    }
    if (translations.russian) {
        languages.push({ code: LanguageCode.RUSSIAN, data: translations.russian });
    }

    for (const language of languages) {
        try {
            await client.query(queries.createProductTranslation, [
                productId,
                language.code,
                language.data.name.trim(),
                language.data.shortDesc.trim(),
                language.data.longDesc?.trim() || null,
                language.data.techSpecs ? JSON.stringify(language.data.techSpecs) : null,
                requestorUuid
            ]);

            createAndPublishEvent({
                eventName: PRODUCT_CREATE_EVENTS.TRANSLATION_CREATED.eventName,
                req: req,
                payload: {
                    productId,
                    productCode,
                    languageCode: language.code,
                    translationName: language.data.name.trim()
                }
            });
        } catch (error) {
            createAndPublishEvent({
                eventName: PRODUCT_CREATE_EVENTS.TRANSLATION_ERROR.eventName,
                req: req,
                payload: {
                    productId,
                    productCode,
                    languageCode: language.code,
                    error: error instanceof Error ? error.message : String(error)
                },
                errorData: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
}

/**
 * Creates product-user and product-group relationships
 * @param client - Database client for transaction
 * @param productId - Product ID
 * @param data - Product data containing owner and specialistsGroups
 * @param requestorUuid - UUID of the user creating the product
 */
async function createProductRelationships(client: any, productId: string, data: CreateProductRequest, requestorUuid: string, req: Request): Promise<void> {
    try {
        // Create owner relationship - owner is automatically set to the user creating the product
        await client.query(queries.createProductUser, [
            productId,
            requestorUuid,
            'owner', // role_type
            requestorUuid
        ]);

        // Create specialists groups relationships
        if (data.specialistsGroups && data.specialistsGroups.length > 0) {
            for (const groupName of data.specialistsGroups) {
                const groupResult = await validateField({ value: groupName, fieldType: 'groupName' }, req);
                if (!groupResult.isValid && groupResult.error) {
                    throw new Error(`Specialists group "${groupName}": ${groupResult.error}`);
                }
                if (groupName && groupName.trim()) {
                    const groupUuid = await getUuidByGroupName(groupName.trim());
                    if (groupUuid) {
                        await client.query(queries.createProductGroup, [
                            productId,
                            groupUuid,
                            'product_specialists', // role_type
                            requestorUuid
                        ]);
                    } else {
                        throw new Error(`Specialists group '${groupName}' not found`);
                    }
                }
            }
        }
    } catch (error) {
        await createAndPublishEvent({
            eventName: PRODUCT_CREATE_EVENTS.ERROR.eventName,
            req: req,
            payload: {
                productId,
                error: error instanceof Error ? error.message : String(error)
            },
            errorData: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}

/**
 * Creates a new product in the database with all translations
 * @param data - Product data to create
 * @param requestorUuid - UUID of the user creating the product
 * @returns Promise<CreateProductResponse>
 */
async function createProductInDatabase(data: CreateProductRequest, requestorUuid: string, req: Request): Promise<CreateProductResponse> {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        const productResult = await client.query(queries.createProduct, [
            data.productCode.trim(),
            data.translationKey.trim(),
            data.statusCode || 'draft', // status_code - use provided or default to 'draft'
            false, // isPublished - always false for new products
            false, // is_visible_owner - default false
            false, // is_visible_groups - default false
            false, // is_visible_tech_specs - default false
            false, // is_visible_long_description - default false
            requestorUuid
        ]);

        const createdProduct = productResult.rows[0] as { product_id: string; product_code: string; translation_key: string };
        const productId = createdProduct.product_id;

        createAndPublishEvent({
            eventName: PRODUCT_CREATE_EVENTS.SUCCESS.eventName,
            req: req,
            payload: {
                productId,
                productCode: createdProduct.product_code,
                translationKey: createdProduct.translation_key
            }
        });

        // Create translations for provided languages only
        await createProductTranslations(client, productId, createdProduct.product_code, data.translations, requestorUuid, req);

        // Create product-user and product-group relationships
        await createProductRelationships(client, productId, data, requestorUuid, req);

        await client.query('COMMIT');

        return {
            success: true,
            message: 'Product created successfully',
            data: {
                id: createdProduct.product_id,
                productCode: createdProduct.product_code,
                translationKey: createdProduct.translation_key
            }
        };

    } catch (error) {
        await client.query('ROLLBACK');
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        createAndPublishEvent({
            eventName: PRODUCT_CREATE_EVENTS.TRANSACTION_ROLLBACK.eventName,
            req: req,
            payload: {
                productId: 'unknown',
                productCode: data.productCode?.trim(),
                error: errorMessage
            },
            errorData: errorMessage
        });
        createAndPublishEvent({
            eventName: PRODUCT_CREATE_EVENTS.DATABASE_ERROR.eventName,
            req: req,
            payload: {
                productCode: data.productCode?.trim(),
                translationKey: data.translationKey?.trim(),
                error: errorMessage
            },
            errorData: errorMessage
        });
        
        // Re-throw the original error to preserve the actual error message
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Main service function for creating products
 * @param req - Express Request object
 * @returns Promise<CreateProductResponse>
 */
export async function createProduct(req: Request): Promise<CreateProductResponse> {
    try {
        // Get requestor UUID from JWT
        const requestorUuid = getRequestorUuidFromReq(req);
        if (!requestorUuid) {
            throw {
                code: 'AUTHENTICATION_ERROR',
                message: 'Unable to identify requestor',
                details: {}
            };
        }

        // Extract product data from request body
        const productData: CreateProductRequest = req.body;

        // Validate product data
        await validateCreateProductData(productData, req);

        // Create product in database with all translations
        const result = await createProductInDatabase(productData, requestorUuid, req);

        return result;

    } catch (error: any) {
        createAndPublishEvent({
            eventName: PRODUCT_CREATE_EVENTS.ERROR.eventName,
            req: req,
            payload: {
                error: error instanceof Error ? error.message : String(error)
            },
            errorData: error instanceof Error ? error.message : String(error)
        });

        // Return structured error response
        return {
            success: false,
            message: error.message || 'Failed to create product',
            data: undefined
        };
    }
}
