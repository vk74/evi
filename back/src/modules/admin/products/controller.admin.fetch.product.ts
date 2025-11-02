/**
 * controller.admin.fetch.product.ts - backend file
 * version: 1.0.1
 * 
 * Controller for fetching single product data.
 * 
 * Handles HTTP GET requests to the /api/admin/products/fetch endpoint.
 * Validates JWT (handled by middleware), processes product fetching through the service,
 * and sends the response. Uses event bus to track operations.
 * 
 * Note: HTTP request/response events are now handled by the universal connection handler.
 */

import { Request, Response } from 'express';
import { serviceAdminFetchProduct } from './service.admin.fetch.single.product';
import { connectionHandler } from '@/core/helpers/connection.handler';

/**
 * Business logic for fetching single product data
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function fetchProductLogic(req: Request, res: Response): Promise<any> {
    // JWT validation is already performed by route guards
    // If request reaches controller, JWT is valid

    // Extract product ID from query parameters
    const productId = req.query.id as string;

    if (!productId) {
        return {
            success: false,
            message: 'Product ID is required'
        };
    }

    // Fetch product data
    const result = await serviceAdminFetchProduct.fetchSingleProduct(productId, req);

    return result;
}

// Export controller using universal connection handler
export default connectionHandler(fetchProductLogic, 'FetchProductController');
