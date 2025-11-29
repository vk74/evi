/**
 * service.admin.update.region.ts - version 1.1.0
 * Service for updating regions operations.
 * 
 * Functionality:
 * - Validates input data for updating regions
 * - Checks existence of region to update
 * - Checks uniqueness of region name (excluding current region)
 * - Updates region in database
 * - Handles data transformation and business logic
 * - Manages database interactions and error handling
 * 
 * File: service.admin.update.region.ts
 * 
 * Changes in v1.1.0:
 * - Removed region.update.started event
 * - Removed region.update.validation.error event
 * - Enhanced region.update.success event payload with oldRegionName and newRegionName
 * - Enhanced region.update.not_found event payload with attemptedRegionName
 * - Enhanced region.update.database_error event payload with oldRegionName and attemptedRegionName
 * - Added region.update.error event with detailed payload (regionId, attemptedRegionName, errorMessage, errorCode)
 */

import { Request } from 'express'
import { Pool } from 'pg'
import { pool as pgPool } from '@/core/db/maindb'
import { queries } from './queries.admin.regions'
import type { 
    UpdateRegionRequest, 
    UpdateRegionResponse, 
    RegionError,
    Region
} from './types.admin.regions'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'
import { EVENTS_ADMIN_REGIONS } from './events.admin.regions'

// Type assertion for pool
const pool = pgPool as Pool

/**
 * Validates region update data
 * @param data - Region data to validate
 * @throws {RegionError} When validation fails
 */
async function validateUpdateRegionData(data: UpdateRegionRequest, req: Request): Promise<void> {
    const errors: string[] = []

    // Validate region_id
    if (!data.region_id || typeof data.region_id !== 'number' || data.region_id <= 0) {
        errors.push('Valid region ID is required')
    }

    // Validate region_name - required
    if (!data.region_name || typeof data.region_name !== 'string') {
        errors.push('Region name is required')
    } else {
        const trimmedName = data.region_name.trim()
        
        // Check if empty after trimming
        if (trimmedName.length === 0) {
            errors.push('Region name cannot be empty')
        }
        
        // Check max length (100 characters)
        if (trimmedName.length > 100) {
            errors.push('Region name cannot exceed 100 characters')
        }
        
        // Validate format: only letters (any alphabet) and digits, no special characters or punctuation
        if (trimmedName.length > 0) {
            // Using Unicode property escapes: \p{L} for letters, \p{N} for digits
            // Allows letters from any alphabet (Latin, Cyrillic, Arabic, etc.) and digits
            const validPattern = /^[\p{L}\p{N}]+$/u
            if (!validPattern.test(trimmedName)) {
                errors.push('Region name can only contain letters (any alphabet) and digits. Special characters and punctuation are not allowed')
            }
        }
        
        // Check uniqueness excluding current region if name and id are valid
        if (trimmedName.length > 0 && trimmedName.length <= 100 && data.region_id > 0) {
            try {
                const result = await pool.query(queries.checkRegionNameExistsExcluding, [trimmedName, data.region_id])
                if (result.rows.length > 0) {
                    errors.push('Region with this name already exists')
                }
            } catch (error) {
                createAndPublishEvent({
                    eventName: EVENTS_ADMIN_REGIONS['region.update.duplicate_error'].eventName,
                    req: req,
                    payload: {
                        regionId: data.region_id,
                        regionName: trimmedName,
                        error: error instanceof Error ? error.message : String(error)
                    },
                    errorData: error instanceof Error ? error.message : String(error)
                })
                errors.push('Error checking region name existence')
            }
        }
    }

    if (errors.length > 0) {
        const error: RegionError = {
            code: 'VALIDATION_ERROR',
            message: errors.join('; '),
            details: { errors }
        }
        throw error
    }
}

/**
 * Updates a region in the database
 * @param data - Region data to update
 * @returns Promise<UpdateRegionResponse>
 */
async function updateRegionInDatabase(data: UpdateRegionRequest, req: Request): Promise<UpdateRegionResponse> {
    const client = await pool.connect()
    
    try {
        // Check if region exists and get old name
        const existsResult = await client.query(queries.checkRegionExists, [data.region_id])
        
        if (existsResult.rows.length === 0) {
            await createAndPublishEvent({
                eventName: EVENTS_ADMIN_REGIONS['region.update.not_found'].eventName,
                req: req,
                payload: {
                    regionId: data.region_id,
                    attemptedRegionName: data.region_name.trim()
                }
            })
            
            return {
                success: false,
                message: 'Region not found',
                data: undefined
            }
        }

        const oldRegionName = existsResult.rows[0].region_name
        const trimmedName = data.region_name.trim()

        // Update region in database
        const result = await client.query(queries.updateRegion, [trimmedName, data.region_id])

        if (result.rows.length === 0) {
            await createAndPublishEvent({
                eventName: EVENTS_ADMIN_REGIONS['region.update.database_error'].eventName,
                req: req,
                payload: {
                    regionId: data.region_id,
                    oldRegionName: oldRegionName,
                    attemptedRegionName: trimmedName,
                    error: 'Update query returned no rows'
                },
                errorData: 'Update query returned no rows'
            })
            
            return {
                success: false,
                message: 'Failed to update region',
                data: undefined
            }
        }

        const updatedRegion: Region = {
            region_id: result.rows[0].region_id,
            region_name: result.rows[0].region_name,
            created_at: result.rows[0].created_at,
            updated_at: result.rows[0].updated_at
        }

        createAndPublishEvent({
            eventName: EVENTS_ADMIN_REGIONS['region.update.success'].eventName,
            req: req,
            payload: {
                regionId: updatedRegion.region_id,
                oldRegionName: oldRegionName,
                newRegionName: updatedRegion.region_name
            }
        })

        return {
            success: true,
            message: 'Region updated successfully',
            data: updatedRegion
        }

    } catch (error) {
        await createAndPublishEvent({
            eventName: EVENTS_ADMIN_REGIONS['region.update.database_error'].eventName,
            req: req,
            payload: {
                regionId: data.region_id,
                attemptedRegionName: data.region_name.trim(),
                error: error instanceof Error ? error.message : String(error)
            },
            errorData: error instanceof Error ? error.message : String(error)
        })
        throw {
            code: 'DATABASE_ERROR',
            message: 'Failed to update region in database',
            details: { error }
        }
    } finally {
        client.release()
    }
}

/**
 * Main service function for updating regions
 * @param req - Express Request object
 * @returns Promise<UpdateRegionResponse>
 */
export async function updateRegion(req: Request): Promise<UpdateRegionResponse> {
    // Extract region data from request body (before try to access in catch)
    const regionData: UpdateRegionRequest = req.body
    
    try {
        // Validate region data
        await validateUpdateRegionData(regionData, req)

        // Update region in database
        const result = await updateRegionInDatabase(regionData, req)

        return result

    } catch (error: any) {
        // Log error event with detailed information about failed attempt
        await createAndPublishEvent({
            eventName: EVENTS_ADMIN_REGIONS['region.update.error'].eventName,
            req: req,
            payload: {
                regionId: regionData?.region_id || 0,
                attemptedRegionName: regionData?.region_name?.trim() || 'unknown',
                errorMessage: error.message || 'Unknown error',
                errorCode: error.code || 'UNKNOWN_ERROR'
            },
            errorData: error.message || 'Unknown error'
        })

        // Return structured error response
        return {
            success: false,
            message: error.message || 'Failed to update region',
            data: undefined
        }
    }
}

