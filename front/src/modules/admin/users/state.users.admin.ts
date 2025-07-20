/**
 * @file state.users.admin.ts
 * Version: 1.0.0
 * Pinia store for managing user administration module state.
 * Frontend file that handles active section state management in SubModuleUserAdmin.
 */
import { defineStore } from 'pinia'
import type { UsersAdminState, UserSectionId } from './types.users.admin'

export const useUsersAdminStore = defineStore('users-admin', {
  state: (): UsersAdminState => ({
    /**
     * Current active section in user administration module
     */
    activeSection: 'users-proto'
  }),

  getters: {
    /**
     * Get current active section
     */
    getCurrentSection(): UserSectionId {
      return this.activeSection
    }
  },

  actions: {
    /**
     * Set active section
     */
    setActiveSection(sectionId: UserSectionId) {
      this.activeSection = sectionId
    }
  },

  persist: true
})