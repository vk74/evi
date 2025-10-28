/**
 * version: 1.1.0
 * Service for deleting price lists.
 * Backend file that handles business logic for deleting price lists.
 * 
 * Functionality:
 * - Validates price list IDs
 * - Deletes price lists from database
 * - Automatically deletes associated partitions via trigger
 * - Handles partial failures (some deleted, some failed)
 * - Returns deletion statistics
 * - Publishes events for partition deletion tracking
 * 
 * File: service.admin.pricing.delete.pricelists.ts (backend)
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '@/core/db/maindb';
import { queries } from './queries.admin.pricing';
import type { 
    DeletePriceListsRequest,
    DeletePriceListsResponse
} from './types.admin.pricing';
import { getRequestorUuidFromReq } from '@/core/helpers/get.requestor.uuid.from.req';
import { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { EVENTS_ADMIN_PRICING } from './events.admin.pricing';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Deletes multiple price lists
 * @param data - Request data with price list IDs
 * @param req - Express request object
 * @returns Promise with deletion result
 */
export async function deletePriceLists(
    data: DeletePriceListsRequest,
    req: Request
): Promise<DeletePriceListsResponse> {
    try {
        // Get requestor UUID
        const requestorUuid = getRequestorUuidFromReq(req);
        if (!requestorUuid) {
            return {
                success: false,
                message: 'Unauthorized: Unable to identify requestor'
            };
        }

        // Validate input
        if (!data.priceListIds || !Array.isArray(data.priceListIds) || data.priceListIds.length === 0) {
            createAndPublishEvent({
                eventName: EVENTS_ADMIN_PRICING['pricelists.delete.validation.error'].eventName,
                payload: {
                    error: 'Price list IDs array is required and must not be empty',
                    requestor: requestorUuid
                }
            });

            return {
                success: false,
                message: 'Price list IDs array is required and must not be empty'
            };
        }

        let totalDeleted = 0;
        let totalErrors = 0;
        const errors: string[] = [];

        // Delete each price list
        for (const priceListId of data.priceListIds) {
            try {
                // Validate ID
                if (!priceListId || isNaN(priceListId) || priceListId < 1) {
                    errors.push(`Invalid price list ID: ${priceListId}`);
                    totalErrors++;
                    continue;
                }

                // Check if price list exists
                const checkResult = await pool.query(queries.fetchPriceListById, [priceListId]);
                if (checkResult.rows.length === 0) {
                    createAndPublishEvent({
                        eventName: EVENTS_ADMIN_PRICING['pricelists.delete.not_found'].eventName,
                        payload: { 
                            priceListId,
                            requestor: requestorUuid
                        }
                    });
                    
                    errors.push(`Price list ${priceListId} not found`);
                    totalErrors++;
                    continue;
                }

                // Delete price list (this will trigger partition deletion via database trigger)
                const deleteResult = await pool.query(queries.deletePriceList, [priceListId]);
                
                if (deleteResult.rowCount && deleteResult.rowCount > 0) {
                    totalDeleted++;
                    
                    // Publish success event for price list deletion
                    createAndPublishEvent({
                        eventName: EVENTS_ADMIN_PRICING['pricelists.delete.success'].eventName,
                        payload: {
                            priceListId,
                            name: checkResult.rows[0].name,
                            requestor: requestorUuid
                        }
                    });

                    // Publish success event for partition deletion (triggered automatically)
                    createAndPublishEvent({
                        eventName: EVENTS_ADMIN_PRICING['pricelists.delete.partition.success'].eventName,
                        payload: {
                            priceListId,
                            partitionName: `price_lists_${priceListId}`,
                            requestor: requestorUuid
                        }
                    });
                } else {
                    errors.push(`Failed to delete price list ${priceListId}`);
                    totalErrors++;
                }

            } catch (error) {
                // Publish error event for price list deletion
                createAndPublishEvent({
                    eventName: EVENTS_ADMIN_PRICING['pricelists.delete.database_error'].eventName,
                    payload: {
                        priceListId,
                        error: error instanceof Error ? error.message : String(error),
                        requestor: requestorUuid
                    },
                    errorData: error instanceof Error ? error.message : String(error)
                });

                // Publish error event for partition deletion
                createAndPublishEvent({
                    eventName: EVENTS_ADMIN_PRICING['pricelists.delete.partition.error'].eventName,
                    payload: {
                        priceListId,
                        partitionName: `price_lists_${priceListId}`,
                        error: error instanceof Error ? error.message : String(error),
                        requestor: requestorUuid
                    },
                    errorData: error instanceof Error ? error.message : String(error)
                });

                errors.push(`Error deleting price list ${priceListId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                totalErrors++;
            }
        }

        // Determine result message
        let message = '';
        if (totalDeleted === data.priceListIds.length) {
            message = `Successfully deleted ${totalDeleted} price list(s)`;
        } else if (totalDeleted > 0) {
            message = `Partially successful: ${totalDeleted} deleted, ${totalErrors} failed`;
        } else {
            message = `Failed to delete price lists: ${errors.join('; ')}`;
        }

        return {
            success: totalDeleted > 0,
            message,
            data: {
                totalDeleted,
                totalErrors
            }
        };

    } catch (error) {
        // Publish general error event
        createAndPublishEvent({
            eventName: EVENTS_ADMIN_PRICING['pricelists.delete.error'].eventName,
            payload: {
                error: error instanceof Error ? error.message : String(error)
            },
            errorData: error instanceof Error ? error.message : String(error)
        });

        return {
            success: false,
            message: 'Failed to delete price lists'
        };
    }
}

