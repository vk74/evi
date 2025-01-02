/**
 * @file service.delete.selected.users.ts
 * Service for deleting selected users from the system.
 *
 * Functionality:
 * - Executes delete operation in database
 * - Invalidates users cache after successful deletion
 * - Handles errors and logging
 */

import { IDeleteUsersRequest, IDeleteUsersResponse, UserError } from './types.users.list';
import { usersRepository } from './repository.users.list';
import { queries } from './queries.users.list';
import { Pool } from 'pg';
import { pool as pgPool } from '../../../../db/maindb';

// Явно указываем тип для pool
const pool = pgPool as Pool;

export async function deleteSelectedUsers(request: IDeleteUsersRequest): Promise<IDeleteUsersResponse> {
  try {
    console.log('Starting delete operation for users:', request.userIds);

// Выполняем запрос на удаление
const result = await pool.query(queries.deleteSelectedUsers, [request.userIds]);

// Получаем количество реально удаленных записей
const deletedCount = result.rowCount ?? 0; // используем nullish coalescing operator

// Если были удалены записи, инвалидируем кэш
if (deletedCount > 0) {
  const repository = usersRepository;
  repository.clearCache();
  console.log('Cache invalidated after successful deletion');
}

// Формируем ответ
const response: IDeleteUsersResponse = {
  success: true,
  deletedCount  // теперь точно number, а не number | null
};

    console.log(`Successfully deleted ${deletedCount} users`);
    return response;

  } catch (error) {
    console.error('Service error while deleting users:', error);
    throw {
      code: 'SERVICE_ERROR',
      message: 'Error while deleting users',
      details: error
    } as UserError;
  }
}