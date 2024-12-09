/**
 * groupstate.js
 * Store для управления группами пользователей
 * Обеспечивает функционал создания, редактирования групп и управления участниками
 */

import { defineStore } from 'pinia'
import axios from 'axios'

// Вспомогательная функция для логирования в консоль браузера
const logEvent = (eventType, details) => {
  console.log(
    `[Groups Module] ${new Date().toISOString()} | ${eventType}:`, 
    details
  )
}

export const useGroupStore = defineStore('group', {
  state: () => ({
    currentGroup: null,
    groups: [],
    groupMembers: [],
    loading: {
      groups: false,
      members: false,
      saving: false
    },
    errors: {
      groups: null,
      members: null,
      saving: null
    }
  }),

  getters: {
    getGroupById: (state) => (groupId) => {
      return state.groups.find(group => group.group_id === groupId)
    },

    getActiveMembers: (state) => {
      return state.groupMembers.filter(member => member.is_active)
    },

    isUserMember: (state) => (userId) => {
      return state.groupMembers.some(member => 
        member.user_id === userId && member.is_active
      )
    }
  },

  actions: {
    async fetchGroups() {
      this.loading.groups = true
      this.errors.groups = null
      
      try {
        const response = await axios.get('/api/groups')
        this.groups = response.data
        logEvent('GROUPS_LOADED', { count: response.data.length })
      } catch (error) {
        this.errors.groups = error.response?.data?.message || 'Ошибка при загрузке групп'
        logEvent('ERROR', { 
          action: 'fetchGroups', 
          error: error.message 
        })
        throw error
      } finally {
        this.loading.groups = false
      }
    },

    async fetchGroup(groupId) {
      try {
        const response = await axios.get(`/api/groups/${groupId}`)
        this.currentGroup = response.data
        logEvent('GROUP_LOADED', { 
          id: groupId,
          name: response.data.group_name 
        })
        return response.data
      } catch (error) {
        logEvent('ERROR', { 
          action: 'fetchGroup', 
          groupId,
          error: error.message 
        })
        throw error
      }
    },

    async createGroup(groupData) {
      this.loading.saving = true
      this.errors.saving = null

      try {
        const response = await axios.post('/api/groups', groupData)
        this.groups.push(response.data)
        logEvent('GROUP_CREATED', {
          id: response.data.group_id,
          name: response.data.group_name
        })
        return response.data
      } catch (error) {
        this.errors.saving = error.response?.data?.message || 'Ошибка при создании группы'
        logEvent('ERROR', { 
          action: 'createGroup',
          error: error.message 
        })
        throw error
      } finally {
        this.loading.saving = false
      }
    },

    async updateGroup(groupId, groupData) {
      this.loading.saving = true
      this.errors.saving = null

      try {
        const response = await axios.put(`/api/groups/${groupId}`, groupData)
        const index = this.groups.findIndex(g => g.group_id === groupId)
        if (index !== -1) {
          this.groups[index] = response.data
        }
        logEvent('GROUP_UPDATED', {
          id: groupId,
          name: response.data.group_name
        })
        return response.data
      } catch (error) {
        this.errors.saving = error.response?.data?.message || 'Ошибка при обновлении группы'
        logEvent('ERROR', { 
          action: 'updateGroup',
          groupId,
          error: error.message 
        })
        throw error
      } finally {
        this.loading.saving = false
      }
    },

    async fetchGroupMembers(groupId) {
      this.loading.members = true
      this.errors.members = null

      try {
        const response = await axios.get(`/api/groups/${groupId}/members`)
        this.groupMembers = response.data
        logEvent('MEMBERS_LOADED', {
          groupId,
          count: response.data.length
        })
        return response.data
      } catch (error) {
        this.errors.members = error.response?.data?.message || 'Ошибка при загрузке участников'
        logEvent('ERROR', { 
          action: 'fetchGroupMembers',
          groupId,
          error: error.message 
        })
        throw error
      } finally {
        this.loading.members = false
      }
    },

    async addGroupMember(groupId, userId) {
      try {
        const response = await axios.post(`/api/groups/${groupId}/members`, { user_id: userId })
        this.groupMembers.push(response.data)
        logEvent('MEMBER_ADDED', {
          groupId,
          userId,
          memberId: response.data.member_id
        })
        return response.data
      } catch (error) {
        logEvent('ERROR', { 
          action: 'addGroupMember',
          groupId,
          userId,
          error: error.message 
        })
        throw error
      }
    },

    async removeGroupMember(groupId, memberId) {
      try {
        await axios.delete(`/api/groups/${groupId}/members/${memberId}`)
        const member = this.groupMembers.find(m => m.member_id === memberId)
        if (member) {
          member.is_active = false
          member.left_at = new Date()
        }
        logEvent('MEMBER_REMOVED', {
          groupId,
          memberId
        })
      } catch (error) {
        logEvent('ERROR', { 
          action: 'removeGroupMember',
          groupId,
          memberId,
          error: error.message 
        })
        throw error
      }
    },

    clearCurrentGroup() {
      this.currentGroup = null
      this.groupMembers = []
      this.errors = {
        groups: null,
        members: null,
        saving: null
      }
      logEvent('STATE_CLEARED', { component: 'currentGroup' })
    }
  }
})