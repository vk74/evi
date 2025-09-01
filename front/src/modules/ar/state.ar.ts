/**
 * @file state.ar.ts
 * Version: 1.0.0
 * Pinia store for managing AR (Analytics & Reports) module state.
 * Frontend file that handles active section state management in ModuleAR.
 */
import { defineStore } from 'pinia'
import type { ARState, ARSectionId } from './types.ar'

export const useARStore = defineStore('ar', {
  state: (): ARState => ({
    /**
     * Current active section in AR module
     */
    activeSection: 'dashboards'
  }),

  getters: {
    /**
     * Get current active section
     */
    getCurrentSection(): ARSectionId {
      return this.activeSection
    }
  },

  actions: {
    /**
     * Set active section
     */
    setActiveSection(sectionId: ARSectionId) {
      this.activeSection = sectionId
    }
  },

  persist: true
})
