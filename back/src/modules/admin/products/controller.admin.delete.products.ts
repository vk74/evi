/**
 * controller.admin.delete.products.ts - backend file
 * version: 1.0.0
 * 
 * Controller for deleting products data.
 * 
 * Handles HTTP POST requests to the /api/admin/products/delete endpoint.
 * Validates JWT (handled by middleware), processes product deletion through the service,
 * and sends the response. Uses event bus to track operations.
 * 
 * Note: HTTP request/response events are now handled by the universal connection handler.
 */

import { Request, Response } from 'express';
import { deleteProducts as deleteProductsService } from './service.admin.delete.products';
import { connectionHandler } from '@/core/helpers/connection.handler';
import type { DeleteProductsParams } from './types.admin.products';

/**
 * Business logic for deleting products data
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function deleteProductsLogic(req: Request, res: Response): Promise<any> {
    // JWT validation is already performed by route guards
    // If request reaches controller, JWT is valid

    // Extract product IDs from request body
    const { productIds } = req.body as DeleteProductsParams;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return {
            success: false,
            message: 'Product IDs array is required and must not be empty',
            data: undefined
        };
    }

    // Delete products
    const result = await deleteProductsService({ productIds }, req);

    // Return result for connectionHandler to process
    return {
        success: result.totalErrors === 0,
        message: result.totalErrors === 0 
            ? `Successfully deleted ${result.totalDeleted} product(s).`
            : result.totalDeleted > 0 
                ? `Partially successful. Deleted ${result.totalDeleted} of ${result.totalRequested} products.`
                : `Failed to delete any products. ${result.totalErrors} error(s) occurred.`,
        data: {
            deletedProducts: result.deletedProducts,
            errors: result.errors,
            totalRequested: result.totalRequested,
            totalDeleted: result.totalDeleted,
            totalErrors: result.totalErrors
        }
    };
}

// Export controller using universal connection handler
export default connectionHandler(deleteProductsLogic, 'DeleteProductsController');
