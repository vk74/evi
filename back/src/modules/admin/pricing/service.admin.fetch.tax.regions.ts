/**
 * version: 1.0.0
 * Service to fetch tax regions bindings for pricing admin module (backend).
 * Connects to DB, executes queries for regions, categories and bindings, maps fields to DTO format.
 * File: service.admin.fetch.tax.regions.ts (backend)
 */

import { Pool } from 'pg'
import { Request } from 'express'
import { queries } from './queries.admin.pricing'
import type { FetchTaxRegionsResponse } from './types.admin.pricing'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'
import { EVENTS_ADMIN_PRICING } from './events.admin.pricing'
import { pool as pgPool } from '@/core/db/maindb'

// Type assertion for pool
const pool = pgPool as Pool

/**
 * Fetches all regions, categories and bindings for tax regions management
 * @param req - Express request object for event context
 * @returns Promise with regions, categories and bindings data or error
 */
export async function fetchTaxRegions(req?: any): Promise<FetchTaxRegionsResponse> {
    const client = await pool.connect()
    
    try {
        // Fetch all regions
        const regionsResult = await client.query(queries.fetchAllRegions)
        const regions = regionsResult.rows.map((row: any) => ({
            region_id: row.region_id,
            region_name: row.region_name
        }))

        // Fetch all taxable categories
        const categoriesResult = await client.query(queries.fetchAllTaxableCategoriesSimple)
        const categories = categoriesResult.rows.map((row: any) => ({
            category_id: row.category_id,
            category_name: row.category_name
        }))

        // Fetch all bindings with VAT rates
        const bindingsResult = await client.query(queries.fetchAllRegionsTaxableCategoriesBindings)
        const bindings = bindingsResult.rows.map((row: any) => ({
            region_id: row.region_id,
            category_id: row.category_id,
            vat_rate: row.vat_rate !== null && row.vat_rate !== undefined ? Number(row.vat_rate) : null
        }))
        
        // Log success
        await createAndPublishEvent({
            eventName: EVENTS_ADMIN_PRICING['taxRegions.fetch.success'].eventName,
            req: req,
            payload: {
                totalRegions: regions.length,
                totalCategories: categories.length,
                totalBindings: bindings.length,
                timestamp: new Date().toISOString()
            }
        })
        
        return {
            success: true,
            message: 'Tax regions data fetched successfully',
            data: {
                regions,
                categories,
                bindings
            }
        }
    } catch (error) {
        await createAndPublishEvent({
            eventName: EVENTS_ADMIN_PRICING['taxRegions.fetch.database_error'].eventName,
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

