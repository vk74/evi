/**
 * protoService.delete.selected.users.ts
 * Version: 1.0.0
 * FRONTEND service for deleting selected users.
 *
 * Functionality:
 * - Sends delete request to API
 * - Invalidates cache after deletion
 * - Returns count of deleted users
 */
import { api } from '@/core/api/service.axios'
import { useStoreUsersList } from './protoState.users.list'
import { useUserStore } from '@/core/state/userstate'
import usersFetchService from './protoService.fetch.users'

// Logger for main operations
const logger = {
  info: (message: string, meta?: any) => console.log(`[ProtoDeleteUsersService] ${message}`, meta || ''),
  error: (message: string, error?: any) => console.error(`[ProtoDeleteUsersService] ${message}`, error || '')
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
    const userStore = useUserStore()

    // Check user authentication
    if (!userStore.isLoggedIn) {
      const errorMessage = 'User not authenticated'
      logger.error(errorMessage)
      throw new Error(errorMessage)
    }

    if (!userIds.length) {
      logger.info('No users selected for deletion')
      return 0
    }

    logger.info('Deleting selected users', { count: userIds.length })

    try {
      const response = await api.post<{success: boolean, deletedCount: number}>(
        '/api/admin/users/proto/delete-selected-users',
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
