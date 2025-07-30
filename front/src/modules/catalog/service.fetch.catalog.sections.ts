/**
 * @file service.fetch.catalog.sections.ts
 * Version: 1.0.0
 * Service for fetching catalog sections from the backend.
 * Frontend file that provides unified interface for getting catalog sections with caching.
 *
 * Functionality:
 * - Provides a unified interface for getting catalog sections
 * - Uses local state for caching with 5-minute TTL
 * - Handles loading states and error management
 */

import { api } from '@/core/api/service.axios'
import { useUiStore } from '@/core/state/uistate';
import { 
  CatalogSection, 
  FetchSectionsResponse,
  FetchSectionsOptions,
  CatalogSectionsState
} from './types.catalog';

// Cache TTL in milliseconds (5 minutes)
const CATALOG_CACHE_TTL = 5 * 60 * 1000;

// Local state for caching
let catalogState: CatalogSectionsState = {
  sections: [],
  loading: false,
  error: null,
  lastFetched: null
};

/**
 * Checks if the cache is valid (not expired)
 */
function isCacheValid(): boolean {
  if (!catalogState.lastFetched) return false;
  const now = Date.now();
  return (now - catalogState.lastFetched) < CATALOG_CACHE_TTL;
}

/**
 * Fetches catalog sections from the backend.
 * First checks the cache, and only requests from backend if cache is empty or expired.
 * 
 * @param options - Optional parameters for fetching
 * @returns Promise that resolves to an array of catalog sections
 */
export async function fetchCatalogSections(options: FetchSectionsOptions = {}): Promise<CatalogSection[]> {
  const uiStore = useUiStore();
  
  console.log(`Fetching catalog sections${options.forceRefresh ? ' (forced refresh)' : ''}`);
  
  try {
    // Check if we have valid cache and not forcing refresh
    if (!options.forceRefresh && isCacheValid()) {
      console.log('Using cached catalog sections', catalogState.sections);
      return catalogState.sections;
    }
    
    // Set loading state
    catalogState.loading = true;
    catalogState.error = null;
    
    // Prepare request parameters
    const params: Record<string, string> = {};
    if (options.sectionId) {
      params.sectionId = options.sectionId;
    }
    
    // Make API request using the centralized api client
    const response = await api.get<FetchSectionsResponse>(
      '/api/catalog/fetch-sections',
      { params }
    );
    
    // Handle response
    if (response.data.success && response.data.data) {
      // Cache the sections
      catalogState.sections = response.data.data;
      catalogState.lastFetched = Date.now();
      
      // Clear any previous errors
      catalogState.error = null;
      
      console.log('Catalog sections fetched successfully:', catalogState.sections);
      
      // Return the sections
      return catalogState.sections;
    } else {
      // Handle error case
      const errorMessage = response.data.message || 'Unknown error fetching catalog sections';
      catalogState.error = errorMessage;
      
      // Show error message to user
      uiStore.showErrorSnackbar(`Error loading catalog sections: ${errorMessage}`);
      
      // Return empty sections array
      return [];
    }
  } catch (error) {
    // Handle exception
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching catalog sections:', error);
    
    // Set error in state
    catalogState.error = errorMessage;
    
    // Show error message to user
    uiStore.showErrorSnackbar(`Error loading catalog sections: ${errorMessage}`);
    
    // Return empty sections array
    return [];
  } finally {
    // Clear loading state
    catalogState.loading = false;
  }
}

/**
 * Gets cached catalog sections without making a request
 * 
 * @returns Array of cached catalog sections or empty array if no cache
 */
export function getCachedCatalogSections(): CatalogSection[] {
  return catalogState.sections;
}

/**
 * Checks if the cache for catalog sections has expired.
 * 
 * @returns True if cache has expired or doesn't exist, false otherwise
 */
export function isCatalogCacheExpired(): boolean {
  return !isCacheValid();
}

/**
 * Gets the time in seconds until the cache expires.
 * 
 * @returns Time in seconds until expiration, or 0 if already expired
 */
export function getCatalogCacheTimeRemaining(): number {
  if (!catalogState.lastFetched) return 0;
  
  const now = Date.now();
  const expirationTime = catalogState.lastFetched + CATALOG_CACHE_TTL;
  const remainingMs = Math.max(0, expirationTime - now);
  
  return Math.floor(remainingMs / 1000); // Convert to seconds
}

/**
 * Gets the current loading state
 * 
 * @returns True if currently loading, false otherwise
 */
export function isCatalogLoading(): boolean {
  return catalogState.loading;
}

/**
 * Gets the current error state
 * 
 * @returns Current error message or null if no error
 */
export function getCatalogError(): string | null {
  return catalogState.error;
}

/**
 * Clears the cache and error state
 */
export function clearCatalogCache(): void {
  catalogState.sections = [];
  catalogState.lastFetched = null;
  catalogState.error = null;
} 