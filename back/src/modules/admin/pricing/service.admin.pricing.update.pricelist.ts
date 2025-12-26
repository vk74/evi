/**
 * version: 1.3.0
 * Service for updating price lists.
 * Backend file that handles business logic for updating existing price lists.
 * 
 * Functionality:
 * - Validates price list update data
 * - Checks price list existence
 * - Checks currency existence and active status (if being updated)
 * - Checks name uniqueness (if being updated)
 * - Validates owner (if being updated)
 * - Validates region existence in app.regions table (if being updated)
 * - Validates region uniqueness (if being updated)
 * - Updates price list in database
 * 
 * File: service.admin.pricing.update.pricelist.ts (backend)
 * 
 * Changes in v1.2.2:
 * - Removed event publishing for inactive currency attempts
 * 
 * Changes in v1.2.3:
 * - Added region uniqueness validation
 * - Added region parameter to UPDATE query
 * 
 * Changes in v1.2.4:
 * - Added validation to check if region exists in app.regions table before updating
 * 
 * Changes in v1.3.0:
 * - Updated to use region_id instead of region (VARCHAR)
 * - Converts region_name to region_id before updating
 * - Uses region_id for uniqueness checks
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
    req: Request,
    oldPriceListRef: { value: PriceListFullDto | null }
): Promise<string[]> {
    const errors: string[] = [];

    // Validate price list ID
    if (!data.price_list_id || isNaN(data.price_list_id) || data.price_list_id < 1) {
        errors.push('Invalid price list ID');
        return errors;
    }

    // Check if price list exists
    let oldPriceList: PriceListFullDto | null = null
    try {
        const checkResult = await pool.query(queries.fetchPriceListById, [data.price_list_id]);
        if (checkResult.rows.length === 0) {
            errors.push('Price list not found');
            
            createAndPublishEvent({
                eventName: EVENTS_ADMIN_PRICING['pricelists.update.not_found'].eventName,
                req: req,
                payload: { priceListId: data.price_list_id }
            });
            
            return errors;
        }
        oldPriceList = checkResult.rows[0]
        oldPriceListRef.value = oldPriceList
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
                        req: req,
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

    // Validate currency code (if provided, must exist and be active)
    if (data.currency_code !== undefined) {
        if (data.currency_code.trim().length !== 3) {
            errors.push('Currency code must be 3 characters');
        } else {
            // Check currency existence and active status
            try {
                const result = await pool.query(queries.existsActiveCurrency, [data.currency_code]);
                if (result.rows.length === 0) {
                    // Check if currency exists but is not active
                    const existsResult = await pool.query(queries.existsCurrency, [data.currency_code]);
                    if (existsResult.rows.length > 0) {
                        errors.push('Currency is not active');
                    } else {
                        errors.push('Currency does not exist');
                        
                        createAndPublishEvent({
                            eventName: EVENTS_ADMIN_PRICING['pricelists.update.currency.not_found'].eventName,
                            req: req,
                            payload: { currency_code: data.currency_code }
                        });
                    }
                }
            } catch (error) {
                errors.push('Error checking currency existence');
            }
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

    // Validate region (if provided)
    if (data.region !== undefined && data.region !== null && data.region !== '') {
        const trimmedRegion = data.region.trim();
        
        // First, check if region exists in app.regions table
        try {
            const regionExistsResult = await pool.query(
                queries.checkRegionExistsInRegionsTable,
                [trimmedRegion]
            );
            if (regionExistsResult.rows.length === 0) {
                errors.push('Region does not exist in regions table');
                
                createAndPublishEvent({
                    eventName: EVENTS_ADMIN_PRICING['pricelists.update.region.not_found'].eventName,
                    req: req,
                    payload: { 
                        priceListId: data.price_list_id,
                        region: trimmedRegion
                    }
                });
            } else {
                // Region exists, get region_id and check uniqueness (one region per price list)
                const regionId = regionExistsResult.rows[0].region_id;
                try {
                    const result = await pool.query(
                        queries.checkPriceListRegionExistsExcluding,
                        [regionId, data.price_list_id]
                    );
                    if (result.rows.length > 0) {
                        errors.push('This region is already assigned to another price list');
                        
                        createAndPublishEvent({
                            eventName: EVENTS_ADMIN_PRICING['pricelists.update.region.duplicate'].eventName,
                            req: req,
                            payload: { 
                                priceListId: data.price_list_id,
                                region: trimmedRegion
                            }
                        });
                    }
                } catch (error) {
                    errors.push('Error checking region uniqueness');
                }
            }
        } catch (error) {
            errors.push('Error checking region existence');
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

        // Get old price list data for comparison
        const oldPriceListRef = { value: null as PriceListFullDto | null }
        
        // Validate data (will also fetch old price list)
        const validationErrors = await validateUpdatePriceListData(data, req, oldPriceListRef);
        if (validationErrors.length > 0) {
            createAndPublishEvent({
                eventName: EVENTS_ADMIN_PRICING['pricelists.update.validation.error'].eventName,
                req: req,
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

        // Update price list - build parameters array conditionally
        const updateParams: any[] = [
            data.price_list_id, // $1
            data.name?.trim() || null, // $2
            data.description !== undefined ? (data.description?.trim() || null) : null, // $3
            data.currency_code?.trim() || null, // $4
        ];

        // Add is_active parameter only if is_active is being updated
        if (data.is_active !== undefined) {
            updateParams.push(data.is_active); // $5
        } else {
            updateParams.push(null); // $5 - null means don't update this field
        }

        // Add owner_id parameter only if owner is being updated
        if (data.owner !== undefined) {
            let ownerUuid: string | null = null;
            if (data.owner !== '' && data.owner !== null) {
                ownerUuid = await getUuidByUsername(data.owner);
            }
            updateParams.push(ownerUuid); // $6
        } else {
            updateParams.push(null); // $6 - null means don't update this field
        }

        // Add region parameter only if region is being updated
        // We need to distinguish between "set to null" and "don't update"
        if (data.region !== undefined) {
            // Region is being updated - convert region_name to region_id
            let regionId: number | null = null;
            if (data.region !== null && data.region !== '') {
                const regionCheckResult = await pool.query(
                    queries.checkRegionExistsInRegionsTable,
                    [data.region.trim()]
                );
                if (regionCheckResult.rows.length > 0) {
                    regionId = regionCheckResult.rows[0].region_id;
                }
            }
            updateParams.push(regionId); // $7 - region_id (can be null to clear)
        } else {
            // Don't update region - use special value -1 to indicate no update
            updateParams.push(-1); // $7 - special value means don't update
        }

        updateParams.push(requestorUuid); // $8

        // Execute update
        await pool.query(queries.updatePriceList, updateParams);

        // Fetch updated price list
        const fetchResult = await pool.query(queries.fetchPriceListById, [data.price_list_id]);
        const priceList: PriceListFullDto = fetchResult.rows[0];

        // Build changes map with old and new values
        const changes: Record<string, { old: any, new: any }> = {}
        const oldPriceList = oldPriceListRef.value
        if (oldPriceList) {
          if (data.name !== undefined && data.name !== oldPriceList.name) {
            changes.name = { old: oldPriceList.name, new: priceList.name }
          }
          if (data.description !== undefined && data.description !== oldPriceList.description) {
            changes.description = { old: oldPriceList.description, new: priceList.description }
          }
          if (data.currency_code !== undefined && data.currency_code !== oldPriceList.currency_code) {
            changes.currencyCode = { old: oldPriceList.currency_code, new: priceList.currency_code }
          }
          if (data.is_active !== undefined && data.is_active !== oldPriceList.is_active) {
            changes.isActive = { old: oldPriceList.is_active, new: priceList.is_active }
          }
          if (data.owner !== undefined) {
            const newOwnerId = data.owner ? (await getUuidByUsername(data.owner)) : null
            if (newOwnerId !== oldPriceList.owner_id) {
              changes.ownerId = { old: oldPriceList.owner_id, new: newOwnerId }
            }
          }
          if (data.region !== undefined) {
            const newRegion = data.region !== null && data.region !== '' ? data.region.trim() : null
            if (newRegion !== oldPriceList.region) {
              changes.region = { old: oldPriceList.region, new: priceList.region }
            }
          }
        }

        // Publish success event with informative payload
        createAndPublishEvent({
            eventName: EVENTS_ADMIN_PRICING['pricelists.update.success'].eventName,
            req: req,
            payload: {
                priceList: {
                    priceListId: priceList.price_list_id,
                    name: priceList.name,
                    description: priceList.description,
                    currencyCode: priceList.currency_code,
                    isActive: priceList.is_active,
                    ownerId: priceList.owner_id
                },
                changes: Object.keys(changes).length > 0 ? changes : undefined
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
            req: req,
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

