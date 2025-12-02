/**
 * version: 1.0.0
 * Service to update tax regions bindings for pricing admin module (backend).
 * Executes batch operations: create, update, delete bindings for one region in a single transaction.
 * Includes validation: region_id exists, category_id exists, vat_rate in range 0-99 or null.
 * Publishes events with informative payload for audit purposes.
 * File: service.admin.update.tax.regions.ts (backend)
 */

import { Pool } from 'pg'
import { Request } from 'express'
import { queries } from './queries.admin.pricing'
import type { UpdateTaxRegionsRequest, UpdateTaxRegionsResponse } from './types.admin.pricing'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'
import { EVENTS_ADMIN_PRICING } from './events.admin.pricing'
import { pool as pgPool } from '@/core/db/maindb'

// Type assertion for pool
const pool = pgPool as Pool

/**
 * Validates VAT rate value (0-99 or null)
 */
function validateVATRate(vatRate: number | null | undefined): { isValid: boolean; error?: string } {
  if (vatRate === null || vatRate === undefined) {
    return { isValid: true } // null is valid (means no binding)
  }
  
  const numValue = Number(vatRate)
  if (isNaN(numValue)) {
    return { isValid: false, error: 'VAT rate must be a number' }
  }
  
  if (numValue < 0 || numValue > 99) {
    return { isValid: false, error: 'VAT rate must be between 0 and 99' }
  }
  
  // Ensure it's an integer
  if (numValue !== Math.floor(numValue)) {
    return { isValid: false, error: 'VAT rate must be an integer' }
  }
  
  return { isValid: true }
}

/**
 * Updates tax regions bindings for one region - handles create, update, delete in batch
 */
export async function updateTaxRegions(
  req: Request,
  payload: UpdateTaxRegionsRequest
): Promise<UpdateTaxRegionsResponse> {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // Validate payload
    if (!payload.region_id || typeof payload.region_id !== 'number') {
      throw new Error('validation: region_id is required and must be a number')
    }

    if (!payload.bindings || !Array.isArray(payload.bindings)) {
      throw new Error('validation: bindings must be an array')
    }

    // Validate region exists
    const regionCheck = await client.query(queries.checkRegionExistsById, [payload.region_id])
    if (regionCheck.rows.length === 0) {
      throw new Error(`validation: region with ID ${payload.region_id} does not exist`)
    }

    // Fetch existing bindings for this region
    const existingBindingsResult = await client.query(queries.fetchRegionTaxableCategoriesBindings, [payload.region_id])
    const existingBindings = existingBindingsResult.rows.map((row: any) => ({
      category_id: row.category_id,
      vat_rate: row.vat_rate !== null && row.vat_rate !== undefined ? Number(row.vat_rate) : null
    }))

    // Validate all bindings and determine operations
    const validationErrors: Array<{ category_id: number; error: string }> = []
    const bindingsToCreate: Array<{ category_id: number; vat_rate: number }> = []
    const bindingsToUpdate: Array<{ category_id: number; vat_rate: number | null }> = []
    const bindingsToDelete: number[] = []
    
    // Track operations for events
    const created: Array<{ category_id: number; vat_rate: number }> = []
    const updated: Array<{ category_id: number; oldVatRate: number | null; newVatRate: number | null }> = []
    const deleted: Array<{ category_id: number }> = []

    // Process bindings from request
    for (const binding of payload.bindings) {
      // Validate category_id
      if (!binding.category_id || typeof binding.category_id !== 'number') {
        validationErrors.push({
          category_id: binding.category_id || 0,
          error: 'category_id is required and must be a number'
        })
        continue
      }

      // Validate category exists
      const categoryCheck = await client.query(queries.checkTaxableCategoryExistsById, [binding.category_id])
      if (categoryCheck.rows.length === 0) {
        validationErrors.push({
          category_id: binding.category_id,
          error: `Category with ID ${binding.category_id} does not exist`
        })
        continue
      }

      // Validate VAT rate
      const vatRateValidation = validateVATRate(binding.vat_rate)
      if (!vatRateValidation.isValid) {
        validationErrors.push({
          category_id: binding.category_id,
          error: vatRateValidation.error || 'Invalid VAT rate'
        })
        continue
      }

      const normalizedVatRate = binding.vat_rate !== null && binding.vat_rate !== undefined 
        ? Number(binding.vat_rate) 
        : null

      // Find existing binding
      const existingBinding = existingBindings.find(b => b.category_id === binding.category_id)

      if (normalizedVatRate === null) {
        // VAT rate is null - means delete binding if exists
        if (existingBinding) {
          bindingsToDelete.push(binding.category_id)
          deleted.push({ category_id: binding.category_id })
        }
      } else {
        // VAT rate is provided - create or update
        if (!existingBinding) {
          // Create new binding
          bindingsToCreate.push({ category_id: binding.category_id, vat_rate: normalizedVatRate })
          created.push({ category_id: binding.category_id, vat_rate: normalizedVatRate })
        } else if (existingBinding.vat_rate !== normalizedVatRate) {
          // Update existing binding (vat_rate changed)
          bindingsToUpdate.push({ category_id: binding.category_id, vat_rate: normalizedVatRate })
          updated.push({
            category_id: binding.category_id,
            oldVatRate: existingBinding.vat_rate,
            newVatRate: normalizedVatRate
          })
        }
        // If vat_rate is the same, no operation needed
      }
    }

    // Find bindings to delete (existing bindings not in request)
    const requestCategoryIds = new Set(
      payload.bindings
        .filter(b => b.vat_rate !== null && b.vat_rate !== undefined)
        .map(b => b.category_id)
    )
    
    for (const existing of existingBindings) {
      if (!requestCategoryIds.has(existing.category_id)) {
        bindingsToDelete.push(existing.category_id)
        deleted.push({ category_id: existing.category_id })
      }
    }

    // If validation errors exist, throw with detailed context
    if (validationErrors.length > 0) {
      const errorMessage = `Validation failed for ${validationErrors.length} binding(s)`
      throw new Error(`validation: ${errorMessage}. Details: ${JSON.stringify(validationErrors)}`)
    }

    // Execute batch operations
    // 1. Delete bindings
    for (const categoryId of bindingsToDelete) {
      await client.query(queries.deleteRegionCategoryBinding, [payload.region_id, categoryId])
    }

    // 2. Create new bindings
    for (const binding of bindingsToCreate) {
      await client.query(queries.upsertRegionCategoryBinding, [
        payload.region_id,
        binding.category_id,
        binding.vat_rate
      ])
    }

    // 3. Update existing bindings
    for (const binding of bindingsToUpdate) {
      await client.query(queries.upsertRegionCategoryBinding, [
        payload.region_id,
        binding.category_id,
        binding.vat_rate
      ])
    }

    await client.query('COMMIT')

    const totalBindings = bindingsToCreate.length + bindingsToUpdate.length + 
      (existingBindings.length - bindingsToDelete.length)

    // Publish success event
    try {
      await createAndPublishEvent({
        eventName: EVENTS_ADMIN_PRICING['taxRegions.update.success'].eventName,
        req: req,
        payload: {
          region_id: payload.region_id,
          totalBindings,
          summary: {
            created: bindingsToCreate.length,
            updated: bindingsToUpdate.length,
            deleted: bindingsToDelete.length
          },
          created: created.length > 0 ? created : undefined,
          updated: updated.length > 0 ? updated : undefined,
          deleted: deleted.length > 0 ? deleted : undefined
        }
      })
    } catch (eventError) {
      // Don't throw - transaction is already committed
    }

    return {
      success: true,
      message: 'Tax regions bindings updated successfully',
      data: {
        totalBindings,
        created: bindingsToCreate.length,
        updated: bindingsToUpdate.length,
        deleted: bindingsToDelete.length
      }
    }
  } catch (err) {
    await client.query('ROLLBACK')

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
          eventName: EVENTS_ADMIN_PRICING['taxRegions.update.validation_error'].eventName,
          req: req,
          payload: {
            error: err.message,
            ...validationDetails,
            region_id: payload.region_id,
            attemptedBindingsCount: payload.bindings?.length || 0
          },
          errorData: err.message
        })
      } catch (eventError) {
        // Don't throw - already in error state
      }
    } else {
      try {
        await createAndPublishEvent({
          eventName: EVENTS_ADMIN_PRICING['taxRegions.update.database_error'].eventName,
          req: req,
          payload: {
            error: err instanceof Error ? err.message : String(err),
            region_id: payload.region_id,
            attemptedBindingsCount: payload.bindings?.length || 0,
            operation: 'update_tax_regions'
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

