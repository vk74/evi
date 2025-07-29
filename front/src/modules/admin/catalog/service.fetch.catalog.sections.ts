/**
 * @file service.fetch.catalog.sections.ts
 * Service for fetching catalog sections data from API.
 * Version: 1.0.01
 * FRONTEND service for fetching and managing catalog sections data from API.
 *
 * Functionality:
 * - Fetches catalog sections from API
 * - Manages state through Pinia store
 * - Handles request cancellation for concurrent requests
 * - Provides error handling and logging
 * - Supports simple data fetching without pagination
 */
import { api } from '@/core/api/service.axios'
import { useCatalogAdminStore } from './state.catalog.admin'
import { useUserAuthStore } from '@/modules/account/state.user.auth'
import { useUiStore } from '@/core/state/uistate'
import type { 
  FetchSectionsResponse,
  CatalogSection,
  ApiError
} from './types.catalog.admin'

// Logger for main operations
const logger = {
  info: (message: string, meta?: any) => console.log(`[CatalogSectionsFetchService] ${message}`, meta || ''),
  error: (message: string, error?: any) => console.error(`[CatalogSectionsFetchService] ${message}`, error || '')
}

// For request cancellation
let currentController: AbortController | null = null

/**
 * Service for fetching and managing catalog sections data
 */
export const catalogSectionsFetchService = {
  /**
   * Fetches catalog sections from API
   * @param forceRefresh Flag to bypass cache
   * @returns Promise<void>
   * @throws {Error} When request fails
   */
  async fetchSections(forceRefresh = false): Promise<void> {
    const store = useCatalogAdminStore()
    const userStore = useUserAuthStore()
    const uiStore = useUiStore()

    // Check user authentication
    if (!userStore.isAuthenticated) {
      const errorMessage = 'User not authenticated'
      logger.error(errorMessage)
      store.setError(errorMessage)
      throw new Error(errorMessage)
    }

    // Check if we can use cached data (5 minutes cache)
    if (!forceRefresh && store.lastFetchTime) {
      const cacheAge = Date.now() - store.lastFetchTime
      const cacheValid = cacheAge < 5 * 60 * 1000 // 5 minutes
      
      if (cacheValid && store.sections.length > 0) {
        logger.info('Using cached catalog sections data', {
          cacheAge: Math.round(cacheAge / 1000),
          sectionsCount: store.sections.length
        })
        return
      }
    }

    // Prepare for API request
    store.setLoading(true)
    store.clearError()

    // Cancel any in-progress request
    if (currentController) {
      currentController.abort()
    }
    currentController = new AbortController()

    try {
      logger.info('Fetching catalog sections from API')
      
      // Make API request
      const response = await api.get<FetchSectionsResponse>(
        '/api/admin/catalog/fetch-sections',
        {
          signal: currentController.signal
        }
      )

      // Debug: log what we received
      console.log('[CatalogSectionsFetchService] Raw response:', {
        responseType: typeof response,
        responseDataType: typeof response.data,
        responseDataKeys: Object.keys(response.data || {}),
        hasData: !!response.data?.data,
        dataIsArray: Array.isArray(response.data?.data),
        dataLength: response.data?.data?.length,
        success: response.data?.success
      })

      // Validate response format
      if (!response.data || !response.data.success || !Array.isArray(response.data.data)) {
        console.error('[CatalogSectionsFetchService] Validation failed:', {
          hasData: !!response.data,
          success: response.data?.success,
          dataIsArray: Array.isArray(response.data?.data),
          responseData: response.data
        })
        throw new Error('Invalid API response format')
      }

      console.log('[CatalogSectionsFetchService] API Response received:', {
        sectionsCount: response.data.data.length,
        success: response.data.success,
        message: response.data.message,
        sectionsSample: response.data.data.slice(0, 2).map(s => ({ 
          id: s.id, 
          name: s.name, 
          status: s.status 
        }))
      })

      logger.info('Successfully received catalog sections data', {
        count: response.data.data.length,
        message: response.data.message
      })

      // Update store data
      store.setSections(response.data.data)

    } catch (error: any) {
      // Don't process aborted requests
      if (error.name === 'AbortError' || error.name === 'CanceledError') {
        logger.info('Request was cancelled')
        return
      }
      
      // Handle API error responses
      if (error.response?.data) {
        const apiError = error.response.data as ApiError
        const errorMessage = apiError.message || 'Error fetching catalog sections'
        store.setError(errorMessage)
        logger.error('API error:', apiError)
        uiStore.showErrorSnackbar(errorMessage)
      } else {
        // Handle other errors
        const errorMessage = error.message || 'Failed to fetch catalog sections data'
        store.setError(errorMessage)
        logger.error('Error fetching catalog sections:', error)
        uiStore.showErrorSnackbar(errorMessage)
      }
      
      throw error
    } finally {
      store.setLoading(false)
      currentController = null
    }
  },

  /**
   * Forces refresh of catalog sections data
   * @returns Promise<void>
   */
  async refreshSections(): Promise<void> {
    logger.info('Forcing refresh of catalog sections data')
    return this.fetchSections(true)
  }
}

export default catalogSectionsFetchService 