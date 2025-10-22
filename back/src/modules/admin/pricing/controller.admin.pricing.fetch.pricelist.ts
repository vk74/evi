/**
 * version: 1.0.0
 * Controller for fetching a single price list by ID.
 * Backend file that handles HTTP GET requests for single price list.
 * 
 * Handles HTTP GET requests to the /api/admin/pricing/pricelists/fetch endpoint.
 * Validates JWT (handled by middleware), processes fetching through the service,
 * and sends the response. Uses event bus to track operations.
 * 
 * File: controller.admin.pricing.fetch.pricelist.ts (backend)
 */

import { Request, Response } from 'express';
import { fetchPriceList } from './service.admin.pricing.fetch.pricelist';
import { connectionHandler } from '@/core/helpers/connection.handler';

/**
 * Business logic for fetching a single price list
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function fetchPriceListLogic(req: Request, res: Response): Promise<any> {
    // JWT validation is already performed by route guards
    // If request reaches controller, JWT is valid

    // Extract price list ID from query parameters
    const priceListId = parseInt(req.query.id as string);

    if (!priceListId || isNaN(priceListId)) {
        return {
            success: false,
            message: 'Price list ID is required and must be a valid number'
        };
    }

    // Fetch price list
    const result = await fetchPriceList(priceListId, req);

    return result;
}

// Export controller using universal connection handler
export default connectionHandler(fetchPriceListLogic, 'FetchPriceListController');