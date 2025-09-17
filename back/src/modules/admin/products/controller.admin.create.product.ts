/**
 * controller.admin.create.product.ts - backend file
 * version: 1.0.0
 * 
 * Controller for creating products data.
 * 
 * Handles HTTP POST requests to the /api/admin/products/create endpoint.
 * Validates JWT (handled by middleware), processes product creation through the service,
 * and sends the response. Uses event bus to track operations.
 * 
 * Note: HTTP request/response events are now handled by the universal connection handler.
 */

import { Request, Response } from 'express';
import { createProduct as createProductService } from './service.admin.create.product';
import { connectionHandler } from '@/core/helpers/connection.handler';

/**
 * Business logic for creating products data
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function createProductLogic(req: Request, res: Response): Promise<any> {
    // JWT validation is already performed by route guards
    // If request reaches controller, JWT is valid

    // Create product
    const result = await createProductService(req);

    return result;
}

// Export controller using universal connection handler
export default connectionHandler(createProductLogic, 'CreateProductController');
