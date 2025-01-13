/**
 * service.update.user.ts
 * Сервис для обновления данных пользователя.
 *
 * Функциональность:
 * - Обновление данных пользователя через API
 * - Обработка ошибок запроса
 * - Логирование операций
 */
import { api } from '@/core/api/service.axios'
import type { IUpdateUserRequest, IApiResponse } from './types.user.editor'

/**
 * Логгер для операций сервиса
 */
const logger = {
  info: (message: string, meta?: object) =>
    console.log(`[UpdateUserService] ${message}`, meta || ''),
  error: (message: string, error?: unknown) =>
    console.error(`[UpdateUserService] ${message}`, error || '')
}

/**
 * Сервис обновления данных пользователя
 */
export const updateUserService = {
  /**
   * Обновляет данные пользователя
   * @param userData - обновляемые данные пользователя
   * @returns Promise<boolean> - успешность операции
   * @throws Error при ошибке обновления
   */
  async updateUser(userData: IUpdateUserRequest): Promise<boolean> {
    logger.info('Starting user update with data:', {
      user_id: userData.user_id,
      changed_fields: Object.keys(userData).filter(key => key !== 'user_id')
    })

    try {
      const response = await api.post<IApiResponse>(
        '/api/admin/users/update-user-by-userid',
        userData
      )

      if (!response?.data) {
        const errorMessage = 'Некорректный ответ сервера'
        logger.error(errorMessage)
        throw new Error(errorMessage)
      }

      if (response.data.success) {
        logger.info('User successfully updated', {
          user_id: userData.user_id
        })
        return true
      } else {
        const errorMessage = response.data.message || 'Неизвестная ошибка обновления данных пользователя'
        logger.error(errorMessage)
        throw new Error(errorMessage)
      }

    } catch (error) {
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