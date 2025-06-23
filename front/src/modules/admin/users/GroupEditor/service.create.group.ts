/**
 * service.create.new.group.ts
 * Service used for creation of new groups from admin module.
 *
 * - sending request to api for new group creation
 * - errors management
 * - logging
 */
import { api } from '@/core/api/service.axios'
import { groupsService } from '../GroupsList/service.read.groups';
import { useStoreGroupsList } from '../GroupsList/state.groups.list'; // Groups store
import type { 
  ICreateGroupRequest, 
  ICreateGroupResponse 
} from './types.group.editor'

const groupsStore = useStoreGroupsList();

/**
 * Логгер для операций сервиса
 */
const logger = {
  info: (message: string, meta?: object) =>
    console.log(`[CreateGroupService] ${message}`, meta || ''),
  error: (message: string, error?: unknown) =>
    console.error(`[CreateGroupService] ${message}`, error || '')
}

/**
 * Сервис создания новой группы
 */
export const createGroupService = {
  /**
   * Создает новую группу
   * @param groupData - данные новой группы
   * @returns Promise<ICreateGroupResponse> - Ответ от сервера с данными созданной группы
   * @throws Error при ошибке создания
   */
  async createGroup(groupData: ICreateGroupRequest): Promise<ICreateGroupResponse> {
    logger.info('Starting group creation with data:', {
      group_name: groupData.group_name,
      group_status: groupData.group_status,
      group_owner: groupData.group_owner,
      group_email: groupData.group_email
    })

    try {
      const response = await api.post<ICreateGroupResponse>(
        '/api/admin/groups/create-new-group',
        groupData
      )

      if (!response?.data) {
        const errorMessage = 'Некорректный ответ сервера'
        logger.error(errorMessage)
        throw new Error(errorMessage)
      }

      if (response.data.success) {
        logger.info('Group successfully created', {
          groupId: response.data.groupId,
          group_name: response.data.group_name
        });
      
        // Обновляем список групп в кеше хранилища
        try {
          groupsStore.clearCache();
          groupsService.fetchGroups();
        } catch (error) {
          // Логируем ошибку, но не прерываем выполнение
          logger.error('Failed to update groups list after creation', error);
        }
      
        return response.data;
      } else {
        const errorMessage = response.data.message || 'Неизвестная ошибка создания группы'
        logger.error(errorMessage)
        throw new Error(errorMessage)
      }
    } catch (error) {
      // Обработка ошибок axios
      if (error instanceof Error) {
        logger.error('Failed to create group', error)
        throw error
      }

      // Обработка неожиданных ошибок
      const errorMessage = 'Unexpected error during group creation'
      logger.error(errorMessage, error)
      throw new Error(errorMessage)
    }
  }
}

export default createGroupService