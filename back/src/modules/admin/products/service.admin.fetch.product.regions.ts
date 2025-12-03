/**
 * service.admin.fetch.product.regions.ts - version 1.1.0
 * Backend service for fetching product regions data.
 * 
 * Handles fetching product-region bindings with categories from database.
 * 
 * Backend file - service.admin.fetch.product.regions.ts
 * 
 * Changes in v1.1.0:
 * - Added validation for productId
 * - Business logic validation moved from controller to service
 */

import { Request } from 'express';
import { Pool, QueryResult } from 'pg';
import { pool as pgPool } from '@/core/db/maindb';
import { queries } from './queries.admin.products';
import type { ProductRegion, FetchProductRegionsResponse } from './types.admin.products';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Fetches all regions with product-region bindings and categories
 * @param productId - Product ID
 * @param req - Express Request object
 * @returns Promise<FetchProductRegionsResponse>
 */
export async function fetchProductRegions(
    productId: string,
    req: Request
): Promise<FetchProductRegionsResponse> {
    // Validate productId
    if (!productId) {
        return {
            success: false,
            message: 'Product ID is required'
        };
    }

    try {
        // Execute query to fetch all regions with product bindings
        const result: QueryResult = await pool.query(
            queries.fetchProductRegions,
            [productId]
        );

        // Transform database rows to ProductRegion format
        const regions: ProductRegion[] = result.rows.map(row => ({
            region_id: row.region_id,
            region_name: row.region_name,
            category_id: row.taxable_category_id || null,
            category_name: row.category_name || null
        }));

        return {
            success: true,
            message: 'Product regions fetched successfully',
            data: regions
        };
    } catch (error) {
        console.error('Error fetching product regions:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch product regions'
        };
    }
}

export const serviceAdminFetchProductRegions = {
    fetchProductRegions
};

