/**
 * File: service.admin.read.product.option.pairs.ts
 * Version: 1.0.0
 * Description: Service for reading existing product-option pairs for a main product.
 * Purpose: Returns pairs for provided option ids, without fallbacks.
 * Backend file - service.admin.read.product.option.pairs.ts
 */

import { Request } from 'express'
import { Pool } from 'pg'
import { pool as pgPool } from '@/core/db/maindb'
import { pairsQueries } from './queries.admin.product.option.pairs'
import type { ReadPairsRequestBody, ReadPairsResult } from './types.admin.product.option.pairs'
import { getRequestorUuidFromReq } from '@/core/helpers/get.requestor.uuid.from.req'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'
import { OPTIONS_FETCH_EVENTS, PRODUCT_FETCH_EVENTS } from '../events.admin.products'

const pool = pgPool as Pool

export async function readProductOptionPairs(body: ReadPairsRequestBody, req: Request): Promise<ReadPairsResult> {
  const client = await pool.connect()

  try {
    const requestorUuid = getRequestorUuidFromReq(req)
    const { mainProductId, optionProductIds } = body || ({} as ReadPairsRequestBody)

    await createAndPublishEvent({
      eventName: 'products.pairs.read.started',
      payload: {
        mainProductId,
        optionIdsCount: Array.isArray(optionProductIds) ? optionProductIds.length : 0,
        requestorId: requestorUuid
      }
    })

    if (!mainProductId || !Array.isArray(optionProductIds)) {
      throw new Error('Invalid request body')
    }
    if (optionProductIds.length > 200) {
      throw new Error('Requested option ids exceed limit 200')
    }

    const res = await client.query(pairsQueries.readPairsByMainAndOptions, [mainProductId, optionProductIds])
    const pairs = res.rows.map(r => ({
      optionProductId: r.option_product_id as string,
      isRequired: !!r.is_required,
      unitsCount: r.units_count as number | null,
      unitPrice: null
    }))

    await createAndPublishEvent({
      eventName: 'products.pairs.read.success',
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
  } catch (error) {
    await createAndPublishEvent({
      eventName: 'products.pairs.read.error',
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


