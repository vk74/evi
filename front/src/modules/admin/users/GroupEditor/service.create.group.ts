/**
 * @file service.create.group.ts
 * Version: 1.0.0
 * Service for creating new groups from admin module.
 * Frontend file that handles group creation requests, error management, and logging.
 *
 * Functionality:
 * - Send request to API for new group creation
 * - Error management and handling
 * - Operation logging
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
 * Logger for service operations
 */
const logger = {
  info: (message: string, meta?: object) =>
    console.log(`[CreateGroupService] ${message}`, meta || ''),
  error: (message: string, error?: unknown) =>
    console.error(`[CreateGroupService] ${message}`, error || '')
}

/**
 * Service for creating new groups
 */
export const createGroupService = {
  /**
   * Creates a new group
   * @param groupData - New group data
   * @returns Promise<ICreateGroupResponse> - Server response with created group data
   * @throws Error when creation fails
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
        const errorMessage = 'Invalid server response'
        logger.error(errorMessage)
        throw new Error(errorMessage)
      }

      if (response.data.success) {
        logger.info('Group successfully created', {
          groupId: response.data.groupId,
          group_name: response.data.group_name
        });
      
        // Update groups list in store cache
        try {
          groupsStore.clearCache();
          groupsService.fetchGroups();
        } catch (error) {
          // Log error but don't interrupt execution
          logger.error('Failed to update groups list after creation', error);
        }
      
        return response.data;
      } else {
        const errorMessage = response.data.message || 'Unknown error during group creation'
        logger.error(errorMessage)
        throw new Error(errorMessage)
      }
    } catch (error) {
      // Handle axios errors
      if (error instanceof Error) {
        logger.error('Failed to create group', error)
        throw error
      }

      // Handle unexpected errors
      const errorMessage = 'Unexpected error during group creation'
      logger.error(errorMessage, error)
      throw new Error(errorMessage)
    }
  }
}

export default createGroupService