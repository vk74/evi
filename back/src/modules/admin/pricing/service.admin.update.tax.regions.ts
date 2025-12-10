/**
 * version: 1.1.0
 * Service to update tax regions bindings for pricing admin module (backend).
 * Executes batch operations: create, update, delete bindings for one region in a single transaction.
 * Includes validation: region_id exists, category name valid, vat_rate in range 0-99 or null.
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
    return { isValid: true } // null is valid
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
      id: row.id,
      category_name: row.category_name,
      vat_rate: row.vat_rate !== null && row.vat_rate !== undefined ? Number(row.vat_rate) : null
    }))

    // Determine operations
    const validationErrors: Array<{ index: number; error: string }> = []
    
    // Process input bindings
    // Input structure: { id?: number, category_name: string, vat_rate: number | null, _delete?: boolean }
    // Note: UpdateTaxRegionsRequest types need to be aligned with this
    const bindingsInput = payload.bindings as any[] 

    const bindingsToCreate: Array<{ category_name: string; vat_rate: number | null }> = []
    const bindingsToUpdate: Array<{ id: number; category_name: string; vat_rate: number | null }> = []
    const bindingsToDelete: number[] = []

    // Track processed IDs to find deletions that weren't explicit (if full sync mode)
    // Here we assume client sends ALL bindings for the region, so we can infer deletions
    const processedIds = new Set<number>()

    for (let i = 0; i < bindingsInput.length; i++) {
      const binding = bindingsInput[i]
      
      // Skip marked for delete in processing list (will handle explicit delete later if needed)
      // but if client sends full list, missing items are deleted
      
      if (binding._delete) {
         if (binding.id) {
             bindingsToDelete.push(binding.id)
             processedIds.add(binding.id)
         }
         continue
      }

      // Validation
      if (!binding.category_name || typeof binding.category_name !== 'string' || !binding.category_name.trim()) {
        validationErrors.push({ index: i, error: 'category_name is required' })
        continue
      }
      
      const vatValidation = validateVATRate(binding.vat_rate)
      if (!vatValidation.isValid) {
        validationErrors.push({ index: i, error: vatValidation.error || 'Invalid VAT rate' })
        continue
      }

      if (binding.id) {
        // Update existing
        // Check if exists in current DB fetch (security check)
        const exists = existingBindings.find(b => b.id === binding.id)
        if (!exists) {
           validationErrors.push({ index: i, error: `Binding with ID ${binding.id} not found in this region` })
           continue
        }
        
        bindingsToUpdate.push({
          id: binding.id,
          category_name: binding.category_name.trim(),
          vat_rate: binding.vat_rate
        })
        processedIds.add(binding.id)
      } else {
        // Create new
        bindingsToCreate.push({
          category_name: binding.category_name.trim(),
          vat_rate: binding.vat_rate
        })
      }
    }

    // Infer deletions: Any existing binding not in processedIds
    for (const existing of existingBindings) {
      if (!processedIds.has(existing.id)) {
        bindingsToDelete.push(existing.id)
      }
    }

    if (validationErrors.length > 0) {
      throw new Error(`validation: ${JSON.stringify(validationErrors)}`)
    }

    // Execute operations
    // 1. Delete
    for (const id of bindingsToDelete) {
      await client.query(queries.deleteRegionCategory, [id])
    }

    // 2. Update
    for (const item of bindingsToUpdate) {
      await client.query(queries.updateRegionCategory, [item.id, item.category_name, item.vat_rate])
    }

    // 3. Create
    for (const item of bindingsToCreate) {
      await client.query(queries.insertRegionCategory, [payload.region_id, item.category_name, item.vat_rate])
    }

    await client.query('COMMIT')

    const totalBindings = existingBindings.length - bindingsToDelete.length + bindingsToCreate.length

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
                }
            }
        })
    } catch (e) {
        // ignore event error
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
    throw err
  } finally {
    client.release()
  }
}
