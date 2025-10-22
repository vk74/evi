/**
 * version: 1.1.0
 * Controller for fetching all price lists with pagination, search, sorting and filtering.
 * Backend file that handles HTTP GET requests for price lists list.
 * 
 * Handles HTTP GET requests to the /api/admin/pricing/pricelists/fetchall endpoint.
 * Validates JWT (handled by middleware), delegates all business logic to the service,
 * and sends the response.
 * 
 * File: controller.admin.pricing.fetch.pricelists.ts (backend)
 */

import { Request, Response } from 'express';
import { fetchAllPriceLists } from './service.admin.pricing.fetch.pricelists';
import { connectionHandler } from '@/core/helpers/connection.handler';

/**
 * Controller logic for fetching all price lists
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function fetchAllPriceListsLogic(req: Request, res: Response): Promise<any> {
    // JWT validation is already performed by route guards
    // Delegate all business logic to service
    const result = await fetchAllPriceLists(req);
    return result;
}

// Export controller using universal connection handler
export default connectionHandler(fetchAllPriceListsLogic, 'FetchAllPriceListsController');
