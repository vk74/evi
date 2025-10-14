/**
 * @file state.pricing.admin.ts
 * Version: 1.0.0
 * Pinia store for managing pricing admin module state.
 * Frontend file that handles active section management for pricing administration.
 */
import { defineStore } from 'pinia'
import type { PricingAdminState, PricingSectionId } from './types.pricing.admin'

export const usePricingAdminStore = defineStore('pricingAdmin', {
  state: (): PricingAdminState => ({
    activeSection: 'price-lists'
  }),

  getters: {
    getCurrentSection: (state): PricingSectionId => state.activeSection
  },

  actions: {
    setActiveSection(section: PricingSectionId): void {
      this.activeSection = section
    },

    resetState(): void {
      this.activeSection = 'price-lists'
    }
  },

  persist: true
})

