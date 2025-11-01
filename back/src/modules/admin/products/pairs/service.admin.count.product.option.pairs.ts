/**
 * File: service.admin.count.product.option.pairs.ts
 * Version: 1.1.0
 * Description: Service to count product-option pairs for a main product.
 * 
 * Updated: Changed event names from 'products.pairs.*' to 'adminProducts.pairs.*' to match domain registry
 * 
 * Backend file - service.admin.count.product.option.pairs.ts
 */

import { Request } from 'express'
import { Pool } from 'pg'
import { pool as pgPool } from '@/core/db/maindb'
import { pairsQueries } from './queries.admin.product.option.pairs'

const pool = pgPool as Pool

export interface CountPairsRequestBody { mainProductId: string }
export interface CountPairsResult { success: boolean; count: number }

export async function countProductOptionPairs(body: CountPairsRequestBody, req: Request): Promise<CountPairsResult> {
  const client = await pool.connect()
  try {
    const { mainProductId } = body || ({} as CountPairsRequestBody)
    if (!mainProductId) throw new Error('mainProductId is required')

    const q = await client.query(pairsQueries.countPairsByMain, [mainProductId])
    const count = (q.rows[0]?.cnt as number) || 0

    return { success: true, count }
  } catch (error) {
    return { success: false, count: 0 }
  } finally {
    client.release()
  }
}

export default countProductOptionPairs


