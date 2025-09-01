/**
 * @file state.products.admin.ts
 * Version: 1.0.0
 * Pinia store for managing products admin module state.
 * Frontend file that handles active section management for products administration.
 */
import { defineStore } from 'pinia'
import type {
  ProductsAdminState,
  ProductSectionId
} from './types.products.admin'

export const useProductsAdminStore = defineStore('productsAdmin', {
  state: (): ProductsAdminState => ({
    activeSection: 'products-list'
  }),

  getters: {
    getCurrentSection: (state): ProductSectionId => state.activeSection
  },

  actions: {
    setActiveSection(section: ProductSectionId): void {
      this.activeSection = section
    },

    resetState(): void {
      this.activeSection = 'products-list'
    }
  },

  persist: true
})
