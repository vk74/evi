/**
 * service.admin.delete.products.ts - version 1.0.0
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
import { validateFieldLegacy, validateFieldSecurityLegacy } from '@/core/validation/legacy.validation';
import { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { PRODUCT_DELETE_EVENTS } from './events.admin.products';

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
            } else {
                const validation = validateFieldSecurityLegacy({ value: id, fieldType: 'service_name' });
                if (!validation.isValid) {
                    errors.push(`Invalid product ID: ${validation.error}`);
                }
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
        // Log incoming data for debugging
        console.log('[DeleteProducts] Incoming data:', JSON.stringify(params, null, 2));
        
        await createAndPublishEvent({
            eventName: PRODUCT_DELETE_EVENTS.STARTED.eventName,
            payload: { 
                productIds: params.productIds,
                count: params.productIds.length
            }
        });

        // Get requestor UUID for logging
        const requestorUuid = getRequestorUuidFromReq(req);
        if (!requestorUuid) {
            return {
                deletedProducts: [],
                errors: [{ id: 'system', error: 'Unable to identify requesting user' }],
                totalRequested: params.productIds.length,
                totalDeleted: 0,
                totalErrors: 1
            };
        }

        // Validate input data
        validateProductIds(params.productIds);

        await createAndPublishEvent({
            eventName: PRODUCT_DELETE_EVENTS.VALIDATION_SUCCESS.eventName,
            payload: { productIds: params.productIds }
        });

        // Delete products from database
        // PostgreSQL CASCADE will automatically delete related records:
        // - app.product_translations
        // - app.product_users  
        // - app.product_groups
        const result = await client.query(queries.deleteProducts, [params.productIds]);
        
        const deletedProducts = result.rows.map(row => ({
            id: row.product_id,
            product_code: row.product_code
        }));

        const totalDeleted = deletedProducts.length;
        const totalErrors = params.productIds.length - totalDeleted;

        // Create errors for products that weren't found/deleted
        const errors: Array<{id: string, error: string}> = [];
        if (totalErrors > 0) {
            const deletedIds = new Set(deletedProducts.map(p => p.id));
            for (const id of params.productIds) {
                if (!deletedIds.has(id)) {
                    errors.push({ id, error: 'Product not found or already deleted' });
                }
            }
        }

        // Log success or partial success
        if (totalErrors === 0) {
            await createAndPublishEvent({
                eventName: PRODUCT_DELETE_EVENTS.SUCCESS.eventName,
                payload: { 
                    productIds: params.productIds,
                    totalDeleted,
                    requestorUuid
                }
            });
        } else if (totalDeleted > 0) {
            await createAndPublishEvent({
                eventName: PRODUCT_DELETE_EVENTS.PARTIAL_SUCCESS.eventName,
                payload: { 
                    productIds: params.productIds,
                    totalDeleted,
                    totalErrors,
                    requestorUuid
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
