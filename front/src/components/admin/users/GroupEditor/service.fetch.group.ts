/**
 * @file service.fetch.group.ts
 * Service for fetching group data from the API by group ID.
 * 
 * Functionality:
 * - Retrieves group data by ID
 * - Validates the received data
 * - Initializes edit mode in the store
 * - Handles errors during fetching
 */
import { api } from '@/core/api/service.axios';
import { useGroupEditorStore } from './state.group.editor';
import { useUserStore } from '@/core/state/userstate';
import type { IGroupData, IGroupDetails, IApiError, ILoadGroupResponse } from './types.group.editor'; // Импортируем нужные типы

// Logger for tracking operations
const logger = {
  info: (message: string, meta?: object) => console.log(`[FetchGroupService] ${message}`, meta || ''),
  error: (message: string, error?: unknown) => console.error(`[FetchGroupService] ${message}`, error || ''),
  warn: (message: string, meta?: object) => console.warn(`[FetchGroupService] ${message}`, meta || '') // Добавлен метод warn
};

/**
 * Service for fetching group data
 */
export const fetchGroupService = {
  /**
   * Fetches group data by ID
   * @param groupId - ID of the group
   * @returns Promise<{ group: IGroupData, details: IGroupDetails }> - Group data and details
   * @throws {Error} If fetching fails or data is missing
   */
  async fetchGroupById(groupId: string): Promise<{ group: IGroupData, details: IGroupDetails }> {
    const store = useGroupEditorStore();
    const userStore = useUserStore();

    // Check user authentication
    if (!userStore.isLoggedIn) {
      const errorMessage = 'User not authenticated';
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    try {
      logger.info('Fetching group data', { groupId });

      // Request group data from the API
      const response = await api.get<ILoadGroupResponse>(
        `/api/admin/groups/fetch-group-by-groupid/${groupId}`
      );

      // Check if the request was successful
      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to fetch group data';
        logger.error(errorMessage);
        throw new Error(errorMessage);
      }

      // Check if group data exists
      if (!response.data.data?.group) {
        const errorMessage = 'Group data not found';
        logger.error(errorMessage);
        throw new Error(errorMessage);
      }

      // Check if group details exist (optional, can be empty if not provided)
      if (!response.data.data?.details) {
        logger.warn('Group details not found, using default values');
      }

      const groupData = response.data.data.group;
      const detailsData = response.data.data.details || {
        group_description: '',
        group_email: ''
      }; // Default values if details are missing

      logger.info('Successfully received group data', {
        groupId,
        groupName: groupData.group_name
      });

      return { group: groupData, details: detailsData };

    } catch (error) {
      const apiError = error as IApiError;
      const errorMessage = apiError.message || 'Failed to load group data';
      logger.error(errorMessage, error);
      throw new Error(errorMessage);
    }
  }
};

export default fetchGroupService;