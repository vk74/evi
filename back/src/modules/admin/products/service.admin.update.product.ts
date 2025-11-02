/**
 * service.admin.update.product.ts - version 1.3.2
 * Service for updating products operations.
 * 
 * Functionality:
 * - Validates input data for updating products
 * - Checks existence of product to update
 * - Validates unique constraints (product code, translation key) if changed
 * - Updates product in database with translations
 * - Handles data transformation and business logic
 * - Manages database interactions and error handling
 * - Tracks changes for informative event payloads
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
 * 
 * Changes in v1.3.0:
 * - Enhanced event payloads with detailed change information
 * - updateMainProductData now returns changes with old/new values
 * - updateProductTranslations now returns changed languages and fields
 * - updateProductOwners now returns owner changes with old/new values
 * - updateProductGroups now returns added/removed/all arrays
 * - Events published only when actual changes are detected
 * - Payload includes productCode and detailed change information for audit
 * 
 * Changes in v1.3.1:
 * - Added statusCode field support in product updates
 * - status_code changes are tracked and included in event payloads
 * 
 * Changes in v1.3.2:
 * - Fixed bug where statusCode changes were not processed when statusCode was the only changed field
 * - Added statusCode check to condition that calls updateMainProductData
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
 * Updates product preferences with event publishing for each changed field
 * @param client - Database client
 * @param productId - Product ID
 * @param data - Update data with visibility preferences
 * @param requestorUuid - UUID of the user updating the product
 * @param req - Express request object
 * @param productCode - Product code for events
 */
async function updateProductPreferences(
    client: any,
    productId: string,
    data: UpdateProductRequest,
    requestorUuid: string,
    req: Request,
    productCode: string
): Promise<void> {
    // Only update if any preference fields are provided
    if (data.visibility && (
        data.visibility.isVisibleOwner !== undefined ||
        data.visibility.isVisibleGroups !== undefined ||
        data.visibility.isVisibleTechSpecs !== undefined ||
        data.visibility.isVisibleAreaSpecs !== undefined ||
        data.visibility.isVisibleIndustrySpecs !== undefined ||
        data.visibility.isVisibleKeyFeatures !== undefined ||
        data.visibility.isVisibleOverview !== undefined ||
        data.visibility.isVisibleLongDescription !== undefined
    )) {
        // Get current preferences for comparison
        const currentPrefsResult = await client.query(
            'SELECT is_visible_owner, is_visible_groups, is_visible_tech_specs, is_visible_area_specs, is_visible_industry_specs, is_visible_key_features, is_visible_overview, is_visible_long_description FROM app.products WHERE product_id = $1',
            [productId]
        );
        const currentPrefs = currentPrefsResult.rows[0];

        // Update preferences in database
        const updateFields: string[] = [];
        const updateValues: any[] = [];
        let paramIndex = 1;

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

        // Always update updated_by and updated_at
        updateFields.push(`updated_by = $${paramIndex++}`);
        updateValues.push(requestorUuid);
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

        // Publish event for each changed field
        const fieldMappings = [
            { field: 'isVisibleOwner', oldValue: currentPrefs.is_visible_owner, newValue: data.visibility.isVisibleOwner },
            { field: 'isVisibleGroups', oldValue: currentPrefs.is_visible_groups, newValue: data.visibility.isVisibleGroups },
            { field: 'isVisibleTechSpecs', oldValue: currentPrefs.is_visible_tech_specs, newValue: data.visibility.isVisibleTechSpecs },
            { field: 'isVisibleAreaSpecs', oldValue: currentPrefs.is_visible_area_specs, newValue: data.visibility.isVisibleAreaSpecs },
            { field: 'isVisibleIndustrySpecs', oldValue: currentPrefs.is_visible_industry_specs, newValue: data.visibility.isVisibleIndustrySpecs },
            { field: 'isVisibleKeyFeatures', oldValue: currentPrefs.is_visible_key_features, newValue: data.visibility.isVisibleKeyFeatures },
            { field: 'isVisibleOverview', oldValue: currentPrefs.is_visible_overview, newValue: data.visibility.isVisibleOverview },
            { field: 'isVisibleLongDescription', oldValue: currentPrefs.is_visible_long_description, newValue: data.visibility.isVisibleLongDescription }
        ];

        for (const { field, oldValue, newValue } of fieldMappings) {
            if (oldValue !== newValue && newValue !== undefined) {
                await createAndPublishEvent({
                    req,
                    eventName: PRODUCT_UPDATE_EVENTS.PREFERENCES_FIELD_CHANGED.eventName,
                    payload: {
                        productId,
                        requestorUuid,
                        field,
                        oldValue,
                        newValue,
                        productCode: data.productCode || productCode
                    }
                });
            }
        }
    }
}

/**
 * Updates main product data
 * @param client - Database client
 * @param productId - Product ID
 * @param data - Update data
 * @param updatedBy - User ID who is updating
 * @param req - Express request object
 * @returns Object with changes or null if no changes
 */
async function updateMainProductData(
    client: any,
    productId: string,
    data: UpdateProductRequest,
    updatedBy: string,
    req: Request
): Promise<{ changes: Record<string, { old: any, new: any }> } | null> {
    // Get current values from database
    const currentResult = await client.query(
        'SELECT product_code, translation_key, status_code, can_be_option, option_only FROM app.products WHERE product_id = $1',
        [productId]
    );
    
    if (currentResult.rows.length === 0) {
        return null;
    }
    
    const current = currentResult.rows[0];
    const changes: Record<string, { old: any, new: any }> = {};
    
    // Compare and collect changes
    if (data.productCode !== undefined && data.productCode !== current.product_code) {
        changes.productCode = {
            old: current.product_code,
            new: data.productCode
        };
    }
    if (data.translationKey !== undefined && data.translationKey !== current.translation_key) {
        changes.translationKey = {
            old: current.translation_key,
            new: data.translationKey
        };
    }
    if (data.statusCode !== undefined && data.statusCode !== current.status_code) {
        changes.statusCode = {
            old: current.status_code,
            new: data.statusCode
        };
    }
    if (data.canBeOption !== undefined && data.canBeOption !== current.can_be_option) {
        changes.canBeOption = {
            old: current.can_be_option,
            new: data.canBeOption
        };
    }
    if (data.optionOnly !== undefined && data.optionOnly !== current.option_only) {
        changes.optionOnly = {
            old: current.option_only,
            new: data.optionOnly
        };
    }
    
    // If no changes, return null
    if (Object.keys(changes).length === 0) {
        return null;
    }
    
    // Build dynamic update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (data.productCode !== undefined) {
        updateFields.push(`product_code = $${paramIndex++}`);
        updateValues.push(data.productCode);
    }
    if (data.translationKey !== undefined) {
        updateFields.push(`translation_key = $${paramIndex++}`);
        updateValues.push(data.translationKey);
    }
    if (data.statusCode !== undefined) {
        updateFields.push(`status_code = $${paramIndex++}`);
        updateValues.push(data.statusCode);
    }
    if (data.canBeOption !== undefined) {
        updateFields.push(`can_be_option = $${paramIndex++}`);
        updateValues.push(data.canBeOption);
    }
    if (data.optionOnly !== undefined) {
        updateFields.push(`option_only = $${paramIndex++}`);
        updateValues.push(data.optionOnly);
    }
    // Note: visibility fields are now handled by updateProductPreferences function

    // Always update updated_by and updated_at
    updateFields.push(`updated_by = $${paramIndex++}`);
    updateValues.push(updatedBy);
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
        UPDATE app.products 
        SET ${updateFields.join(', ')}
        WHERE product_id = $${paramIndex}
    `;
    updateValues.push(productId);
    await client.query(query, updateValues);
    
    return { changes };
}

/**
 * Updates product translations
 * @param client - Database client
 * @param productId - Product ID
 * @param translations - Translation data
 * @param updatedBy - User ID who is updating
 * @returns Object with languageCodes and fieldsChanged or null if no changes
 */
async function updateProductTranslations(
    client: any,
    productId: string,
    translations: any,
    updatedBy: string
): Promise<{ languageCodes: string[], fieldsChanged: string[] } | null> {
    // Get current translations from database
    const currentTranslationsResult = await client.query(
        'SELECT language_code, name, short_desc, long_desc, tech_specs, area_specifics, industry_specifics, key_features, product_overview FROM app.product_translations WHERE product_id = $1',
        [productId]
    );
    
    const currentTranslations: Record<string, any> = {};
    currentTranslationsResult.rows.forEach((row: any) => {
        // Helper function to safely parse JSON fields
        const parseJsonField = (value: any): any => {
            if (value === null || value === undefined) {
                return null;
            }
            // If already an object, return as is (PostgreSQL JSONB fields are already parsed)
            if (typeof value === 'object') {
                return value;
            }
            // If string, try to parse
            if (typeof value === 'string') {
                try {
                    return JSON.parse(value);
                } catch (e) {
                    return null;
                }
            }
            return value;
        };
        
        currentTranslations[row.language_code] = {
            name: row.name,
            shortDesc: row.short_desc,
            longDesc: row.long_desc,
            techSpecs: parseJsonField(row.tech_specs),
            areaSpecifics: parseJsonField(row.area_specifics),
            industrySpecifics: parseJsonField(row.industry_specifics),
            keyFeatures: parseJsonField(row.key_features),
            productOverview: parseJsonField(row.product_overview)
        };
    });
    
    const changedLanguageCodes = new Set<string>();
    const changedFields = new Set<string>();
    
    // Field mapping from frontend to database
    const fieldMapping: Record<string, string> = {
        name: 'name',
        shortDesc: 'shortDesc',
        longDesc: 'longDesc',
        techSpecs: 'techSpecs',
        areaSpecifics: 'areaSpecifics',
        industrySpecifics: 'industrySpecifics',
        keyFeatures: 'keyFeatures',
        productOverview: 'productOverview'
    };
    
    for (const [langCode, translationData] of Object.entries(translations)) {
        if (translationData && typeof translationData === 'object') {
            const current = currentTranslations[langCode];
            let hasChanges = false;
            
            // Compare each field
            for (const [fieldName, dbFieldName] of Object.entries(fieldMapping)) {
                const newValue = (translationData as any)[fieldName];
                const currentValue = current?.[fieldName];
                
                // Normalize values for comparison (handle JSON objects)
                const normalizedNew = typeof newValue === 'object' && newValue !== null 
                    ? JSON.stringify(newValue) 
                    : newValue;
                const normalizedCurrent = typeof currentValue === 'object' && currentValue !== null 
                    ? JSON.stringify(currentValue) 
                    : currentValue;
                
                if (normalizedNew !== normalizedCurrent) {
                    hasChanges = true;
                    changedFields.add(dbFieldName);
                }
            }
            
            if (hasChanges || !current) {
                // New translation or changed translation
                changedLanguageCodes.add(langCode);
            }
            
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
    
    if (changedLanguageCodes.size === 0 && changedFields.size === 0) {
        return null;
    }
    
    return {
        languageCodes: Array.from(changedLanguageCodes),
        fieldsChanged: Array.from(changedFields)
    };
}

/**
 * Updates product owners
 * @param client - Database client
 * @param productId - Product ID
 * @param owner - Owner username
 * @param backupOwner - Backup owner username
 * @param updatedBy - User ID who is updating
 * @returns Object with changes or null if no changes
 */
async function updateProductOwners(
    client: any,
    productId: string,
    owner: string | undefined,
    backupOwner: string | undefined,
    updatedBy: string
): Promise<{ changes: Record<string, { old: string | null, new: string | null }> } | null> {
    // Get current owners from database
    const currentOwnersResult = await client.query(`
        SELECT u.username, pu.role_type 
        FROM app.product_users pu
        JOIN app.users u ON pu.user_id = u.user_id
        WHERE pu.product_id = $1
    `, [productId]);
    
    let currentOwner: string | null = null;
    let currentBackupOwner: string | null = null;
    
    currentOwnersResult.rows.forEach((row: any) => {
        if (row.role_type === 'owner') {
            currentOwner = row.username;
        } else if (row.role_type === 'backup_owner') {
            currentBackupOwner = row.username;
        }
    });
    
    // Normalize undefined to null for comparison
    const newOwner = owner || null;
    const newBackupOwner = backupOwner || null;
    
    const changes: Record<string, { old: string | null, new: string | null }> = {};
    
    // Compare owner
    if (newOwner !== currentOwner) {
        changes.owner = {
            old: currentOwner,
            new: newOwner
        };
    }
    
    // Compare backup owner
    if (newBackupOwner !== currentBackupOwner) {
        changes.backupOwner = {
            old: currentBackupOwner,
            new: newBackupOwner
        };
    }
    
    // If no changes, return null
    if (Object.keys(changes).length === 0) {
        return null;
    }
    
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
    
    return { changes };
}

/**
 * Updates product specialist groups
 * @param client - Database client
 * @param productId - Product ID
 * @param specialistsGroups - Array of group names
 * @param updatedBy - User ID who is updating
 * @returns Object with added, removed, and all arrays or null if no changes
 */
async function updateProductGroups(
    client: any,
    productId: string,
    specialistsGroups: string[] | undefined,
    updatedBy: string
): Promise<{ added: string[], removed: string[], all: string[] } | null> {
    // Get current specialist groups from database
    const currentGroupsResult = await client.query(`
        SELECT g.group_name 
        FROM app.product_groups pg
        JOIN app.groups g ON pg.group_id = g.group_id
        WHERE pg.product_id = $1 AND pg.role_type = 'product_specialists'
    `, [productId]);
    
    const currentGroups = currentGroupsResult.rows.map((row: any) => row.group_name);
    const newGroups = specialistsGroups || [];
    
    // Normalize arrays: sort and remove duplicates for comparison
    const currentGroupsSorted = [...new Set(currentGroups)].sort();
    const newGroupsSorted = [...new Set(newGroups)].sort();
    
    // Check if there are changes
    const hasChanges = JSON.stringify(currentGroupsSorted) !== JSON.stringify(newGroupsSorted);
    
    if (!hasChanges) {
        return null;
    }
    
    // Calculate added and removed groups
    const added = newGroups.filter((group: string) => !currentGroups.includes(group));
    const removed = currentGroups.filter((group: string) => !newGroups.includes(group));
    const all = newGroups;
    
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
    
    return { added, removed, all };
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
        // Validate input data
        await validateUpdateProductData(data, req);

        // Check if product exists
        const existingProduct = await checkProductExists(data.productId);
        if (!existingProduct) {
            await createAndPublishEvent({
                eventName: PRODUCT_UPDATE_EVENTS.NOT_FOUND.eventName,
                req: req,
                payload: { productId: data.productId }
            });

            return {
                success: false,
                message: 'Product not found',
                data: undefined
            };
        }

        // Get product code for events
        const productCode = data.productCode || existingProduct.product_code;

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

        // Update main product data and collect changes
        let mainDataChanges = null;
        if (data.productCode !== undefined || data.translationKey !== undefined || 
            data.statusCode !== undefined || data.canBeOption !== undefined || data.optionOnly !== undefined) {
            mainDataChanges = await updateMainProductData(client, data.productId, data, requestorUuid, req);
            
            // Publish event only if there are actual changes
            if (mainDataChanges && Object.keys(mainDataChanges.changes).length > 0) {
                // Get final product code (new or existing)
                const finalProductCode = data.productCode || existingProduct.product_code;
                await createAndPublishEvent({
                    eventName: PRODUCT_UPDATE_EVENTS.MAIN_DATA_UPDATED.eventName,
                    req: req,
                    payload: {
                        productId: data.productId,
                        productCode: finalProductCode,
                        changes: mainDataChanges.changes
                    }
                });
            }
        }

        // Update preferences if provided
        await updateProductPreferences(client, data.productId, data, requestorUuid, req, productCode);

        // Update translations if provided and not empty
        if (data.translations && Object.keys(data.translations).length > 0) {
            const translationsChanges = await updateProductTranslations(client, data.productId, data.translations, requestorUuid);
            
            // Publish event only if there are actual changes
            if (translationsChanges && (translationsChanges.languageCodes.length > 0 || translationsChanges.fieldsChanged.length > 0)) {
                await createAndPublishEvent({
                    eventName: PRODUCT_UPDATE_EVENTS.TRANSLATIONS_UPDATED.eventName,
                    req: req,
                    payload: {
                        productId: data.productId,
                        productCode: productCode,
                        languageCodes: translationsChanges.languageCodes,
                        fieldsChanged: translationsChanges.fieldsChanged
                    }
                });
            }
        }

        // Update owners if provided
        if (data.owner !== undefined || data.backupOwner !== undefined) {
            const ownersChanges = await updateProductOwners(client, data.productId, data.owner, data.backupOwner, requestorUuid);
            
            // Publish event only if there are actual changes
            if (ownersChanges && Object.keys(ownersChanges.changes).length > 0) {
                await createAndPublishEvent({
                    eventName: PRODUCT_UPDATE_EVENTS.OWNERS_UPDATED.eventName,
                    req: req,
                    payload: {
                        productId: data.productId,
                        productCode: productCode,
                        changes: ownersChanges.changes
                    }
                });
            }
        }

        // Update specialist groups if provided
        if (data.specialistsGroups !== undefined) {
            const groupsChanges = await updateProductGroups(client, data.productId, data.specialistsGroups, requestorUuid);
            
            // Publish event only if there are actual changes
            if (groupsChanges) {
                await createAndPublishEvent({
                    eventName: PRODUCT_UPDATE_EVENTS.GROUPS_UPDATED.eventName,
                    req: req,
                    payload: {
                        productId: data.productId,
                        productCode: productCode,
                        added: groupsChanges.added,
                        removed: groupsChanges.removed,
                        all: groupsChanges.all
                    }
                });
            }
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
            req: req,
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
