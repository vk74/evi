/**
 * @file service.change.group.owner.ts
 * FRONTEND service for changing the owner of a group in the ItemSelector.
 * 
 * Functionality:
 * - Changes the owner of a group via the API based on selected user ID
 * - Validates the received data
 * - Handles errors during the operation
 * - Provides logging for key operations
 */
import { api } from '@/core/api/service.axios';
import { useUiStore } from '@/core/state/uistate';
import { useGroupEditorStore } from '@/modules/admin/users/GroupEditor/state.group.editor';
import { useUserStore } from '@/core/state/userstate';
import { ActionResult } from './types.item.selector';

// Define interfaces for request and response
interface ChangeGroupOwnerRequest {
  groupId: string;      // ID of the group
  newOwnerId: string;   // ID of the new owner
  changedBy: string;    // ID of the user making the change
}

interface ChangeGroupOwnerResponse {
  success: boolean;
  message?: string;
  oldOwnerId?: string;  // Optional: ID of the previous owner
}

// Logger for tracking operations
const logger = {
  info: (message: string, meta?: object) => console.log(`[ChangeGroupOwnerService] ${message}`, meta || ''),
  error: (message: string, error?: unknown) => console.error(`[ChangeGroupOwnerService] ${message}`, error || ''),
};

/**
 * Changes the owner of a group based on the selected user ID from ItemSelector.
 * @param userIds - Array of user UUIDs selected in ItemSelector (should contain only one item)
 * @returns Promise with response indicating success or failure
 */
async function changeGroupOwner(userIds: string[]): Promise<ActionResult> {
  const uiStore = useUiStore();
  const groupEditorStore = useGroupEditorStore();
  const userStore = useUserStore();

  // Validate input parameters
  if (!userIds || userIds.length === 0) {
    const errorMessage = 'No user selected to be the new owner';
    logger.error(errorMessage);
    uiStore.showErrorSnackbar(errorMessage);
    return { success: false, message: errorMessage };
  }

  // Ensure only one user is selected (ItemSelector should be configured with maxItems=1)
  if (userIds.length > 1) {
    const errorMessage = 'Only one user can be selected as the group owner';
    logger.error(errorMessage);
    uiStore.showErrorSnackbar(errorMessage);
    return { success: false, message: errorMessage };
  }

  // Get groupId from the store (only available in edit mode)
  const groupId = groupEditorStore.isEditMode ? (groupEditorStore.mode as { mode: string, groupId: string }).groupId : '';
  if (!groupId) {
    const errorMessage = 'Group ID not found. Ensure you are in edit mode and group is loaded';
    logger.error(errorMessage);
    uiStore.showErrorSnackbar(errorMessage);
    return { success: false, message: errorMessage };
  }

  // Get the new owner ID (the only item in the array)
  const newOwnerId = userIds[0];

  // Log the sent request with request body
  const requestBody: ChangeGroupOwnerRequest = {
    groupId,
    newOwnerId,
    changedBy: userStore.userID || '', // Current user ID from userStore
  };
  
  logger.info('Sending request to change group owner', {
    endpoint: '/api/core/item-selector/change-group-owner',
    requestBody,
  });

  try {
    // Send POST request to the API endpoint
    const response = await api.post<ChangeGroupOwnerResponse>(
      '/api/core/item-selector/change-group-owner',
      requestBody,
    );

    // Log the received response
    logger.info('Received response from changing group owner', {
      response: response.data,
    });

    // Check if the request was successful
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to change group owner');
    }

    // Return success response with optional oldOwnerId as part of the result
    return {
      success: true,
      message: response.data.message || 'Group owner changed successfully'
    };
  } catch (error) {
    // Log error with request details
    logger.error('Error changing group owner', error);

    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred while changing group owner';
    
    uiStore.showErrorSnackbar(errorMessage);

    // Return error response
    return { 
      success: false, 
      message: errorMessage 
    };
  }
}

export default changeGroupOwner;