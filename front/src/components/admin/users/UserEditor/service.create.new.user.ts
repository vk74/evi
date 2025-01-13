/**
 * service.create.new.user.ts
 * Сервис для создания новой учетной записи пользователя.
 *
 * Функциональность:
 * - Создание новой учетной записи через API
 * - Обработка ошибок запроса
 * - Логирование операций
 */
import { api } from '@/core/api/service.axios'
import type { ICreateUserRequest, ICreateUserResponse } from './types.user.editor'

/**
 * Логгер для операций сервиса
 */
const logger = {
  info: (message: string, meta?: object) =>
    console.log(`[CreateUserService] ${message}`, meta || ''),
  error: (message: string, error?: unknown) =>
    console.error(`[CreateUserService] ${message}`, error || '')
}

/**
 * Сервис создания нового пользователя
 */
export const createUserService = {
  /**
   * Создает новую учетную запись пользователя
   * @param userData - данные нового пользователя
   * @returns Promise<string> - ID созданного пользователя
   * @throws Error при ошибке создания
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
        const errorMessage = 'Некорректный ответ сервера'
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
        const errorMessage = response.data.message || 'Неизвестная ошибка создания пользователя'
        logger.error(errorMessage)
        throw new Error(errorMessage)
      }
    } catch (error) {
      // Обработка ошибок axios
      if (error instanceof Error) {
        logger.error('Failed to create user', error)
        throw error
      }
      // Обработка неожиданных ошибок
      const errorMessage = 'Unexpected error during user creation'
      logger.error(errorMessage, error)
      throw new Error(errorMessage)
    }
  }
}

export default createUserService