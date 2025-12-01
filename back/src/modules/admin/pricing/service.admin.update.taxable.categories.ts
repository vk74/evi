/**
 * version: 1.1.0
 * Service to update taxable categories for pricing admin module (backend).
 * Executes batch operations: create new, update existing, delete removed categories in a single transaction.
 * Includes validation: category_name required, max 100 chars, only letters/digits, uniqueness.
 * Handles region bindings via app.regions_taxable_categories junction table.
 * Publishes events with informative payload for audit purposes.
 * File: service.admin.update.taxable.categories.ts (backend)
 * 
 * Changes in v1.1.0:
 * - Added region binding management: create, update, delete bindings in app.regions_taxable_categories
 * - Added region validation: checks if region exists in app.regions table
 * - Updated event payloads to include region binding information
 */

import { Pool } from 'pg'
import { Request } from 'express'
import { queries } from './queries.admin.pricing'
import type { UpdateTaxableCategoriesRequest, UpdateTaxableCategoriesResponse } from './types.admin.pricing'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'
import { EVENTS_ADMIN_PRICING } from './events.admin.pricing'
import { pool as pgPool } from '@/core/db/maindb'

// Type assertion for pool
const pool = pgPool as Pool

/**
 * Validates category name format (letters of any alphabet, spaces, and hyphens)
 */
function validateCategoryNameFormat(name: string): { isValid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Category name cannot be empty' }
  }
  
  const trimmedName = name.trim()
  
  // Check max length (100 characters)
  if (trimmedName.length > 100) {
    return { isValid: false, error: 'Category name cannot exceed 100 characters' }
  }
  
  // Check format: only letters (any alphabet), spaces, and hyphens
  // Using Unicode property escapes: \p{L} for letters, \s for spaces, - for hyphens
  // Allows letters from any alphabet (Latin, Cyrillic, Arabic, etc.), spaces, and hyphens
  const validPattern = /^[\p{L}\s-]+$/u
  if (!validPattern.test(trimmedName)) {
    return {
      isValid: false,
      error: 'Category name can only contain letters (any alphabet), spaces, and hyphens'
    }
  }
  
  return { isValid: true }
}

/**
 * Updates taxable categories - handles create, update, delete in batch
 */
export async function updateTaxableCategories(
  req: Request,
  payload: UpdateTaxableCategoriesRequest
): Promise<UpdateTaxableCategoriesResponse> {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // Validate payload
    if (!payload.categories || !Array.isArray(payload.categories)) {
      throw new Error('validation: categories must be an array')
    }

    // Fetch existing categories from database with region bindings
    const existingResult = await client.query(queries.fetchAllTaxableCategories)
    const existingCategories = existingResult.rows.map((row: any) => ({
      category_id: row.category_id,
      category_name: row.category_name,
      region: row.region || null
    }))

    // Prepare arrays for batch operations
    const categoriesToCreate: Array<{ category_name: string; region?: string | null }> = []
    const categoriesToUpdate: Array<{ category_id: number; category_name: string; region?: string | null }> = []
    const categoriesToDelete: number[] = []
    
    // Track region bindings operations
    const regionBindingsCreated: Array<{ category_id: number; region: string }> = []
    const regionBindingsUpdated: Array<{ category_id: number; oldRegion: string | null; newRegion: string | null }> = []
    const regionBindingsDeleted: Array<{ category_id: number; region: string }> = []

    // Validate all categories and determine operations
    const validationErrors: Array<{ category_name: string; error: string }> = []
    
    for (const category of payload.categories) {
      // Skip categories marked for deletion
      if (category._delete) {
        // Category should be deleted - find existing ID
        if (category.category_id && category.category_id > 0) {
          const exists = existingCategories.find(c => c.category_id === category.category_id)
          if (exists) {
            categoriesToDelete.push(category.category_id)
          }
        }
        continue
      }

      // Validate category name
      if (!category.category_name || typeof category.category_name !== 'string') {
        validationErrors.push({
          category_name: category.category_name || 'unknown',
          error: 'Category name is required'
        })
        continue
      }

      const formatValidation = validateCategoryNameFormat(category.category_name)
      if (!formatValidation.isValid) {
        validationErrors.push({
          category_name: category.category_name,
          error: formatValidation.error || 'Invalid category name format'
        })
        continue
      }

      const trimmedName = category.category_name.trim()
      const categoryId = category.category_id

      // Validate region if provided
      let regionValue: string | null = null
      if (category.region !== undefined && category.region !== null && category.region.trim() !== '') {
        const trimmedRegion = category.region.trim()
        // Check if region exists in app.regions table
        const regionCheck = await client.query(queries.checkRegionExists, [trimmedRegion])
        if (regionCheck.rows.length === 0) {
          validationErrors.push({
            category_name: trimmedName,
            error: `Region "${trimmedRegion}" does not exist in regions table`
          })
          continue
        }
        regionValue = trimmedRegion
      }

      // Determine operation based on category_id
      if (!categoryId || categoryId < 0) {
        // New category (negative or missing ID)
        categoriesToCreate.push({ category_name: trimmedName, region: regionValue })
      } else {
        // Existing category - check if name or region changed
        const existing = existingCategories.find(c => c.category_id === categoryId)
        if (!existing) {
          validationErrors.push({
            category_name: trimmedName,
            error: `Category with ID ${categoryId} not found in database`
          })
          continue
        }

        const nameChanged = existing.category_name !== trimmedName
        const regionChanged = existing.region !== regionValue

        if (nameChanged || regionChanged) {
          // Name or region changed - need to update
          categoriesToUpdate.push({ category_id: categoryId, category_name: trimmedName, region: regionValue })
        }
      }
    }

    // Find categories to delete (existing categories not in request)
    const requestCategoryIds = new Set(
      payload.categories
        .filter(c => c.category_id && c.category_id > 0 && !c._delete)
        .map(c => c.category_id as number)
    )
    
    for (const existing of existingCategories) {
      if (!requestCategoryIds.has(existing.category_id)) {
        categoriesToDelete.push(existing.category_id)
      }
    }

    // Check uniqueness for all categories to create/update
    const allNamesToCheck = new Map<string, { category_id?: number; category_name: string }>()
    
    for (const cat of categoriesToCreate) {
      const lowerName = cat.category_name.toLowerCase()
      if (allNamesToCheck.has(lowerName)) {
        validationErrors.push({
          category_name: cat.category_name,
          error: 'Duplicate category name in request'
        })
      } else {
        allNamesToCheck.set(lowerName, cat)
      }

      // Check against database
      const nameCheck = await client.query(queries.checkTaxableCategoryNameExists, [cat.category_name])
      if (nameCheck.rows.length > 0) {
        validationErrors.push({
          category_name: cat.category_name,
          error: 'Category with this name already exists in database'
        })
      }
    }

    for (const cat of categoriesToUpdate) {
      const lowerName = cat.category_name.toLowerCase()
      const existingWithSameName = allNamesToCheck.get(lowerName)
      if (existingWithSameName && existingWithSameName.category_id !== cat.category_id) {
        validationErrors.push({
          category_name: cat.category_name,
          error: 'Duplicate category name in request'
        })
      } else {
        allNamesToCheck.set(lowerName, cat)
      }

      // Check against database (excluding current category)
      const nameCheck = await client.query(queries.checkTaxableCategoryNameExistsExcluding, [
        cat.category_name,
        cat.category_id
      ])
      if (nameCheck.rows.length > 0) {
        validationErrors.push({
          category_name: cat.category_name,
          error: 'Category with this name already exists in database'
        })
      }
    }

    // If validation errors exist, throw with detailed context
    if (validationErrors.length > 0) {
      const errorMessage = `Validation failed for ${validationErrors.length} category(ies)`
      throw new Error(`validation: ${errorMessage}. Details: ${JSON.stringify(validationErrors)}`)
    }

    // Execute batch operations
    // 1. Delete categories (region bindings will be deleted automatically via CASCADE)
    if (categoriesToDelete.length > 0) {
      await client.query(queries.deleteTaxableCategories, [categoriesToDelete])
    }

    // 2. Create new categories
    for (const category of categoriesToCreate) {
      const insertResult = await client.query(queries.insertTaxableCategory, [category.category_name])
      const newCategoryId = insertResult.rows[0]?.category_id
      
      if (newCategoryId && category.region) {
        // Get region_id from region_name
        const regionResult = await client.query(queries.checkRegionExists, [category.region])
        if (regionResult.rows.length > 0) {
          const regionId = regionResult.rows[0].region_id
          await client.query(queries.insertCategoryRegion, [regionId, newCategoryId])
          regionBindingsCreated.push({ category_id: newCategoryId, region: category.region })
        }
      }
    }

    // 3. Update existing categories
    for (const category of categoriesToUpdate) {
      const existing = existingCategories.find(c => c.category_id === category.category_id)
      const oldRegion = existing?.region || null
      const newRegion = category.region || null
      
      // Update category name if changed
      if (existing && existing.category_name !== category.category_name) {
        await client.query(queries.updateTaxableCategory, [category.category_name, category.category_id])
      }
      
      // Handle region binding changes
      if (oldRegion !== newRegion) {
        // Delete old binding if exists
        if (oldRegion) {
          const oldRegionResult = await client.query(queries.checkRegionExists, [oldRegion])
          if (oldRegionResult.rows.length > 0) {
            const oldRegionId = oldRegionResult.rows[0].region_id
            await client.query(queries.deleteCategoryRegion, [oldRegionId, category.category_id])
            regionBindingsDeleted.push({ category_id: category.category_id, region: oldRegion })
          }
        }
        
        // Create new binding if region provided
        if (newRegion) {
          const newRegionResult = await client.query(queries.checkRegionExists, [newRegion])
          if (newRegionResult.rows.length > 0) {
            const newRegionId = newRegionResult.rows[0].region_id
            await client.query(queries.insertCategoryRegion, [newRegionId, category.category_id])
            regionBindingsCreated.push({ category_id: category.category_id, region: newRegion })
          }
        }
        
        regionBindingsUpdated.push({
          category_id: category.category_id,
          oldRegion,
          newRegion
        })
      }
    }

    await client.query('COMMIT')

    const totalRecords = categoriesToCreate.length + categoriesToUpdate.length + (existingCategories.length - categoriesToDelete.length)

    // Publish success event
    try {
      await createAndPublishEvent({
        eventName: EVENTS_ADMIN_PRICING['taxableCategories.update.success'].eventName,
        req: req,
        payload: {
          totalRecords,
          summary: {
            created: categoriesToCreate.length,
            updated: categoriesToUpdate.length,
            deleted: categoriesToDelete.length
          },
          created: categoriesToCreate.length > 0 ? categoriesToCreate.map(c => c.category_name) : undefined,
          updated: categoriesToUpdate.length > 0 ? categoriesToUpdate.map(c => ({ id: c.category_id, name: c.category_name })) : undefined,
          deleted: categoriesToDelete.length > 0 ? categoriesToDelete : undefined,
          regionsBindings: {
            created: regionBindingsCreated.length > 0 ? regionBindingsCreated : undefined,
            updated: regionBindingsUpdated.length > 0 ? regionBindingsUpdated : undefined,
            deleted: regionBindingsDeleted.length > 0 ? regionBindingsDeleted : undefined
          }
        }
      })
    } catch (eventError) {
      // Don't throw - transaction is already committed
    }

    return {
      success: true,
      message: 'Taxable categories updated successfully',
      data: {
        totalRecords
      }
    }
  } catch (err) {
    await client.query('ROLLBACK')

    // Publish rollback event
    try {
      await createAndPublishEvent({
        eventName: EVENTS_ADMIN_PRICING['taxableCategories.update.transaction.rollback'].eventName,
        req: req,
        payload: {
          error: err instanceof Error ? err.message : String(err),
          attemptedCategoriesCount: payload.categories?.length || 0,
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
          eventName: EVENTS_ADMIN_PRICING['taxableCategories.update.validation.error'].eventName,
          req: req,
          payload: {
            error: err.message,
            ...validationDetails,
            attemptedCategoriesCount: payload.categories?.length || 0
          },
          errorData: err.message
        })
      } catch (eventError) {
        // Don't throw - already in error state
      }
    } else {
      try {
        await createAndPublishEvent({
          eventName: EVENTS_ADMIN_PRICING['taxableCategories.update.database_error'].eventName,
          req: req,
          payload: {
            error: err instanceof Error ? err.message : String(err),
            attemptedCategoriesCount: payload.categories?.length || 0,
            operation: 'update_taxable_categories'
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

