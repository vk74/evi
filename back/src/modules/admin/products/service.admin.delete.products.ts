/**
 * service.admin.delete.products.ts - version 1.3.0
 * Service for deleting products operations.
 * 
 * Functionality:
 * - Validates input data for deleting products
 * - Deletes products from database with cascade deletion
 * - Handles data transformation and business logic
 * - Manages database interactions and error handling
 * 
 * Data flow:
 * 1. Receive request object with product IDs
 * 2. Validate required fields and data formats
 * 3. Delete products from database (cascade deletion handles related data)
 * 4. Return formatted response
 * 
 * Changes in v1.3.0:
 * - Added scope check support for authorization
 * - If effectiveScope = 'own', checks access to each product before deletion
 * - Deletes only accessible products and returns errors for inaccessible ones
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '@/core/db/maindb';
import { queries } from './queries.admin.products';
import type { 
    DeleteProductsParams, 
    DeleteProductsResult,
    ProductError
} from './types.admin.products';
import { getRequestorUuidFromReq } from '@/core/helpers/get.requestor.uuid.from.req';
// Legacy validation removed; rely on basic type checks and DB
import { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { PRODUCT_DELETE_EVENTS } from './events.admin.products';
import { AuthenticatedRequest } from '@/core/guards/types.guards';
import { checkProductAccess } from './helpers.check.product.access';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Validates product IDs for deletion
 * @param productIds - Array of product IDs to validate
 * @throws {ProductError} When validation fails
 */
function validateProductIds(productIds: string[]): void {
    const errors: string[] = [];

    if (!Array.isArray(productIds)) {
        errors.push('Product IDs must be an array');
    } else if (productIds.length === 0) {
        errors.push('At least one product ID is required');
    } else {
        // Validate each product ID
        for (const id of productIds) {
            if (!id || typeof id !== 'string') {
                errors.push('Product ID must be a non-empty string');
            }
        }
    }

    if (errors.length > 0) {
        const productError: ProductError = {
            code: 'VALIDATION_ERROR',
            message: 'Product deletion validation failed',
            details: { errors }
        };
        throw productError;
    }
}

/**
 * Main function to delete products
 * @param params - Product deletion parameters
 * @param req - Express request object
 * @returns DeleteProductsResult
 */
export async function deleteProducts(
    params: DeleteProductsParams,
    req: Request
): Promise<DeleteProductsResult> {
    const client = await pool.connect();
    
    try {
        // Validate input data
        validateProductIds(params.productIds);

        // Get requestor UUID for access check
        const requestorUuid = await getRequestorUuidFromReq(req);
        if (!requestorUuid) {
            return {
                deletedProducts: [],
                errors: [{ id: 'auth', error: 'Unable to identify requesting user' }],
                totalRequested: params.productIds.length,
                totalDeleted: 0,
                totalErrors: params.productIds.length
            };
        }

        // Check scope for authorization
        const authReq = req as AuthenticatedRequest;
        const effectiveScope = authReq.authContext?.effectiveScope;

        let productsToDelete: string[] = [];
        const errors: Array<{id: string, error: string}> = [];

        // If scope is 'own', check access to each product
        if (effectiveScope === 'own') {
            for (const productId of params.productIds) {
                const hasAccess = await checkProductAccess(productId, requestorUuid, client);
                
                if (hasAccess) {
                    productsToDelete.push(productId);
                } else {
                    errors.push({
                        id: productId,
                        error: 'Access denied: you can only delete your own products'
                    });
                }
            }

            // If no products are accessible, return early
            if (productsToDelete.length === 0) {
                await createAndPublishEvent({
                    eventName: PRODUCT_DELETE_EVENTS.PARTIAL_SUCCESS.eventName,
                    req: req,
                    payload: { 
                        productIds: params.productIds,
                        productCodes: [],
                        totalDeleted: 0,
                        totalErrors: params.productIds.length,
                        deletedIds: [],
                        notFoundIds: []
                    }
                });

                return {
                    deletedProducts: [],
                    errors,
                    totalRequested: params.productIds.length,
                    totalDeleted: 0,
                    totalErrors: params.productIds.length
                };
            }
        } else {
            // scope = 'all' - delete all requested products without access check
            productsToDelete = params.productIds;
        }

        // Delete products from database
        // PostgreSQL CASCADE will automatically delete related records:
        // - app.product_translations
        // - app.product_users  
        // - app.product_groups
        const result = await client.query(queries.deleteProducts, [productsToDelete]);
        
        const deletedProducts = result.rows.map(row => ({
            id: row.product_id,
            product_code: row.product_code
        }));

        const totalDeleted = deletedProducts.length;
        const totalErrors = errors.length + (productsToDelete.length - totalDeleted);

        // Add errors for products that weren't found/deleted
        if (productsToDelete.length > totalDeleted) {
            const deletedIds = new Set(deletedProducts.map(p => p.id));
            for (const id of productsToDelete) {
                if (!deletedIds.has(id)) {
                    errors.push({ id, error: 'Product not found or already deleted' });
                }
            }
        }

        // Log success or partial success
        const productCodes = deletedProducts.map(p => p.product_code);
        
        if (totalErrors === 0) {
            await createAndPublishEvent({
                eventName: PRODUCT_DELETE_EVENTS.SUCCESS.eventName,
                req: req,
                payload: { 
                    productIds: params.productIds,
                    productCodes,
                    totalDeleted
                }
            });
        } else if (totalDeleted > 0) {
            const deletedIds = deletedProducts.map(p => p.id);
            const notFoundIds = params.productIds.filter(id => !deletedIds.includes(id));
            
            await createAndPublishEvent({
                eventName: PRODUCT_DELETE_EVENTS.PARTIAL_SUCCESS.eventName,
                req: req,
                payload: { 
                    productIds: params.productIds,
                    productCodes,
                    totalDeleted,
                    totalErrors,
                    deletedIds,
                    notFoundIds
                }
            });
        }

        return {
            deletedProducts,
            errors,
            totalRequested: params.productIds.length,
            totalDeleted,
            totalErrors
        };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        
        await createAndPublishEvent({
            eventName: PRODUCT_DELETE_EVENTS.DATABASE_ERROR.eventName,
            req: req,
            payload: { 
                productIds: params.productIds,
                error: errorMessage,
                stack: errorStack
            },
            errorData: errorMessage
        });

        if (error instanceof Error && 'code' in error) {
            const productError = error as ProductError;
            return {
                deletedProducts: [],
                errors: [{ id: 'validation', error: productError.message }],
                totalRequested: params.productIds.length,
                totalDeleted: 0,
                totalErrors: params.productIds.length
            };
        }

        return {
            deletedProducts: [],
            errors: [{ id: 'system', error: 'Failed to delete products' }],
            totalRequested: params.productIds.length,
            totalDeleted: 0,
            totalErrors: params.productIds.length
        };
    } finally {
        client.release();
    }
}

export default deleteProducts;
