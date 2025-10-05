/**
 * @file service.fetch.active.products.ts
 * Version: 1.0.0
 * Service for fetching active catalog products from the backend with caching.
 * Frontend file that provides unified interface for getting active products.
 */

import { api } from '@/core/api/service.axios'
import { useUiStore } from '@/core/state/uistate'
import { useUserAuthStore } from '@/core/auth/state.user.auth'
import type { CatalogProduct, FetchActiveProductsResponse, FetchActiveProductsOptions } from './types.products'

const PRODUCTS_CACHE_TTL = 5 * 60 * 1000

type ProductId = string

interface ProductsState {
  products: CatalogProduct[]
  loading: boolean
  error: string | null
  lastFetched: number | null
}

let state: ProductsState = { products: [], loading: false, error: null, lastFetched: null }

function isFresh(): boolean {
  if (!state.lastFetched) return false
  return Date.now() - state.lastFetched < PRODUCTS_CACHE_TTL
}

export async function fetchActiveProducts(options: FetchActiveProductsOptions = {}): Promise<CatalogProduct[]> {
  const ui = useUiStore()
  const userStore = useUserAuthStore()
  
  try {
    if (!options.forceRefresh && isFresh()) {
      return state.products
    }
    
    // Get user language from store
    const userLanguage = userStore.language
    if (!userLanguage) {
      throw new Error('User language is not set in application state')
    }
    
    state.loading = true
    state.error = null
    const response = await api.get<FetchActiveProductsResponse>('/api/catalog/fetch-products', { 
      params: { 
        sectionId: options.sectionId,
        language: userLanguage
      }
    })
    if (response.data.success) {
      state.products = response.data.data
      state.lastFetched = Date.now()
      state.error = null
      return state.products
    } else {
      const msg = response.data.message || 'Unknown error'
      state.error = msg
      ui.showErrorSnackbar(`Error loading active products: ${msg}`)
      return []
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    state.error = msg
    ui.showErrorSnackbar(`Error loading active products: ${msg}`)
    return []
  } finally {
    state.loading = false
  }
}

export function getCachedActiveProducts(): CatalogProduct[] {
  return state.products
}

export function isActiveProductsLoading(): boolean { 
  return state.loading 
}

export function getActiveProductsError(): string | null { 
  return state.error 
}

export function clearActiveProductsCache(): void { 
  state = { products: [], loading: false, error: null, lastFetched: null } 
}

export async function forceRefreshActiveProducts(): Promise<CatalogProduct[]> {
  clearActiveProductsCache()
  return fetchActiveProducts({ forceRefresh: true })
}
