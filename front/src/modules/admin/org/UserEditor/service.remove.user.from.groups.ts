/**
 * @file service.remove.user.from.groups.ts
 * Version: 1.0.0
 * Frontend service for removing user from groups.
 * Frontend file that handles user removal from multiple groups via API and error processing.
 * 
 * Functionality:
 * - Removes user from multiple groups via API
 * - Handles API response and error processing
 */

import { api } from '@/core/api/service.axios';
import { useUserAuthStore } from '@/core/auth/state.user.auth';
import { useUiStore } from '@/core/state/uistate';

/**
 * Remove user from groups
 * @param userId - ID of the user
 * @param groupIds - Array of group IDs to remove user from
 * @returns Promise<number> - Number of successfully removed groups
 */
export async function removeUserFromGroups(userId: string, groupIds: string[]): Promise<number> {
  const userStore = useUserAuthStore();
  const uiStore = useUiStore();
  
  // Skip if no authorization
  if (!userStore.isAuthenticated || !userStore.jwt) {
    console.warn('[RemoveUserFromGroupsService] Unauthorized - cannot remove user from groups');
    uiStore.showErrorSnackbar('Authorization required to remove user from groups');
    return 0;
  }
  
  if (!groupIds.length) {
    console.warn('[RemoveUserFromGroupsService] No groups selected for removal');
    uiStore.showErrorSnackbar('No groups selected for removal');
    return 0;
  }
  
  try {
    console.log(`[RemoveUserFromGroupsService] Removing user ${userId} from ${groupIds.length} groups`);
    
    const response = await api.post('/api/admin/users/remove-from-groups', {
      userId,
      groupIds
    });
    
    const { success, removedCount, message } = response.data;
    
    if (success) {
      console.log(`[RemoveUserFromGroupsService] Successfully removed user from ${removedCount} groups`);
      uiStore.showSuccessSnackbar(message || `Successfully removed user from ${removedCount} groups`);
      return removedCount;
    } else {
      const errorMessage = message || 'Failed to remove user from groups';
      console.error(`[RemoveUserFromGroupsService] API error: ${errorMessage}`);
      uiStore.showErrorSnackbar(errorMessage);
      return 0;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error removing user from groups';
    console.error('[RemoveUserFromGroupsService] Exception:', error);
    uiStore.showErrorSnackbar(errorMessage);
    return 0;
  }
}

export default removeUserFromGroups;
