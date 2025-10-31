/**
 * version: 1.1.3
 * Service to update currencies for pricing admin module (backend).
 * Executes created/updated/deleted diffs in a single transaction.
 * Includes integrity check: prevents deletion of currencies used in price lists.
 * Publishes events with informative payload for audit purposes.
 * File: service.admin.pricing.update.currencies.ts (backend)
 */

import { Pool } from 'pg'
import { Request } from 'express'
import { queries } from './queries.admin.pricing'
import type { CurrencyDto } from './types.admin.pricing'
import fabricEvents from '@/core/eventBus/fabric.events'
import { EVENTS_ADMIN_PRICING } from './events.admin.pricing'

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

    const createdCurrencies: CurrencyDto[] = []
    const updatedCurrencies: Array<{ currency: CurrencyDto, oldValues: Partial<CurrencyDto>, newValues: Partial<CurrencyDto> }> = []
    const deletedCurrencies: CurrencyDto[] = []

    // Fetch currency before update/delete to get full data for events
    const fetchCurrency = async (code: string): Promise<CurrencyDto | null> => {
      const result = await client.query(queries.fetchCurrencyByCode, [code])
      if (result.rows.length === 0) return null
      const row = result.rows[0]
      return {
        code: row.code,
        name: row.name,
        symbol: row.symbol ?? null,
        active: Boolean(row.active)
      }
    }

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
      createdCurrencies.push({
        code,
        name: c.name.trim(),
        symbol,
        active: Boolean(c.active)
      })
    }

    for (const u of payload.updated || []) {
      const idCode = validateCode(u.code)
      const oldCurrency = await fetchCurrency(idCode)
      if (!oldCurrency) throw new Error(`currency not found: ${u.code}`)
      if ((u as any).newCode) throw new Error('validation: code change is not supported')
      
      // Build old and new values
      const oldValues: Partial<CurrencyDto> = {}
      const newValues: Partial<CurrencyDto> = {}
      
      if (u.name !== undefined) {
        oldValues.name = oldCurrency.name
        newValues.name = u.name.trim()
      }
      if (u.symbol !== undefined) {
        oldValues.symbol = oldCurrency.symbol
        newValues.symbol = validateSymbol(u.symbol)
      }
      if (u.active !== undefined) {
        oldValues.active = oldCurrency.active
        newValues.active = Boolean(u.active)
      }

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
      
      // Fetch updated currency to get full data
      const updatedCurrency = await fetchCurrency(idCode)
      if (updatedCurrency) {
        updated++
        updatedCurrencies.push({
          currency: updatedCurrency,
          oldValues,
          newValues
        })
      }
    }

    for (const code of payload.deleted || []) {
      const idCode = validateCode(code)
      const currency = await fetchCurrency(idCode)
      if (!currency) throw new Error(`currency not found: ${code}`)
      
      // Check if currency is used in price lists
      const isUsed = await client.query(queries.isCurrencyUsedInPriceLists, [idCode])
      if (isUsed.rowCount && isUsed.rowCount > 0) {
        throw new Error(`cannot delete currency ${code}: it is used in price lists`)
      }
      
      await client.query(queries.deleteCurrency, [idCode])
      deleted++
      deletedCurrencies.push(currency)
    }

    await client.query('COMMIT')

    // Publish events with informative payload
    // Each event is wrapped in try-catch to ensure errors in one don't block others
    if (createdCurrencies.length > 0) {
      try {
        await fabricEvents.createAndPublishEvent({
          eventName: EVENTS_ADMIN_PRICING['currencies.create.success'].eventName,
          req: req,
          payload: {
            currencies: createdCurrencies,
            totalCreated: createdCurrencies.length
          }
        })
      } catch (eventError) {
        // Don't throw - transaction is already committed, errors are handled by event bus
      }
    }

    for (const update of updatedCurrencies) {
      try {
        await fabricEvents.createAndPublishEvent({
          eventName: EVENTS_ADMIN_PRICING['currencies.update.currency.success'].eventName,
          req: req,
          payload: {
            currency: update.currency,
            changes: {
              oldValues: update.oldValues,
              newValues: update.newValues
            }
          }
        })
      } catch (eventError) {
        // Don't throw - transaction is already committed, errors are handled by event bus
      }
    }

    if (deletedCurrencies.length > 0) {
      try {
        await fabricEvents.createAndPublishEvent({
          eventName: EVENTS_ADMIN_PRICING['currencies.delete.success'].eventName,
          req: req,
          payload: {
            currencies: deletedCurrencies,
            totalDeleted: deletedCurrencies.length
          }
        })
      } catch (eventError) {
        // Don't throw - transaction is already committed, errors are handled by event bus
      }
    }

    return { created, updated, deleted }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}