/**
 * version: 1.0.0
 * Controller for fetching price item types.
 * Backend file that handles HTTP GET requests for price item types.
 * 
 * Handles HTTP GET requests to the /api/admin/pricing/item-types endpoint.
 * Validates JWT (handled by middleware), processes fetching through the service,
 * and sends the response. Uses event bus to track operations.
 * 
 * File: controller.admin.fetch.price.item.types.ts (backend)
 */

import { Request, Response } from 'express';
import { fetchPriceItemTypes } from './service.admin.fetch.price.item.types';
import { connectionHandler } from '@/core/helpers/connection.handler';

/**
 * Business logic for fetching price item types
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function fetchPriceItemTypesLogic(req: Request, res: Response): Promise<any> {
    // JWT validation is already performed by route guards
    // If request reaches controller, JWT is valid

    // Fetch price item types
    const result = await fetchPriceItemTypes(req);

    return result;
}

// Export controller using universal connection handler
export default connectionHandler(fetchPriceItemTypesLogic, 'FetchPriceItemTypesController');
