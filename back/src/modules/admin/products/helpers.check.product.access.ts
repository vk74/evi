/**
 * helpers.check.product.access.ts - version 1.0.0
 * Helper function for checking product access based on ownership and group membership.
 * 
 * Functionality:
 * - Checks if a user has access to a product based on 'own' scope rules
 * - User has access if:
 *   1. User is the owner of the product (app.product_users with role_type = 'owner')
 *   2. OR user's group is linked to the product as 'product_specialists' (app.product_groups)
 * 
 * Backend file - helpers.check.product.access.ts
 */

import { PoolClient } from 'pg';

/**
 * Checks if a user has access to a product based on ownership or group membership.
 * 
 * @param productId - UUID of the product to check access for
 * @param userUuid - UUID of the user requesting access
 * @param client - Database client (must be from an active connection)
 * @returns Promise<boolean> - true if user has access, false otherwise
 */
export async function checkProductAccess(
    productId: string,
    userUuid: string,
    client: PoolClient
): Promise<boolean> {
    // SQL check: user is owner OR user's group is linked as product_specialists
    const result = await client.query(`
        SELECT EXISTS (
            SELECT 1 FROM app.product_users pu 
            WHERE pu.product_id = $1 
            AND pu.user_id = $2 
            AND pu.role_type = 'owner'
        ) OR EXISTS (
            SELECT 1 FROM app.product_groups pg
            JOIN app.group_members ug ON pg.group_id = ug.group_id
            WHERE pg.product_id = $1
            AND pg.role_type = 'product_specialists'
            AND ug.user_id = $2
        ) as has_access
    `, [productId, userUuid]);
    
    return result.rows[0].has_access as boolean;
}

