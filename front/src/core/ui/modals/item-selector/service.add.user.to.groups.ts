/**
 * @file service.add.user.to.groups.ts
 * Service for adding a user to multiple groups in the ItemSelector.
 * 
 * Functionality:
 * - Adds a user to multiple groups via the API based on group IDs and user ID
 * - Validates the received data
 * - Handles errors during the operation
 * - Provides logging for key operations
 */
import { api } from '@/core/api/service.axios';
import { useUiStore } from '@/core/state/uistate';
import { useUserEditorStore } from '@/modules/admin/org/UserEditor/state.user.editor';
import { useUserAuthStore } from '@/core/auth/state.user.auth';
import { AddUsersResponse, AddUsersToGroupRequest } from './types.action.services';

// Logger for tracking operations
const logger = {
  info: (message: string, meta?: object) => console.log(`[AddUserToGroupsService] ${message}`, meta || ''),
  error: (message: string, error?: unknown) => console.error(`[AddUserToGroupsService] ${message}`, error || ''),
};

/**
 * Adds a user to multiple groups based on group IDs from ItemSelector and user ID from store.
 * @param groupIds - Array of group UUIDs selected in ItemSelector
 * @returns Promise with response indicating success and count of added groups
 */
async function addUserToGroups(groupIds: string[]): Promise<AddUsersResponse> {
  const uiStore = useUiStore();
  const userEditorStore = useUserEditorStore();
  const userStore = useUserAuthStore(); // Хранилище для получения UUID текущего пользователя

  // Validate input parameters
  if (!groupIds || groupIds.length === 0) {
    throw new Error('No groups specified to add the user to');
  }

  // Get userId from the store (only available in edit mode)
  const userId = userEditorStore.isEditMode ? (userEditorStore.mode as { mode: string, userId: string }).userId : '';
  if (!userId) {
    throw new Error('User ID not found. Ensure you are in edit mode and user is loaded');
  }

  // Log the sent request with request body
  const requestBody = {
    userId,
    groupIds,
    addedBy: userStore.userID || '', // Используем UUID текущего пользователя из userStore
  };
  logger.info('Sending request to add user to groups', {
    endpoint: '/api/core/item-selector/add-user-to-groups',
    requestBody,
  });

  try {
    // Send POST request to the API endpoint
    const response = await api.post<AddUsersResponse>(
      '/api/core/item-selector/add-user-to-groups',
      requestBody,
    );

    // Log the received response
    logger.info('Received response from adding user to groups', {
      response: response.data,
    });

    // Check if the request was successful
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to add user to groups');
    }

    return response.data;
  } catch (error) {
    // Log error with request details
    logger.error('Error adding user to groups', error);

    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка при добавлении пользователя в группы';
    uiStore.showErrorSnackbar(errorMessage);

    throw error; // Re-throw to handle in the calling component
  }
}

export default addUserToGroups;
