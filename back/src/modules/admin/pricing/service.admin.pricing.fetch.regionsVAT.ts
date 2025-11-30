/**
 * version: 1.1.0
 * Service to fetch regions VAT for pricing admin module (backend).
 * Connects to DB, executes query, maps fields to DTO format.
 * File: service.admin.pricing.fetch.regionsVAT.ts (backend)
 * 
 * Changes in v1.1.0:
 * - Enhanced fetch event payload with statistics (regions count, vat rates count)
 */

import { Pool } from 'pg'
import { Request } from 'express'
import { queries } from './queries.admin.pricing'
import type { RegionsVATDto } from './types.admin.pricing'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'
import { EVENTS_ADMIN_PRICING } from './events.admin.pricing'

/**
 * Fetch regions VAT from DB and map to DTO
 */
export async function fetchRegionsVATService(pool: Pool, req: Request): Promise<RegionsVATDto[]> {
    const client = await pool.connect()
    try {
        const result = await client.query(queries.fetchRegionsVAT)

        const regionsVAT: RegionsVATDto[] = result.rows.map((row: any) => ({
            id: Number(row.id),
            region_name: row.region_name,
            vat_rate: Number(row.vat_rate),
            priority: Number(row.priority),
            created_at: row.created_at,
            updated_at: row.updated_at
        }))

        // Calculate statistics for audit
        const uniqueRegions = new Set(regionsVAT.map(r => r.region_name))
        const uniqueVatRates = new Set(regionsVAT.map(r => r.vat_rate))
        
        // Publish success event with statistics
        createAndPublishEvent({
            eventName: EVENTS_ADMIN_PRICING['regionsVAT.fetch.success'].eventName,
            req: req,
            payload: {
                totalRecords: regionsVAT.length,
                uniqueRegionsCount: uniqueRegions.size,
                uniqueVatRatesCount: uniqueVatRates.size,
                vatRates: Array.from(uniqueVatRates).sort((a, b) => a - b)
            }
        })

        return regionsVAT
    } catch (error) {
        // Publish error event with context
        createAndPublishEvent({
            eventName: EVENTS_ADMIN_PRICING['regionsVAT.fetch.database_error'].eventName,
            req: req,
            payload: {
                error: error instanceof Error ? error.message : String(error),
                operation: 'fetch_regions_vat'
            },
            errorData: error instanceof Error ? error.message : String(error)
        })
        throw error
    } finally {
        client.release()
    }
}

