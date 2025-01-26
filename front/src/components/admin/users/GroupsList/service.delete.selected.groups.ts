/**
 * @file service.delete.selected.groups.ts
 * Service for deleting selected groups.
 *
 * Functionality:
 * - Sends a request to delete selected groups by their IDs.
 * - Handles errors and logging.
 */

import { api } from '@/core/api/service.axios'; // Импорт Axios instance
import { useStoreGroupsList } from './state.groups.list';
import { useUiStore } from '@/core/state/uistate';
import { useUserStore } from '@/core/state/userstate';
import type { GroupError } from './types.groups.list';

// Логгер для основных операций
const logger = {
    info: (message: string, meta?: object) => console.log(`[DeleteGroupsService] ${message}`, meta || ''),
    error: (message: string, error?: unknown) => console.error(`[DeleteGroupsService] ${message}`, error || '')
};

/**
 * Сервис для удаления выбранных групп
 */
export const deleteSelectedGroupsService = {
    /**
     * Удаляет выбранные группы по их IDs
     * @param groupIds - Массив UUID групп для удаления
     * @returns Promise<number> - Количество удаленных групп
     * @throws {GroupError} - В случае ошибки
     */
    async deleteSelectedGroups(groupIds: string[]): Promise<number> {
        const store = useStoreGroupsList();
        const userStore = useUserStore();
        const uiStore = useUiStore();

        // Проверка авторизации пользователя
        if (!userStore.isLoggedIn) {
            const errorMessage = 'User not authenticated';
            logger.error(errorMessage);
            throw new Error(errorMessage);
        }

        // Логируем начало операции
        logger.info('Starting delete operation', { groupIds });

        try {
            // Отправляем запрос на удаление групп
            const response = await api.post<{ deletedCount: number }>(
                '/api/admin/groups/delete-selected-groups',
                { groupIds }
            );

            // Проверяем ответ
            if (!response.data || typeof response.data.deletedCount !== 'number') {
                const errorMessage = 'Invalid API response format';
                logger.error(errorMessage);
                throw new Error(errorMessage);
            }

            // Логируем успешное удаление
            logger.info('Successfully deleted groups', { deletedCount: response.data.deletedCount });

            // Показываем уведомление об успешном удалении
            uiStore.showSuccessSnackbar(`Successfully deleted ${response.data.deletedCount} groups`);

            // Возвращаем количество удаленных групп
            return response.data.deletedCount;

        } catch (error) {
            // Логируем ошибку
            logger.error('Error during groups deletion', error);

            // Формируем ошибку для отображения
            const groupError: GroupError = {
                code: 'DELETE_GROUPS_ERROR',
                message: 'Failed to delete selected groups',
                details: process.env.NODE_ENV === 'development' ?
                    (error instanceof Error ? error.message : String(error)) :
                    undefined
            };

            // Показываем уведомление об ошибке
            uiStore.showErrorSnackbar(groupError.message);

            // Пробрасываем ошибку дальше
            throw groupError;
        }
    }
};

export default deleteSelectedGroupsService;