/**
 * version: 1.0.0
 * Service for fetching price item types.
 * Backend file that handles business logic for retrieving price item types.
 * 
 * Functionality:
 * - Fetches active price item types from database
 * - Returns formatted type data
 * - Handles errors during fetching
 * 
 * File: service.admin.fetch.price.item.types.ts (backend)
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '@/core/db/maindb';
import { queries } from './queries.admin.pricing';
import type { 
    FetchPriceItemTypesResponse,
    PriceItemTypeDto
} from './types.admin.pricing';
import { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { EVENTS_ADMIN_PRICING } from './events.admin.pricing';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Fetches active price item types
 * @param req - Express request object
 * @returns Promise with fetch result
 */
export async function fetchPriceItemTypes(
    req: Request
): Promise<FetchPriceItemTypesResponse> {
    try {
        // Fetch price item types
        const result = await pool.query(queries.fetchPriceItemTypes);

        const types: PriceItemTypeDto[] = result.rows;

        // Publish success event
        createAndPublishEvent({
            eventName: EVENTS_ADMIN_PRICING['pricelist.item.types.fetch.success'].eventName,
            req: req,
            payload: {
                count: types.length
            }
        });

        return {
            success: true,
            data: {
                types
            }
        };

    } catch (error) {
        // Publish error event
        createAndPublishEvent({
            eventName: EVENTS_ADMIN_PRICING['pricelist.item.types.fetch.database_error'].eventName,
            req: req,
            payload: {
                error: error instanceof Error ? error.message : String(error)
            },
            errorData: error instanceof Error ? error.message : String(error)
        });

        return {
            success: false,
            message: 'Failed to fetch price item types'
        };
    }
}
