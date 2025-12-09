/**
 * @file service.fetch.product.options.ts
 * Version: 1.2.0
 * Service for fetching product options for product card.
 * Frontend file that posts productId, locale, and region to backend and returns typed data.
 * 
 * Changes in v1.1.0:
 * - Added optional region parameter for region-based option filtering
 * - Region is required for options to be filtered by user's location
 * 
 * Changes in v1.2.0:
 * - Now uses userStore.language which stores full language names ('english'/'russian')
 * - Language is sent directly to backend without conversion
 */

import { api } from '@/core/api/service.axios'
import { useUiStore } from '@/core/state/uistate'
import { useUserAuthStore } from '@/core/auth/state.user.auth'
import type { CatalogProductOption, FetchProductOptionsResponse } from './types.products'

export async function fetchProductOptions(productId: string, region?: string): Promise<CatalogProductOption[]> {
  const ui = useUiStore()
  const userStore = useUserAuthStore()

  try {
    const userLanguage = userStore.language
    if (!userLanguage) {
      throw new Error('User language is not set in application state')
    }

    const response = await api.post<FetchProductOptionsResponse>('/api/catalog/products/options', {
      productId,
      locale: userLanguage,
      region
    })

    if (response.data.success) {
      return (response.data.data || []).map(row => ({
        product_id: row.option_product_id,
        option_name: row.option_name,
        product_code: row.product_code,
        is_published: row.is_published,
        is_required: row.is_required,
        units_count: row.units_count,
        unit_price: row.unit_price ?? undefined
      }))
    } else {
      const msg = response.data.message || 'Unknown error'
      ui.showErrorSnackbar(`Error loading product options: ${msg}`)
      return []
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    ui.showErrorSnackbar(`Error loading product options: ${msg}`)
    return []
  }
}

export default fetchProductOptions


