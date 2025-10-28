/**
 * version: 1.1.0
 * Service for creating price lists.
 * Backend file that handles business logic for creating new price lists.
 * 
 * Functionality:
 * - Validates price list data
 * - Checks currency existence
 * - Checks name uniqueness
 * - Validates owner (optional)
 * - Creates price list in database
 * - Sets owner_id from created_by if not specified
 * 
 * File: service.admin.pricing.create.pricelist.ts (backend)
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '@/core/db/maindb';
import { queries } from './queries.admin.pricing';
import type { 
    CreatePriceListRequest,
    CreatePriceListResponse,
    PriceListFullDto
} from './types.admin.pricing';
import { getRequestorUuidFromReq } from '@/core/helpers/get.requestor.uuid.from.req';
import { getUuidByUsername } from '@/core/helpers/get.uuid.by.username';
import { validateField } from '@/core/validation/service.validation';
import { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { EVENTS_ADMIN_PRICING } from './events.admin.pricing';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Validates price list creation data
 * @param data - Price list data
 * @param req - Express request object
 * @returns Array of validation errors
 */
async function validateCreatePriceListData(
    data: CreatePriceListRequest,
    req: Request
): Promise<string[]> {
    const errors: string[] = [];

    // Validate name (required, unique)
    if (!data.name || data.name.trim().length < 2) {
        errors.push('Price list name is required and must be at least 2 characters');
    } else {
        // Check name uniqueness
        try {
            const result = await pool.query(queries.checkPriceListNameExists, [data.name.trim()]);
            if (result.rows.length > 0) {
                errors.push('Price list with this name already exists');
                
                createAndPublishEvent({
                    eventName: EVENTS_ADMIN_PRICING['pricelists.create.name.duplicate'].eventName,
                    req: req,
                    payload: { name: data.name }
                });
            }
        } catch (error) {
            errors.push('Error checking price list name uniqueness');
        }
    }

    // Validate description (optional, max 2000 characters)
    if (data.description && data.description.length > 2000) {
        errors.push('Description must not exceed 2000 characters');
    }

    // Validate currency code (required, must exist)
    if (!data.currency_code || data.currency_code.trim().length !== 3) {
        errors.push('Currency code is required and must be 3 characters');
    } else {
        // Check currency existence
        try {
            const result = await pool.query(queries.existsCurrency, [data.currency_code]);
            if (result.rows.length === 0) {
                errors.push('Currency does not exist');
                
                createAndPublishEvent({
                    eventName: EVENTS_ADMIN_PRICING['pricelists.create.currency.not_found'].eventName,
                    req: req,
                    payload: { currency_code: data.currency_code }
                });
            }
        } catch (error) {
            errors.push('Error checking currency existence');
        }
    }

    // Validate owner (optional)
    if (data.owner !== undefined && data.owner !== '' && data.owner !== null) {
        const ownerResult = await validateField({ 
            value: data.owner, 
            fieldType: 'userName' 
        }, req);
        
        if (!ownerResult.isValid && ownerResult.error) {
            errors.push(`Owner: ${ownerResult.error}`);
            
            createAndPublishEvent({
                eventName: EVENTS_ADMIN_PRICING['pricelists.create.owner.validation_error'].eventName,
                req: req,
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
 * Creates a new price list
 * @param data - Price list data
 * @param req - Express request object
 * @returns Promise with creation result
 */
export async function createPriceList(
    data: CreatePriceListRequest,
    req: Request
): Promise<CreatePriceListResponse> {
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
        const validationErrors = await validateCreatePriceListData(data, req);
        if (validationErrors.length > 0) {
            createAndPublishEvent({
                eventName: EVENTS_ADMIN_PRICING['pricelists.create.validation.error'].eventName,
                req: req,
                payload: {
                    errors: validationErrors,
                    name: data.name
                }
            });

            return {
                success: false,
                message: validationErrors.join('; ')
            };
        }

        // Determine owner_id
        let ownerUuid: string | null = null;
        if (data.owner) {
            // If owner specified, get their UUID
            ownerUuid = await getUuidByUsername(data.owner);
        } else {
            // If no owner specified, use created_by (requestor)
            ownerUuid = requestorUuid;
        }

        // Insert price list
        const insertResult = await pool.query(queries.insertPriceList, [
            data.name.trim(),
            data.description?.trim() || null,
            data.currency_code.trim(),
            data.is_active !== undefined ? data.is_active : false,
            ownerUuid,
            requestorUuid
        ]);

        const newPriceListId = insertResult.rows[0].price_list_id;

        // Fetch created price list
        const fetchResult = await pool.query(queries.fetchPriceListById, [newPriceListId]);
        const priceList: PriceListFullDto = fetchResult.rows[0];

        // Publish success event
        createAndPublishEvent({
            eventName: EVENTS_ADMIN_PRICING['pricelists.create.success'].eventName,
            req: req,
            payload: {
                priceListId: newPriceListId,
                name: priceList.name,
                currency_code: priceList.currency_code,
                created_by: requestorUuid
            }
        });

        return {
            success: true,
            message: 'Price list created successfully',
            data: {
                priceList
            }
        };

    } catch (error) {
        // Publish error event
        createAndPublishEvent({
            eventName: EVENTS_ADMIN_PRICING['pricelists.create.database_error'].eventName,
            req: req,
            payload: {
                name: data.name,
                error: error instanceof Error ? error.message : String(error)
            },
            errorData: error instanceof Error ? error.message : String(error)
        });

        return {
            success: false,
            message: 'Failed to create price list'
        };
    }
}

