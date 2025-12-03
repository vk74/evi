/**
 * controller.admin.update.product.regions.ts - backend file
 * version: 1.2.0
 * 
 * Controller for updating product regions data.
 * 
 * Handles HTTP PUT requests to the /api/admin/products/:productId/regions endpoint.
 * Validates JWT (handled by middleware), processes product regions update through the service,
 * and sends the response.
 * 
 * Backend file - controller.admin.update.product.regions.ts
 * 
 * Changes in v1.1.0:
 * - Removed business logic validation (moved to service)
 * - Controller now only extracts parameters and calls service
 * 
 * Changes in v1.2.0:
 * - Removed all event generation (moved to service according to backend-file-types rules)
 * - Controller now only extracts parameters and delegates to service
 */

import { Request, Response } from 'express';
import { serviceAdminUpdateProductRegions } from './service.admin.update.product.regions';
import { connectionHandler } from '@/core/helpers/connection.handler';
import type { UpdateProductRegionsRequest } from './types.admin.products';

/**
 * Controller logic for updating product regions data
 * Extracts parameters from request and delegates to service
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function updateProductRegionsLogic(req: Request, res: Response): Promise<any> {
    // JWT validation is already performed by route guards
    // If request reaches controller, JWT is valid

    // Extract product ID from route parameters
    const productId = req.params.productId as string;

    // Extract request body
    const requestBody = req.body as UpdateProductRegionsRequest;

    // Update product regions data (validation and event generation performed in service)
    const result = await serviceAdminUpdateProductRegions.updateProductRegions(productId, requestBody, req);

    return result;
}

// Export controller using universal connection handler
export default connectionHandler(updateProductRegionsLogic, 'UpdateProductRegionsController');

