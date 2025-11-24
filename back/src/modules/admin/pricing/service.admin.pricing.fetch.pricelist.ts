/**
 * version: 1.1.1
 * Service for fetching a single price list by ID.
 * Backend file that handles business logic for retrieving single price list data.
 * 
 * Functionality:
 * - Fetches single price list from database by ID
 * - Returns full price list data with rounding_precision from currency
 * - Handles not found cases
 * 
 * File: service.admin.pricing.fetch.pricelist.ts (backend)
 * 
 * Changes in v1.1.0:
 * - Added rounding_precision to response data from currency table
 * 
 * Changes in v1.1.1:
 * - Added region field to price list mapping
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '@/core/db/maindb';
import { queries } from './queries.admin.pricing';
import type { 
    FetchPriceListResponse,
    PriceListFullDto,
    PriceListItemDto
} from './types.admin.pricing';
import { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { EVENTS_ADMIN_PRICING } from './events.admin.pricing';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Fetches a single price list by ID
 * @param priceListId - Price list ID
 * @param req - Express request object
 * @returns Promise with fetch result
 */
export async function fetchPriceList(
    priceListId: number,
    req: Request
): Promise<FetchPriceListResponse> {
    try {
        // Validate price list ID
        if (!priceListId || isNaN(priceListId) || priceListId < 1) {
            return {
                success: false,
                message: 'Invalid price list ID'
            };
        }

        // Fetch price list
        const result = await pool.query(queries.fetchPriceListById, [priceListId]);

        if (result.rows.length === 0) {
            // Publish not found event
            createAndPublishEvent({
                eventName: EVENTS_ADMIN_PRICING['pricelists.fetch.not_found'].eventName,
                req: req,
                payload: { priceListId }
            });

            return {
                success: false,
                message: 'Price list not found'
            };
        }

        const row = result.rows[0];
        const priceList: PriceListFullDto = {
            price_list_id: row.price_list_id,
            name: row.name,
            description: row.description,
            currency_code: row.currency_code,
            is_active: row.is_active,
            owner_id: row.owner_id,
            region: row.region,
            created_by: row.created_by,
            updated_by: row.updated_by,
            created_at: row.created_at,
            updated_at: row.updated_at
        };
        const roundingPrecision = row.rounding_precision !== null && row.rounding_precision !== undefined 
            ? Number(row.rounding_precision) 
            : null;

        // Fetch price list items
        const itemsResult = await pool.query(queries.fetchPriceListItems, [priceListId]);
        const items: PriceListItemDto[] = itemsResult.rows;

        // Publish success event
        createAndPublishEvent({
            eventName: EVENTS_ADMIN_PRICING['pricelists.fetch.success'].eventName,
            req: req,
            payload: {
                priceListId,
                name: priceList.name,
                itemsCount: items.length
            }
        });

        return {
            success: true,
            data: {
                priceList,
                items,
                rounding_precision: roundingPrecision
            }
        };

    } catch (error) {
        // Publish error event
        createAndPublishEvent({
            eventName: EVENTS_ADMIN_PRICING['pricelists.fetch.database_error'].eventName,
            req: req,
            payload: {
                priceListId,
                error: error instanceof Error ? error.message : String(error)
            },
            errorData: error instanceof Error ? error.message : String(error)
        });

        return {
            success: false,
            message: 'Failed to fetch price list'
        };
    }
}

