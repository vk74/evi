/**
 * @file service.fetch.active.services.ts
 * Version: 1.0.0
 * Service for fetching active catalog services from the backend.
 * Frontend file that provides unified interface for getting active services with caching.
 *
 * Functionality:
 * - Provides a unified interface for getting active services
 * - Uses local state for caching with 5-minute TTL
 * - Handles loading states and error management
 */

import { api } from '@/core/api/service.axios';
import { useUiStore } from '@/core/state/uistate';
import type { CatalogService, FetchActiveServicesResponse, FetchActiveServicesOptions } from './services/types.services';

// Cache TTL in milliseconds (5 minutes)
const SERVICES_CACHE_TTL = 5 * 60 * 1000;

type FetchServicesResponse = FetchActiveServicesResponse;
type FetchServicesOptions = FetchActiveServicesOptions;

interface ActiveServicesState {
  services: CatalogService[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

// Local state for caching
const servicesState: ActiveServicesState = {
  services: [],
  loading: false,
  error: null,
  lastFetched: null,
};

function isCacheValid(): boolean {
  if (!servicesState.lastFetched) return false;
  const now = Date.now();
  return now - servicesState.lastFetched < SERVICES_CACHE_TTL;
}

export async function fetchActiveServices(options: FetchServicesOptions & { sectionId?: string } = {}): Promise<CatalogService[]> {
  const uiStore = useUiStore();

  try {
    // Disable global cache when filtering by section to avoid leaking across sections
    if (!options.forceRefresh && !options.sectionId && isCacheValid()) {
      return servicesState.services;
    }

    servicesState.loading = true;
    servicesState.error = null;

    const response = await api.get<FetchServicesResponse>('/api/catalog/fetch-services', {
      params: options.sectionId ? { sectionId: options.sectionId } : undefined,
    });

    if (response.data.success && response.data.data) {
      servicesState.services = response.data.data;
      servicesState.lastFetched = Date.now();
      servicesState.error = null;
      return servicesState.services;
    } else {
      const errorMessage = response.data.message || 'Unknown error fetching active services';
      servicesState.error = errorMessage;
      uiStore.showErrorSnackbar(`Error loading active services: ${errorMessage}`);
      return [];
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    servicesState.error = errorMessage;
    uiStore.showErrorSnackbar(`Error loading active services: ${errorMessage}`);
    return [];
  } finally {
    servicesState.loading = false;
  }
}

export function getCachedActiveServices(): CatalogService[] {
  return servicesState.services;
}

export function isActiveServicesCacheExpired(): boolean {
  return !isCacheValid();
}

export function getActiveServicesCacheTimeRemaining(): number {
  if (!servicesState.lastFetched) return 0;
  const now = Date.now();
  const expirationTime = servicesState.lastFetched + SERVICES_CACHE_TTL;
  return Math.max(0, Math.floor((expirationTime - now) / 1000));
}

export function isActiveServicesLoading(): boolean {
  return servicesState.loading;
}

export function getActiveServicesError(): string | null {
  return servicesState.error;
}

export function clearActiveServicesCache(): void {
  servicesState.services = [];
  servicesState.lastFetched = null;
  servicesState.error = null;
}

export async function forceRefreshActiveServices(): Promise<CatalogService[]> {
  clearActiveServicesCache();
  return fetchActiveServices({ forceRefresh: true });
}


