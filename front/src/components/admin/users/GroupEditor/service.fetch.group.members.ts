/**
 * service.fetch.group.members.ts
 * FRONTEND service for fetching group members from the API.
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
      uiStore.showErrorSnackbar('Требуется авторизация для получения участников группы')
      return false
    }
    
    try {
      groupEditorStore.setMembersLoading(true)
      groupEditorStore.setMembersError(null)
      console.log(`[FetchGroupMembersService] Fetching members for group ${groupId}`)
      
      // Используем api из core/api/service.axios и правильный URL
      const response = await api.get<IFetchGroupMembersResponse>(
        `/api/admin/groups/${groupId}/members`
      )
      
      const { success, data, message } = response.data
      
      if (success && data && data.members) {
        groupEditorStore.updateGroupMembers(data.members)
        console.log(`[FetchGroupMembersService] Successfully fetched ${data.total} members`)
        uiStore.showSuccessSnackbar(`Успешно загружено ${data.total} участников группы`)
        return true
      } else {
        const errorMessage = message || 'Не удалось получить список участников группы'
        console.error(`[FetchGroupMembersService] API error: ${errorMessage}`)
        groupEditorStore.setMembersError(errorMessage)
        uiStore.showErrorSnackbar(errorMessage)
        return false
      }
    } catch (error) {
      let errorMessage = 'Ошибка при получении участников группы'
      
      // Пытаемся получить более информативное сообщение об ошибке
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      // Делаем сообщение более понятным для пользователя
      if (errorMessage.includes('500')) {
        errorMessage = 'Ошибка на сервере при получении участников группы'
      } else if (errorMessage.includes('404')) {
        errorMessage = 'Не найдена группа или сервис для получения участников'
      } else if (errorMessage.includes('403')) {
        errorMessage = 'Нет прав доступа для просмотра участников группы'
      } else if (errorMessage.includes('401')) {
        errorMessage = 'Требуется авторизация для просмотра участников группы'
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