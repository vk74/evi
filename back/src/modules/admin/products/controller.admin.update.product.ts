/**
 * controller.admin.update.product.ts - backend file
 * version: 1.0.0
 * 
 * Controller for updating products data.
 * 
 * Handles HTTP POST requests to the /api/admin/products/update endpoint.
 * Validates JWT (handled by middleware), processes product update through the service,
 * and sends the response. Uses event bus to track operations.
 * 
 * Note: HTTP request/response events are now handled by the universal connection handler.
 */

import { Request, Response } from 'express';
import { updateProduct as updateProductService } from './service.admin.update.product';
import { connectionHandler } from '@/core/helpers/connection.handler';

/**
 * Business logic for updating products data
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function updateProductLogic(req: Request, res: Response): Promise<any> {
    // JWT validation is already performed by route guards
    // If request reaches controller, JWT is valid

    // Extract product data from request body
    const productData = req.body;

    // Update product
    const result = await updateProductService(productData, req);

    return result;
}

// Export controller using universal connection handler
export default connectionHandler(updateProductLogic, 'UpdateProductController');
