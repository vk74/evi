/**
 * @file service.remove.group.members.ts
 * Version: 1.0.0
 * Service for removing members from a group.
 * Frontend file that handles group member removal via API and error processing.
 * 
 * Functionality:
 * - Removes members from a group via API
 * - Handles API response and error processing
 */
import axios from 'axios'
import { useGroupEditorStore } from './state.group.editor'
import { useUserAuthStore } from '@/core/auth/state.user.auth';
import { useUiStore } from '@/core/state/uistate'
import { fetchGroupMembersService } from './service.fetch.group.members'
import type { IRemoveGroupMembersResponse } from './types.group.editor'

/**
 * Singleton service for removing group members
 */
class RemoveGroupMembersService {
  private apiUrl = '/api/v1/admin/groups/members/remove'
  
  /**
   * Removes selected members from a group
   * @param groupId - ID of the group
   * @param userIds - Array of user IDs to remove
   * @returns Promise<number> - Number of successfully removed members
   */
  async removeGroupMembers(groupId: string, userIds: string[]): Promise<number> {
    const groupEditorStore = useGroupEditorStore()
    const userStore = useUserAuthStore()
    const uiStore = useUiStore()
    
    // Skip if no authorization
    if (!userStore.isAuthenticated || !userStore.jwt) {
      console.warn('[RemoveGroupMembersService] Unauthorized - cannot remove group members')
      uiStore.showErrorSnackbar('Authorization required to remove group members')
      return 0
    }
    
    if (!userIds.length) {
      console.warn('[RemoveGroupMembersService] No members selected for removal')
      uiStore.showErrorSnackbar('No members selected for removal')
      return 0
    }
    
    try {
      groupEditorStore.setMembersLoading(true)
      console.log(`[RemoveGroupMembersService] Removing ${userIds.length} members from group ${groupId}`)
      
      const response = await axios.post<IRemoveGroupMembersResponse>(
        this.apiUrl,
        {
          group_id: groupId,
          user_ids: userIds
        },
        {
          headers: {
            Authorization: `Bearer ${userStore.jwt}`
          }
        }
      )
      
      const { success, removedCount, message } = response.data
      
      if (success) {
        console.log(`[RemoveGroupMembersService] Successfully removed ${removedCount} members`)
        
        // After successful removal, refresh the members list with force refresh
        await fetchGroupMembersService.fetchGroupMembers(groupId, true)
        
        return removedCount
      } else {
        const errorMessage = message || 'Failed to remove group members'
        console.error(`[RemoveGroupMembersService] API error: ${errorMessage}`)
        uiStore.showErrorSnackbar(errorMessage)
        return 0
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error removing group members'
      console.error('[RemoveGroupMembersService] Exception:', error)
      uiStore.showErrorSnackbar(errorMessage)
      return 0
    } finally {
      groupEditorStore.setMembersLoading(false)
    }
  }
}

export const removeGroupMembersService = new RemoveGroupMembersService()
export default removeGroupMembersService