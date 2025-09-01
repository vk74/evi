/**
 * @file state.work.ts
 * Version: 1.0.0
 * Pinia store for managing work module state.
 * Frontend file that handles active section state management in ModuleWork.
 */
import { defineStore } from 'pinia'
import type { WorkState, WorkSectionId } from './types.work'

export const useWorkStore = defineStore('work', {
  state: (): WorkState => ({
    /**
     * Current active section in work module
     */
    activeSection: 'all-work-items'
  }),

  getters: {
    /**
     * Get current active section
     */
    getCurrentSection(): WorkSectionId {
      return this.activeSection
    }
  },

  actions: {
    /**
     * Set active section
     */
    setActiveSection(sectionId: WorkSectionId) {
      this.activeSection = sectionId
    }
  },

  persist: true
})
