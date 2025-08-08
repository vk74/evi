/**
 * @file service.fetch.service.details.ts
 * Version: 1.0.0
 * Service for fetching single service details from the backend with caching.
 * Frontend file that provides unified interface for getting service details.
 */

import { api } from '@/core/api/service.axios'
import { useUiStore } from '@/core/state/uistate'
import type { CatalogServiceDetails, FetchServiceDetailsResponse, FetchServiceDetailsOptions } from './types.service.details'

const DETAILS_CACHE_TTL = 5 * 60 * 1000

type ServiceId = string

interface DetailsState {
  byId: Record<ServiceId, { data: CatalogServiceDetails | null; fetchedAt: number }>
  loading: boolean
  error: string | null
}

let state: DetailsState = { byId: {}, loading: false, error: null }

function isFresh(serviceId: ServiceId): boolean {
  const entry = state.byId[serviceId]
  if (!entry) return false
  return Date.now() - entry.fetchedAt < DETAILS_CACHE_TTL
}

export async function fetchServiceDetails(serviceId: string, options: FetchServiceDetailsOptions = {}): Promise<CatalogServiceDetails | null> {
  const ui = useUiStore()
  try {
    if (!options.forceRefresh && isFresh(serviceId)) {
      return state.byId[serviceId].data
    }
    state.loading = true
    state.error = null
    const response = await api.get<FetchServiceDetailsResponse>('/api/catalog/fetch-service-details', { params: { serviceId } })
    if (response.data.success) {
      state.byId[serviceId] = { data: response.data.data, fetchedAt: Date.now() }
      return response.data.data
    } else {
      const msg = response.data.message || 'Unknown error'
      state.error = msg
      ui.showErrorSnackbar(`Error loading service details: ${msg}`)
      return null
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    state.error = msg
    ui.showErrorSnackbar(`Error loading service details: ${msg}`)
    return null
  } finally {
    state.loading = false
  }
}

export function getCachedServiceDetails(serviceId: string): CatalogServiceDetails | null {
  return state.byId[serviceId]?.data ?? null
}

export function isServiceDetailsLoading(): boolean { return state.loading }
export function getServiceDetailsError(): string | null { return state.error }
export function clearServiceDetailsCache(): void { state = { byId: {}, loading: false, error: null } }
export async function forceRefreshServiceDetails(serviceId: string): Promise<CatalogServiceDetails | null> {
  delete state.byId[serviceId]
  return fetchServiceDetails(serviceId, { forceRefresh: true })
}


