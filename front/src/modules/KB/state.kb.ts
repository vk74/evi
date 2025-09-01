/**
 * @file state.kb.ts
 * Version: 1.0.0
 * Pinia store for managing KB (Knowledge Base) module state.
 * Frontend file that handles active section state management in ModuleKnowledgeBase.
 */
import { defineStore } from 'pinia'
import type { KBState, KBSectionId } from './types.kb'

export const useKBStore = defineStore('kb', {
  state: (): KBState => ({
    /**
     * Current active section in KB module
     */
    activeSection: 'knowledge-base'
  }),

  getters: {
    /**
     * Get current active section
     */
    getCurrentSection(): KBSectionId {
      return this.activeSection
    }
  },

  actions: {
    /**
     * Set active section
     */
    setActiveSection(sectionId: KBSectionId) {
      this.activeSection = sectionId
    }
  },

  persist: true
})
