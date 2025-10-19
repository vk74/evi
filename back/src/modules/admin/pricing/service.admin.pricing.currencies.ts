/**
 * version: 1.1.1
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
            roundingMode: String(row.rounding_mode) as CurrencyDto['roundingMode'],
            active: Boolean(row.active)
        }))

        return currencies
    } catch (error) {
        throw error
    } finally {
        client.release()
    }
}

/**
 * Validate rounding mode hyphen or underscore, return underscore form for DB
 */
function toDbRoundingMode(mode?: CurrencyDto['roundingMode'] | string | null): string | null {
    if (!mode) return null
    let normalized = String(mode).toLowerCase().replace(/-/g, '_')
    const allowed = ['half_up', 'half_even', 'cash_0_05', 'cash_0_1']
    return allowed.includes(normalized) ? normalized : null
}

function validateCode(code?: string): string {
    if (!code) throw new Error('validation: code is required')
    const trimmed = code.trim().toUpperCase()
    if (!/^[A-Z]{3}$/.test(trimmed)) throw new Error('validation: code must be 3 uppercase letters')
    return trimmed
}

function validateMinorUnits(value?: number | null): number | null {
    if (value === undefined) return null
    if (value === null) return null
    const n = Number(value)
    if (!Number.isInteger(n) || n < 0 || n > 6) throw new Error('validation: minorUnits must be integer between 0 and 6')
    return n
}

/**
 * Update currencies in a single transaction using diff-based payload
 */
export async function updateCurrenciesService(pool: Pool, req: Request, payload: {
    created?: CurrencyDto[]
    updated?: Array<Partial<CurrencyDto> & { code: string }>
    deleted?: string[]
}): Promise<{ created: number, updated: number, deleted: number }> {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')

        let created = 0
        let updated = 0
        let deleted = 0

        // Created
        for (const c of payload.created || []) {
            const code = validateCode(c.code)
            if (c.name == null || String(c.name).trim() === '') throw new Error('validation: name is required')
            const dbMode = toDbRoundingMode(c.roundingMode)
            if (!dbMode) throw new Error('validation: roundingMode invalid')
            const mu = validateMinorUnits(c.minorUnits)
            if (mu == null) throw new Error('validation: minorUnits is required')
            await client.query(queries.insertCurrency, [
                code,
                c.name,
                c.symbol ?? null,
                mu,
                dbMode,
                Boolean(c.active)
            ])
            created++
        }

        // Updated
        for (const u of payload.updated || []) {
            // Ensure exists by identifier code
            const idCode = validateCode(u.code)
            const exists = await client.query(queries.existsCurrency, [idCode])
            if (exists.rowCount === 0) throw new Error(`currency not found: ${u.code}`)
            // Reject attempts to change code via updated diff
            if ((u as any).newCode || (u as any).code && u.code !== idCode) {
                throw new Error('validation: code change is not supported')
            }
            const dbMode = toDbRoundingMode(u.roundingMode as any)
            const mu = validateMinorUnits(u.minorUnits as any)
            await client.query(queries.updateCurrency, [
                idCode,
                u.name ?? null,
                (u.symbol === undefined ? null : u.symbol),
                mu,
                dbMode,
                (u.active === undefined ? null : u.active)
            ])
            updated++
        }

        // Deleted
        for (const code of payload.deleted || []) {
            const idCode = validateCode(code)
            const exists = await client.query(queries.existsCurrency, [idCode])
            if (exists.rowCount === 0) throw new Error(`currency not found: ${code}`)
            await client.query(queries.deleteCurrency, [idCode])
            deleted++
        }

        await client.query('COMMIT')
        return { created, updated, deleted }
    } catch (err) {
        await client.query('ROLLBACK')
        throw err
    } finally {
        client.release()
    }
}


