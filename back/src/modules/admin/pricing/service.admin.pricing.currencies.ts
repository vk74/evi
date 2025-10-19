/**
 * version: 1.0.1
 * Service to fetch currencies for pricing admin module (backend).
 * Connects to DB, executes query, maps fields (events temporarily disabled).
 * File: service.admin.pricing.currencies.ts (backend)
 */

import { Pool } from 'pg'
import { Request } from 'express'
import { queries } from './queries.admin.pricing'
import type { CurrencyDto } from './types.admin.pricing'

/**
 * Fetch currencies from DB and map to DTO
 */
export async function fetchCurrenciesService(pool: Pool, req: Request): Promise<CurrencyDto[]> {
    const client = await pool.connect()
    try {
        const result = await client.query(queries.fetchCurrencies)

        const currencies: CurrencyDto[] = result.rows.map((row: any) => ({
            code: row.code,
            name: row.name,
            symbol: row.symbol ?? null,
            minorUnits: Number(row.minor_units),
            // map underscore to hyphen variants expected by FE
            roundingMode: (String(row.rounding_mode).replace('_', '-') as CurrencyDto['roundingMode']),
            active: Boolean(row.active)
        }))

        return currencies
    } catch (error) {
        throw error
    } finally {
        client.release()
    }
}


