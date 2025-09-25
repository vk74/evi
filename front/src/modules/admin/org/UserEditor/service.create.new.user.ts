/**
 * @file service.create.new.user.ts
 * Version: 1.0.0
 * Service for creating new user accounts from admin module.
 * Frontend file that handles user creation requests, error management, and logging.
 *
 * Functionality:
 * - Send request to API for new user creation
 * - Error management and handling
 * - Operation logging
 */
import { api } from '@/core/api/service.axios'
import type { ICreateUserRequest, ICreateUserResponse } from './types.user.editor'

/**
 * Logger for service operations
 */
const logger = {
  info: (message: string, meta?: object) =>
    console.log(`[CreateUserService] ${message}`, meta || ''),
  error: (message: string, error?: unknown) =>
    console.error(`[CreateUserService] ${message}`, error || '')
}

/**
 * Service for creating new users
 */
export const createUserService = {
  /**
   * Creates a new user account
   * @param userData - New user data
   * @returns Promise<string> - ID of created user
   * @throws Error when creation fails
   */
  async createUser(userData: ICreateUserRequest): Promise<string> {
    logger.info('Starting user creation with data:', {
      username: userData.username,
      email: userData.email,
      is_staff: userData.is_staff,
      account_status: userData.account_status
    })

    try {
      const response = await api.post<ICreateUserResponse>(
        '/api/admin/users/create-new-user',
        userData
      )

      if (!response?.data) {
        const errorMessage = 'Invalid server response'
        logger.error(errorMessage)
        throw new Error(errorMessage)
      }

      if (response.data.success) {
        logger.info('User successfully created', {
          userId: response.data.userId,
          username: response.data.username,
          email: response.data.email
        })
        return response.data.userId
      } else {
        const errorMessage = response.data.message || 'Unknown error during user creation'
        logger.error(errorMessage)
        throw new Error(errorMessage)
      }
    } catch (error) {
      // Handle axios errors
      if (error instanceof Error) {
        logger.error('Failed to create user', error)
        throw error
      }
      // Handle unexpected errors
      const errorMessage = 'Unexpected error during user creation'
      logger.error(errorMessage, error)
      throw new Error(errorMessage)
    }
  }
}

export default createUserService