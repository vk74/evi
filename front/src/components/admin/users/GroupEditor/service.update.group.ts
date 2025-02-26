/**
 * service.update.groups.ts
 * Сервис для обновления данных группы.
 *
 * Функциональность:
 * - Обновление данных группы через API
 * - Обработка ошибок запроса
 * - Логирование операций
 */
import { api } from '@/core/api/service.axios'
import type { IUpdateGroupRequest, IApiResponse } from './types.group.editor'

/**
 * Логгер для операций сервиса
 */
const logger = {
  info: (message: string, meta?: object) =>
    console.log(`[UpdateGroupService] ${message}`, meta || ''),
  error: (message: string, error?: unknown) =>
    console.error(`[UpdateGroupService] ${message}`, error || '')
}

/**
 * Сервис обновления данных группы
 */
export const updateGroupService = {
  /**
   * Обновляет данные группы
   * @param groupData - обновляемые данные группы
   * @returns Promise<boolean> - успешность операции
   * @throws Error при ошибке обновления
   */
  async updateGroup(groupData: IUpdateGroupRequest): Promise<boolean> {
    logger.info('Starting group update with data:', {
      group_id: groupData.group_id,
      changed_fields: Object.keys(groupData).filter(key => key !== 'group_id')
    })

    try {
      const response = await api.post<IApiResponse>(
        '/api/admin/groups/update-group-by-groupid',
        groupData
      )

      if (!response?.data) {
        const errorMessage = 'Некорректный ответ сервера'
        logger.error(errorMessage)
        throw new Error(errorMessage)
      }

      if (response.data.success) {
        logger.info('Group successfully updated', {
          group_id: groupData.group_id
        })
        return true
      } else {
        const errorMessage = response.data.message || 'Неизвестная ошибка обновления данных группы'
        logger.error(errorMessage)
        throw new Error(errorMessage)
      }
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Failed to update group', error)
        throw error
      }

      const errorMessage = 'Unexpected error during group update'
      logger.error(errorMessage, error)
      throw new Error(errorMessage)
    }
  }
}

export default updateGroupService