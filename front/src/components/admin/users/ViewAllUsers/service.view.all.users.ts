/**
 * service.view.all.users.ts
 * Service for fetching and managing users list data.
 *
 * Functionality:
 * - Fetches users list from API endpoint
 * - Updates store cache with received data
 * - Provides logging for main operations
 */
import { api } from '@/core/api/service.axios'
import { useStoreViewAllUsers } from './state.view.all.users'
import { useUserStore } from '@/core/state/userstate'
import type { IUsersResponse } from './types.view.all.users'

// Логгер для основных операций
const logger = {
  info: (message: string, meta?: object) => console.log(`[UsersService] ${message}`, meta || ''),
  error: (message: string, error?: unknown) => console.error(`[UsersService] ${message}`, error || '')
}

/**
 * Сервис для работы со списком пользователей
 */
export const usersService = {
  /**
   * Получает список всех пользователей
   * @returns Promise<void>
   * @throws {Error} При ошибке получения данных
   */
  async fetchUsers(): Promise<void> {
    const store = useStoreViewAllUsers()
    const userStore = useUserStore()

    // Проверка авторизации пользователя
    if (!userStore.isLoggedIn) {
      const errorMessage = 'User not authenticated'
      logger.error(errorMessage)
      store.error = errorMessage
      throw new Error(errorMessage)
    }

    // Проверяем наличие данных в кеше
    if (store.users.length > 0) {
      logger.info('Using cached users list from store', {
        cachedUsers: store.users.length
      })
      return
    }

    store.loading = true
    store.error = null

    try {
      logger.info('Cache empty, fetching users list from API')
      
      const response = await api.get<IUsersResponse>(
        '/api/admin/users/view-all-users'
      )

      // Проверка формата данных
      if (!response.data || !Array.isArray(response.data.users)) {
        const errorMessage = 'Invalid API response format'
        logger.error(errorMessage)
        throw new Error(errorMessage)
      }

      logger.info('Successfully received users data', {
        userCount: response.data.users.length
      })

      // Обновляем кеш в хранилище
      store.updateCache(response.data.users, response.data.total)
      
      logger.info('Users list cached in store', {
        totalUsers: response.data.total
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process users data'
      store.error = errorMessage
      throw new Error(errorMessage)
    } finally {
      store.loading = false
    }
  }
}

export default usersService