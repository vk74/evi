/**
 * version: 1.0.0
 * Controller for deleting price lists.
 * Backend file that handles HTTP POST requests for price lists deletion.
 * 
 * Handles HTTP POST requests to the /api/admin/pricing/pricelists/delete endpoint.
 * Validates JWT (handled by middleware), processes deletion through the service,
 * and sends the response. Uses event bus to track operations.
 * 
 * File: controller.admin.pricing.delete.pricelists.ts (backend)
 */

import { Request, Response } from 'express';
import { deletePriceLists } from './service.admin.pricing.delete.pricelists';
import { connectionHandler } from '@/core/helpers/connection.handler';
import type { DeletePriceListsRequest } from './types.admin.pricing';

/**
 * Business logic for deleting price lists
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function deletePriceListsLogic(req: Request, res: Response): Promise<any> {
    // JWT validation is already performed by route guards
    // If request reaches controller, JWT is valid

    // Extract price list IDs from request body
    const { priceListIds } = req.body as DeletePriceListsRequest;

    if (!priceListIds || !Array.isArray(priceListIds) || priceListIds.length === 0) {
        return {
            success: false,
            message: 'Price list IDs array is required and must not be empty',
            data: undefined
        };
    }

    // Delete price lists
    const result = await deletePriceLists({ priceListIds }, req);

    return result;
}

// Export controller using universal connection handler
export default connectionHandler(deletePriceListsLogic, 'DeletePriceListsController');