/**
 * @file service.fetch.group.ts
 * Version: 1.0.0
 * Service for fetching group data from the API by group ID.
 * Frontend file that handles group data retrieval, validation, and store initialization.
 * 
 * Functionality:
 * - Retrieves group data by ID
 * - Validates the received data
 * - Fetches username for group owner asynchronously
 * - Initializes edit mode in the store
 * - Handles errors during fetching
 */
import { api } from '@/core/api/service.axios';
import { useGroupEditorStore } from './state.group.editor';
import { useUserAuthStore } from '@/core/auth/state.user.auth';
import { fetchUsernameByUuid } from '@/core/services/service.fetch.username.by.uuid';
import type { IGroupData, IGroupDetails, IApiError, ILoadGroupResponse } from './types.group.editor';

// Logger for tracking operations
const logger = {
  info: (message: string, meta?: object) => console.log(`[FetchGroupService] ${message}`, meta || ''),
  error: (message: string, error?: unknown) => console.error(`[FetchGroupService] ${message}`, error || ''),
  warn: (message: string, meta?: object) => console.warn(`[FetchGroupService] ${message}`, meta || '') // Added warn method
};

/**
 * Service for fetching group data
 */
export const fetchGroupService = {
  /**
   * Fetches group data by ID and includes owner's username
   * @param groupId - ID of the group
   * @returns Promise<{ group: IGroupData, details: IGroupDetails }> - Group data and details with owner's username
   * @throws {Error} If fetching fails or data is missing
   */
  async fetchGroupById(groupId: string): Promise<{ group: IGroupData, details: IGroupDetails }> {
    const store = useGroupEditorStore();
    const userStore = useUserAuthStore();

    // Check user authentication
    if (!userStore.isAuthenticated) {
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

      // Fetch owner's username asynchronously if group_owner exists
      let ownerUsername = groupData.group_owner; // Default to UUID if username fetch fails
      if (groupData.group_owner) {
        try {
          ownerUsername = await fetchUsernameByUuid(groupData.group_owner);
          logger.info('Successfully fetched owner username', { groupId, ownerUsername });
        } catch (error) {
          logger.error('Failed to fetch owner username, using UUID instead', error);
          ownerUsername = groupData.group_owner; // Fall back to UUID
        }
      }

      // Update groupData with owner's username (keep group_owner as UUID for consistency)
      const updatedGroupData: IGroupData = {
        ...groupData,
        ownerUsername // Add owner's username as a new field, keeping group_owner as UUID
      };

      logger.info('Successfully received group data with owner username', {
        groupId,
        groupName: updatedGroupData.group_name,
        ownerUsername
      });

      return { group: updatedGroupData, details: detailsData };

    } catch (error) {
      const apiError = error as IApiError;
      const errorMessage = apiError.message || 'Failed to load group data';
      logger.error(errorMessage, error);
      throw new Error(errorMessage);
    }
  }
};

export default fetchGroupService;