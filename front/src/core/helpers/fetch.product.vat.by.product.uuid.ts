/**
 * Version: 1.0.0
 * Helper for getting VAT rate(s) by product UUID(s) and region from backend.
 * Frontend file that provides universal functions to get VAT rate for product(s).
 * Can be used across different modules that need VAT rate information.
 * Filename: fetch.product.vat.by.product.uuid.ts (frontend)
 */

import { api } from '@/core/api/service.axios'

interface GetVatRateSingleResponse {
  success: boolean
  message?: string
  data?: {
    productId: string
    region: string
    vatRate: number | null
  }
  error?: string
}

interface GetVatRateBatchResponse {
  success: boolean
  message?: string
  data?: {
    region: string
    vatRates: Record<string, number | null>
  }
  error?: string
}

/**
 * Fetch VAT rate for a single product by its UUID and region
 * Wrapper around batch method for convenience
 * @param productId Product UUID to fetch VAT rate for
 * @param region Region name to filter by
 * @returns Promise with VAT rate (number | null) or null on error
 */
export async function fetchProductVatByProductUuid(
  productId: string,
  region: string
): Promise<number | null> {
  try {
    if (!productId || !region) {
      return null
    }

    const response = await api.get<GetVatRateSingleResponse>('/api/catalog/vat-rate', {
      params: {
        productId: productId.trim(),
        region: region.trim()
      }
    })

    if (!response.data.success || !response.data.data) {
      console.error('[fetchProductVatByProductUuid] API error:', response.data.message || response.data.error)
      return null
    }

    return response.data.data.vatRate
  } catch (error) {
    console.error('[fetchProductVatByProductUuid] Error fetching VAT rate:', error)
    return null
  }
}

/**
 * Fetch VAT rates for multiple products by their UUIDs and region
 * @param productIds Array of product UUIDs to fetch VAT rates for
 * @param region Region name to filter by
 * @returns Promise with Map of productId -> vatRate (number | null)
 */
export async function fetchProductsVatByProductUuids(
  productIds: string[],
  region: string
): Promise<Map<string, number | null>> {
  const resultMap = new Map<string, number | null>()

  try {
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return resultMap
    }

    if (!region) {
      return resultMap
    }

    // Filter out invalid productIds
    const validProductIds = productIds.filter(
      id => id && typeof id === 'string' && id.trim().length > 0
    ).map(id => id.trim())

    if (validProductIds.length === 0) {
      return resultMap
    }

    const response = await api.post<GetVatRateBatchResponse>('/api/catalog/vat-rates', {
      productIds: validProductIds,
      region: region.trim()
    })

    if (!response.data.success || !response.data.data) {
      console.error('[fetchProductsVatByProductUuids] API error:', response.data.message || response.data.error)
      return resultMap
    }

    // Convert response object to Map
    const { vatRates } = response.data.data
    Object.entries(vatRates).forEach(([productId, vatRate]) => {
      resultMap.set(productId, vatRate)
    })

    return resultMap
  } catch (error) {
    console.error('[fetchProductsVatByProductUuids] Error fetching VAT rates:', error)
    return resultMap
  }
}

