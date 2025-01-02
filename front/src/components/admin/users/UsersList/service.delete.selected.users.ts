/**
 * service.delete.selected.users.ts
 * Service for deleting selected users.
 */
import { api } from '@/core/api/service.axios'
import { useStoreUsersList } from './state.users.list'
import { useUserStore } from '@/core/state/userstate'
import usersService from './service.view.all.users'
import type { IUser } from './types.users.list'

// Интерфейс для ответа API
interface IDeleteUsersResponse {
  deletedCount: number;
}

// Логгер для операций удаления
const logger = {
  info: (message: string, meta?: object) => console.log(`[DeleteSelectedUsersService] ${message}`, meta || ''),
  error: (message: string, error?: unknown) => console.error(`[DeleteSelectedUsersService] ${message}`, error || '')
}

export const deleteSelectedUsersService = {
  /**
   * Удаляет выбранных пользователей
   * @param userIds - массив ID пользователей для удаления
   * @returns Promise<number> - количество удаленных записей
   * @throws {Error} При ошибке удаления
   */
  async deleteSelectedUsers(userIds: string[]): Promise<number> {
    logger.info('Starting deleteSelectedUsers with IDs:', { userIds })

    const store = useStoreUsersList()
    logger.info('Store initialized')

    const userStore = useUserStore()
    logger.info('UserStore initialized')
    
    // Проверка авторизации пользователя
    logger.info('Checking user authentication, isLoggedIn:', { isLoggedIn: userStore.isLoggedIn })
    if (!userStore.isLoggedIn) {
      const errorMessage = 'User not authenticated'
      logger.error(errorMessage)
      store.error = errorMessage
      throw new Error(errorMessage)
    }

    // Получаем информацию о выбранных пользователях для логирования
    const selectedUsers = store.users.filter((user: IUser) => userIds.includes(user.user_id))
    const userDetails = selectedUsers.map((user: IUser) => ({
      id: user.user_id,
      username: user.username
    }))

    logger.info(`Selected for deletion: ${userDetails.map((u) => u.username).join(', ')}`)
    logger.info('Attempting to delete users', {
      userCount: userIds.length,
      selectedUsers: userDetails
    })

    store.loading = true
    store.error = null

    try {
      logger.info('Sending delete request to API')
      // Отправляем запрос на удаление и получаем ответ с количеством удаленных записей
      const response = await api.post<IDeleteUsersResponse>('/api/admin/users/delete-selected-users', {
        userIds
      })
      logger.info('API response received:', response.data)

      logger.info('Successfully deleted users', {
        deletedCount: response.data.deletedCount,
        deletedUsers: userDetails
      })

      logger.info('Clearing cache')
      // Сбрасываем кеш перед обновлением данных
      store.clearCache()
      
      logger.info('Fetching updated users list')
      // Получаем свежие данные
      await usersService.fetchUsers()
      
      logger.info('Clearing selection')
      // Очищаем выбранные записи
      store.clearSelection()

      return response.data.deletedCount

    } catch (error) {
      const errorMessage = error instanceof Error ?
        error.message :
        'Failed to delete users'

      logger.error('Error deleting users', {
        error,
        attemptedUsers: userDetails
      })

      store.error = errorMessage
      throw new Error(errorMessage)
    } finally {
      store.loading = false
      logger.info('Operation completed')
    }
  }
}

export default deleteSelectedUsersService