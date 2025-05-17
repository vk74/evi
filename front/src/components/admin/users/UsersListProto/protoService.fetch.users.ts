/**
 * protoService.fetch.users.ts
 * Version: 1.0.0
 * FRONTEND service for fetching and managing users list data from API.
 *
 * Functionality:
 * - Fetches users with pagination, sorting and filtering
 * - Manages cache through Pinia store
 * - Handles request cancellation for concurrent requests
 * - Provides error handling and logging
 */
import { api } from '@/core/api/service.axios'
import { useStoreUsersList } from './protoState.users.list'
import { useUserStore } from '@/core/state/userstate'
import { useUiStore } from '@/core/state/uistate'
import { 
  IFetchUsersParams, 
  IUsersResponse,
  IApiError
} from './protoTypes.users.list'

// Logger for main operations
const logger = {
  info: (message: string, meta?: any) => console.log(`[ProtoUsersFetchService] ${message}`, meta || ''),
  error: (message: string, error?: any) => console.error(`[ProtoUsersFetchService] ${message}`, error || '')
}

// For request cancellation
let currentController: AbortController | null = null

/**
 * Service for fetching and managing users data
 */
export const usersFetchService = {
  /**
   * Fetches users list with given parameters
   * @param params Query parameters including pagination, sorting and search
   * @param forceRefresh Flag to bypass cache
   * @returns Promise<void>
   * @throws {Error} When request fails
   */
  async fetchUsers(params?: Partial<IFetchUsersParams>, forceRefresh = false): Promise<void> {
    const store = useStoreUsersList()
    const userStore = useUserStore()
    const uiStore = useUiStore()

    // Check user authentication
    if (!userStore.isLoggedIn) {
      const errorMessage = 'User not authenticated'
      logger.error(errorMessage)
      store.error = errorMessage
      throw new Error(errorMessage)
    }

    // Merge params with current display params
    const queryParams: IFetchUsersParams = {
      ...store.displayParams,
      ...params,
      forceRefresh
    }

    // Check if we can use cached data
    if (!forceRefresh) {
      const cachedData = store.getCachedData(queryParams)
      if (cachedData) {
        // Update current display parameters
        store.updateDisplayParams(params || {})
        
        // Set data from cache
        store.setUsersData(cachedData.users, cachedData.totalItems)
        return
      }
    }

    // Prepare for API request
    store.loading = true
    store.error = null

    // Cancel any in-progress request
    if (currentController) {
      currentController.abort()
    }
    currentController = new AbortController()

    try {
      logger.info('Fetching users from API', queryParams)
      
      // Build search parameter
      const searchQuery = queryParams.search && queryParams.search.length >= 2 
        ? queryParams.search 
        : ''

      // Make API request
      const response = await api.get<IUsersResponse>(
        '/api/admin/users/proto/fetch-users',
        {
          params: {
            page: queryParams.page,
            itemsPerPage: queryParams.itemsPerPage,
            search: searchQuery,
            sortBy: queryParams.sortBy,
            sortDesc: queryParams.sortDesc,
            forceRefresh: forceRefresh
          },
          signal: currentController.signal
        }
      )

      // Validate response format
      if (!response.data || !Array.isArray(response.data.users)) {
        throw new Error('Invalid API response format')
      }

      logger.info('Successfully received users data', {
        count: response.data.users.length,
        total: response.data.total
      })

      // Update display parameters
      store.updateDisplayParams(params || {})
      
      // Update store data
      store.setUsersData(response.data.users, response.data.total)
      
      // Cache the result
      store.setCacheData(queryParams, response.data.users, response.data.total)

    } catch (error: any) {
      // Don't process aborted requests
      if (error.name === 'AbortError' || error.name === 'CanceledError') {
        logger.info('Request was cancelled')
        return
      }
      
      // Handle API error responses
      if (error.response?.data) {
        const apiError = error.response.data as IApiError
        store.error = apiError.message || 'Error fetching users'
        logger.error('API error:', apiError)
        uiStore.showErrorSnackbar(apiError.message)
      } else {
        // Handle other errors
        const errorMessage = error.message || 'Failed to fetch users data'
        store.error = errorMessage
        logger.error('Error fetching users:', error)
        uiStore.showErrorSnackbar(errorMessage)
      }
      
      throw error
    } finally {
      store.loading = false
      currentController = null
    }
  },

  /**
   * Forces refresh of users data
   * @returns Promise<void>
   */
  async refreshUsers(): Promise<void> {
    logger.info('Forcing refresh of users data')
    return this.fetchUsers({}, true)
  }
}

export default usersFetchService
