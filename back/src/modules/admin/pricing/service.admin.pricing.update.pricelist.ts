/**
 * version: 1.0.1
 * Service for updating price lists.
 * Backend file that handles business logic for updating existing price lists.
 * 
 * Functionality:
 * - Validates price list update data
 * - Checks price list existence
 * - Checks currency existence (if being updated)
 * - Checks name uniqueness (if being updated)
 * - Validates dates (not in past, valid_to > valid_from) only if dates are being updated
 * - Validates owner (if being updated)
 * - Updates price list in database
 * 
 * File: service.admin.pricing.update.pricelist.ts (backend)
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '@/core/db/maindb';
import { queries } from './queries.admin.pricing';
import type { 
    UpdatePriceListRequest,
    UpdatePriceListResponse,
    PriceListFullDto
} from './types.admin.pricing';
import { getRequestorUuidFromReq } from '@/core/helpers/get.requestor.uuid.from.req';
import { getUuidByUsername } from '@/core/helpers/get.uuid.by.username';
import { validateField } from '@/core/validation/service.validation';
import { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { EVENTS_ADMIN_PRICING } from './events.admin.pricing';
import { validatePriceListDatesForUpdate } from './helper.date.validation';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Validates price list update data
 * @param data - Price list update data
 * @param req - Express request object
 * @returns Array of validation errors
 */
async function validateUpdatePriceListData(
    data: UpdatePriceListRequest,
    req: Request
): Promise<string[]> {
    const errors: string[] = [];

    // Validate price list ID
    if (!data.price_list_id || isNaN(data.price_list_id) || data.price_list_id < 1) {
        errors.push('Invalid price list ID');
        return errors;
    }

    // Check if price list exists
    try {
        const checkResult = await pool.query(queries.fetchPriceListById, [data.price_list_id]);
        if (checkResult.rows.length === 0) {
            errors.push('Price list not found');
            
            createAndPublishEvent({
                eventName: EVENTS_ADMIN_PRICING['pricelists.update.not_found'].eventName,
                payload: { priceListId: data.price_list_id }
            });
            
            return errors;
        }
    } catch (error) {
        errors.push('Error checking price list existence');
        return errors;
    }

    // Validate name (if provided)
    if (data.name !== undefined) {
        if (data.name.trim().length < 2) {
            errors.push('Price list name must be at least 2 characters');
        } else {
            // Check name uniqueness (excluding current price list)
            try {
                const result = await pool.query(
                    queries.checkPriceListNameExistsExcluding,
                    [data.name.trim(), data.price_list_id]
                );
                if (result.rows.length > 0) {
                    errors.push('Price list with this name already exists');
                    
                    createAndPublishEvent({
                        eventName: EVENTS_ADMIN_PRICING['pricelists.update.name.duplicate'].eventName,
                        payload: { 
                            priceListId: data.price_list_id,
                            name: data.name 
                        }
                    });
                }
            } catch (error) {
                errors.push('Error checking price list name uniqueness');
            }
        }
    }

    // Validate description (if provided)
    if (data.description !== undefined && data.description !== null && data.description.length > 2000) {
        errors.push('Description must not exceed 2000 characters');
    }

    // Validate currency code (if provided)
    if (data.currency_code !== undefined) {
        if (data.currency_code.trim().length !== 3) {
            errors.push('Currency code must be 3 characters');
        } else {
            // Check currency existence
            try {
                const result = await pool.query(queries.existsCurrency, [data.currency_code]);
                if (result.rows.length === 0) {
                    errors.push('Currency does not exist');
                    
                    createAndPublishEvent({
                        eventName: EVENTS_ADMIN_PRICING['pricelists.update.currency.not_found'].eventName,
                        payload: { currency_code: data.currency_code }
                    });
                }
            } catch (error) {
                errors.push('Error checking currency existence');
            }
        }
    }

    // Validate dates (only if being updated)
    if (data.valid_from !== undefined || data.valid_to !== undefined) {
        // Need to get current values for cross-validation
        const currentResult = await pool.query(queries.fetchPriceListById, [data.price_list_id]);
        const currentData = currentResult.rows[0];
        
        const dateValidation = await validatePriceListDatesForUpdate(
            data.valid_from,
            data.valid_to,
            currentData.valid_from,
            currentData.valid_to
        );
        
        if (!dateValidation.isValid) {
            errors.push(dateValidation.error || 'Invalid dates');
        }
    }

    // Validate owner (if provided)
    if (data.owner !== undefined && data.owner !== '' && data.owner !== null) {
        const ownerResult = await validateField({ 
            value: data.owner, 
            fieldType: 'userName' 
        }, req);
        
        if (!ownerResult.isValid && ownerResult.error) {
            errors.push(`Owner: ${ownerResult.error}`);
            
            createAndPublishEvent({
                eventName: EVENTS_ADMIN_PRICING['pricelists.update.owner.validation_error'].eventName,
                payload: { 
                    owner: data.owner,
                    error: ownerResult.error
                }
            });
        } else {
            // Check if user exists
            try {
                const ownerUuid = await getUuidByUsername(data.owner);
                if (!ownerUuid) {
                    errors.push('Owner user does not exist');
                }
            } catch (error) {
                errors.push('Invalid owner username');
            }
        }
    }

    return errors;
}

/**
 * Updates an existing price list
 * @param data - Price list update data
 * @param req - Express request object
 * @returns Promise with update result
 */
export async function updatePriceList(
    data: UpdatePriceListRequest,
    req: Request
): Promise<UpdatePriceListResponse> {
    try {
        // Get requestor UUID
        const requestorUuid = getRequestorUuidFromReq(req);
        if (!requestorUuid) {
            return {
                success: false,
                message: 'Unauthorized: Unable to identify requestor'
            };
        }

        // Validate data
        const validationErrors = await validateUpdatePriceListData(data, req);
        if (validationErrors.length > 0) {
            createAndPublishEvent({
                eventName: EVENTS_ADMIN_PRICING['pricelists.update.validation.error'].eventName,
                payload: {
                    errors: validationErrors,
                    priceListId: data.price_list_id
                }
            });

            return {
                success: false,
                message: validationErrors.join('; ')
            };
        }

        // Determine owner_id (if being updated)
        let ownerUuid: string | null | undefined = undefined;
        if (data.owner !== undefined) {
            if (data.owner === '' || data.owner === null) {
                ownerUuid = null;
            } else {
                ownerUuid = await getUuidByUsername(data.owner);
            }
        }

        // Update price list
        await pool.query(queries.updatePriceList, [
            data.price_list_id,
            data.name?.trim(),
            data.description !== undefined ? (data.description?.trim() || null) : undefined,
            data.currency_code?.trim(),
            data.is_active,
            data.valid_from,
            data.valid_to,
            data.auto_deactivate,
            ownerUuid,
            requestorUuid
        ]);

        // Fetch updated price list
        const fetchResult = await pool.query(queries.fetchPriceListById, [data.price_list_id]);
        const priceList: PriceListFullDto = fetchResult.rows[0];

        // Publish success event
        createAndPublishEvent({
            eventName: EVENTS_ADMIN_PRICING['pricelists.update.success'].eventName,
            payload: {
                priceListId: data.price_list_id,
                name: priceList.name,
                updated_by: requestorUuid
            }
        });

        return {
            success: true,
            message: 'Price list updated successfully',
            data: {
                priceList
            }
        };

    } catch (error) {
        // Publish error event
        createAndPublishEvent({
            eventName: EVENTS_ADMIN_PRICING['pricelists.update.database_error'].eventName,
            payload: {
                priceListId: data.price_list_id,
                error: error instanceof Error ? error.message : String(error)
            },
            errorData: error instanceof Error ? error.message : String(error)
        });

        return {
            success: false,
            message: 'Failed to update price list'
        };
    }
}

