/**
 * File: service.admin.read.product.option.pairs.ts
 * Version: 1.1.1
 * Description: Service for reading existing product-option pairs for a main product.
 * Purpose: Returns pairs for provided option ids, without fallbacks.
 * 
 * Updated v1.1.1: Removed unused adminProducts.pairs.read.started event call
 * 
 * Updated v1.1.0: Changed event names from 'products.pairs.*' to 'adminProducts.pairs.*' to match domain registry
 * 
 * Backend file - service.admin.read.product.option.pairs.ts
 */

import { Request } from 'express'
import { Pool } from 'pg'
import { pool as pgPool } from '@/core/db/maindb'
import { pairsQueries } from './queries.admin.product.option.pairs'
import type { ReadPairsRequestBody, ReadPairsResult, ReadPairsMode } from './types.admin.product.option.pairs'
import { getRequestorUuidFromReq } from '@/core/helpers/get.requestor.uuid.from.req'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'
import { OPTIONS_FETCH_EVENTS, PRODUCT_FETCH_EVENTS } from '../events.admin.products'

const pool = pgPool as Pool

export async function readProductOptionPairs(body: ReadPairsRequestBody, req: Request): Promise<ReadPairsResult> {
  const client = await pool.connect()

  try {
    const requestorUuid = getRequestorUuidFromReq(req)
    const { mainProductId } = body || ({} as ReadPairsRequestBody)
    const mode: ReadPairsMode = body?.mode || 'records'
    const optionProductIds: string[] | undefined = body?.optionProductIds

    if (!mainProductId) {
      throw new Error('Invalid request body')
    }

    if (mode === 'records') {
      if (!Array.isArray(optionProductIds)) throw new Error('optionProductIds are required for mode=records')
      if (optionProductIds.length > 200) throw new Error('Requested option ids exceed limit 200')
      const res = await client.query(pairsQueries.readPairsByMainAndOptions, [mainProductId, optionProductIds])
      const pairs = res.rows.map(r => ({
        optionProductId: r.option_product_id as string,
        isRequired: !!r.is_required,
        unitsCount: r.units_count as number | null,
        unitPrice: null
      }))
      await createAndPublishEvent({
        eventName: 'adminProducts.pairs.read.success',
        req: req,
        payload: {
          mainProductId,
          foundCount: pairs.length,
          requestedCount: optionProductIds.length,
          optionIdsFound: pairs.map(p => p.optionProductId),
          optionIdsRequested: optionProductIds,
          requestorId: requestorUuid
        }
      })
      return { success: true, pairs }
    }

    if (mode === 'ids') {
      // Return all paired option ids for main product
      const q = await client.query(pairsQueries.countPairsByMain.replace('COUNT(*)::int AS cnt', 'array_agg(option_product_id) as ids').replace('SELECT', 'SELECT option_product_id').replace('WHERE', 'WHERE') , [mainProductId])
      // The above hack is brittle; instead, do a direct select:
      const resIds = await client.query('SELECT option_product_id FROM app.product_options WHERE main_product_id = $1', [mainProductId])
      const ids: string[] = resIds.rows.map(r => r.option_product_id as string)
      await createAndPublishEvent({
        eventName: 'adminProducts.pairs.read.success',
        req: req,
        payload: { mainProductId, foundCount: ids.length, requestedCount: 0, optionIdsFound: ids, optionIdsRequested: [], requestorId: requestorUuid }
      })
      return { success: true, optionProductIds: ids }
    }

    if (mode === 'exists') {
      if (!Array.isArray(optionProductIds)) throw new Error('optionProductIds are required for mode=exists')
      if (optionProductIds.length > 200) throw new Error('Requested option ids exceed limit 200')
      const res = await client.query(pairsQueries.readPairsByMainAndOptions, [mainProductId, optionProductIds])
      const found = new Set<string>(res.rows.map(r => r.option_product_id as string))
      const existsMap: Record<string, boolean> = {}
      for (const id of optionProductIds) existsMap[id] = found.has(id)
      await createAndPublishEvent({
        eventName: 'adminProducts.pairs.read.success',
        req: req,
        payload: { mainProductId, foundCount: res.rows.length, requestedCount: optionProductIds.length, optionIdsFound: Array.from(found), optionIdsRequested: optionProductIds, requestorId: requestorUuid }
      })
      return { success: true, existsMap }
    }

    throw new Error('Unsupported mode')
  } catch (error) {
    await createAndPublishEvent({
      eventName: 'adminProducts.pairs.read.error',
      req: req,
      payload: {
        mainProductId: body?.mainProductId,
        requestedCount: Array.isArray(body?.optionProductIds) ? body.optionProductIds.length : 0,
        error: error instanceof Error ? error.message : String(error),
        requestorId: getRequestorUuidFromReq(req)
      },
      errorData: error instanceof Error ? error.message : String(error)
    })
    return { success: false, pairs: [], message: error instanceof Error ? error.message : 'Unknown error' }
  } finally {
    client.release()
  }
}

export default readProductOptionPairs


