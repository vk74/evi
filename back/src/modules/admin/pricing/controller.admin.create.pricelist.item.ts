/**
 * version: 1.0.0
 * Controller for creating price list items.
 * Backend file that handles HTTP POST requests for creating price list items.
 * 
 * Handles HTTP POST requests to the /api/admin/pricing/pricelists/{priceListId}/createItem endpoint.
 * Validates JWT (handled by middleware), processes creation through the service,
 * and sends the response. Uses event bus to track operations.
 * 
 * File: controller.admin.create.pricelist.item.ts (backend)
 */

import { Request, Response } from 'express';
import { createPriceListItem } from './service.admin.create.pricelist.item';
import { connectionHandler } from '@/core/helpers/connection.handler';
import { getRequestorUuidFromReq } from '@/core/helpers/get.requestor.uuid.from.req';
import type { CreatePriceListItemRequest } from './types.admin.pricing';

/**
 * Business logic for creating a price list item
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function createPriceListItemLogic(req: Request, res: Response): Promise<any> {
    // JWT validation is already performed by route guards
    // If request reaches controller, JWT is valid

    // Extract price list ID from URL parameters
    const priceListId = parseInt(req.params.priceListId as string);

    // Extract request body
    const body = req.body as CreatePriceListItemRequest;
    const userUuid = getRequestorUuidFromReq(req);

    // Basic HTTP request validation only
    if (!body || typeof body !== 'object') {
        return {
            success: false,
            message: 'Invalid request body format'
        };
    }

    // Create price list item
    const result = await createPriceListItem(priceListId, body, req, userUuid);

    return result;
}

// Export controller using universal connection handler
export default connectionHandler(createPriceListItemLogic, 'CreatePriceListItemController');
