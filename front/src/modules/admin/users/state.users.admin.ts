/**
 * state.users.admin.ts
 * Хранилище состояния для модуля управления пользователями.
 * Управляет состоянием активной секции в модуле SubModuleUserAdmin.
 */
import { defineStore } from 'pinia'
import type { UsersAdminState, UserSectionId } from './types.users.admin'

export const useUsersAdminStore = defineStore('users-admin', {
  state: (): UsersAdminState => ({
    /**
     * Текущая активная секция в модуле управления пользователями
     */
    activeSection: 'users-proto'
  }),

  getters: {
    /**
     * Получение текущей активной секции
     */
    getCurrentSection(): UserSectionId {
      return this.activeSection
    }
  },

  actions: {
    /**
     * Установка активной секции
     */
    setActiveSection(sectionId: UserSectionId) {
      this.activeSection = sectionId
    }
  },

  persist: true
})