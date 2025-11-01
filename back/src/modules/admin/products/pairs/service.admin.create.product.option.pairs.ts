/**
 * service.admin.create.product.option.pairs.ts - version 1.2.0
 * Service for creating product-option pairs with transactional integrity.
 * Inserts only new pairs; on conflict (existing), throws error with detailed payload.
 * 
 * Backend file - service.admin.create.product.option.pairs.ts
 */

import { Request } from 'express'
import { Pool } from 'pg'
import { pool as pgPool } from '@/core/db/maindb'
import { pairsQueries } from './queries.admin.product.option.pairs'
import type { CreatePairsRequestBody, CreatePairsResult } from './types.admin.product.option.pairs'
import { getRequestorUuidFromReq } from '@/core/helpers/get.requestor.uuid.from.req'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'
import { v4 as uuidv4 } from 'uuid'

const pool = pgPool as Pool

export async function createProductOptionPairs(body: CreatePairsRequestBody, req: Request): Promise<CreatePairsResult> {
  const client = await pool.connect()

  try {
    const requestorUuid = getRequestorUuidFromReq(req)
    const { mainProductId, pairs } = body || ({} as CreatePairsRequestBody)

    if (!mainProductId || !Array.isArray(pairs)) {
      throw new Error('Invalid request body')
    }
    if (pairs.length === 0) {
      return { success: true, createdCount: 0, created: [] }
    }
    if (pairs.length > 200) {
      throw new Error('Pairs exceed limit 200')
    }

    // Validate semantics
    // 1) no self-pairing
    const selfPairing = pairs.filter(p => p.optionProductId === mainProductId).map(p => p.optionProductId)
    if (selfPairing.length > 0) {
      throw new Error(`Self-pairing not allowed for option ids: ${selfPairing.join(',')}`)
    }
    // 2) field constraints
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

    // Get main product code
    const mainProductResult = await client.query('SELECT product_code FROM app.products WHERE product_id = $1', [mainProductId])
    const mainProductCode = mainProductResult.rows[0]?.product_code || null

    // Detect existing pairs to prevent conflicts
    const optionIds = pairs.map(p => p.optionProductId)
    const existing = await client.query(pairsQueries.checkExistingPairs, [mainProductId, optionIds])
    const existingSet = new Set<string>(existing.rows.map(r => r.option_product_id as string))
    const conflicting = optionIds.filter(id => existingSet.has(id))
    if (conflicting.length > 0) {
      const errorMessage = 'Conflict: pairs already exist for some option ids'
      // Get option product codes
      const conflictingProducts = await client.query('SELECT product_id, product_code FROM app.products WHERE product_id = ANY($1)', [conflicting])
      const conflictingOptionCodes = conflictingProducts.rows.map(r => r.product_code)
      
      await createAndPublishEvent({
        eventName: 'adminProducts.pairs.create.conflict',
        req: req,
        payload: {
          mainProductId,
          mainProductCode,
          conflictingOptionIds: conflicting,
          conflictingOptionCodes
        }
      })
      throw new Error(`${errorMessage}: ${conflicting.join(',')}`)
    }

    // Prepare arrays for UNNEST insert
    const relIds = optionIds.map(() => uuidv4())
    const isReqArr = pairs.map(p => p.isRequired)
    const unitsArr = pairs.map(p => (p.isRequired ? p.unitsCount : null))

    await client.query(pairsQueries.insertPairsUsingUnnest, [
      mainProductId,
      requestorUuid,
      optionIds,
      isReqArr,
      unitsArr,
      relIds
    ])

    await client.query('COMMIT')

    const createdIds = optionIds
    // Get created option codes
    const createdProducts = await client.query('SELECT product_id, product_code FROM app.products WHERE product_id = ANY($1)', [createdIds])
    const createdOptionCodes = createdProducts.rows.map(r => r.product_code)
    
    await createAndPublishEvent({
      eventName: 'adminProducts.pairs.create.success',
      req: req,
      payload: {
        mainProductId,
        mainProductCode,
        createdCount: createdIds.length,
        createdOptionIds: createdIds,
        createdOptionCodes
      }
    })

    return { success: true, createdCount: createdIds.length, created: createdIds }
  } catch (error) {
    try { await client.query('ROLLBACK') } catch {}
    await createAndPublishEvent({
      eventName: 'adminProducts.pairs.create.error',
      req: req,
      payload: {
        mainProductId: body?.mainProductId,
        requestedCount: Array.isArray(body?.pairs) ? body.pairs.length : 0,
        error: error instanceof Error ? error.message : String(error)
      },
      errorData: error instanceof Error ? error.message : String(error)
    })
    throw error
  } finally {
    client.release()
  }
}

export default createProductOptionPairs


