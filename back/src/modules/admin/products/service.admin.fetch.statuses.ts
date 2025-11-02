/**
 * service.admin.fetch.statuses.ts - version 1.1.0
 * Service for fetching product statuses from app.product_status UDT enum.
 * 
 * Handles database queries to get product statuses for filter dropdown.
 * 
 * File: service.admin.fetch.statuses.ts
 * Created: 2024-12-20
 * Last updated: 2024-12-20
 * 
 * Changes in v1.1.0:
 * - Updated to fetch statuses from app.product_status UDT enum instead of product_statuses table
 * - Removed description, is_active, and display_order fields from response
 * - Returns only status_code values
 */

import { Pool } from 'pg'
import { queries } from './queries.admin.products'
import type { ProductStatus } from './types.admin.products'

/**
 * Fetches all product statuses from app.product_status enum
 * @param pool - Database connection pool
 * @returns Promise with array of ProductStatus objects (status_code only) sorted by enum order
 */
export const fetchProductStatuses = async (
    pool: Pool
): Promise<ProductStatus[]> => {
    const client = await pool.connect()
    
    try {
        // Execute query to get product statuses from enum
        const result = await client.query(queries.fetchProductStatuses)
        
        // Map results to ProductStatus interface (only status_code)
        const statuses: ProductStatus[] = result.rows.map((row: any) => ({
            status_code: row.status_code
        }))
        
        return statuses
        
    } catch (error) {
        throw error
    } finally {
        client.release()
    }
}
