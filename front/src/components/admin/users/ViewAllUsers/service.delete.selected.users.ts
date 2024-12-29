/**
 * service.delete.selected.users.ts
 * Service for deleting selected users.
 */
import { api } from '@/core/api/service.axios'
import { useStoreViewAllUsers } from './state.view.all.users'
import { useUserStore } from '@/core/state/userstate'
import usersService from './service.view.all.users'
import type { IUser } from './types.view.all.users'

// Логгер для операций удаления
const logger = {
    info: (message: string, meta?: object) => console.log(`[DeleteSelectedUsersService] ${message}`, meta || ''),
    error: (message: string, error?: unknown) => console.error(`[DeleteSelectedUsersService] ${message}`, error || '')
}

export const deleteSelectedUsersService = {
    /**
     * Удаляет выбранных пользователей
     * @param userIds - массив ID пользователей для удаления
     * @returns Promise<void>
     * @throws {Error} При ошибке удаления
     */
    async deleteSelectedUsers(userIds: string[]): Promise<void> {
        const store = useStoreViewAllUsers()
        const userStore = useUserStore()

        // Проверка авторизации пользователя
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
            await api.post('/api/admin/users/delete-selected-users', {
                userIds
            })

            logger.info('Successfully deleted users', { 
                deletedCount: userIds.length,
                deletedUsers: userDetails
            })

            // После успешного удаления обновляем список пользователей
            await usersService.fetchUsers()
            store.clearSelection() // Очищаем выбранные записи

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
        }
    }
}

export default deleteSelectedUsersService