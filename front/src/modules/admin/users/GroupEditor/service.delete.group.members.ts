/**
 * service.delete.group.members.ts
 * FRONTEND service for removing group members from the API.
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
    uiStore.showErrorSnackbar('Требуется авторизация для удаления участников группы')
    return -1
  }
  
  // Skip if no user IDs provided
  if (!userIds || userIds.length === 0) {
    console.warn('[RemoveGroupMembersService] No user IDs provided')
    uiStore.showErrorSnackbar('Не выбраны участники для удаления')
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
      uiStore.showSuccessSnackbar(`Успешно удалено ${removedCount} участников группы`)
      return removedCount
    } else {
      const errorMessage = message || 'Не удалось удалить участников группы'
      console.error(`[RemoveGroupMembersService] API error: ${errorMessage}`)
      uiStore.showErrorSnackbar(errorMessage)
      return 0
    }
  } catch (error) {
    let errorMessage = 'Ошибка при удалении участников группы'
    
    // Try to get more informative error message
    if (error instanceof Error) {
      errorMessage = error.message
    }
    
    // Make error message more user-friendly
    if (errorMessage.includes('500')) {
      errorMessage = 'Ошибка на сервере при удалении участников группы'
    } else if (errorMessage.includes('404')) {
      errorMessage = 'Не найдена группа или сервис для удаления участников'
    } else if (errorMessage.includes('403')) {
      errorMessage = 'Нет прав доступа для удаления участников группы'
    } else if (errorMessage.includes('401')) {
      errorMessage = 'Требуется авторизация для удаления участников группы'
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