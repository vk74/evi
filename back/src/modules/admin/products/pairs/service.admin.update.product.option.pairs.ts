/**
 * service.admin.update.product.option.pairs.ts - version 1.2.0
 * Service for updating existing product-option pairs with transactional integrity.
 * Updates only existing pairs; if any is missing, throws error with missing ids.
 * 
 * Backend file - service.admin.update.product.option.pairs.ts
 */

import { Request } from 'express'
import { Pool } from 'pg'
import { pool as pgPool } from '@/core/db/maindb'
import { pairsQueries } from './queries.admin.product.option.pairs'
import type { UpdatePairsRequestBody, UpdatePairsResult } from './types.admin.product.option.pairs'
import { getRequestorUuidFromReq } from '@/core/helpers/get.requestor.uuid.from.req'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'
import { AuthenticatedRequest } from '@/core/guards/types.guards'
import { checkProductAccess } from '../helpers.check.product.access'

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

    // Check scope for authorization
    const authReq = req as AuthenticatedRequest
    const effectiveScope = authReq.authContext?.effectiveScope

    // If scope is 'own', check access to main product
    if (effectiveScope === 'own') {
      if (!requestorUuid) {
         throw new Error('Unable to identify requesting user')
      }

      // Need to use a fresh client for this check or run it before transaction
      // Since we haven't started transaction yet, we can use the pool directly or the client
      const hasAccess = await checkProductAccess(mainProductId, requestorUuid, client)
      
      if (!hasAccess) {
        await createAndPublishEvent({
          eventName: 'adminProducts.pairs.update.error',
          req: req,
          payload: {
            mainProductId,
            error: 'Access denied: you can only update option pairs for your own products',
            scope: effectiveScope
          }
        })
        throw new Error('Access denied: you can only update option pairs for your own products')
      }
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

    // Ensure all pairs exist; otherwise, rollback with detailed error
    const optionIds = pairs.map(p => p.optionProductId)
    const existing = await client.query(pairsQueries.checkExistingPairs, [mainProductId, optionIds])
    const existingSet = new Set<string>(existing.rows.map(r => r.option_product_id as string))
    const missing = optionIds.filter(id => !existingSet.has(id))
    if (missing.length > 0) {
      const reason = 'Not found: some option ids do not have existing pairs'
      // Get missing option codes
      const missingProducts = await client.query('SELECT product_id, product_code FROM app.products WHERE product_id = ANY($1)', [missing])
      const missingOptionCodes = missingProducts.rows.map(r => r.product_code)

      await createAndPublishEvent({
        eventName: 'adminProducts.pairs.update.not_found',
        req: req,
        payload: {
          mainProductId,
          mainProductCode,
          missingOptionIds: missing,
          missingOptionCodes
        }
      })
      throw new Error(`${reason}: ${missing.join(',')}`)
    }

    // Get old values before update
    const oldPairsMap = new Map(existing.rows.map(r => [r.option_product_id, { is_required: r.is_required, units_count: r.units_count }]))

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

    // Get option codes and build changes array
    const updatedProducts = await client.query('SELECT product_id, product_code FROM app.products WHERE product_id = ANY($1)', [optionIds])
    const updatedOptionCodes = updatedProducts.rows.map(r => r.product_code)
    
    const changes = pairs.map(p => {
      const old = oldPairsMap.get(p.optionProductId)
      const productCode = updatedProducts.rows.find(r => r.product_id === p.optionProductId)?.product_code
      const change: any = { optionProductId: p.optionProductId, optionProductCode: productCode }
      
      if (old && old.is_required !== p.isRequired) {
        change.isRequired = { old: old.is_required, new: p.isRequired }
      }
      if (old && old.units_count !== p.unitsCount) {
        change.unitsCount = { old: old.units_count, new: p.unitsCount }
      }
      
      return change
    })

    await createAndPublishEvent({
      eventName: 'adminProducts.pairs.update.success',
      req: req,
      payload: {
        mainProductId,
        mainProductCode,
        updatedCount: optionIds.length,
        updatedOptionIds: optionIds,
        updatedOptionCodes,
        changes
      }
    })

    return { success: true, updatedCount: optionIds.length, updated: optionIds }
  } catch (error) {
    try { await client.query('ROLLBACK') } catch {}
    await createAndPublishEvent({
      eventName: 'adminProducts.pairs.update.error',
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

export default updateProductOptionPairs


