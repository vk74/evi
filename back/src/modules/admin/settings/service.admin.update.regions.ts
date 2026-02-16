/**
 * version: 1.0.1
 * Service to update regions for admin settings module (backend).
 * Executes batch operations: create new, update existing, delete removed regions in a single transaction.
 * Includes validation: region_name required, max 100 chars, letters/digits/hyphen/underscore, uniqueness.
 * Publishes events with informative payload for audit purposes.
 * File: service.admin.update.regions.ts (backend)
 *
 * Changes in v1.0.1:
 * - Updated validation to allow hyphen (-) and underscore (_) in region names
 */

import { Pool } from 'pg'
import { Request } from 'express'
import { queries } from './queries.admin.regions'
import type { UpdateRegionsRequest, UpdateRegionsResponse } from './types.admin.regions'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'
import { EVENTS_ADMIN_REGIONS } from './events.admin.regions'
import { pool as pgPool } from '@/core/db/maindb'

// Type assertion for pool
const pool = pgPool as Pool

/**
 * Validates region name format (only letters and digits, any alphabet)
 */
function validateRegionNameFormat(name: string): { isValid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Region name cannot be empty' }
  }
  
  const trimmedName = name.trim()
  
  // Check max length (100 characters)
  if (trimmedName.length > 100) {
    return { isValid: false, error: 'Region name cannot exceed 100 characters' }
  }
  
  // Check format: only letters (any alphabet), digits, hyphen and underscore
  // Using Unicode property escapes: \p{L} for letters, \p{N} for digits
  const validPattern = /^[\p{L}\p{N}_-]+$/u
  if (!validPattern.test(trimmedName)) {
    return {
      isValid: false,
      error: 'Region name can only contain letters (any alphabet), digits, hyphen and underscore. Other special characters and punctuation are not allowed'
    }
  }
  
  return { isValid: true }
}

/**
 * Updates regions - handles create, update, delete in batch
 */
export async function updateRegions(
  req: Request,
  payload: UpdateRegionsRequest
): Promise<UpdateRegionsResponse> {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // Validate payload
    if (!payload.regions || !Array.isArray(payload.regions)) {
      throw new Error('validation: regions must be an array')
    }

    // Fetch existing regions from database
    const existingResult = await client.query(queries.fetchAllRegions)
    const existingRegions = existingResult.rows.map((row: any) => ({
      region_id: row.region_id,
      region_name: row.region_name
    }))

    // Prepare arrays for batch operations
    const regionsToCreate: Array<{ region_name: string }> = []
    const regionsToUpdate: Array<{ region_id: number; region_name: string }> = []
    const regionsToDelete: number[] = []

    // Validate all regions and determine operations
    const validationErrors: Array<{ region_name: string; error: string }> = []
    
    for (const region of payload.regions) {
      // Skip regions marked for deletion
      if (region._delete) {
        // Region should be deleted - find existing ID
        if (region.region_id && region.region_id > 0) {
          const exists = existingRegions.find(r => r.region_id === region.region_id)
          if (exists) {
            regionsToDelete.push(region.region_id)
          }
        }
        continue
      }

      // Validate region name
      if (!region.region_name || typeof region.region_name !== 'string') {
        validationErrors.push({
          region_name: region.region_name || 'unknown',
          error: 'Region name is required'
        })
        continue
      }

      const formatValidation = validateRegionNameFormat(region.region_name)
      if (!formatValidation.isValid) {
        validationErrors.push({
          region_name: region.region_name,
          error: formatValidation.error || 'Invalid region name format'
        })
        continue
      }

      const trimmedName = region.region_name.trim()
      const regionId = region.region_id

      // Determine operation based on region_id
      if (!regionId || regionId < 0) {
        // New region (negative or missing ID)
        regionsToCreate.push({ region_name: trimmedName })
      } else {
        // Existing region - check if name changed
        const existing = existingRegions.find(r => r.region_id === regionId)
        if (!existing) {
          validationErrors.push({
            region_name: trimmedName,
            error: `Region with ID ${regionId} not found in database`
          })
          continue
        }

        if (existing.region_name !== trimmedName) {
          // Name changed - need to update
          regionsToUpdate.push({ region_id: regionId, region_name: trimmedName })
        }
      }
    }

    // Find regions to delete (existing regions not in request)
    const requestRegionIds = new Set(
      payload.regions
        .filter(r => r.region_id && r.region_id > 0 && !r._delete)
        .map(r => r.region_id as number)
    )
    
    for (const existing of existingRegions) {
      if (!requestRegionIds.has(existing.region_id)) {
        regionsToDelete.push(existing.region_id)
      }
    }

    // Check uniqueness for all regions to create/update
    const allNamesToCheck = new Map<string, { region_id?: number; region_name: string }>()
    
    for (const reg of regionsToCreate) {
      const lowerName = reg.region_name.toLowerCase()
      if (allNamesToCheck.has(lowerName)) {
        validationErrors.push({
          region_name: reg.region_name,
          error: 'Duplicate region name in request'
        })
      } else {
        allNamesToCheck.set(lowerName, reg)
      }

      // Check against database
      const nameCheck = await client.query(queries.checkRegionNameExists, [reg.region_name])
      if (nameCheck.rows.length > 0) {
        validationErrors.push({
          region_name: reg.region_name,
          error: 'Region with this name already exists in database'
        })
      }
    }

    for (const reg of regionsToUpdate) {
      const lowerName = reg.region_name.toLowerCase()
      const existingWithSameName = allNamesToCheck.get(lowerName)
      if (existingWithSameName && existingWithSameName.region_id !== reg.region_id) {
        validationErrors.push({
          region_name: reg.region_name,
          error: 'Duplicate region name in request'
        })
      } else {
        allNamesToCheck.set(lowerName, reg)
      }

      // Check against database (excluding current region)
      const nameCheck = await client.query(queries.checkRegionNameExistsExcluding, [
        reg.region_name,
        reg.region_id
      ])
      if (nameCheck.rows.length > 0) {
        validationErrors.push({
          region_name: reg.region_name,
          error: 'Region with this name already exists in database'
        })
      }
    }

    // If validation errors exist, throw with detailed context
    if (validationErrors.length > 0) {
      const errorMessage = `Validation failed for ${validationErrors.length} region(s)`
      throw new Error(`validation: ${errorMessage}. Details: ${JSON.stringify(validationErrors)}`)
    }

    // Execute batch operations
    // 1. Delete regions
    if (regionsToDelete.length > 0) {
      await client.query(queries.deleteRegions, [regionsToDelete])
    }

    // 2. Create new regions
    for (const region of regionsToCreate) {
      await client.query(queries.createRegion, [region.region_name])
    }

    // 3. Update existing regions
    for (const region of regionsToUpdate) {
      await client.query(queries.updateRegion, [region.region_name, region.region_id])
    }

    await client.query('COMMIT')

    const totalRecords = regionsToCreate.length + regionsToUpdate.length + (existingRegions.length - regionsToDelete.length)

    // Publish success event
    try {
      await createAndPublishEvent({
        eventName: EVENTS_ADMIN_REGIONS['regions.update.success'].eventName,
        req: req,
        payload: {
          totalRecords,
          summary: {
            created: regionsToCreate.length,
            updated: regionsToUpdate.length,
            deleted: regionsToDelete.length
          },
          created: regionsToCreate.length > 0 ? regionsToCreate.map(r => r.region_name) : undefined,
          updated: regionsToUpdate.length > 0 ? regionsToUpdate.map(r => ({ id: r.region_id, name: r.region_name })) : undefined,
          deleted: regionsToDelete.length > 0 ? regionsToDelete : undefined
        }
      })
    } catch (eventError) {
      // Don't throw - transaction is already committed
    }

    return {
      success: true,
      message: 'Regions updated successfully',
      data: {
        totalRecords
      }
    }
  } catch (err) {
    await client.query('ROLLBACK')

    // Publish rollback event
    try {
      await createAndPublishEvent({
        eventName: EVENTS_ADMIN_REGIONS['regions.update.transaction.rollback'].eventName,
        req: req,
        payload: {
          error: err instanceof Error ? err.message : String(err),
          attemptedRegionsCount: payload.regions?.length || 0,
          reason: err instanceof Error && err.message.startsWith('validation:') ? 'validation_error' : 'database_error'
        },
        errorData: err instanceof Error ? err.message : String(err)
      })
    } catch (eventError) {
      // Don't throw - already in error state
    }

    // Publish validation or database error event
    if (err instanceof Error && err.message.startsWith('validation:')) {
      try {
        let validationDetails: any = { error: err.message }
        try {
          const detailsMatch = err.message.match(/Details: (.+)$/)
          if (detailsMatch) {
            validationDetails.validationErrors = JSON.parse(detailsMatch[1])
          }
        } catch (parseError) {
          // If parsing fails, just use the error message
        }

        await createAndPublishEvent({
          eventName: EVENTS_ADMIN_REGIONS['regions.update.validation.error'].eventName,
          req: req,
          payload: {
            error: err.message,
            ...validationDetails,
            attemptedRegionsCount: payload.regions?.length || 0
          },
          errorData: err.message
        })
      } catch (eventError) {
        // Don't throw - already in error state
      }
    } else {
      try {
        await createAndPublishEvent({
          eventName: EVENTS_ADMIN_REGIONS['regions.update.database_error'].eventName,
          req: req,
          payload: {
            error: err instanceof Error ? err.message : String(err),
            attemptedRegionsCount: payload.regions?.length || 0,
            operation: 'update_regions'
          },
          errorData: err instanceof Error ? err.message : String(err)
        })
      } catch (eventError) {
        // Don't throw - already in error state
      }
    }

    throw err
  } finally {
    client.release()
  }
}

