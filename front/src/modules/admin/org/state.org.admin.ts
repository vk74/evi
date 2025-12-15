/**
 * @file state.org.admin.ts
 * Version: 1.0.0
 * Pinia store for managing organization administration module state.
 * Frontend file that handles active section state management in SubModuleOrgAdmin.
 */
import { defineStore } from 'pinia'
import type { OrgAdminState, UserSectionId } from './types.org.admin'

export const useOrgAdminStore = defineStore('org-admin', {
  state: (): OrgAdminState => ({
    /**
     * Current active section in organization administration module
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
    },

    /**
     * Reset state to initial values
     */
    resetState() {
      this.activeSection = 'users-proto'
    }
  },

  persist: true
})