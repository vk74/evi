/**
 * @file service.add.users.to.group.ts
 * Version: 1.1.0
 * Service for adding users to a group in the GroupEditor.
 * 
 * Functionality:
 * - Adds users to a group via the API based on user IDs and group ID
 * - Validates the received data
 * - Handles errors during the operation
 * - Provides logging for key operations
 * Frontend file
 * 
 * Changes in v1.1.0:
 * - Moved from core/ui/modals/item-selector to GroupEditor module
 * - Updated API endpoint from /api/core/item-selector/add-users-to-group to /api/admin/groups/:groupId/add-members
 */
import { api } from '@/core/api/service.axios';
import { useUiStore } from '@/core/state/uistate';
import { useGroupEditorStore } from './state.group.editor';
import { useUserAuthStore } from '@/core/auth/state.user.auth';

export interface AddUsersResponse {
  success: boolean;
  count: number;
  message?: string;
}

// Logger for tracking operations
const logger = {
  info: (message: string, meta?: object) => console.log(`[AddUsersToGroupService] ${message}`, meta || ''),
  error: (message: string, error?: unknown) => console.error(`[AddUsersToGroupService] ${message}`, error || ''),
};

/**
 * Adds users to a group based on user IDs from ItemSelector and group ID from store.
 * @param userIds - Array of user UUIDs selected in ItemSelector
 * @returns Promise with response indicating success and count of added users
 */
async function addUsersToGroup(userIds: string[]): Promise<AddUsersResponse> {
  const uiStore = useUiStore();
  const groupEditorStore = useGroupEditorStore();
  const userStore = useUserAuthStore(); // Хранилище для получения UUID текущего пользователя

  // Validate input parameters
  if (!userIds || userIds.length === 0) {
    throw new Error('No users specified to add to the group');
  }

  // Get groupId from the store (only available in edit mode)
  const groupId = groupEditorStore.isEditMode ? (groupEditorStore.mode as { mode: string, groupId: string }).groupId : '';
  if (!groupId) {
    throw new Error('Group ID not found. Ensure you are in edit mode and group is loaded');
  }

  // Log the sent request with request body
  const requestBody = {
    userIds,
    addedBy: userStore.userID || '', // Используем UUID текущего пользователя из userStore
  };
  logger.info('Sending request to add users to group', {
    endpoint: `/api/admin/groups/${groupId}/add-members`,
    requestBody,
  });

  try {
    // Send POST request to the API endpoint
    const response = await api.post<AddUsersResponse>(
      `/api/admin/groups/${groupId}/add-members`,
      requestBody,
    );

    // Log the received response
    logger.info('Received response from adding users to group', {
      response: response.data,
    });

    // Check if the request was successful
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to add users to group');
    }

    return response.data;
  } catch (error) {
    // Log error with request details
    logger.error('Error adding users to group', error);

    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка при добавлении пользователей в группу';
    uiStore.showErrorSnackbar(errorMessage);

    throw error; // Re-throw to handle in the calling component
  }
}

export default addUsersToGroup;

