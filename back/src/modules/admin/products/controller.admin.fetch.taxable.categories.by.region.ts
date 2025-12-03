/**
 * controller.admin.fetch.taxable.categories.by.region.ts - backend file
 * version: 1.1.0
 * 
 * Controller for fetching taxable categories by region.
 * 
 * Handles HTTP GET requests to the /api/admin/products/taxable-categories/by-region/:regionId endpoint.
 * Validates JWT (handled by middleware), processes categories fetching through the service,
 * and sends the response.
 * 
 * Backend file - controller.admin.fetch.taxable.categories.by.region.ts
 * 
 * Changes in v1.1.0:
 * - Removed business logic validation (moved to service)
 * - Controller now only extracts parameters and calls service
 */

import { Request, Response } from 'express';
import { serviceAdminFetchTaxableCategoriesByRegion } from './service.admin.fetch.taxable.categories.by.region';
import { connectionHandler } from '@/core/helpers/connection.handler';

/**
 * Controller logic for fetching taxable categories by region
 * Extracts parameters from request and delegates to service
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function fetchTaxableCategoriesByRegionLogic(req: Request, res: Response): Promise<any> {
    // JWT validation is already performed by route guards
    // If request reaches controller, JWT is valid

    // Extract region ID from route parameters
    const regionId = parseInt(req.params.regionId as string, 10);

    // Fetch taxable categories by region (validation is performed in service)
    const result = await serviceAdminFetchTaxableCategoriesByRegion.fetchTaxableCategoriesByRegion(regionId, req);

    return result;
}

// Export controller using universal connection handler
export default connectionHandler(fetchTaxableCategoriesByRegionLogic, 'FetchTaxableCategoriesByRegionController');

