/**
 * service.admin.delete.product.option.pairs.ts - version 1.2.0
 * Service for deleting product-option pairs (selected or all).
 * Handles deletion of product-option pairs with transactional integrity.
 * 
 * Backend file - service.admin.delete.product.option.pairs.ts
 */

import { Request } from 'express'
import { Pool } from 'pg'
import { pool as pgPool } from '@/core/db/maindb'
import { pairsQueries } from './queries.admin.product.option.pairs'
import { getRequestorUuidFromReq } from '@/core/helpers/get.requestor.uuid.from.req'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'

const pool = pgPool as Pool

export interface DeletePairsRequestBody {
  mainProductId: string
  all: boolean
  selectedOptionIds?: string[]
}

export interface DeletePairsResult {
  success: boolean
  mode: 'all' | 'selected'
  totalRequested: number
  totalDeleted: number
  deletedOptionIds: string[]
  missingOptionIds?: string[]
}

export async function deleteProductOptionPairs(body: DeletePairsRequestBody, req: Request): Promise<DeletePairsResult> {
  const client = await pool.connect()
  try {
    const { mainProductId, all, selectedOptionIds } = body || ({} as DeletePairsRequestBody)

    if (!mainProductId) throw new Error('mainProductId is required')
    if (!all) {
      if (!Array.isArray(selectedOptionIds)) throw new Error('selectedOptionIds must be array when all=false')
      if (selectedOptionIds.length === 0) return { success: true, mode: 'selected', totalRequested: 0, totalDeleted: 0, deletedOptionIds: [] }
      if (selectedOptionIds.length > 200) throw new Error('selectedOptionIds exceed limit 200')
    }

    await client.query('BEGIN')

    // Get main product code
    const mainProductResult = await client.query('SELECT product_code FROM app.products WHERE product_id = $1', [mainProductId])
    const mainProductCode = mainProductResult.rows[0]?.product_code || null

    if (all) {
      const res = await client.query(pairsQueries.deleteAllPairs, [mainProductId])
      const deleted = res.rows.map(r => r.option_product_id as string)
      await client.query('COMMIT')

      // Get deleted option codes
      const deletedProducts = await client.query('SELECT product_id, product_code FROM app.products WHERE product_id = ANY($1)', [deleted])
      const deletedOptionCodes = deletedProducts.rows.map(r => r.product_code)

      await createAndPublishEvent({
        eventName: 'adminProducts.pairs.delete.success',
        req: req,
        payload: { mainProductId, mainProductCode, mode: 'all', totalRequested: deleted.length, totalDeleted: deleted.length, deletedOptionIds: deleted, deletedOptionCodes }
      })

      return { success: true, mode: 'all', totalRequested: deleted.length, totalDeleted: deleted.length, deletedOptionIds: deleted }
    } else {
      const res = await client.query(pairsQueries.deleteSelectedPairs, [mainProductId, selectedOptionIds])
      const deleted = res.rows.map(r => r.option_product_id as string)
      const deletedSet = new Set(deleted)
      const missing = selectedOptionIds!.filter(id => !deletedSet.has(id))

      await client.query('COMMIT')

      // Get deleted option codes
      const deletedProducts = await client.query('SELECT product_id, product_code FROM app.products WHERE product_id = ANY($1)', [deleted])
      const deletedOptionCodes = deletedProducts.rows.map(r => r.product_code)

      if (missing.length > 0) {
        const missingProducts = await client.query('SELECT product_id, product_code FROM app.products WHERE product_id = ANY($1)', [missing])
        const missingOptionCodes = missingProducts.rows.map(r => r.product_code)

        await createAndPublishEvent({
          eventName: 'adminProducts.pairs.delete.partial_success',
          req: req,
          payload: { mainProductId, mainProductCode, mode: 'selected', totalRequested: selectedOptionIds!.length, totalDeleted: deleted.length, deletedOptionIds: deleted, deletedOptionCodes, missingOptionIds: missing, missingOptionCodes }
        })
      } else {
        await createAndPublishEvent({
          eventName: 'adminProducts.pairs.delete.success',
          req: req,
          payload: { mainProductId, mainProductCode, mode: 'selected', totalRequested: selectedOptionIds!.length, totalDeleted: deleted.length, deletedOptionIds: deleted, deletedOptionCodes }
        })
      }

      return { success: true, mode: 'selected', totalRequested: selectedOptionIds!.length, totalDeleted: deleted.length, deletedOptionIds: deleted, missingOptionIds: missing.length ? missing : undefined }
    }
  } catch (error) {
    try { await client.query('ROLLBACK') } catch {}
    await createAndPublishEvent({
          eventName: 'adminProducts.pairs.delete.error',
          req: req,
      payload: { mainProductId: body?.mainProductId, mode: body?.all ? 'all' : 'selected', error: error instanceof Error ? error.message : String(error) },
      errorData: error instanceof Error ? error.message : String(error)
    })
    throw error
  } finally {
    client.release()
  }
}

export default deleteProductOptionPairs


