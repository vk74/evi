/**
 * service.load.user.ts
 * Сервис для загрузки данных пользователя из API.
 * 
 * Функциональность:
 * - Получение данных пользователя по ID
 * - Проверка корректности полученных данных
 * - Инициализация режима редактирования в хранилище
 * - Обработка ошибок при загрузке
 */
import { api } from '@/core/api/service.axios'
import { useUserEditorStore } from './state.user.editor'
import { useUserStore } from '@/core/state/userstate'
import type { ILoadUserResponse, IApiError } from './types.user.editor'

// Логгер для отслеживания операций
const logger = {
  info: (message: string, meta?: object) => console.log(`[LoadUserService] ${message}`, meta || ''),
  error: (message: string, error?: unknown) => console.error(`[LoadUserService] ${message}`, error || '')
}

/**
 * Сервис для загрузки данных пользователя
 */
export const loadUserService = {
  /**
   * Загружает данные пользователя по ID
   * @param userId - ID пользователя
   * @throws {Error} При ошибке загрузки или отсутствии данных
   */
  async fetchUserById(userId: string): Promise<void> {
    const store = useUserEditorStore()
    const userStore = useUserStore()

    // Проверка авторизации пользователя
    if (!userStore.isLoggedIn) {
      const errorMessage = 'User not authenticated'
      logger.error(errorMessage)
      throw new Error(errorMessage)
    }

    try {
      logger.info('Fetching user data', { userId })
      
      // Запрос данных из API
      const response = await api.get<ILoadUserResponse>(
        `/api/admin/users/fetch-user-by-userid/${userId}`
      )

      // Проверка успешности запроса
      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to fetch user data'
        logger.error(errorMessage)
        throw new Error(errorMessage)
      }

      // Проверка наличия данных пользователя
      if (!response.data.data?.user) {
        const errorMessage = 'User data not found'
        logger.error(errorMessage)
        throw new Error(errorMessage)
      }

      // Проверка наличия профиля пользователя
      if (!response.data.data?.profile) {
        const errorMessage = 'User profile not found'
        logger.error(errorMessage)
        store.resetForm()
        throw new Error(errorMessage)
      }

      logger.info('Successfully received user data', {
        userId,
        username: response.data.data.user.username
      })

      // Инициализация режима редактирования
      store.initEditMode({
        user: response.data.data.user,
        profile: response.data.data.profile
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