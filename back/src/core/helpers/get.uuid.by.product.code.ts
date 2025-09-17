/**
 * @file get.uuid.by.product.code.ts
 * Version: 1.0.0
 * Backend helper for retrieving product UUID by its code
 * Purpose: Gets product UUID from cache or database by product code
 * Backend file - get.uuid.by.product.code.ts
 */

import { Pool, QueryResult } from 'pg'
import { pool as pgPool } from '../db/maindb'
import { createAndPublishEvent } from '../eventBus/fabric.events'
import { GET_UUID_BY_PRODUCT_CODE_EVENTS } from './events.helpers'
import { get, set, CacheKeys } from './cache.helpers'

// Type assertion for pool
const pool = pgPool as Pool

interface ProductUuidError {
  code: string
  message: string
  details?: any
}

/**
 * Get product UUID by product code
 * @param productCode Code of the product to find
 * @returns UUID string or null if not found
 * @throws ProductUuidError on database errors
 */
export async function getUuidByProductCode(productCode: string): Promise<string | null> {
  try {
    await createAndPublishEvent({
      eventName: GET_UUID_BY_PRODUCT_CODE_EVENTS.START.eventName,
      payload: { productCode }
    })

    // Try cache first
    const cacheKey = CacheKeys.forProductUuid(productCode)
    const cachedUuid = await get<string | null>(cacheKey)
    if (cachedUuid !== undefined) {
      await createAndPublishEvent({
        eventName: GET_UUID_BY_PRODUCT_CODE_EVENTS.SUCCESS_CACHE.eventName,
        payload: { productCode, productId: cachedUuid, source: 'cache' }
      })
      return cachedUuid
    }

    // Query DB
    const query = { text: 'SELECT product_id FROM app.products WHERE product_code = $1', values: [productCode] }
    const result: QueryResult = await pool.query(query)

    if (!result.rows || result.rows.length === 0) {
      await createAndPublishEvent({
        eventName: GET_UUID_BY_PRODUCT_CODE_EVENTS.NOT_FOUND.eventName,
        payload: { productCode }
      })
      await set(cacheKey, null)
      return null
    }

    const productId = result.rows[0].product_id
    await set(cacheKey, productId)

    await createAndPublishEvent({
      eventName: GET_UUID_BY_PRODUCT_CODE_EVENTS.SUCCESS_DB.eventName,
      payload: { productCode, productId, source: 'database' }
    })

    return productId
  } catch (error) {
    await createAndPublishEvent({
      eventName: GET_UUID_BY_PRODUCT_CODE_EVENTS.ERROR.eventName,
      payload: { productCode, error: error instanceof Error ? error.message : String(error) },
      errorData: error instanceof Error ? error.message : String(error)
    })

    const productUuidError: ProductUuidError = {
      code: 'DB_ERROR',
      message: error instanceof Error ? error.message : 'Failed to get product UUID',
      details: { productCode, error }
    }
    throw productUuidError
  }
}

export default getUuidByProductCode
