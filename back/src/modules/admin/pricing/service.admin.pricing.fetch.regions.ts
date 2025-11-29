/**
 * version: 1.0.0
 * Service to fetch regions for pricing admin module (backend).
 * Connects to DB, executes query, maps fields to DTO format.
 * File: service.admin.pricing.fetch.regions.ts (backend)
 */

import { Pool } from 'pg'
import { Request } from 'express'
import { queries } from './queries.admin.pricing'
import type { RegionDto } from './types.admin.pricing'

/**
 * Fetch regions from DB and map to DTO
 */
export async function fetchRegionsService(pool: Pool, req: Request): Promise<RegionDto[]> {
    const client = await pool.connect()
    try {
        const result = await client.query(queries.fetchRegions)

        const regions: RegionDto[] = result.rows.map((row: any) => ({
            region_id: Number(row.region_id),
            region_name: row.region_name,
            created_at: row.created_at,
            updated_at: row.updated_at
        }))

        return regions
    } catch (error) {
        throw error
    } finally {
        client.release()
    }
}

