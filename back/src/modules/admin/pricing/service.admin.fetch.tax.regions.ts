/**
 * version: 1.1.0
 * Service to fetch tax regions bindings for pricing admin module (backend).
 * Connects to DB, executes queries for regions and their category bindings.
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
 * Fetches all regions and their taxable category bindings
 * @param req - Express request object for event context
 * @returns Promise with regions and bindings data or error
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

        // Fetch all bindings (categories within regions)
        const bindingsResult = await client.query(queries.fetchAllRegionsTaxableCategoriesBindings)
        const bindings = bindingsResult.rows.map((row: any) => ({
            id: row.id,
            region_id: row.region_id,
            region_name: row.region_name,
            category_name: row.category_name,
            vat_rate: row.vat_rate !== null && row.vat_rate !== undefined ? Number(row.vat_rate) : null
        }))
        
        // Log success
        await createAndPublishEvent({
            eventName: EVENTS_ADMIN_PRICING['taxRegions.fetch.success'].eventName,
            req: req,
            payload: {
                totalRegions: regions.length,
                totalBindings: bindings.length,
                timestamp: new Date().toISOString()
            }
        })
        
        return {
            success: true,
            message: 'Tax regions data fetched successfully',
            data: {
                regions,
                categories: [], // Kept for backward compatibility but empty
                bindings: bindings as any // Type cast if necessary, or update types
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
