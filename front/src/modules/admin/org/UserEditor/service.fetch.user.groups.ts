/**
 * @file service.fetch.user.groups.ts
 * Version: 1.0.0
 * Frontend service to fetch groups a user belongs to with server-side pagination and sorting.
 * Frontend file.
 */
import { api } from '@/core/api/service.axios'
import { useUiStore } from '@/core/state/uistate'
import { useUserEditorStore } from './state.user.editor'
import type { IFetchUserGroupsResponse } from './types.user.editor'

export interface FetchUserGroupsParams {
  userId: string
  page: number
  itemsPerPage: number
  sortBy?: string
  sortDesc?: boolean
  search?: string
}

export const userGroupsService = {
  async fetchUserGroups(params: FetchUserGroupsParams): Promise<{ items: any[]; total: number }> {
    const uiStore = useUiStore()
    const store = useUserEditorStore()

    if (store.mode.mode !== 'edit') {
      return { items: [], total: 0 }
    }

    const query = new URLSearchParams()
    query.set('page', String(params.page))
    query.set('itemsPerPage', String(params.itemsPerPage))
    if (params.sortBy) query.set('sortBy', params.sortBy)
    if (typeof params.sortDesc === 'boolean') query.set('sortDesc', params.sortDesc ? 'true' : 'false')
    if (params.search) query.set('search', params.search)

    try {
      const resp = await api.get<IFetchUserGroupsResponse>(`/api/admin/users/${params.userId}/groups?${query.toString()}`)
      if (!resp.data.success || !resp.data.data) {
        throw new Error(resp.data.message || 'failed to fetch user groups')
      }
      return { items: resp.data.data.items, total: resp.data.data.total }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'failed to fetch user groups'
      uiStore.showErrorSnackbar(msg)
      throw error
    }
  }
}

export default userGroupsService
