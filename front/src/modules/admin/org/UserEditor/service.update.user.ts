/**
 * @file service.update.user.ts
 * Version: 1.0.0
 * Service for updating user data.
 * Frontend file that handles user data updates, error handling, and operation logging.
 *
 * Functionality:
 * - Update user data via API
 * - Handle request errors
 * - Log operations
 */
import { api } from '@/core/api/service.axios'
import type { IUpdateUserRequestData, IApiResponse } from './types.user.editor'

/**
 * Logger for service operations
 */
const logger = {
  info: (message: string, meta?: object) =>
    console.log(`[UpdateUserService] ${message}`, meta || ''),
  error: (message: string, error?: unknown) =>
    console.error(`[UpdateUserService] ${message}`, error || '')
}

/**
 * Service for updating user data
 */
export const updateUserService = {
  /**
   * Updates user data
   * @param userId - User ID to update
   * @param userData - User data to update
   * @returns Promise<boolean> - Success status
   * @throws Error when update fails
   */
  async updateUser(userId: string, userData: IUpdateUserRequestData): Promise<boolean> {
    logger.info('Starting user update with data:', {
      user_id: userId,
      changed_fields: Object.keys(userData)
    })

    try {
      const response = await api.post<IApiResponse>(
        `/api/admin/users/update-user-by-userid/${userId}`,
        userData
      )

      if (!response?.data) {
        const errorMessage = 'Invalid server response'
        logger.error(errorMessage)
        throw new Error(errorMessage)
      }

      if (response.data.success) {
        logger.info('User successfully updated', {
          user_id: userId
        })
        return true
      } else {
        const errorMessage = response.data.message || 'Unknown error during user data update'
        logger.error(errorMessage)
        throw new Error(errorMessage)
      }

    } catch (error: any) {
      // Handle 403 Forbidden Operation error
      if (error.response?.status === 403 && error.response?.data?.code === 'FORBIDDEN_OPERATION') {
        const errorMessage = error.response.data.message || 'Operation not allowed for system user account'
        logger.error('Forbidden operation attempted', { message: errorMessage })
        throw new Error(errorMessage)
      }
      
      if (error instanceof Error) {
        logger.error('Failed to update user', error)
        throw error
      }

      const errorMessage = 'Unexpected error during user update'
      logger.error(errorMessage, error)
      throw new Error(errorMessage)
    }
  }
}

export default updateUserService