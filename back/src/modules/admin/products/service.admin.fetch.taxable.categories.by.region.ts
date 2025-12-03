/**
 * service.admin.fetch.taxable.categories.by.region.ts - version 1.1.0
 * Backend service for fetching taxable categories by region.
 * 
 * Handles fetching categories available for a specific region from app.regions_taxable_categories.
 * 
 * Backend file - service.admin.fetch.taxable.categories.by.region.ts
 * 
 * Changes in v1.1.0:
 * - Added validation for regionId
 * - Business logic validation moved from controller to service
 */

import { Request } from 'express';
import { Pool, QueryResult } from 'pg';
import { pool as pgPool } from '@/core/db/maindb';
import { queries } from './queries.admin.products';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Taxable category interface
 */
export interface TaxableCategoryByRegion {
    category_id: number;
    category_name: string;
}

/**
 * Response interface
 */
export interface FetchTaxableCategoriesByRegionResponse {
    success: boolean;
    message: string;
    data?: TaxableCategoryByRegion[];
}

/**
 * Fetches taxable categories available for a specific region
 * @param regionId - Region ID
 * @param req - Express Request object
 * @returns Promise<FetchTaxableCategoriesByRegionResponse>
 */
export async function fetchTaxableCategoriesByRegion(
    regionId: number,
    req: Request
): Promise<FetchTaxableCategoriesByRegionResponse> {
    // Validate regionId
    if (isNaN(regionId) || regionId <= 0) {
        return {
            success: false,
            message: 'Valid region ID is required'
        };
    }

    try {
        // Execute query to fetch categories for region
        const result: QueryResult = await pool.query(
            queries.fetchTaxableCategoriesByRegion,
            [regionId]
        );

        // Transform database rows to TaxableCategoryByRegion format
        const categories: TaxableCategoryByRegion[] = result.rows.map(row => ({
            category_id: row.category_id,
            category_name: row.category_name
        }));

        return {
            success: true,
            message: 'Taxable categories fetched successfully',
            data: categories
        };
    } catch (error) {
        console.error('Error fetching taxable categories by region:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch taxable categories by region'
        };
    }
}

export const serviceAdminFetchTaxableCategoriesByRegion = {
    fetchTaxableCategoriesByRegion
};

