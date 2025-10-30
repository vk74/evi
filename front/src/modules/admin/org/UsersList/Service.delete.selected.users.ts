/**
 * @file Service.delete.selected.users.ts
 * Version: 1.0.1
 * FRONTEND service for deleting selected users.
 *
 * Functionality:
 * - Validates selected accounts are not system accounts (is_system=true)
 * - Sends delete request to API
 * - Invalidates cache after deletion
 * - Returns count of deleted users
 */
import { api } from '@/core/api/service.axios'
import { useStoreUsersList } from './State.users.list'
import { useUserAuthStore } from '@/core/auth/state.user.auth';
import usersFetchService from './Service.fetch.users'
import type { ILoadUserResponse } from '../UserEditor/types.user.editor'

// Logger for main operations
const logger = {
  info: (message: string, meta?: any) => console.log(`[DeleteUsersService] ${message}`, meta || ''),
  error: (message: string, error?: any) => console.error(`[DeleteUsersService] ${message}`, error || '')
}

/**
 * Service for deleting selected users
 */
export const deleteSelectedUsersService = {
  /**
   * Deletes selected users
   * @param userIds Array of user IDs to delete
   * @returns Promise<number> Number of deleted users
   * @throws {Error} When deletion fails
   */
  async deleteSelectedUsers(userIds: string[]): Promise<number> {
    const store = useStoreUsersList()
    const userStore = useUserAuthStore()

    // Check user authentication
    if (!userStore.isAuthenticated) {
      const errorMessage = 'User not authenticated'
      logger.error(errorMessage)
      throw new Error(errorMessage)
    }

    if (!userIds.length) {
      logger.info('No users selected for deletion')
      return 0
    }

    // Pre-check: fetch each user and collect system accounts
    logger.info('Validating selected users before deletion', { count: userIds.length })

    const fetchUserPromises = userIds.map(async (id) => {
      const resp = await api.get<ILoadUserResponse>(`/api/admin/users/fetch-user-by-userid/${id}`)
      // If API indicates failure or missing data, we still proceed to let backend handle delete errors
      return resp.data?.data?.user
    })

    const users = await Promise.all(fetchUserPromises)
    const systemUsernames = users
      .filter(u => !!u && u.is_system === true)
      .map(u => u!.username)

    if (systemUsernames.length > 0) {
      const err = new Error(`системные учетные запись нельзя удалять: ${systemUsernames.join(', ')}`) as Error & { code?: string, usernames?: string[] }
      err.code = 'SYSTEM_USERS_SELECTED'
      err.usernames = systemUsernames
      logger.error('Deletion blocked due to system accounts', { systemUsernames })
      throw err
    }

    logger.info('Deleting selected users', { count: userIds.length })

    try {
      const response = await api.post<{success: boolean, deletedCount: number}>(
        '/api/admin/users/delete-selected-users',
        { userIds }
      )

      const deletedCount = response.data.deletedCount
      logger.info('Successfully deleted users', { deletedCount })

      // Invalidate cache completely after deletion
      store.invalidateCache()
      
      // Clear selection
      store.clearSelection()
      
      // Refresh current view to show updated data
      await usersFetchService.fetchUsers()

      return deletedCount

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                        error.message || 
                        'Failed to delete users'
      
      logger.error('Error deleting users:', error)
      throw new Error(errorMessage)
    }
  }
}

export default deleteSelectedUsersService
