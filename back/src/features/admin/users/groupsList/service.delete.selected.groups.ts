/**
 * @file service.delete.selected.groups.ts
 * Backend service for deleting selected groups.
 *
 * Functionality:
 * - Deletes selected groups from the database.
 * - Clears the cache after successful deletion.
 * - Handles errors and logging.
 */

import { Pool } from 'pg';
import { pool as pgPool } from '../../../../db/maindb';
import { queries } from './queries.groups.list';
import { groupsRepository } from './repository.groups.list';

// Явно указываем тип для pool
const pool = pgPool as Pool;

// Логгер для основных операций
const logger = {
    info: (message: string, meta?: object) => console.log(`[DeleteGroupsService] ${message}`, meta || ''),
    error: (message: string, error?: unknown) => console.error(`[DeleteGroupsService] ${message}`, error || '')
};

/**
 * Backend service for deleting selected groups
 */
export const deleteSelectedGroupsService = {
    /**
     * Deletes selected groups by their IDs
     * @param groupIds - Array of group UUIDs to delete
     * @returns Promise<number> - Number of deleted groups
     * @throws {Error} - If an error occurs
     */
    async deleteSelectedGroups(groupIds: string[]): Promise<number> {
        try {
            // Логируем начало операции
            logger.info('Starting delete operation', { groupIds });

            // Выполняем SQL-запрос для удаления групп
            const result = await pool.query(queries.deleteSelectedGroups, [groupIds]);

            // Проверяем результат
            if (!result.rows || !Array.isArray(result.rows)) {
                const errorMessage = 'Invalid database response format';
                logger.error(errorMessage);
                throw new Error(errorMessage);
            }

            // Логируем успешное удаление
            const deletedCount = result.rows.length;
            logger.info('Successfully deleted groups', { deletedCount });

            // Очищаем кэш в репозитории
            groupsRepository.clearCache();

            // Возвращаем количество удаленных групп
            return deletedCount;

        } catch (error) {
            // Логируем ошибку
            logger.error('Error during groups deletion', error);

            // Пробрасываем ошибку дальше
            throw new Error(
                process.env.NODE_ENV === 'development' ?
                    (error instanceof Error ? error.message : String(error)) :
                    'Failed to delete selected groups'
            );
        }
    }
};

export default deleteSelectedGroupsService;