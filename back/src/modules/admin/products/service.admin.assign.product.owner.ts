/**
 * service.admin.assign.product.owner.ts - version 1.1.0
 * Service for assigning product owner operations.
 * 
 * Functionality:
 * - Validates input data for assigning product owner
 * - Validates that products exist in database
 * - Validates that new owner exists (by username)
 * - Updates product owners in database with transaction
 * - Handles data transformation and business logic
 * - Manages database interactions and error handling
 * 
 * Data flow:
 * 1. Receive request object with productIds and newOwnerUsername
 * 2. Validate required fields and data formats
 * 3. Validate that products exist
 * 4. Validate that new owner exists (get UUID by username)
 * 5. Update product owners in database with transaction
 * 6. Return formatted response
 * 
 * Changes in v1.1.0:
 * - Added scope check support for authorization
 * - If effectiveScope = 'own', checks access to each product before allowing owner change
 * - Allows owner change only for accessible products
 * 
 * Backend file - service.admin.assign.product.owner.ts
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '@/core/db/maindb';
import { queries } from './queries.admin.products';
import type { 
    AssignProductOwnerRequest, 
    AssignProductOwnerResponse,
    ProductError
} from './types.admin.products';
import { getRequestorUuidFromReq } from '@/core/helpers/get.requestor.uuid.from.req';
import { getUuidByUsername } from '@/core/helpers/get.uuid.by.username';
import { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { PRODUCT_ASSIGN_OWNER_EVENTS } from './events.admin.products';
import { AuthenticatedRequest } from '@/core/guards/types.guards';
import { checkProductAccess } from './helpers.check.product.access';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Validates assign product owner request data
 * @param data - Assign product owner request data
 * @throws {ProductError} When validation fails
 */
function validateAssignOwnerData(data: AssignProductOwnerRequest): void {
    const errors: string[] = [];

    if (!data.productIds || !Array.isArray(data.productIds) || data.productIds.length === 0) {
        errors.push('Product IDs array is required and must not be empty');
    } else {
        // Validate each product ID
        for (const id of data.productIds) {
            if (!id || typeof id !== 'string') {
                errors.push('Product ID must be a non-empty string');
            }
        }
    }

    if (!data.newOwnerUsername || typeof data.newOwnerUsername !== 'string' || data.newOwnerUsername.trim().length === 0) {
        errors.push('New owner username is required and must be a non-empty string');
    }

    if (errors.length > 0) {
        const productError: ProductError = {
            code: 'VALIDATION_ERROR',
            message: 'Product owner assignment validation failed',
            details: { errors }
        };
        throw productError;
    }
}

/**
 * Check if products exist in database
 * @param client - Database client
 * @param productIds - Array of product IDs to check
 * @returns Array of existing product IDs with their codes
 */
async function checkProductsExist(
    client: any,
    productIds: string[]
): Promise<Array<{product_id: string, product_code: string}>> {
    const result = await client.query(
        'SELECT product_id, product_code FROM app.products WHERE product_id = ANY($1)',
        [productIds]
    );
    return result.rows;
}

/**
 * Get old owners for products
 * @param client - Database client
 * @param productIds - Array of product IDs
 * @returns Map of product_id to username
 */
async function getOldOwners(
    client: any,
    productIds: string[]
): Promise<Map<string, string>> {
    const result = await client.query(`
        SELECT pu.product_id, u.username
        FROM app.product_users pu
        JOIN app.users u ON pu.user_id = u.user_id
        WHERE pu.product_id = ANY($1) AND pu.role_type = 'owner'
    `, [productIds]);

    const ownersMap = new Map<string, string>();
    result.rows.forEach((row: any) => {
        ownersMap.set(row.product_id, row.username);
    });

    return ownersMap;
}

/**
 * Main function to assign product owner
 * @param data - Assign product owner request data
 * @param req - Express request object
 * @returns AssignProductOwnerResponse
 */
export async function assignProductOwner(
    data: AssignProductOwnerRequest,
    req: Request
): Promise<AssignProductOwnerResponse> {
    const client = await pool.connect();
    
    try {
        // Validate input data
        validateAssignOwnerData(data);

        // Get requestor UUID for audit tracking
        const requestorUuid = await getRequestorUuidFromReq(req);
        if (!requestorUuid) {
            await createAndPublishEvent({
                eventName: PRODUCT_ASSIGN_OWNER_EVENTS.VALIDATION_ERROR.eventName,
                req: req,
                payload: { 
                    error: 'Unable to identify requesting user',
                    productIds: data.productIds
                },
                errorData: 'Unable to identify requesting user'
            });

            return {
                success: false,
                message: 'Unable to identify requesting user',
                data: undefined
            };
        }

        // Validate that new owner exists
        const newOwnerUuid = await getUuidByUsername(data.newOwnerUsername.trim());
        if (!newOwnerUuid) {
            await createAndPublishEvent({
                eventName: PRODUCT_ASSIGN_OWNER_EVENTS.OWNER_NOT_FOUND.eventName,
                req: req,
                payload: { 
                    newOwnerUsername: data.newOwnerUsername
                },
                errorData: `Owner user not found: ${data.newOwnerUsername}`
            });

            return {
                success: false,
                message: `Owner user not found: ${data.newOwnerUsername}`,
                data: undefined
            };
        }

        // Check if products exist
        const existingProducts = await checkProductsExist(client, data.productIds);
        
        if (existingProducts.length === 0) {
            await createAndPublishEvent({
                eventName: PRODUCT_ASSIGN_OWNER_EVENTS.PRODUCTS_NOT_FOUND.eventName,
                req: req,
                payload: { 
                    productIds: data.productIds,
                    notFoundIds: data.productIds
                }
            });

            return {
                success: false,
                message: 'None of the specified products were found',
                data: {
                    updatedProducts: [],
                    errors: data.productIds.map(id => ({ id, error: 'Product not found' })),
                    totalRequested: data.productIds.length,
                    totalUpdated: 0,
                    totalErrors: data.productIds.length
                }
            };
        }

        // Check scope for authorization
        const authReq = req as AuthenticatedRequest;
        const effectiveScope = authReq.authContext?.effectiveScope;

        // If scope is 'own', filter products by access
        let accessibleProducts = existingProducts;
        const errors: Array<{id: string, error: string}> = [];

        if (effectiveScope === 'own') {
            accessibleProducts = [];
            for (const product of existingProducts) {
                const hasAccess = await checkProductAccess(product.product_id, requestorUuid, client);
                
                if (hasAccess) {
                    accessibleProducts.push(product);
                } else {
                    errors.push({
                        id: product.product_id,
                        error: 'Access denied: you can only change owner for your own products'
                    });
                }
            }

            // If no products are accessible, return early
            if (accessibleProducts.length === 0) {
                await createAndPublishEvent({
                    eventName: PRODUCT_ASSIGN_OWNER_EVENTS.PARTIAL_SUCCESS.eventName,
                    req: req,
                    payload: { 
                        productIds: data.productIds,
                        productCodes: [],
                        updatedIds: [],
                        notFoundIds: [],
                        newOwnerUsername: data.newOwnerUsername,
                        totalUpdated: 0,
                        totalErrors: data.productIds.length
                    }
                });

                return {
                    success: false,
                    message: 'Access denied: you can only change owner for your own products',
                    data: {
                        updatedProducts: [],
                        errors,
                        totalRequested: data.productIds.length,
                        totalUpdated: 0,
                        totalErrors: data.productIds.length
                    }
                };
            }
        }

        // Get old owners before update (only for accessible products)
        const accessibleProductIds = accessibleProducts.map(p => p.product_id);
        const oldOwners = await getOldOwners(client, accessibleProductIds);

        // Start transaction
        await client.query('BEGIN');

        const updatedProducts: Array<{id: string, product_code: string}> = [];

        // Process each accessible product
        for (const product of accessibleProducts) {
            try {
                // Delete existing owner for this product
                await client.query(
                    'DELETE FROM app.product_users WHERE product_id = $1 AND role_type = $2',
                    [product.product_id, 'owner']
                );

                // Insert new owner
                await client.query(queries.createProductUser, [
                    product.product_id,
                    newOwnerUuid,
                    'owner',
                    requestorUuid
                ]);

                updatedProducts.push({
                    id: product.product_id,
                    product_code: product.product_code
                });
            } catch (error) {
                // If error occurs for a specific product, add to errors but continue with others
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                errors.push({
                    id: product.product_id,
                    error: errorMessage
                });
            }
        }

        // Commit transaction if at least one product was updated
        if (updatedProducts.length > 0) {
            await client.query('COMMIT');
        } else {
            await client.query('ROLLBACK');
        }

        const totalUpdated = updatedProducts.length;
        const totalErrors = errors.length + (data.productIds.length - existingProducts.length);

        // Add errors for products that weren't found
        const existingProductIds = new Set(existingProducts.map(p => p.product_id));
        for (const productId of data.productIds) {
            if (!existingProductIds.has(productId)) {
                errors.push({
                    id: productId,
                    error: 'Product not found'
                });
            }
        }

        // Add errors for products that exist but are not accessible (if scope = 'own')
        if (effectiveScope === 'own') {
            const accessibleProductIds = new Set(accessibleProducts.map(p => p.product_id));
            for (const product of existingProducts) {
                if (!accessibleProductIds.has(product.product_id)) {
                    // Error already added in the access check loop above
                }
            }
        }

        const productCodes = updatedProducts.map(p => p.product_code);

        // Publish events based on results
        if (totalErrors === 0) {
            const oldOwnerUsernames = Array.from(oldOwners.values());
            await createAndPublishEvent({
                eventName: PRODUCT_ASSIGN_OWNER_EVENTS.SUCCESS.eventName,
                req: req,
                payload: { 
                    productIds: data.productIds,
                    productCodes,
                    newOwnerUsername: data.newOwnerUsername,
                    oldOwnerUsernames: oldOwnerUsernames.length > 0 ? oldOwnerUsernames : undefined,
                    totalUpdated
                }
            });
        } else if (totalUpdated > 0) {
            const updatedIds = updatedProducts.map(p => p.id);
            const notFoundIds = data.productIds.filter(id => !existingProductIds.has(id));
            
            await createAndPublishEvent({
                eventName: PRODUCT_ASSIGN_OWNER_EVENTS.PARTIAL_SUCCESS.eventName,
                req: req,
                payload: { 
                    productIds: data.productIds,
                    productCodes,
                    updatedIds,
                    notFoundIds,
                    newOwnerUsername: data.newOwnerUsername,
                    totalUpdated,
                    totalErrors
                }
            });
        }

        if (totalUpdated === 0) {
            return {
                success: false,
                message: 'Failed to assign owner to any products',
                data: {
                    updatedProducts: [],
                    errors,
                    totalRequested: data.productIds.length,
                    totalUpdated: 0,
                    totalErrors
                }
            };
        }

        return {
            success: totalErrors === 0,
            message: totalErrors === 0
                ? `Owner assigned successfully to ${totalUpdated} product(s)`
                : `Owner assigned to ${totalUpdated} of ${data.productIds.length} products`,
            data: {
                updatedProducts,
                errors,
                totalRequested: data.productIds.length,
                totalUpdated,
                totalErrors
            }
        };

    } catch (error) {
        // Rollback transaction if it was started
        try {
            await client.query('ROLLBACK');
        } catch (rollbackError) {
            // Ignore rollback errors
        }

        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        
        await createAndPublishEvent({
            eventName: PRODUCT_ASSIGN_OWNER_EVENTS.ERROR.eventName,
            req: req,
            payload: { 
                productIds: data.productIds,
                newOwnerUsername: data.newOwnerUsername,
                error: errorMessage,
                stack: errorStack
            },
            errorData: errorMessage
        });

        if (error instanceof Error && 'code' in error) {
            const productError = error as ProductError;
            return {
                success: false,
                message: productError.message || 'Failed to assign product owner',
                data: {
                    updatedProducts: [],
                    errors: [{ id: 'validation', error: productError.message }],
                    totalRequested: data.productIds?.length || 0,
                    totalUpdated: 0,
                    totalErrors: data.productIds?.length || 0
                }
            };
        }

        return {
            success: false,
            message: 'Failed to assign product owner',
            data: {
                updatedProducts: [],
                errors: [{ id: 'system', error: 'Failed to assign product owner' }],
                totalRequested: data.productIds?.length || 0,
                totalUpdated: 0,
                totalErrors: data.productIds?.length || 0
            }
        };
    } finally {
        client.release();
    }
}

export default assignProductOwner;
