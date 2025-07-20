/**
 * @file service.fetch.group.members.ts
 * Version: 1.0.0
 * Frontend service for fetching group members from the API.
 * Frontend file that handles group member data fetching and error processing.
 * 
 * Functionality:
 * - Fetches group members data from the API
 * - Handles API response and error processing
 */
import { api } from '@/core/api/service.axios';
import { useGroupEditorStore } from './state.group.editor'
import { useUserStore } from '@/core/state/userstate'
import { useUiStore } from '@/core/state/uistate'
import type { IFetchGroupMembersResponse } from './types.group.editor'

/**
 * Singleton service for fetching group members
 */
class FetchGroupMembersService {
  /**
   * Fetches members for a specific group
   * @param groupId - ID of the group to fetch members for
   * @returns Promise<boolean> - Success status
   */
  async fetchGroupMembers(groupId: string): Promise<boolean> {
    const groupEditorStore = useGroupEditorStore()
    const userStore = useUserStore()
    const uiStore = useUiStore()
    
    // Skip if no authorization
    if (!userStore.isLoggedIn || !userStore.jwt) {
      console.warn('[FetchGroupMembersService] Unauthorized - cannot fetch group members')
      uiStore.showErrorSnackbar('Authorization required to view group members')
      return false
    }
    
    try {
      groupEditorStore.setMembersLoading(true)
      groupEditorStore.setMembersError(null)
      console.log(`[FetchGroupMembersService] Fetching members for group ${groupId}`)
      
      // Use api from core/api/service.axios and correct URL
      const response = await api.get<IFetchGroupMembersResponse>(
        `/api/admin/groups/${groupId}/members`
      )
      
      const { success, data, message } = response.data
      
      if (success && data && data.members) {
        groupEditorStore.updateGroupMembers(data.members)
        console.log(`[FetchGroupMembersService] Successfully fetched ${data.total} members`)
        uiStore.showSuccessSnackbar(`Successfully loaded ${data.total} group members`)
        return true
      } else {
        const errorMessage = message || 'Failed to get group members list'
        console.error(`[FetchGroupMembersService] API error: ${errorMessage}`)
        groupEditorStore.setMembersError(errorMessage)
        uiStore.showErrorSnackbar(errorMessage)
        return false
      }
    } catch (error) {
      let errorMessage = 'Error fetching group members'
      
      // Try to get more informative error message
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      // Make message more user-friendly
      if (errorMessage.includes('500')) {
        errorMessage = 'Server error while fetching group members'
      } else if (errorMessage.includes('404')) {
        errorMessage = 'Group or service for fetching members not found'
      } else if (errorMessage.includes('403')) {
        errorMessage = 'No access rights to view group members'
      } else if (errorMessage.includes('401')) {
        errorMessage = 'Authorization required to view group members'
      }
      
      console.error('[FetchGroupMembersService] Exception:', error)
      groupEditorStore.setMembersError(errorMessage)
      uiStore.showErrorSnackbar(errorMessage)
      return false
    } finally {
      groupEditorStore.setMembersLoading(false)
    }
  }
}

export const fetchGroupMembersService = new FetchGroupMembersService()
export default fetchGroupMembersService