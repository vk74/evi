/**
 * version: 1.1.0
 * Service to fetch taxable categories for pricing admin module (backend).
 * Connects to DB, executes query, maps fields to DTO format.
 * File: service.admin.fetch.taxable.categories.ts (backend)
 * 
 * Changes in v1.1.0:
 * - Updated to include region field from JOIN with app.regions_taxable_categories and app.regions
 */

import { Pool } from 'pg'
import { Request } from 'express'
import { queries } from './queries.admin.pricing'
import type { TaxableCategoryDto, FetchTaxableCategoriesResponse } from './types.admin.pricing'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'
import { EVENTS_ADMIN_PRICING } from './events.admin.pricing'
import { pool as pgPool } from '@/core/db/maindb'

// Type assertion for pool
const pool = pgPool as Pool

/**
 * Fetches all taxable categories from database
 * @param req - Express request object for event context
 * @returns Promise with categories data or error
 */
export async function fetchTaxableCategories(req?: any): Promise<FetchTaxableCategoriesResponse> {
    const client = await pool.connect()
    
    try {
        // Fetch all taxable categories
        const result = await client.query(queries.fetchAllTaxableCategories)
        
        const categories: TaxableCategoryDto[] = result.rows.map((row: any) => ({
            category_id: row.category_id,
            category_name: row.category_name,
            region: row.region || null,
            created_at: row.created_at,
            updated_at: row.updated_at
        }))
        
        // Log success
        await createAndPublishEvent({
            eventName: EVENTS_ADMIN_PRICING['taxableCategories.fetch.success'].eventName,
            req: req,
            payload: {
                totalCategories: categories.length,
                timestamp: new Date().toISOString()
            }
        })
        
        return {
            success: true,
            message: 'Taxable categories fetched successfully',
            data: categories
        }
    } catch (error) {
        await createAndPublishEvent({
            eventName: EVENTS_ADMIN_PRICING['taxableCategories.fetch.database_error'].eventName,
            req: req,
            payload: {
                error: error instanceof Error ? error.message : 'Unknown database error',
                timestamp: new Date().toISOString()
            },
            errorData: error instanceof Error ? error.message : 'Unknown database error'
        })
        
        throw error
    } finally {
        client.release()
    }
}

