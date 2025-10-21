/**
 * version: 1.1.4
 * Service to fetch currencies for pricing admin module (backend).
 * Connects to DB, executes query, maps fields (events temporarily disabled).
 * Supports optional filtering of active currencies via query parameter.
 * File: service.admin.pricing.fetch.currencies.ts (backend)
 */

import { Pool } from 'pg'
import { Request } from 'express'
import { queries } from './queries.admin.pricing'
import type { CurrencyDto } from './types.admin.pricing'

/**
 * Fetch currencies from DB and map to DTO
 * Business logic: reads activeOnly query parameter and selects appropriate query
 */
export async function fetchCurrenciesService(pool: Pool, req: Request): Promise<CurrencyDto[]> {
    const client = await pool.connect()
    try {
        // Business logic: read query parameter and select appropriate query
        const activeOnly = req.query.activeOnly === 'true'
        const selectedQuery = activeOnly ? queries.fetchCurrenciesActiveOnly : queries.fetchCurrencies
        
        const result = await client.query(selectedQuery)

        const currencies: CurrencyDto[] = result.rows.map((row: any) => ({
            code: row.code,
            name: row.name,
            symbol: row.symbol ?? null,
            active: Boolean(row.active)
        }))

        return currencies
    } catch (error) {
        throw error
    } finally {
        client.release()
    }
}


