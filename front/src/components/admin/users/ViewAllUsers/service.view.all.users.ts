/**
 * @file service.view.all.users.ts
 * Service for fetching and managing users list data.
 * 
 * Functionality:
 * - Fetches users list from API endpoint
 * - Updates store cache with received data
 * - Provides logging for main operations
 */

import axios from 'axios'
import { useStoreViewAllUsers } from './state.view.all.users'
import { useUserStore } from '@/state/userstate'
import type { IUsersResponse, IUserError } from './types.view.all.users'

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
            // Проверка аутентификации
            if (!userStore.isLoggedIn || !userStore.jwt) {
                throw new Error('User not authenticated')
            }

            logger.info('Cache empty, fetching users list from API')
            
            const response = await axios.get<IUsersResponse>(
                'http://localhost:3000/api/admin/users/view-all-users',
                {
                    headers: { 
                        Authorization: `Bearer ${userStore.jwt}` 
                    }
                }
            )
            
            // Проверка ответа
            if (!response.data || !Array.isArray(response.data.users)) {
                throw new Error('Invalid API response format')
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
            let errorMessage = 'Failed to fetch users'
            
            if (axios.isAxiosError(error)) {
                const serverError = error.response?.data as IUserError | undefined
                errorMessage = serverError?.message || error.message
                
                logger.error('API Error', {
                    status: error.response?.status,
                    message: errorMessage
                })
            } else {
                logger.error('Unexpected error while fetching users', error)
            }

            store.error = errorMessage
            throw new Error(errorMessage)
            
        } finally {
            store.loading = false
        }
    }
}

export default usersService