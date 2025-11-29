/**
 * service.admin.create.region.ts - version 1.0.0
 * Service for creating regions operations.
 * 
 * Functionality:
 * - Validates input data for creating regions
 * - Checks uniqueness of region name
 * - Creates new region in database
 * - Handles data transformation and business logic
 * - Manages database interactions and error handling
 * 
 * File: service.admin.create.region.ts
 */

import { Request } from 'express'
import { Pool } from 'pg'
import { pool as pgPool } from '@/core/db/maindb'
import { queries } from './queries.admin.regions'
import type { 
    CreateRegionRequest, 
    CreateRegionResponse, 
    RegionError,
    Region
} from './types.admin.regions'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'
import { EVENTS_ADMIN_REGIONS } from './events.admin.regions'

// Type assertion for pool
const pool = pgPool as Pool

/**
 * Validates region creation data
 * @param data - Region data to validate
 * @throws {RegionError} When validation fails
 */
async function validateCreateRegionData(data: CreateRegionRequest, req: Request): Promise<void> {
    const errors: string[] = []

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
        
        // Check uniqueness if name is valid
        if (trimmedName.length > 0 && trimmedName.length <= 100) {
            try {
                const result = await pool.query(queries.checkRegionNameExists, [trimmedName])
                if (result.rows.length > 0) {
                    errors.push('Region with this name already exists')
                }
            } catch (error) {
                createAndPublishEvent({
                    eventName: EVENTS_ADMIN_REGIONS['region.create.duplicate_error'].eventName,
                    req: req,
                    payload: {
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
 * Creates a new region in the database
 * @param data - Region data to create
 * @returns Promise<CreateRegionResponse>
 */
async function createRegionInDatabase(data: CreateRegionRequest, req: Request): Promise<CreateRegionResponse> {
    const client = await pool.connect()
    
    try {
        const trimmedName = data.region_name.trim()

        // Create region in database
        const result = await client.query(queries.createRegion, [trimmedName])

        const createdRegion: Region = {
            region_id: result.rows[0].region_id,
            region_name: result.rows[0].region_name,
            created_at: result.rows[0].created_at,
            updated_at: result.rows[0].updated_at
        }

        createAndPublishEvent({
            eventName: EVENTS_ADMIN_REGIONS['region.create.success'].eventName,
            req: req,
            payload: {
                regionId: createdRegion.region_id,
                regionName: createdRegion.region_name
            }
        })

        return {
            success: true,
            message: 'Region created successfully',
            data: createdRegion
        }

    } catch (error) {
        await createAndPublishEvent({
            eventName: EVENTS_ADMIN_REGIONS['region.create.database_error'].eventName,
            req: req,
            payload: {
                error: error instanceof Error ? error.message : String(error)
            },
            errorData: error instanceof Error ? error.message : String(error)
        })
        throw {
            code: 'DATABASE_ERROR',
            message: 'Failed to create region in database',
            details: { error }
        }
    } finally {
        client.release()
    }
}

/**
 * Main service function for creating regions
 * @param req - Express Request object
 * @returns Promise<CreateRegionResponse>
 */
export async function createRegion(req: Request): Promise<CreateRegionResponse> {
    try {
        // Extract region data from request body
        const regionData: CreateRegionRequest = req.body

        createAndPublishEvent({
            eventName: EVENTS_ADMIN_REGIONS['region.create.started'].eventName,
            req: req,
            payload: {
                regionName: regionData.region_name
            }
        })

        // Validate region data
        await validateCreateRegionData(regionData, req)

        // Create region in database
        const result = await createRegionInDatabase(regionData, req)

        return result

    } catch (error: any) {
        createAndPublishEvent({
            eventName: EVENTS_ADMIN_REGIONS['region.create.validation.error'].eventName,
            req: req,
            payload: {
                error: error.message || 'Unknown validation error'
            },
            errorData: error.message || 'Unknown validation error'
        })

        // Return structured error response
        return {
            success: false,
            message: error.message || 'Failed to create region',
            data: undefined
        }
    }
}

