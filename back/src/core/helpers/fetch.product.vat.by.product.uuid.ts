/**
 * @file fetch.product.vat.by.product.uuid.ts
 * Version: 1.1.0
 * Backend helper for retrieving VAT rate by product UUID and region
 * Purpose: Gets VAT rate from database for product(s) in a specific region
 * Backend file - fetch.product.vat.by.product.uuid.ts
 * 
 * Changes in v1.1.0:
 * - Added service-level functions that return controller-ready response format
 * - Moved validation and business logic from controller to helper
 * - Helper now handles all validation and returns structured responses
 */

import { Pool, QueryResult } from 'pg'
import { pool as pgPool } from '../db/maindb'

// Type assertion for pool
const pool = pgPool as Pool

interface VatRateRow {
  product_id: string
  vat_rate: number | null
}

/**
 * Fetch VAT rates for multiple products by their UUIDs and region name
 * @param productIds Array of product UUIDs to fetch VAT rates for
 * @param regionName Region name to filter by
 * @returns Map of productId -> vatRate (number | null)
 */
export async function fetchProductsVatByProductUuids(
  productIds: string[],
  regionName: string
): Promise<Map<string, number | null>> {
  const resultMap = new Map<string, number | null>()

  try {
    // Validate inputs
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return resultMap
    }

    if (!regionName || typeof regionName !== 'string' || regionName.trim().length === 0) {
      return resultMap
    }

    // Convert region_name to region_id
    const regionResult = await pool.query<{ region_id: number }>(
      'SELECT region_id FROM app.regions WHERE region_name = $1',
      [regionName.trim()]
    )

    if (regionResult.rows.length === 0) {
      // Region not found - return empty map (all products will have null VAT rate)
      return resultMap
    }

    const regionId = regionResult.rows[0].region_id

    // Initialize all productIds with null (for products not found in result)
    productIds.forEach(id => {
      resultMap.set(id, null)
    })

    // Fetch VAT rates for all products in one query
    const query = `
      SELECT pr.product_id, rtc.vat_rate
      FROM app.product_regions pr
      INNER JOIN app.regions r ON pr.region_id = r.region_id
      INNER JOIN app.regions_taxable_categories rtc 
        ON pr.region_id = rtc.region_id 
        AND pr.taxable_category_id = rtc.id
      WHERE pr.product_id = ANY($1::uuid[]) 
        AND r.region_id = $2
    `

    const vatResult: QueryResult<VatRateRow> = await pool.query(query, [productIds, regionId])

    // Update map with found VAT rates
    vatResult.rows.forEach(row => {
      resultMap.set(row.product_id, row.vat_rate)
    })

    return resultMap
  } catch (error) {
    console.error('[fetchProductsVatByProductUuids] Error fetching VAT rates:', error)
    // On error, return map with null values for all products
    return resultMap
  }
}

/**
 * Fetch VAT rate for a single product by its UUID and region name
 * Wrapper around batch method for convenience
 * @param productId Product UUID to fetch VAT rate for
 * @param regionName Region name to filter by
 * @returns VAT rate (number | null) or null if not found/error
 */
export async function fetchProductVatByProductUuid(
  productId: string,
  regionName: string
): Promise<number | null> {
  try {
    if (!productId || typeof productId !== 'string' || productId.trim().length === 0) {
      return null
    }

    const resultMap = await fetchProductsVatByProductUuids([productId], regionName)
    return resultMap.get(productId) ?? null
  } catch (error) {
    console.error('[fetchProductVatByProductUuid] Error fetching VAT rate:', error)
    return null
  }
}

// ==================== SERVICE-LEVEL FUNCTIONS (for controllers) ====================

export interface GetVatRateSingleResponse {
  success: boolean
  message?: string
  data?: {
    productId: string
    region: string
    vatRate: number | null
  }
}

export interface GetVatRateBatchResponse {
  success: boolean
  message?: string
  data?: {
    region: string
    vatRates: Record<string, number | null>
  }
}

/**
 * Service-level function for getting single product VAT rate
 * Validates inputs and returns controller-ready response format
 * @param productId Product UUID
 * @param region Region name
 * @returns Controller-ready response with VAT rate
 */
export async function getVatRateSingle(
  productId: string,
  region: string
): Promise<GetVatRateSingleResponse> {
  // Validate inputs
  if (!productId || typeof productId !== 'string' || productId.trim().length === 0) {
    return {
      success: false,
      message: 'Product ID parameter is required'
    }
  }

  if (!region || typeof region !== 'string' || region.trim().length === 0) {
    return {
      success: false,
      message: 'Region parameter is required'
    }
  }

  const trimmedProductId = productId.trim()
  const trimmedRegion = region.trim()

  const vatRate = await fetchProductVatByProductUuid(trimmedProductId, trimmedRegion)

  return {
    success: true,
    data: {
      productId: trimmedProductId,
      region: trimmedRegion,
      vatRate
    }
  }
}

/**
 * Service-level function for getting batch products VAT rates
 * Validates inputs and returns controller-ready response format
 * @param productIds Array of product UUIDs
 * @param region Region name
 * @returns Controller-ready response with VAT rates map
 */
export async function getVatRateBatch(
  productIds: string[],
  region: string
): Promise<GetVatRateBatchResponse> {
  // Validate inputs
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return {
      success: false,
      message: 'productIds array is required and must not be empty'
    }
  }

  if (!region || typeof region !== 'string' || region.trim().length === 0) {
    return {
      success: false,
      message: 'Region parameter is required'
    }
  }

  // Filter out invalid productIds
  const validProductIds = productIds.filter(
    id => id && typeof id === 'string' && id.trim().length > 0
  ).map(id => id.trim())

  if (validProductIds.length === 0) {
    return {
      success: false,
      message: 'No valid product IDs provided'
    }
  }

  const trimmedRegion = region.trim()

  const vatRatesMap = await fetchProductsVatByProductUuids(validProductIds, trimmedRegion)

  // Convert Map to object for JSON response
  const vatRates: Record<string, number | null> = {}
  validProductIds.forEach(id => {
    vatRates[id] = vatRatesMap.get(id) ?? null
  })

  return {
    success: true,
    data: {
      region: trimmedRegion,
      vatRates
    }
  }
}

export default {
  fetchProductsVatByProductUuids,
  fetchProductVatByProductUuid,
  getVatRateSingle,
  getVatRateBatch
}

