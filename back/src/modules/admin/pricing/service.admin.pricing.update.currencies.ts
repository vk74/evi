/**
 * version: 1.1.2
 * Service to update currencies for pricing admin module (backend).
 * Executes created/updated/deleted diffs in a single transaction.
 * Includes integrity check: prevents deletion of currencies used in price lists.
 * File: service.admin.pricing.update.currencies.ts (backend)
 */

import { Pool } from 'pg'
import { Request } from 'express'
import { queries } from './queries.admin.pricing'
import type { CurrencyDto } from './types.admin.pricing'

function validateCode(code?: string): string {
  if (!code) throw new Error('validation: code is required')
  const trimmed = code.trim().toUpperCase()
  if (!/^[A-Z]{3}$/.test(trimmed)) throw new Error('validation: code must be 3 uppercase letters')
  return trimmed
}

function validateSymbol(symbol?: string | null): string {
  if (!symbol || symbol.trim() === '') throw new Error('validation: symbol is required')
  const trimmed = symbol.trim()
  if (trimmed.length > 3) throw new Error('validation: symbol must not exceed 3 characters')
  return trimmed
}

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

    for (const c of payload.created || []) {
      const code = validateCode(c.code)
      if (c.name == null || String(c.name).trim() === '') throw new Error('validation: name is required')
      const symbol = validateSymbol(c.symbol)
      await client.query(queries.insertCurrency, [
        code,
        c.name.trim(),
        symbol,
        Boolean(c.active)
      ])
      created++
    }

    for (const u of payload.updated || []) {
      const idCode = validateCode(u.code)
      const exists = await client.query(queries.existsCurrency, [idCode])
      if (exists.rowCount === 0) throw new Error(`currency not found: ${u.code}`)
      if ((u as any).newCode) throw new Error('validation: code change is not supported')
      // Validate symbol if provided
      let symbolValue = null
      if (u.symbol !== undefined) {
        symbolValue = validateSymbol(u.symbol)
      }
      await client.query(queries.updateCurrency, [
        idCode,
        u.name ? u.name.trim() : null,
        symbolValue,
        (u.active === undefined ? null : u.active)
      ])
      updated++
    }

    for (const code of payload.deleted || []) {
      const idCode = validateCode(code)
      const exists = await client.query(queries.existsCurrency, [idCode])
      if (exists.rowCount === 0) throw new Error(`currency not found: ${code}`)
      
      // Check if currency is used in price lists
      const isUsed = await client.query(queries.isCurrencyUsedInPriceLists, [idCode])
      if (isUsed.rowCount && isUsed.rowCount > 0) {
        throw new Error(`cannot delete currency ${code}: it is used in price lists`)
      }
      
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


