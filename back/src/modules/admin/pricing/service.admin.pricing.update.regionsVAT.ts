/**
 * version: 1.1.0
 * Service to update regions VAT for pricing admin module (backend).
 * Executes full replacement: DELETE all existing records, then INSERT new ones in a single transaction.
 * Includes validation: region_name must exist in app.regions, vat_rate 0-99, priority > 0.
 * Publishes events with informative payload for audit purposes.
 * File: service.admin.pricing.update.regionsVAT.ts (backend)
 * 
 * Changes in v1.1.0:
 * - Added detailed audit payload: compares old and new data to identify created, updated, and deleted records
 * - Enhanced error events with detailed context (region_name, vat_rate, validation details)
 * - Removed transaction.commit event (not significant for audit)
 */

import { Pool } from 'pg'
import { Request } from 'express'
import { queries } from './queries.admin.pricing'
import type { UpdateRegionsVATRequest } from './types.admin.pricing'
import fabricEvents from '@/core/eventBus/fabric.events'
import { EVENTS_ADMIN_PRICING } from './events.admin.pricing'

function validateRegionName(regionName?: string): string {
  if (!regionName || regionName.trim() === '') {
    throw new Error('validation: region_name is required')
  }
  return regionName.trim()
}

function validateVatRate(vatRate?: number): number {
  const value = Number(vatRate)
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    throw new Error('validation: vat_rate must be an integer')
  }
  if (value < 0 || value > 99) {
    throw new Error('validation: vat_rate must be between 0 and 99')
  }
  return value
}

function validatePriority(priority?: number): number {
  const value = Number(priority)
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    throw new Error('validation: priority must be an integer')
  }
  if (value < 1) {
    throw new Error('validation: priority must be greater than 0')
  }
  return value
}

export async function updateRegionsVATService(
  pool: Pool,
  req: Request,
  payload: UpdateRegionsVATRequest
): Promise<{ totalRecords: number }> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Validate payload
    if (!payload.regionsVAT || !Array.isArray(payload.regionsVAT)) {
      throw new Error('validation: regionsVAT must be an array')
    }

    // Fetch existing records for comparison (before validation to catch all issues)
    const existingResult = await client.query(queries.fetchRegionsVAT)
    const existingRecords = existingResult.rows.map((row: any) => ({
      region_name: row.region_name,
      vat_rate: Number(row.vat_rate),
      priority: Number(row.priority)
    }))

    // Validate each record and collect validation errors with context
    const validationErrors: Array<{region_name: string, vat_rate: number, error: string}> = []
    for (const record of payload.regionsVAT) {
      try {
        const regionName = validateRegionName(record.region_name)
        const vatRate = validateVatRate(record.vat_rate)
        const priority = validatePriority(record.priority)

        // Check if region exists in app.regions table
        const regionCheck = await client.query(queries.checkRegionExistsInRegionsTable, [regionName])
        if (regionCheck.rowCount === 0) {
          validationErrors.push({
            region_name: regionName,
            vat_rate: vatRate,
            error: `Region "${regionName}" does not exist in app.regions table`
          })
        }
      } catch (error) {
        validationErrors.push({
          region_name: record.region_name || 'unknown',
          vat_rate: record.vat_rate || -1,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    // If validation errors exist, throw with detailed context
    if (validationErrors.length > 0) {
      const errorMessage = `Validation failed for ${validationErrors.length} record(s)`
      throw new Error(`validation: ${errorMessage}. Details: ${JSON.stringify(validationErrors)}`)
    }

    // Prepare new records map for comparison (key: region_name + vat_rate)
    const newRecordsMap = new Map<string, {region_name: string, vat_rate: number, priority: number}>()
    for (const record of payload.regionsVAT) {
      const regionName = validateRegionName(record.region_name)
      const vatRate = validateVatRate(record.vat_rate)
      const priority = validatePriority(record.priority)
      const key = `${regionName}|${vatRate}`
      newRecordsMap.set(key, { region_name: regionName, vat_rate: vatRate, priority })
    }

    // Compare old and new data to identify changes
    const created: Array<{region_name: string, vat_rate: number, priority: number}> = []
    const updated: Array<{
      region_name: string
      vat_rate: number
      oldPriority: number
      newPriority: number
    }> = []
    const deleted: Array<{region_name: string, vat_rate: number, priority: number}> = []

    // Find created and updated records
    for (const newRecord of newRecordsMap.values()) {
      const key = `${newRecord.region_name}|${newRecord.vat_rate}`
      const existing = existingRecords.find(
        r => r.region_name === newRecord.region_name && r.vat_rate === newRecord.vat_rate
      )
      
      if (!existing) {
        // New record
        created.push(newRecord)
      } else if (existing.priority !== newRecord.priority) {
        // Priority changed
        updated.push({
          region_name: newRecord.region_name,
          vat_rate: newRecord.vat_rate,
          oldPriority: existing.priority,
          newPriority: newRecord.priority
        })
      }
    }

    // Find deleted records
    for (const existing of existingRecords) {
      const key = `${existing.region_name}|${existing.vat_rate}`
      if (!newRecordsMap.has(key)) {
        deleted.push(existing)
      }
    }

    // Delete all existing records
    await client.query(queries.deleteAllRegionsVAT)

    // Insert new records
    let totalRecords = 0
    for (const record of payload.regionsVAT) {
      const regionName = validateRegionName(record.region_name)
      const vatRate = validateVatRate(record.vat_rate)
      const priority = validatePriority(record.priority)

      await client.query(queries.insertRegionsVAT, [regionName, vatRate, priority])
      totalRecords++
    }

    await client.query('COMMIT')

    // Publish success event with detailed audit information
    try {
      await fabricEvents.createAndPublishEvent({
        eventName: EVENTS_ADMIN_PRICING['regionsVAT.update.success'].eventName,
        req: req,
        payload: {
          totalRecords,
          summary: {
            created: created.length,
            updated: updated.length,
            deleted: deleted.length
          },
          created: created.length > 0 ? created : undefined,
          updated: updated.length > 0 ? updated : undefined,
          deleted: deleted.length > 0 ? deleted : undefined
        }
      })
    } catch (eventError) {
      // Don't throw - transaction is already committed
    }

    return { totalRecords }
  } catch (err) {
    await client.query('ROLLBACK')

    // Publish rollback event with context
    try {
      await fabricEvents.createAndPublishEvent({
        eventName: EVENTS_ADMIN_PRICING['regionsVAT.update.transaction.rollback'].eventName,
        req: req,
        payload: {
          error: err instanceof Error ? err.message : String(err),
          attemptedRecordsCount: payload.regionsVAT?.length || 0,
          reason: err instanceof Error && err.message.startsWith('validation:') ? 'validation_error' : 'database_error'
        },
        errorData: err instanceof Error ? err.message : String(err)
      })
    } catch (eventError) {
      // Don't throw - already in error state
    }

    // Publish validation or database error event with detailed context
    if (err instanceof Error && err.message.startsWith('validation:')) {
      try {
        // Try to extract validation details from error message
        let validationDetails: any = { error: err.message }
        try {
          const detailsMatch = err.message.match(/Details: (.+)$/)
          if (detailsMatch) {
            validationDetails.validationErrors = JSON.parse(detailsMatch[1])
          }
        } catch (parseError) {
          // If parsing fails, just use the error message
        }

        await fabricEvents.createAndPublishEvent({
          eventName: EVENTS_ADMIN_PRICING['regionsVAT.update.validation.error'].eventName,
          req: req,
          payload: {
            error: err.message,
            ...validationDetails,
            attemptedRecordsCount: payload.regionsVAT?.length || 0
          },
          errorData: err.message
        })
      } catch (eventError) {
        // Don't throw - already in error state
      }
    } else {
      try {
        await fabricEvents.createAndPublishEvent({
          eventName: EVENTS_ADMIN_PRICING['regionsVAT.update.database_error'].eventName,
          req: req,
          payload: {
            error: err instanceof Error ? err.message : String(err),
            attemptedRecordsCount: payload.regionsVAT?.length || 0,
            operation: 'update_regions_vat'
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

