/**
 * @file service.load.user.ts
 * Version: 1.0.0
 * Service for loading user data from API.
 * Frontend file that handles user data fetching, validation, and store initialization.
 * 
 * Functionality:
 * - Fetch user data by ID
 * - Validate received data integrity
 * - Initialize edit mode in store
 * - Handle loading errors
 */
import { api } from '@/core/api/service.axios'
import { useUserEditorStore } from './state.user.editor'
import { useUserAuthStore } from '@/core/auth/state.user.auth';
import type { ILoadUserResponse, IApiError } from './types.user.editor'

// Logger for tracking operations
const logger = {
  info: (message: string, meta?: object) => console.log(`[LoadUserService] ${message}`, meta || ''),
  error: (message: string, error?: unknown) => console.error(`[LoadUserService] ${message}`, error || '')
}

/**
 * Service for loading user data
 */
export const loadUserService = {
  /**
   * Fetches user data by ID
   * @param userId - User ID
   * @throws {Error} When loading fails or data is missing
   */
  async fetchUserById(userId: string): Promise<void> {
    const store = useUserEditorStore()
    const userStore = useUserAuthStore()

    // Check user authentication
    if (!userStore.isAuthenticated) {
      const errorMessage = 'User not authenticated'
      logger.error(errorMessage)
      throw new Error(errorMessage)
    }

    try {
      logger.info('Fetching user data', { userId })
      
      // Request data from API
      const response = await api.get<ILoadUserResponse>(
        `/api/admin/users/fetch-user-by-userid/${userId}`
      )

      // Check request success
      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to fetch user data'
        logger.error(errorMessage)
        throw new Error(errorMessage)
      }

      // Check if user data exists
      if (!response.data.data?.user) {
        const errorMessage = 'User data not found'
        logger.error(errorMessage)
        throw new Error(errorMessage)
      }

      logger.info('Successfully received user data', {
        userId,
        username: response.data.data.user.username
      })

      // Initialize edit mode
      store.initEditMode({
        user: response.data.data.user
      })

      logger.info('User data saved to store', { userId })

    } catch (error) {
      const apiError = error as IApiError
      const errorMessage = apiError.message || 'Failed to load user data'
      logger.error(errorMessage, error)
      throw new Error(errorMessage)
    }
  }
}

export default loadUserService