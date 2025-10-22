/**
 * version: 1.0.0
 * Controller for updating an existing price list.
 * Backend file that handles HTTP POST requests for price list update.
 * 
 * Handles HTTP POST requests to the /api/admin/pricing/pricelists/update endpoint.
 * Validates JWT (handled by middleware), processes update through the service,
 * and sends the response. Uses event bus to track operations.
 * 
 * File: controller.admin.pricing.update.pricelist.ts (backend)
 */

import { Request, Response } from 'express';
import { updatePriceList } from './service.admin.pricing.update.pricelist';
import { connectionHandler } from '@/core/helpers/connection.handler';
import type { UpdatePriceListRequest } from './types.admin.pricing';

/**
 * Business logic for updating a price list
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function updatePriceListLogic(req: Request, res: Response): Promise<any> {
    // JWT validation is already performed by route guards
    // If request reaches controller, JWT is valid

    // Extract price list data from request body
    const priceListData: UpdatePriceListRequest = req.body;

    // Update price list
    const result = await updatePriceList(priceListData, req);

    return result;
}

// Export controller using universal connection handler
export default connectionHandler(updatePriceListLogic, 'UpdatePriceListController');