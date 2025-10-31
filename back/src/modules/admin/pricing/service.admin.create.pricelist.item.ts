/**
 * version: 1.0.0
 * Service for creating price list items.
 * Backend file that handles business logic for creating price list items.
 * 
 * Functionality:
 * - Validates input data
 * - Checks if price list exists
 * - Validates item type exists and is active
 * - Checks item code uniqueness within price list
 * - Creates price list item in database
 * - Publishes events for tracking
 * 
 * File: service.admin.create.pricelist.item.ts (backend)
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '@/core/db/maindb';
import { queries } from './queries.admin.pricing';
import type { 
    CreatePriceListItemRequest,
    CreatePriceListItemResponse,
    PriceListItemDto
} from './types.admin.pricing';
import { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { EVENTS_ADMIN_PRICING } from './events.admin.pricing';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Creates a new price list item
 * @param priceListId - Price list ID
 * @param data - Item data
 * @param req - Express request object
 * @returns Promise with creation result
 */
export async function createPriceListItem(
    priceListId: number,
    data: CreatePriceListItemRequest,
    req: Request,
    userUuid: string | null
): Promise<CreatePriceListItemResponse> {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Validate price list ID
        if (!priceListId || isNaN(priceListId) || priceListId < 1) {
            createAndPublishEvent({
                eventName: EVENTS_ADMIN_PRICING['pricelist.items.create.validation.error'].eventName,
                req: req,
                payload: { 
                    priceListId, 
                    error: 'Invalid price list ID' 
                }
            });
            return {
                success: false,
                message: 'Invalid price list ID'
            };
        }

        // Validate required fields exist
        if (!data.item_type || !data.item_code || !data.item_name || data.list_price === undefined) {
            createAndPublishEvent({
                eventName: EVENTS_ADMIN_PRICING['pricelist.items.create.validation.error'].eventName,
                req: req,
                payload: { 
                    priceListId, 
                    error: 'Missing required fields' 
                }
            });
            return {
                success: false,
                message: 'Missing required fields: item_type, item_code, item_name, list_price'
            };
        }

        // Validate field types and formats
        if (typeof data.item_type !== 'string' || data.item_type.trim() === '') {
            createAndPublishEvent({
                eventName: EVENTS_ADMIN_PRICING['pricelist.items.create.validation.error'].eventName,
                req: req,
                payload: { 
                    priceListId, 
                    error: 'Invalid item_type format' 
                }
            });
            return {
                success: false,
                message: 'Item type must be a non-empty string'
            };
        }

        if (typeof data.item_code !== 'string' || data.item_code.trim() === '') {
            createAndPublishEvent({
                eventName: EVENTS_ADMIN_PRICING['pricelist.items.create.validation.error'].eventName,
                req: req,
                payload: { 
                    priceListId, 
                    error: 'Invalid item_code format' 
                }
            });
            return {
                success: false,
                message: 'Item code must be a non-empty string'
            };
        }

        if (typeof data.item_name !== 'string' || data.item_name.trim() === '') {
            createAndPublishEvent({
                eventName: EVENTS_ADMIN_PRICING['pricelist.items.create.validation.error'].eventName,
                req: req,
                payload: { 
                    priceListId, 
                    error: 'Invalid item_name format' 
                }
            });
            return {
                success: false,
                message: 'Item name must be a non-empty string'
            };
        }

        if (typeof data.list_price !== 'number' || isNaN(data.list_price)) {
            createAndPublishEvent({
                eventName: EVENTS_ADMIN_PRICING['pricelist.items.create.validation.error'].eventName,
                req: req,
                payload: { 
                    priceListId, 
                    error: 'Invalid list_price format' 
                }
            });
            return {
                success: false,
                message: 'List price must be a valid number'
            };
        }

        if (data.wholesale_price !== undefined && data.wholesale_price !== null && 
            (typeof data.wholesale_price !== 'number' || isNaN(data.wholesale_price))) {
            createAndPublishEvent({
                eventName: EVENTS_ADMIN_PRICING['pricelist.items.create.validation.error'].eventName,
                req: req,
                payload: { 
                    priceListId, 
                    error: 'Invalid wholesale_price format' 
                }
            });
            return {
                success: false,
                message: 'Wholesale price must be a valid number or null'
            };
        }

        // Validate price values
        if (data.list_price < 0 || (data.wholesale_price !== null && data.wholesale_price !== undefined && data.wholesale_price < 0)) {
            createAndPublishEvent({
                eventName: EVENTS_ADMIN_PRICING['pricelist.items.create.validation.error'].eventName,
                req: req,
                payload: { 
                    priceListId, 
                    error: 'Invalid price values' 
                }
            });
            return {
                success: false,
                message: 'Prices cannot be negative'
            };
        }

        // Check if price list exists
        const priceListExists = await client.query(queries.existsPriceList, [priceListId]);
        if (priceListExists.rowCount === 0) {
            createAndPublishEvent({
                eventName: EVENTS_ADMIN_PRICING['pricelist.items.create.not_found'].eventName,
                req: req,
                payload: { 
                    priceListId
                }
            });
            return {
                success: false,
                message: 'Price list not found'
            };
        }

        // Check if item type exists and is active
        const itemTypeExists = await client.query(queries.existsPriceItemType, [data.item_type]);
        if (itemTypeExists.rowCount === 0) {
            createAndPublishEvent({
                eventName: EVENTS_ADMIN_PRICING['pricelist.items.create.type.not_found'].eventName,
                req: req,
                payload: { 
                    priceListId, 
                    itemType: data.item_type 
                }
            });
            return {
                success: false,
                message: 'Invalid item type'
            };
        }

        // Check if item code already exists in this price list
        const codeExists = await client.query(queries.checkPriceListItemCodeExists, [priceListId, data.item_code]);
        if (codeExists.rowCount && codeExists.rowCount > 0) {
            createAndPublishEvent({
                eventName: EVENTS_ADMIN_PRICING['pricelist.items.create.code.duplicate'].eventName,
                req: req,
                payload: { 
                    priceListId, 
                    itemCode: data.item_code 
                }
            });
            return {
                success: false,
                message: 'Item code already exists in this price list'
            };
        }

        // Get user ID from request (assuming it's set by auth middleware)
        const userId = (req as any).user?.userId || null;

        // Create price list item
        const result = await client.query(queries.insertPriceListItem, [
            priceListId,
            data.item_type,
            data.item_code,
            data.item_name,
            data.list_price,
            data.wholesale_price || null,
            userId
        ]);

        if (result.rows.length === 0) {
            throw new Error('Failed to create price list item');
        }

        const itemId = result.rows[0].item_id;

        // Fetch the created item for response
        const fetchResult = await client.query(`
            SELECT 
                item_id,
                price_list_id,
                item_type,
                item_code,
                item_name,
                list_price,
                wholesale_price,
                created_by,
                updated_by,
                created_at,
                updated_at
            FROM app.price_lists
            WHERE item_id = $1
        `, [itemId]);

        if (fetchResult.rows.length === 0) {
            throw new Error('Failed to fetch created price list item');
        }

        const createdItem: PriceListItemDto = fetchResult.rows[0];

        // Fetch price list info for event payload
        const priceListResult = await client.query(queries.fetchPriceListBasicInfo, [priceListId]);

        const priceListInfo = priceListResult.rows.length > 0 ? {
            priceListId: priceListResult.rows[0].price_list_id,
            name: priceListResult.rows[0].name,
            currencyCode: priceListResult.rows[0].currency_code
        } : null;

        await client.query('COMMIT');

        // Publish success event with informative payload
        createAndPublishEvent({
            eventName: EVENTS_ADMIN_PRICING['pricelist.items.create.success'].eventName,
            req: req,
            payload: {
                item: {
                    itemId: createdItem.item_id,
                    itemType: createdItem.item_type,
                    itemCode: createdItem.item_code,
                    itemName: createdItem.item_name,
                    listPrice: createdItem.list_price,
                    wholesalePrice: createdItem.wholesale_price
                },
                priceList: priceListInfo
            }
        });

        return {
            success: true,
            message: 'Price list item created successfully',
            data: {
                item: createdItem
            }
        };

    } catch (error) {
        await client.query('ROLLBACK');
        
        // Publish error event
        createAndPublishEvent({
            eventName: EVENTS_ADMIN_PRICING['pricelist.items.create.database_error'].eventName,
            req: req,
            payload: {
                priceListId,
                error: error instanceof Error ? error.message : String(error)
            },
            errorData: error instanceof Error ? error.message : String(error)
        });

        return {
            success: false,
            message: 'Failed to create price list item'
        };
    } finally {
        client.release();
    }
}
