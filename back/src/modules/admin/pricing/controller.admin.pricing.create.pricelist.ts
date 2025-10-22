/**
 * version: 1.0.0
 * Controller for creating a new price list.
 * Backend file that handles HTTP POST requests for price list creation.
 * 
 * Handles HTTP POST requests to the /api/admin/pricing/pricelists/create endpoint.
 * Validates JWT (handled by middleware), processes creation through the service,
 * and sends the response. Uses event bus to track operations.
 * 
 * File: controller.admin.pricing.create.pricelist.ts (backend)
 */

import { Request, Response } from 'express';
import { createPriceList } from './service.admin.pricing.create.pricelist';
import { connectionHandler } from '@/core/helpers/connection.handler';
import type { CreatePriceListRequest } from './types.admin.pricing';

/**
 * Business logic for creating a price list
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function createPriceListLogic(req: Request, res: Response): Promise<any> {
    // JWT validation is already performed by route guards
    // If request reaches controller, JWT is valid

    // Extract price list data from request body
    const priceListData: CreatePriceListRequest = req.body;

    // Create price list
    const result = await createPriceList(priceListData, req);

    return result;
}

// Export controller using universal connection handler
export default connectionHandler(createPriceListLogic, 'CreatePriceListController');