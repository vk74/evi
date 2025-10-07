/**
 * File: service.admin.update.product.option.pairs.ts
 * Version: 1.0.1
 * Description: Service for updating existing product-option pairs with transactional integrity.
 * Purpose: Updates only existing pairs; if any is missing, throws error with missing ids.
 * Backend file - service.admin.update.product.option.pairs.ts
 */

import { Request } from 'express'
import { Pool } from 'pg'
import { pool as pgPool } from '@/core/db/maindb'
import { pairsQueries } from './queries.admin.product.option.pairs'
import type { UpdatePairsRequestBody, UpdatePairsResult } from './types.admin.product.option.pairs'
import { getRequestorUuidFromReq } from '@/core/helpers/get.requestor.uuid.from.req'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'

const pool = pgPool as Pool

export async function updateProductOptionPairs(body: UpdatePairsRequestBody, req: Request): Promise<UpdatePairsResult> {
  const client = await pool.connect()

  try {
    const requestorUuid = getRequestorUuidFromReq(req)
    const { mainProductId, pairs } = body || ({} as UpdatePairsRequestBody)

    if (!mainProductId || !Array.isArray(pairs)) {
      throw new Error('Invalid request body')
    }
    if (pairs.length === 0) {
      return { success: true, updatedCount: 0, updated: [] }
    }
    if (pairs.length > 200) {
      throw new Error('Pairs exceed limit 200')
    }

    // Validate semantics
    for (const p of pairs) {
      if (!p.optionProductId) throw new Error('optionProductId is required')
      if (p.isRequired && (p.unitsCount == null || p.unitsCount < 1 || p.unitsCount > 100)) {
        throw new Error(`Invalid unitsCount for required option ${p.optionProductId}`)
      }
      if (!p.isRequired && p.unitsCount !== null) {
        throw new Error(`unitsCount must be null when not required for ${p.optionProductId}`)
      }
    }

    await client.query('BEGIN')

    // Ensure all pairs exist; otherwise, rollback with detailed error
    const optionIds = pairs.map(p => p.optionProductId)
    const existing = await client.query(pairsQueries.checkExistingPairs, [mainProductId, optionIds])
    const existingSet = new Set<string>(existing.rows.map(r => r.option_product_id as string))
    const missing = optionIds.filter(id => !existingSet.has(id))
    if (missing.length > 0) {
      const reason = 'Not found: some option ids do not have existing pairs'
      await createAndPublishEvent({
        eventName: 'products.pairs.update.not_found',
        payload: {
          mainProductId,
          missingOptionIds: missing,
          missingCount: missing.length,
          requestorId: requestorUuid
        }
      })
      throw new Error(`${reason}: ${missing.join(',')}`)
    }

    // Build arrays for UNNEST update
    const optionIdsArr = pairs.map(p => p.optionProductId)
    const isReqArr = pairs.map(p => p.isRequired)
    const unitsArr = pairs.map(p => (p.isRequired ? p.unitsCount : null))
    await client.query(pairsQueries.updatePairsUsingUnnest, [
      mainProductId,
      optionIdsArr,
      requestorUuid,
      isReqArr,
      unitsArr
    ])

    await client.query('COMMIT')

    const updatedIds = optionIds
    await createAndPublishEvent({
      eventName: 'products.pairs.update.success',
      payload: {
        mainProductId,
        updatedCount: updatedIds.length,
        updatedOptionIds: updatedIds,
        fieldsChanged: ['is_required', 'units_count'],
        requestorId: requestorUuid
      }
    })

    return { success: true, updatedCount: updatedIds.length, updated: updatedIds }
  } catch (error) {
    try { await client.query('ROLLBACK') } catch {}
    await createAndPublishEvent({
      eventName: 'products.pairs.update.error',
      payload: {
        mainProductId: body?.mainProductId,
        requestedCount: Array.isArray(body?.pairs) ? body.pairs.length : 0,
        error: error instanceof Error ? error.message : String(error),
        requestorId: getRequestorUuidFromReq(req)
      },
      errorData: error instanceof Error ? error.message : String(error)
    })
    throw error
  } finally {
    client.release()
  }
}

export default updateProductOptionPairs


