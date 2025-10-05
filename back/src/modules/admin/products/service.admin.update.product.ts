/**
 * service.admin.update.product.ts - version 1.1.0
 * Service for updating products operations.
 * 
 * Functionality:
 * - Validates input data for updating products
 * - Checks existence of product to update
 * - Validates unique constraints (product code, translation key) if changed
 * - Updates product in database with translations
 * - Handles data transformation and business logic
 * - Manages database interactions and error handling
 * 
 * Data flow:
 * 1. Receive request object with product data
 * 2. Validate required fields and data formats
 * 3. Check existence of product to update
 * 4. Check unique constraints if changed (product code, translation key)
 * 5. Update product in database with transaction
 * 6. Update translations for all languages
 * 7. Update relationships (owners, groups)
 * 8. Return formatted response
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '@/core/db/maindb';
import { queries } from './queries.admin.products';
import type { 
    UpdateProductRequest, 
    UpdateProductResponse, 
    ProductError,
    Product,
    ProductTranslation
} from './types.admin.products';
import { LanguageCode } from './types.admin.products';
import { getRequestorUuidFromReq } from '@/core/helpers/get.requestor.uuid.from.req';
import { getUuidByUsername } from '@/core/helpers/get.uuid.by.username';
import { getUuidByGroupName } from '@/core/helpers/get.uuid.by.group.name';
import { fetchUsernameByUuid } from '@/core/helpers/get.username.by.uuid';
import { fetchGroupnameByUuid } from '@/core/helpers/get.groupname.by.uuid';
import { validateField } from '@/core/validation/service.validation';
import { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { PRODUCT_UPDATE_EVENTS } from './events.admin.products';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Validates product update data using validation service
 * @param data - Product data to validate
 * @throws {ProductError} When validation fails
 */
async function validateUpdateProductData(data: UpdateProductRequest, req: Request): Promise<void> {
    const errors: string[] = [];

    // Validate product ID
    if (!data.productId) {
        errors.push('Product ID is required');
    }

    // Validate product code if provided
    // productCode formatting is enforced by DB constraints; no extra validation here
    if (data.productCode !== undefined) {
        // no-op: DB enforces constraints
    }

    // Validate translation key if provided
    if (data.translationKey !== undefined) {
        // no-op: DB enforces constraints
    }

    // Validate owner if provided (well-known)
    if (data.owner !== undefined && data.owner !== '') {
        const ownerResult = await validateField({ value: data.owner, fieldType: 'userName' }, req);
        if (!ownerResult.isValid && ownerResult.error) {
            errors.push(`Owner: ${ownerResult.error}`);
        }
    }

    // Validate backup owner if provided (only check if not empty, since usernames can contain various characters)
    if (data.backupOwner !== undefined && data.backupOwner !== '') {
        const backupOwnerResult = await validateField({ value: data.backupOwner, fieldType: 'userName' }, req);
        if (!backupOwnerResult.isValid && backupOwnerResult.error) {
            errors.push(`Backup owner: ${backupOwnerResult.error}`);
        }
    }

    // Validate specialist groups if provided
    if (data.specialistsGroups !== undefined) {
        if (!Array.isArray(data.specialistsGroups)) {
            errors.push('Specialist groups must be an array');
        } else {
            for (const group of data.specialistsGroups) {
                const result = await validateField({ value: group, fieldType: 'groupName' }, req);
                if (!result.isValid && result.error) {
                    errors.push(`Invalid specialist group: ${result.error}`);
                }
            }
        }
    }

    // Validate translations if provided
    if (data.translations !== undefined) {
        const supportedLanguages = Object.values(LanguageCode);
        for (const [langCode, translation] of Object.entries(data.translations)) {
            if (!supportedLanguages.includes(langCode as LanguageCode)) {
                errors.push(`Unsupported language code: ${langCode}`);
                continue;
            }

            if (translation) {
                if (!translation.name || translation.name.trim() === '') {
                    errors.push(`Product name is required for language: ${langCode}`);
                }
                if (!translation.shortDesc || translation.shortDesc.trim() === '') {
                    errors.push(`Short description is required for language: ${langCode}`);
                }
            }
        }
    }

    if (errors.length > 0) {
        const productError: ProductError = {
            code: 'VALIDATION_ERROR',
            message: 'Product update validation failed',
            details: { errors }
        };
        throw productError;
    }
}

/**
 * Checks if product exists and returns current data
 * @param productId - Product ID to check
 * @returns Current product data or null if not found
 */
async function checkProductExists(productId: string): Promise<Product | null> {
    const client = await pool.connect();
    try {
        const result = await client.query(queries.fetchSingleProduct, [productId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
        client.release();
    }
}

/**
 * Checks unique constraints for product code and translation key
 * @param productCode - Product code to check
 * @param translationKey - Translation key to check
 * @param currentProductId - Current product ID (to exclude from check)
 * @throws {ProductError} When constraint violation is found
 */
async function checkUniqueConstraints(
    productCode: string | undefined,
    translationKey: string | undefined,
    currentProductId: string
): Promise<void> {
    const client = await pool.connect();
    try {
        // Check product code uniqueness if provided
        if (productCode) {
            const codeResult = await client.query(
                'SELECT product_id FROM app.products WHERE product_code = $1 AND product_id != $2',
                [productCode, currentProductId]
            );
            if (codeResult.rows.length > 0) {
                const productError: ProductError = {
                    code: 'UNIQUE_CONSTRAINT_VIOLATION',
                    message: 'Product code already exists',
                    details: { productCode }
                };
                throw productError;
            }
        }

        // Check translation key uniqueness if provided
        if (translationKey) {
            const keyResult = await client.query(
                'SELECT product_id FROM app.products WHERE translation_key = $1 AND product_id != $2',
                [translationKey, currentProductId]
            );
            if (keyResult.rows.length > 0) {
                const productError: ProductError = {
                    code: 'UNIQUE_CONSTRAINT_VIOLATION',
                    message: 'Translation key already exists',
                    details: { translationKey }
                };
                throw productError;
            }
        }
    } finally {
        client.release();
    }
}

/**
 * Updates main product data
 * @param client - Database client
 * @param productId - Product ID
 * @param data - Update data
 * @param updatedBy - User ID who is updating
 */
async function updateMainProductData(
    client: any,
    productId: string,
    data: UpdateProductRequest,
    updatedBy: string
): Promise<void> {
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    // Build dynamic update query
    if (data.productCode !== undefined) {
        updateFields.push(`product_code = $${paramIndex++}`);
        updateValues.push(data.productCode);
    }
    if (data.translationKey !== undefined) {
        updateFields.push(`translation_key = $${paramIndex++}`);
        updateValues.push(data.translationKey);
    }
    if (data.canBeOption !== undefined) {
        updateFields.push(`can_be_option = $${paramIndex++}`);
        updateValues.push(data.canBeOption);
    }
    if (data.optionOnly !== undefined) {
        updateFields.push(`option_only = $${paramIndex++}`);
        updateValues.push(data.optionOnly);
    }
    if (data.visibility) {
        if (data.visibility.isVisibleOwner !== undefined) {
            updateFields.push(`is_visible_owner = $${paramIndex++}`);
            updateValues.push(data.visibility.isVisibleOwner);
        }
        if (data.visibility.isVisibleGroups !== undefined) {
            updateFields.push(`is_visible_groups = $${paramIndex++}`);
            updateValues.push(data.visibility.isVisibleGroups);
        }
        if (data.visibility.isVisibleTechSpecs !== undefined) {
            updateFields.push(`is_visible_tech_specs = $${paramIndex++}`);
            updateValues.push(data.visibility.isVisibleTechSpecs);
        }
        if (data.visibility.isVisibleAreaSpecs !== undefined) {
            updateFields.push(`is_visible_area_specs = $${paramIndex++}`);
            updateValues.push(data.visibility.isVisibleAreaSpecs);
        }
        if (data.visibility.isVisibleIndustrySpecs !== undefined) {
            updateFields.push(`is_visible_industry_specs = $${paramIndex++}`);
            updateValues.push(data.visibility.isVisibleIndustrySpecs);
        }
        if (data.visibility.isVisibleKeyFeatures !== undefined) {
            updateFields.push(`is_visible_key_features = $${paramIndex++}`);
            updateValues.push(data.visibility.isVisibleKeyFeatures);
        }
        if (data.visibility.isVisibleOverview !== undefined) {
            updateFields.push(`is_visible_overview = $${paramIndex++}`);
            updateValues.push(data.visibility.isVisibleOverview);
        }
        if (data.visibility.isVisibleLongDescription !== undefined) {
            updateFields.push(`is_visible_long_description = $${paramIndex++}`);
            updateValues.push(data.visibility.isVisibleLongDescription);
        }
    }

    // Always update updated_by and updated_at
    updateFields.push(`updated_by = $${paramIndex++}`);
    updateValues.push(updatedBy);
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updateFields.length > 2) { // More than just updated_by and updated_at
        const query = `
            UPDATE app.products 
            SET ${updateFields.join(', ')}
            WHERE product_id = $${paramIndex}
        `;
        updateValues.push(productId);
        await client.query(query, updateValues);
    }
}

/**
 * Updates product translations
 * @param client - Database client
 * @param productId - Product ID
 * @param translations - Translation data
 * @param updatedBy - User ID who is updating
 */
async function updateProductTranslations(
    client: any,
    productId: string,
    translations: any,
    updatedBy: string
): Promise<void> {
    for (const [langCode, translationData] of Object.entries(translations)) {
        if (translationData && typeof translationData === 'object') {
            // Use UPSERT (INSERT ... ON CONFLICT) to handle both new and existing translations
            const query = `
                INSERT INTO app.product_translations (
                    product_id, language_code, name, short_desc, long_desc,
                    tech_specs, area_specifics, industry_specifics, key_features, product_overview,
                    created_by, updated_by, created_at, updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                )
                ON CONFLICT (product_id, language_code) 
                DO UPDATE SET
                    name = EXCLUDED.name,
                    short_desc = EXCLUDED.short_desc,
                    long_desc = EXCLUDED.long_desc,
                    tech_specs = EXCLUDED.tech_specs,
                    area_specifics = EXCLUDED.area_specifics,
                    industry_specifics = EXCLUDED.industry_specifics,
                    key_features = EXCLUDED.key_features,
                    product_overview = EXCLUDED.product_overview,
                    updated_by = EXCLUDED.updated_by,
                    updated_at = CURRENT_TIMESTAMP
            `;
            
            await client.query(query, [
                productId,
                langCode,
                (translationData as any).name,
                (translationData as any).shortDesc,
                (translationData as any).longDesc || null,
                (translationData as any).techSpecs ? JSON.stringify((translationData as any).techSpecs) : null,
                (translationData as any).areaSpecifics ? JSON.stringify((translationData as any).areaSpecifics) : null,
                (translationData as any).industrySpecifics ? JSON.stringify((translationData as any).industrySpecifics) : null,
                (translationData as any).keyFeatures ? JSON.stringify((translationData as any).keyFeatures) : null,
                (translationData as any).productOverview ? JSON.stringify((translationData as any).productOverview) : null,
                updatedBy,
                updatedBy
            ]);
        }
    }
}

/**
 * Updates product owners
 * @param client - Database client
 * @param productId - Product ID
 * @param owner - Owner username
 * @param backupOwner - Backup owner username
 * @param updatedBy - User ID who is updating
 */
async function updateProductOwners(
    client: any,
    productId: string,
    owner: string | undefined,
    backupOwner: string | undefined,
    updatedBy: string
): Promise<void> {
    // Clear existing owners
    await client.query('DELETE FROM app.product_users WHERE product_id = $1', [productId]);

    // Add new owner if provided
    if (owner) {
        const ownerUuid = await getUuidByUsername(owner);
        if (ownerUuid) {
            await client.query(
                'INSERT INTO app.product_users (product_id, user_id, role_type, created_by) VALUES ($1, $2, $3, $4)',
                [productId, ownerUuid, 'owner', updatedBy]
            );
        }
    }

    // Add backup owner if provided
    if (backupOwner) {
        const backupOwnerUuid = await getUuidByUsername(backupOwner);
        if (backupOwnerUuid) {
            await client.query(
                'INSERT INTO app.product_users (product_id, user_id, role_type, created_by) VALUES ($1, $2, $3, $4)',
                [productId, backupOwnerUuid, 'backup_owner', updatedBy]
            );
        }
    }
}

/**
 * Updates product specialist groups
 * @param client - Database client
 * @param productId - Product ID
 * @param specialistsGroups - Array of group names
 * @param updatedBy - User ID who is updating
 */
async function updateProductGroups(
    client: any,
    productId: string,
    specialistsGroups: string[] | undefined,
    updatedBy: string
): Promise<void> {
    // Clear existing specialist groups
    await client.query(
        'DELETE FROM app.product_groups WHERE product_id = $1 AND role_type = $2',
        [productId, 'product_specialists']
    );

    // Add new specialist groups if provided
    if (specialistsGroups && specialistsGroups.length > 0) {
        for (const groupName of specialistsGroups) {
            const groupUuid = await getUuidByGroupName(groupName);
            if (groupUuid) {
                await client.query(
                    'INSERT INTO app.product_groups (product_id, group_id, role_type, created_by) VALUES ($1, $2, $3, $4)',
                    [productId, groupUuid, 'product_specialists', updatedBy]
                );
            }
        }
    }
}

/**
 * Main function to update a product
 * @param data - Product update data
 * @param req - Express request object
 * @returns UpdateProductResponse
 */
export async function updateProduct(data: UpdateProductRequest, req: Request): Promise<UpdateProductResponse> {
    const client = await pool.connect();
    
    try {
        // Log incoming data for debugging
        console.log('[UpdateProduct] Incoming data:', JSON.stringify(data, null, 2));
        
        await createAndPublishEvent({
            eventName: PRODUCT_UPDATE_EVENTS.STARTED.eventName,
            payload: { 
                productId: data.productId,
                hasTranslations: !!data.translations,
                translationsKeys: data.translations ? Object.keys(data.translations) : []
            }
        });

        // Validate input data
        await createAndPublishEvent({
            eventName: PRODUCT_UPDATE_EVENTS.VALIDATION_STARTED.eventName,
            payload: { productId: data.productId }
        });

        await validateUpdateProductData(data, req);

        // Check if product exists
        const existingProduct = await checkProductExists(data.productId);
        if (!existingProduct) {
            await createAndPublishEvent({
                eventName: PRODUCT_UPDATE_EVENTS.NOT_FOUND.eventName,
                payload: { productId: data.productId }
            });

            return {
                success: false,
                message: 'Product not found',
                data: undefined
            };
        }

        // Check unique constraints if relevant fields are being updated
        await checkUniqueConstraints(data.productCode, data.translationKey, data.productId);

        // Get requestor UUID
        const requestorUuid = await getRequestorUuidFromReq(req);
        if (!requestorUuid) {
            return {
                success: false,
                message: 'Unable to identify requesting user',
                data: undefined
            };
        }

        // Start transaction
        await client.query('BEGIN');

        // Update main product data
        await updateMainProductData(client, data.productId, data, requestorUuid);
        await createAndPublishEvent({
            eventName: PRODUCT_UPDATE_EVENTS.MAIN_DATA_UPDATED.eventName,
            payload: { productId: data.productId }
        });

        // Update translations if provided and not empty
        if (data.translations && Object.keys(data.translations).length > 0) {
            await updateProductTranslations(client, data.productId, data.translations, requestorUuid);
            await createAndPublishEvent({
                eventName: PRODUCT_UPDATE_EVENTS.TRANSLATIONS_UPDATED.eventName,
                payload: { productId: data.productId }
            });
        }

        // Update owners if provided
        if (data.owner !== undefined || data.backupOwner !== undefined) {
            await updateProductOwners(client, data.productId, data.owner, data.backupOwner, requestorUuid);
            await createAndPublishEvent({
                eventName: PRODUCT_UPDATE_EVENTS.OWNERS_UPDATED.eventName,
                payload: { productId: data.productId }
            });
        }

        // Update specialist groups if provided
        if (data.specialistsGroups !== undefined) {
            await updateProductGroups(client, data.productId, data.specialistsGroups, requestorUuid);
            await createAndPublishEvent({
                eventName: PRODUCT_UPDATE_EVENTS.GROUPS_UPDATED.eventName,
                payload: { productId: data.productId }
            });
        }

        // Commit transaction
        await client.query('COMMIT');

        // Fetch updated product data
        const updatedProduct = await checkProductExists(data.productId);
        if (!updatedProduct) {
            throw new Error('Failed to fetch updated product data');
        }

        // Fetch translations
        const translationsResult = await client.query(
            'SELECT * FROM app.product_translations WHERE product_id = $1 ORDER BY language_code',
            [data.productId]
        );

        // Fetch owners
        const ownersResult = await client.query(`
            SELECT u.username, pu.role_type 
            FROM app.product_users pu
            JOIN app.users u ON pu.user_id = u.user_id
            WHERE pu.product_id = $1
        `, [data.productId]);

        // Fetch specialist groups
        const groupsResult = await client.query(`
            SELECT g.group_name 
            FROM app.product_groups pg
            JOIN app.groups g ON pg.group_id = g.group_id
            WHERE pg.product_id = $1 AND pg.role_type = 'product_specialists'
        `, [data.productId]);

        // Process owners
        let owner: string | undefined;
        let backupOwner: string | undefined;
        ownersResult.rows.forEach((row: any) => {
            if (row.role_type === 'owner') {
                owner = row.username;
            } else if (row.role_type === 'backup_owner') {
                backupOwner = row.username;
            }
        });

        // Process specialist groups
        const specialistsGroups = groupsResult.rows.map((row: any) => row.group_name);

        await createAndPublishEvent({
            eventName: PRODUCT_UPDATE_EVENTS.SUCCESS.eventName,
            payload: { 
                productId: data.productId,
                productCode: updatedProduct.product_code
            }
        });

        return {
            success: true,
            message: 'Product updated successfully',
            data: {
                product: updatedProduct,
                translations: translationsResult.rows,
                owner,
                backupOwner,
                specialistsGroups
            }
        };

    } catch (error) {
        await client.query('ROLLBACK');
        
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        
        await createAndPublishEvent({
            eventName: PRODUCT_UPDATE_EVENTS.ERROR.eventName,
            payload: { 
                productId: data.productId,
                error: errorMessage,
                stack: errorStack
            },
            errorData: errorMessage
        });

        if (error instanceof Error && 'code' in error) {
            const productError = error as ProductError;
            return {
                success: false,
                message: productError.message,
                data: undefined
            };
        }

        return {
            success: false,
            message: 'Failed to update product',
            data: undefined
        };
    } finally {
        client.release();
    }
}

export default updateProduct;
