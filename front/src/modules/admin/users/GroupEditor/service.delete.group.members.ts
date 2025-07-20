/**
 * @file service.delete.group.members.ts
 * Version: 1.0.0
 * Frontend service for removing group members from the API.
 * Frontend file that handles group member removal requests and error processing.
 * 
 * Functionality:
 * - Sends delete requests to the API
 * - Handles API response and error processing
 */
import { api } from '@/core/api/service.axios';
import { useGroupEditorStore } from './state.group.editor'
import { useUserStore } from '@/core/state/userstate'
import { useUiStore } from '@/core/state/uistate'
import type { IRemoveGroupMembersResponse } from './types.group.editor'

/**
 * Remove members from a specific group
 * @param groupId - ID of the group
 * @param userIds - Array of user IDs to remove from the group
 * @returns Promise<number> - Number of removed members or -1 if operation failed
 */
export async function removeGroupMembers(groupId: string, userIds: string[]): Promise<number> {
  const groupEditorStore = useGroupEditorStore()
  const userStore = useUserStore()
  const uiStore = useUiStore()
  
  // Skip if no authorization
  if (!userStore.isLoggedIn || !userStore.jwt) {
    console.warn('[RemoveGroupMembersService] Unauthorized - cannot remove group members')
    uiStore.showErrorSnackbar('Authorization required to remove group members')
    return -1
  }
  
  // Skip if no user IDs provided
  if (!userIds || userIds.length === 0) {
    console.warn('[RemoveGroupMembersService] No user IDs provided')
    uiStore.showErrorSnackbar('No members selected for removal')
    return 0
  }
  
  try {
    groupEditorStore.setMembersLoading(true)
    console.log(`[RemoveGroupMembersService] Removing ${userIds.length} members from group ${groupId}`)
    
    // Send POST request to API
    const response = await api.post<IRemoveGroupMembersResponse>(
      `/api/admin/groups/${groupId}/members/remove`, 
      { userIds }
    )
    
    const { success, removedCount, message } = response.data
    
    if (success) {
      console.log(`[RemoveGroupMembersService] Successfully removed ${removedCount} members`)
      uiStore.showSuccessSnackbar(`Successfully removed ${removedCount} group members`)
      return removedCount
    } else {
      const errorMessage = message || 'Failed to remove group members'
      console.error(`[RemoveGroupMembersService] API error: ${errorMessage}`)
      uiStore.showErrorSnackbar(errorMessage)
      return 0
    }
  } catch (error) {
    let errorMessage = 'Error removing group members'
    
    // Try to get more informative error message
    if (error instanceof Error) {
      errorMessage = error.message
    }
    
    // Make error message more user-friendly
    if (errorMessage.includes('500')) {
      errorMessage = 'Server error while removing group members'
    } else if (errorMessage.includes('404')) {
      errorMessage = 'Group or service for removing members not found'
    } else if (errorMessage.includes('403')) {
      errorMessage = 'No access rights to remove group members'
    } else if (errorMessage.includes('401')) {
      errorMessage = 'Authorization required to remove group members'
    }
    
    console.error('[RemoveGroupMembersService] Exception:', error)
    uiStore.showErrorSnackbar(errorMessage)
    return -1
  } finally {
    groupEditorStore.setMembersLoading(false)
  }
}

export const removeGroupMembersService = { removeGroupMembers }
export default removeGroupMembersService