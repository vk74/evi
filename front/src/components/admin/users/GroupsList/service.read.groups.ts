/**
 * @file service.read.groups.ts
 * Service for fetching and managing groups list data.
 *
 * Functionality:
 * - Fetches groups list from API endpoint
 * - Updates store cache with received data
 * - Provides logging for main operations
 */

import { api } from '@/core/api/service.axios'; // Импорт Axios instance
import { useStoreGroupsList } from './state.groups.list'; // Импорт хранилища
import { useUserStore } from '@/core/state/userstate'; // Импорт хранилища пользователя
import type { IGroupsResponse } from './types.groups.list'; // Импорт типов

// Логгер для основных операций
const logger = {
    info: (message: string, meta?: object) => console.log(`[GroupsService] ${message}`, meta || ''),
    error: (message: string, error?: unknown) => console.error(`[GroupsService] ${message}`, error || '')
};

/**
 * Сервис для работы со списком групп
 */
export const groupsService = {
    /**
     * Получает список всех групп
     * @returns Promise<void>
     * @throws {Error} При ошибке получения данных
     */
    async fetchGroups(): Promise<void> {
        const store = useStoreGroupsList(); // Хранилище групп
        const userStore = useUserStore(); // Хранилище пользователя

        // Проверка авторизации пользователя
        if (!userStore.isLoggedIn) {
            const errorMessage = 'User not authenticated';
            logger.error(errorMessage);
            store.error = errorMessage;
            throw new Error(errorMessage);
        }

        // Проверяем наличие данных в кэше
        if (store.groups.length > 0) {
            logger.info('Using cached groups list from store', {
                cachedGroups: store.groups.length
            });
            return;
        }

        store.loading = true;
        store.error = null;

        try {
            logger.info('Cache empty, fetching groups list from API');

            // Выполняем запрос к API
            const response = await api.get<IGroupsResponse>('/api/admin/groups/fetch-groups');

            // Проверка формата данных
            if (!response.data || !Array.isArray(response.data.groups)) {
                const errorMessage = 'Invalid API response format';
                logger.error(errorMessage);
                throw new Error(errorMessage);
            }

            logger.info('Successfully received groups data', {
                groupCount: response.data.groups.length
            });

            // Обновляем кэш в хранилище
            store.updateCache(response.data.groups, response.data.total);

            logger.info('Groups list cached in store', {
                totalGroups: response.data.total
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to process groups data';
            store.error = errorMessage;
            logger.error('Error fetching groups:', error);
            throw new Error(errorMessage);
        } finally {
            store.loading = false;
        }
    }
};

export default groupsService;