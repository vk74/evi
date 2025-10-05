/**
 * @file service.fetch.product.details.ts
 * Version: 1.0.0
 * Service for fetching single product details from the backend with caching.
 * Frontend file that provides unified interface for getting product details.
 */

import { api } from '@/core/api/service.axios'
import { useUiStore } from '@/core/state/uistate'
import { useUserAuthStore } from '@/core/auth/state.user.auth'
import type { CatalogProductDetails, FetchProductDetailsResponse, FetchProductDetailsOptions } from './types.products'

const DETAILS_CACHE_TTL = 5 * 60 * 1000

type ProductId = string

interface DetailsState {
  byId: Record<ProductId, { data: CatalogProductDetails | null; fetchedAt: number }>
  loading: boolean
  error: string | null
}

let state: DetailsState = { byId: {}, loading: false, error: null }

function isFresh(productId: ProductId): boolean {
  const entry = state.byId[productId]
  if (!entry) return false
  return Date.now() - entry.fetchedAt < DETAILS_CACHE_TTL
}

export async function fetchProductDetails(productId: string, options: FetchProductDetailsOptions = {}): Promise<CatalogProductDetails | null> {
  const ui = useUiStore()
  const userStore = useUserAuthStore()
  
  try {
    if (!options.forceRefresh && isFresh(productId)) {
      return state.byId[productId].data
    }
    
    // Get user language from store
    const userLanguage = userStore.language
    if (!userLanguage) {
      throw new Error('User language is not set in application state')
    }
    
    state.loading = true
    state.error = null
    const response = await api.get<FetchProductDetailsResponse>('/api/catalog/fetch-product-details', { 
      params: { 
        productId,
        language: userLanguage
      } 
    })
    if (response.data.success) {
      const productData = response.data.data
      state.byId[productId] = { data: productData, fetchedAt: Date.now() }
      return productData
    } else {
      const msg = response.data.message || 'Unknown error'
      state.error = msg
      ui.showErrorSnackbar(`Error loading product details: ${msg}`)
      return null
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    state.error = msg
    ui.showErrorSnackbar(`Error loading product details: ${msg}`)
    return null
  } finally {
    state.loading = false
  }
}

export function getCachedProductDetails(productId: string): CatalogProductDetails | null {
  return state.byId[productId]?.data ?? null
}

export function isProductDetailsLoading(): boolean { 
  return state.loading 
}

export function getProductDetailsError(): string | null { 
  return state.error 
}

export function clearProductDetailsCache(): void { 
  state = { byId: {}, loading: false, error: null } 
}

export async function forceRefreshProductDetails(productId: string): Promise<CatalogProductDetails | null> {
  delete state.byId[productId]
  return fetchProductDetails(productId, { forceRefresh: true })
}
