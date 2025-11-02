/**
 * service.admin.fetch.statuses.ts - version 1.0.0
 * Service for fetching product statuses from reference table.
 * 
 * Handles database queries to get active product statuses for filter dropdown.
 * 
 * File: service.admin.fetch.statuses.ts
 * Created: 2024-12-20
 * Last updated: 2024-12-20
 */

import { Pool } from 'pg'
import { queries } from './queries.admin.products'
import type { ProductStatus } from './types.admin.products'

/**
 * Fetches all active product statuses from reference table
 * @param pool - Database connection pool
 * @returns Promise with array of ProductStatus objects sorted by display_order
 */
export const fetchProductStatuses = async (
    pool: Pool
): Promise<ProductStatus[]> => {
    const client = await pool.connect()
    
    try {
        // Execute query to get active product statuses
        const result = await client.query(queries.fetchProductStatuses)
        
        // Map results to ProductStatus interface
        const statuses: ProductStatus[] = result.rows.map((row: any) => ({
            status_code: row.status_code,
            description: row.description,
            is_active: row.is_active,
            display_order: row.display_order
        }))
        
        return statuses
        
    } catch (error) {
        throw error
    } finally {
        client.release()
    }
}
