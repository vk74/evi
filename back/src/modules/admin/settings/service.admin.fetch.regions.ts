/**
 * service.admin.fetch.regions.ts - version 1.0.0
 * Service for fetching all regions.
 * 
 * Handles database queries for regions list.
 * 
 * File: service.admin.fetch.regions.ts
 */

import { Pool } from 'pg'
import { pool } from '@/core/db/maindb'
import { queries } from './queries.admin.regions'
import { EVENTS_ADMIN_REGIONS } from './events.admin.regions'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'
import type { Region, FetchRegionsResponse } from './types.admin.regions'

/**
 * Fetches all regions from database
 * @param req - Express request object for event context
 * @returns Promise with regions data or error
 */
export async function fetchAllRegions(req?: any): Promise<FetchRegionsResponse> {
    const client = await pool.connect()
    
    try {
        // Fetch all regions
        const result = await client.query(queries.fetchAllRegions)
        
        const regions: Region[] = result.rows.map((row: any) => ({
            region_id: row.region_id,
            region_name: row.region_name,
            created_at: row.created_at,
            updated_at: row.updated_at
        }))
        
        // Log success
        await createAndPublishEvent({
            eventName: EVENTS_ADMIN_REGIONS['region.fetch.success'].eventName,
            req: req,
            payload: {
                totalRegions: regions.length,
                timestamp: new Date().toISOString()
            }
        })
        
        return {
            success: true,
            message: 'Regions fetched successfully',
            data: regions
        }
    } catch (error) {
        await createAndPublishEvent({
            eventName: EVENTS_ADMIN_REGIONS['region.fetch.data_error'].eventName,
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

