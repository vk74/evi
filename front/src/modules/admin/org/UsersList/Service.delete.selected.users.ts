/**
 * @file Service.delete.selected.users.ts
 * Version: 1.1.0
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
  async deleteSelectedUsers(userIds: string[]): Promise<{ success: boolean; message: string; deleted: { ids: string[]; names: string[]; count: number }; forbidden?: { ids: string[]; names: string[]; count: number } }> {
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
      return { success: false, message: 'Nothing to delete', deleted: { ids: [], names: [], count: 0 } }
    }

    logger.info('Deleting selected users', { count: userIds.length })

    try {
      const response = await api.post<{ success: boolean; message: string; deleted: { ids: string[]; names: string[]; count: number }; forbidden?: { ids: string[]; names: string[]; count: number } }>(
        '/api/admin/users/delete-selected-users',
        { userIds }
      )

      const data = response.data
      if (!data || typeof data.success !== 'boolean' || typeof data.message !== 'string') {
        throw new Error('Invalid API response format')
      }

      // Invalidate cache completely after deletion attempt (state may change)
      store.invalidateCache()
      // Refresh current view to show updated data
      await usersFetchService.fetchUsers()

      // Show toast
      if (data.success) {
        logger.info('Successfully deleted users', { count: data.deleted.count })
        // Let container component decide toast; or show here if desired
      } else if (data.forbidden && data.forbidden.count > 0) {
        // Backend provides informative message
      }

      return data

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete users'
      
      logger.error('Error deleting users:', error)
      throw new Error(errorMessage)
    }
  }
}

export default deleteSelectedUsersService
