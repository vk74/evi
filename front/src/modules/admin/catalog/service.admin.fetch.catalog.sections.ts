/**
 * @file service.fetch.catalog.sections.ts
 * Service for fetching catalog sections data from API.
 * Version: 1.0.03
 * FRONTEND service for fetching and managing catalog sections data from API.
 *
 * Functionality:
 * - Fetches catalog sections from API
 * - Fetches single section by ID
 * - Manages state through Pinia store
 * - Handles request cancellation for concurrent requests
 * - Provides error handling and logging
 * - Supports simple data fetching without pagination
 */
import { api } from '@/core/api/service.axios'
import { useCatalogAdminStore } from './state.catalog.admin'
import { useUserAuthStore } from '@/core/auth/state.user.auth'
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
   * @param forceRefresh Flag to bypass cache (kept for compatibility)
   * @param sectionId Optional section ID to fetch single section
   * @returns Promise<void>
   * @throws {Error} When request fails
   */
  async fetchSections(forceRefresh = false, sectionId?: string): Promise<void> {
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

    // Prepare for API request
    store.setLoading(true)
    store.clearError()

    // Cancel any in-progress request
    if (currentController) {
      currentController.abort()
    }
    currentController = new AbortController()

    try {
      logger.info('Fetching catalog sections from API', { sectionId })
      
      // Prepare request parameters
      const params: any = {}
      if (sectionId) {
        params.sectionId = sectionId
      }
      
      // Make API request
      const response = await api.get<FetchSectionsResponse>(
        '/api/admin/catalog/fetch-sections',
        {
          params,
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
   * Fetches single catalog section by ID
   * @param sectionId ID of the section to fetch
   * @param forceRefresh Flag to bypass cache (kept for compatibility)
   * @returns Promise<CatalogSection>
   * @throws {Error} When request fails or section not found
   */
  async fetchSection(sectionId: string, forceRefresh = false): Promise<CatalogSection> {
    const store = useCatalogAdminStore()
    const userStore = useUserAuthStore()
    const uiStore = useUiStore()

    // Check user authentication
    if (!userStore.isAuthenticated) {
      const errorMessage = 'User not authenticated'
      logger.error(errorMessage)
      throw new Error(errorMessage)
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
      logger.info('Fetching single catalog section from API', { sectionId })
      
      // Make API request for single section
      const response = await api.get<FetchSectionsResponse>(
        '/api/admin/catalog/fetch-sections',
        {
          params: { sectionId },
          signal: currentController.signal
        }
      )

      // Validate response format
      if (!response.data || !response.data.success || !Array.isArray(response.data.data)) {
        throw new Error('Invalid API response format')
      }

      // Check if section was found
      if (response.data.data.length === 0) {
        const errorMessage = `Section with ID ${sectionId} not found`
        logger.error(errorMessage)
        uiStore.showErrorSnackbar(errorMessage)
        throw new Error(errorMessage)
      }

      const section = response.data.data[0]
      logger.info('Successfully received section data', {
        sectionId: section.id,
        sectionName: section.name
      })

      return section

    } catch (error: any) {
      // Don't process aborted requests
      if (error.name === 'AbortError' || error.name === 'CanceledError') {
        logger.info('Request was cancelled')
        throw error
      }
      
      // Handle API error responses
      if (error.response?.data) {
        const apiError = error.response.data as ApiError
        const errorMessage = apiError.message || 'Error fetching section'
        store.setError(errorMessage)
        logger.error('API error:', apiError)
        uiStore.showErrorSnackbar(errorMessage)
      } else {
        // Handle other errors
        const errorMessage = error.message || 'Failed to fetch section data'
        store.setError(errorMessage)
        logger.error('Error fetching section:', error)
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