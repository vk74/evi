/**
 * service.admin.create.product.ts - version 1.2.0
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
 * Changes in v1.2.0:
 * - Added validation for backup owner username using validation service
 * - Backup owner now validated through validateField with userName type
 * - Format and existence checks aligned with owner validation
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '@/core/db/maindb';
import { queries } from './queries.admin.products';
import type { 
    CreateProductRequest, 
    CreateProductResponse, 
    ProductError,
    LanguageCode
} from './types.admin.products';
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

    // Validate owner username (well-known)
    if (data.owner) {
        const ownerResult = await validateField({ value: data.owner, fieldType: 'userName' }, req);
        if (!ownerResult.isValid && ownerResult.error) {
            errors.push(`Owner: ${ownerResult.error}`);
        } else {
            try {
                const ownerUuid = await getUuidByUsername(data.owner);
                if (!ownerUuid) {
                    errors.push('Owner user does not exist');
                }
            } catch (error) {
                errors.push('Invalid owner username');
            }
        }
    } else {
        errors.push('Owner is required');
    }

    // Validate backup owner username (well-known, optional)
    if (data.backupOwner !== undefined && data.backupOwner !== '') {
        const backupOwnerResult = await validateField({ value: data.backupOwner, fieldType: 'userName' }, req);
        if (!backupOwnerResult.isValid && backupOwnerResult.error) {
            errors.push(`Backup owner: ${backupOwnerResult.error}`);
        } else {
            try {
                const backupOwnerUuid = await getUuidByUsername(data.backupOwner);
                if (!backupOwnerUuid) {
                    errors.push('Backup owner user does not exist');
                }
            } catch (error) {
                errors.push('Invalid backup owner username');
            }
        }
    }

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
 * @param translations - Product translations data
 * @param requestorUuid - UUID of the user creating the product
 */
async function createProductTranslations(client: any, productId: string, translations: CreateProductRequest['translations'], requestorUuid: string, req: Request): Promise<void> {
    // Create translations only for provided languages
    const languages: { code: LanguageCode; data: any }[] = [];
    
    if (translations.en) {
        languages.push({ code: 'en' as LanguageCode, data: translations.en });
    }
    if (translations.ru) {
        languages.push({ code: 'ru' as LanguageCode, data: translations.ru });
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
                language.data.areaSpecifics ? JSON.stringify(language.data.areaSpecifics) : null,
                language.data.industrySpecifics ? JSON.stringify(language.data.industrySpecifics) : null,
                language.data.keyFeatures ? JSON.stringify(language.data.keyFeatures) : null,
                language.data.productOverview ? JSON.stringify(language.data.productOverview) : null,
                requestorUuid
            ]);

            createAndPublishEvent({
                eventName: PRODUCT_CREATE_EVENTS.TRANSLATION_CREATED.eventName,
                req: req,
                payload: {
                    productId,
                    languageCode: language.code,
                    translationId: 'generated'
                }
            });
        } catch (error) {
            createAndPublishEvent({
                eventName: PRODUCT_CREATE_EVENTS.TRANSLATION_ERROR.eventName,
                req: req,
                payload: {
                    productId,
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
        // Create owner relationship
        if (data.owner && data.owner.trim()) {
            const ownerUuid = await getUuidByUsername(data.owner.trim());
            if (ownerUuid) {
                await client.query(queries.createProductUser, [
                    productId,
                    ownerUuid,
                    'owner', // role_type
                    requestorUuid
                ]);

                await createAndPublishEvent({
                    eventName: PRODUCT_CREATE_EVENTS.SUCCESS.eventName,
                    req: req,
                    payload: {
                        productId,
                        owner: data.owner,
                        ownerUuid,
                        relationship: 'product_user',
                        roleType: 'owner'
                    }
                });
            } else {
                throw new Error(`Owner user '${data.owner}' not found`);
            }
        }

        // Create backup owner relationship
        if (data.backupOwner && data.backupOwner.trim()) {
            const backupOwnerUuid = await getUuidByUsername(data.backupOwner.trim());
            if (backupOwnerUuid) {
                await client.query(queries.createProductUser, [
                    productId,
                    backupOwnerUuid,
                    'backup_owner', // role_type
                    requestorUuid
                ]);

                await createAndPublishEvent({
                    eventName: PRODUCT_CREATE_EVENTS.SUCCESS.eventName,
                    req: req,
                    payload: {
                        productId,
                        backupOwner: data.backupOwner,
                        backupOwnerUuid,
                        relationship: 'product_user',
                        roleType: 'backup_owner'
                    }
                });
            } else {
                throw new Error(`Backup owner user '${data.backupOwner}' not found`);
            }
        }

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

                        await createAndPublishEvent({
                            eventName: PRODUCT_CREATE_EVENTS.SUCCESS.eventName,
                            req: req,
                            payload: {
                                productId,
                                groupName: groupName,
                                groupUuid,
                                relationship: 'product_group'
                            }
                        });
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

        // Create product in main table
        createAndPublishEvent({
            eventName: PRODUCT_CREATE_EVENTS.INSERTING_DATA.eventName,
            req: req,
            payload: {
                productCode: data.productCode.trim(),
                translationKey: data.translationKey.trim(),
                canBeOption: data.canBeOption,
                optionOnly: data.optionOnly,
                isPublished: false, // Always false for new products
                owner: data.owner
            }
        });

        const productResult = await client.query(queries.createProduct, [
            data.productCode.trim(),
            data.translationKey.trim(),
            data.canBeOption,
            data.optionOnly,
            false, // isPublished - always false for new products
            false, // is_visible_owner - default false
            false, // is_visible_groups - default false
            false, // is_visible_tech_specs - default false
            false, // is_visible_area_specs - default false
            false, // is_visible_industry_specs - default false
            false, // is_visible_key_features - default false
            false, // is_visible_overview - default false
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
                translationKey: createdProduct.translation_key,
                createdBy: requestorUuid
            }
        });

        // Create translations for provided languages only
        await createProductTranslations(client, productId, data.translations, requestorUuid, req);

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
                error: errorMessage
            },
            errorData: errorMessage
        });
        createAndPublishEvent({
            eventName: PRODUCT_CREATE_EVENTS.DATABASE_ERROR.eventName,
            req: req,
            payload: {
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

        createAndPublishEvent({
            eventName: PRODUCT_CREATE_EVENTS.STARTED.eventName,
            req: req,
            payload: {
                productCode: productData.productCode,
                translationKey: productData.translationKey,
                owner: productData.owner,
                requestorUuid
            }
        });

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
