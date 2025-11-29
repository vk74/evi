/**
 * service.admin.delete.regions.ts - version 1.0.0
 * Service for deleting regions with validation and error handling.
 * 
 * Handles database operations for region deletion with proper logging.
 * 
 * File: service.admin.delete.regions.ts
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
const checkRegionsExist = async (client: any, regionIds: number[], req: any): Promise<{existing: number[], notFound: number[]}> => {
    const existing: number[] = []
    const notFound: number[] = []
    
    for (const id of regionIds) {
        try {
            const result = await client.query(queries.checkRegionExists, [id])
            if (result.rows.length > 0) {
                existing.push(id)
                await createAndPublishEvent({
                    eventName: EVENTS_ADMIN_REGIONS['region.delete.exists'].eventName,
                    req: req,
                    payload: {
                        regionId: id,
                        timestamp: new Date().toISOString()
                    }
                })
            } else {
                notFound.push(id)
                await createAndPublishEvent({
                    eventName: EVENTS_ADMIN_REGIONS['region.delete.not_found'].eventName,
                    req: req,
                    payload: {
                        regionId: id,
                        timestamp: new Date().toISOString()
                    }
                })
            }
        } catch (error) {
            await createAndPublishEvent({
                eventName: EVENTS_ADMIN_REGIONS['region.delete.database_error'].eventName,
                req: req,
                payload: {
                    regionId: id,
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
                    errors: validation.errors,
                    region_ids: region_ids,
                    timestamp: new Date().toISOString()
                },
                errorData: validation.errors.join(', ')
            })
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
        }
        
        await createAndPublishEvent({
            eventName: EVENTS_ADMIN_REGIONS['region.delete.validation.success'].eventName,
            req: req,
            payload: {
                region_ids: region_ids,
                timestamp: new Date().toISOString()
            }
        })
        
        // Check which regions exist
        const { existing, notFound } = await checkRegionsExist(client, region_ids, req)
        
        if (existing.length === 0) {
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
            const result = await client.query(queries.deleteRegions, [existing])
            
            for (const row of result.rows) {
                deletedRegions.push({
                    region_id: row.region_id,
                    region_name: row.region_name
                })
            }
            
            // Log success
            await createAndPublishEvent({
                eventName: EVENTS_ADMIN_REGIONS['region.delete.success'].eventName,
                req: req,
                payload: {
                    deletedRegions: deletedRegions.map(r => r.region_id),
                    totalDeleted: deletedRegions.length,
                    timestamp: new Date().toISOString()
                }
            })
            
        } catch (error) {
            await createAndPublishEvent({
                eventName: EVENTS_ADMIN_REGIONS['region.delete.database_error'].eventName,
                req: req,
                payload: {
                    regionIds: existing,
                    error: error instanceof Error ? error.message : 'Unknown database error',
                    timestamp: new Date().toISOString()
                },
                errorData: error instanceof Error ? error.message : 'Unknown database error'
            })
            
            // Add all existing regions to errors
            errors.push(...existing.map(id => ({ 
                region_id: id, 
                error: 'Database error during deletion' 
            })))
        }
        
        const totalDeleted = deletedRegions.length
        const totalErrors = errors.length
        
        // Log partial success if some regions were deleted but others failed
        if (totalDeleted > 0 && totalErrors > 0) {
            await createAndPublishEvent({
                eventName: EVENTS_ADMIN_REGIONS['region.delete.partial_success'].eventName,
                req: req,
                payload: {
                    deletedRegions: deletedRegions.map(r => r.region_id),
                    failedRegions: errors.map(e => e.region_id),
                    totalDeleted,
                    totalErrors,
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

