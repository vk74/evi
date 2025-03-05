/**
 * service.fetch.group.members.ts
 * Service for fetching group members from the API.
 * 
 * Functionality:
 * - Fetches group members data from the API
 * - Handles API response and error processing
 */
import axios from 'axios'
import { useGroupEditorStore } from './state.group.editor'
import { useUserStore } from '@/core/state/userstate'
import { useUiStore } from '@/core/state/uistate'
import type { IFetchGroupMembersResponse } from './types.group.editor'

/**
 * Singleton service for fetching group members
 */
class FetchGroupMembersService {
  private apiUrl = '/api/v1/admin/groups/members'
  
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
      uiStore.showErrorSnackbar('Требуется авторизация для получения участников группы')
      return false
    }
    
    try {
      groupEditorStore.setMembersLoading(true)
      groupEditorStore.setMembersError(null)
      console.log(`[FetchGroupMembersService] Fetching members for group ${groupId}`)
      
      const response = await axios.get<IFetchGroupMembersResponse>(
        `${this.apiUrl}/${groupId}`,
        {
          headers: {
            Authorization: `Bearer ${userStore.jwt}`
          }
        }
      )
      
      const { success, members, message } = response.data
      
      if (success && members) {
        groupEditorStore.updateGroupMembers(members)
        console.log(`[FetchGroupMembersService] Successfully fetched ${members.length} members`)
        return true
      } else {
        const errorMessage = message || 'Не удалось получить список участников группы'
        console.error(`[FetchGroupMembersService] API error: ${errorMessage}`)
        groupEditorStore.setMembersError(errorMessage)
        uiStore.showErrorSnackbar(errorMessage)
        return false
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при получении участников группы'
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