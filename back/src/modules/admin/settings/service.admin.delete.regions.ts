/**
 * service.admin.delete.regions.ts - version 1.1.0
 * Service for deleting regions with validation and error handling.
 * 
 * Handles database operations for region deletion with proper logging.
 * 
 * File: service.admin.delete.regions.ts
 * 
 * Changes in v1.1.0:
 * - Removed region.delete.validation.success event
 * - Removed region.delete.exists event (debug level)
 * - Removed region.delete.not_found event (debug level)
 * - Enhanced region.delete.success event payload with deletedRegionNames and totalRegionsCount
 * - Enhanced region.delete.validation.error event payload with attemptedRegionIds
 * - Enhanced region.delete.partial_success event payload with deletedRegionNames, failedRegionIds, and totalRegionsCount
 * - Enhanced region.delete.database_error event payload with attemptedRegionNames
 * - Added region.delete.error event for complete error scenarios
 */

import { Pool } from 'pg'
import { pool as pgPool } from '@/core/db/maindb'
import { queries } from './queries.admin.regions'
import { EVENTS_ADMIN_REGIONS } from './events.admin.regions'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'
import { DeleteRegionsRequest, DeleteRegionsResult } from './types.admin.regions'

// Type assertion for pool
const pool = pgPool as Pool

/**
 * Validates region IDs
 */
const validateRegionIds = (regionIds: number[]): { isValid: boolean, errors: string[] } => {
    const errors: string[] = []
    
    if (!Array.isArray(regionIds)) {
        errors.push('Region IDs must be an array')
        return { isValid: false, errors }
    }
    
    if (regionIds.length === 0) {
        errors.push('At least one region ID must be provided')
        return { isValid: false, errors }
    }
    
    if (regionIds.length > 100) {
        errors.push('Maximum 100 regions can be deleted at once')
        return { isValid: false, errors }
    }
    
    // Validate that all are positive integers
    for (const id of regionIds) {
        if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
            errors.push(`Invalid region ID format: ${id}`)
        }
    }
    
    return { isValid: errors.length === 0, errors }
}

/**
 * Checks which regions exist in the database
 */
const checkRegionsExist = async (client: any, regionIds: number[], req: any): Promise<{existing: Array<{id: number, name: string}>, notFound: number[]}> => {
    const existing: Array<{id: number, name: string}> = []
    const notFound: number[] = []
    
    for (const id of regionIds) {
        try {
            const result = await client.query(queries.checkRegionExists, [id])
            if (result.rows.length > 0) {
                existing.push({
                    id: result.rows[0].region_id,
                    name: result.rows[0].region_name
                })
            } else {
                notFound.push(id)
            }
        } catch (error) {
            await createAndPublishEvent({
                eventName: EVENTS_ADMIN_REGIONS['region.delete.database_error'].eventName,
                req: req,
                payload: {
                    attemptedRegionIds: regionIds,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    timestamp: new Date().toISOString()
                },
                errorData: error instanceof Error ? error.message : 'Unknown error'
            })
            notFound.push(id)
        }
    }
    
    return { existing, notFound }
}

/**
 * Deletes regions from database
 */
export const deleteRegions = async (
    params: DeleteRegionsRequest,
    req: any
): Promise<DeleteRegionsResult> => {
    const client = await pool.connect()
    
    try {
        const { region_ids } = params
        
        // Validate input
        const validation = validateRegionIds(region_ids)
        if (!validation.isValid) {
            await createAndPublishEvent({
                eventName: EVENTS_ADMIN_REGIONS['region.delete.validation.error'].eventName,
                req: req,
                payload: {
                    attemptedRegionIds: region_ids,
                    validationErrors: validation.errors,
                    timestamp: new Date().toISOString()
                },
                errorData: validation.errors.join(', ')
            })
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
        }
        
        // Check which regions exist
        const { existing, notFound } = await checkRegionsExist(client, region_ids, req)
        
        if (existing.length === 0) {
            // All regions not found - log error with detailed information
            await createAndPublishEvent({
                eventName: EVENTS_ADMIN_REGIONS['region.delete.error'].eventName,
                req: req,
                payload: {
                    attemptedRegionIds: region_ids,
                    notFoundRegionIds: notFound,
                    totalRequested: region_ids.length,
                    errorMessage: 'All requested regions not found',
                    timestamp: new Date().toISOString()
                },
                errorData: 'All requested regions not found'
            })
            
            return {
                deletedRegions: [],
                errors: notFound.map(id => ({ region_id: id, error: 'Region not found' })),
                totalRequested: region_ids.length,
                totalDeleted: 0,
                totalErrors: notFound.length
            }
        }
        
        // Delete existing regions
        const deletedRegions: Array<{region_id: number, region_name: string}> = []
        const errors: Array<{region_id: number, error: string}> = []
        
        // Add not found regions to errors
        errors.push(...notFound.map(id => ({ region_id: id, error: 'Region not found' })))
        
        // Delete existing regions
        try {
            const existingIds = existing.map(e => e.id)
            const result = await client.query(queries.deleteRegions, [existingIds])
            
            for (const row of result.rows) {
                deletedRegions.push({
                    region_id: row.region_id,
                    region_name: row.region_name
                })
            }
            
            // Get total regions count after deletion
            const countResult = await client.query(queries.countAllRegions)
            const totalRegionsCount = parseInt(countResult.rows[0].total)
            
            // Log success with detailed information
            await createAndPublishEvent({
                eventName: EVENTS_ADMIN_REGIONS['region.delete.success'].eventName,
                req: req,
                payload: {
                    deletedRegionIds: deletedRegions.map(r => r.region_id),
                    deletedRegionNames: deletedRegions.map(r => r.region_name),
                    totalDeleted: deletedRegions.length,
                    totalRegionsCount: totalRegionsCount,
                    timestamp: new Date().toISOString()
                }
            })
            
        } catch (error) {
            await createAndPublishEvent({
                eventName: EVENTS_ADMIN_REGIONS['region.delete.database_error'].eventName,
                req: req,
                payload: {
                    attemptedRegionIds: existing.map(e => e.id),
                    attemptedRegionNames: existing.map(e => e.name),
                    error: error instanceof Error ? error.message : 'Unknown database error',
                    timestamp: new Date().toISOString()
                },
                errorData: error instanceof Error ? error.message : 'Unknown database error'
            })
            
            // Add all existing regions to errors
            errors.push(...existing.map(e => ({ 
                region_id: e.id, 
                error: 'Database error during deletion' 
            })))
        }
        
        const totalDeleted = deletedRegions.length
        const totalErrors = errors.length
        
        // Log partial success if some regions were deleted but others failed
        if (totalDeleted > 0 && totalErrors > 0) {
            // Get total regions count after partial deletion
            const countResult = await client.query(queries.countAllRegions)
            const totalRegionsCount = parseInt(countResult.rows[0].total)
            
            await createAndPublishEvent({
                eventName: EVENTS_ADMIN_REGIONS['region.delete.partial_success'].eventName,
                req: req,
                payload: {
                    deletedRegionIds: deletedRegions.map(r => r.region_id),
                    deletedRegionNames: deletedRegions.map(r => r.region_name),
                    failedRegionIds: errors.map(e => e.region_id),
                    totalDeleted: totalDeleted,
                    totalErrors: totalErrors,
                    totalRegionsCount: totalRegionsCount,
                    timestamp: new Date().toISOString()
                }
            })
        }
        
        return {
            deletedRegions,
            errors,
            totalRequested: region_ids.length,
            totalDeleted,
            totalErrors
        }
        
    } finally {
        client.release()
    }
}

