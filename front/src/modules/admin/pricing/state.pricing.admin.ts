/**
 * @file state.pricing.admin.ts
 * Version: 1.1.0
 * Pinia store for managing pricing admin module state.
 * Frontend file that handles active section management for pricing administration.
 */
import { defineStore } from 'pinia'
import type { PricingAdminState, PricingSectionId, PriceListEditorMode, PriceListData } from './types.pricing.admin'

export const usePricingAdminStore = defineStore('pricingAdmin', {
  state: (): PricingAdminState => ({
    activeSection: 'price-lists',
    editorMode: 'creation',
    editingPriceListId: null,
    editingPriceListData: null
  }),

  getters: {
    getCurrentSection: (state): PricingSectionId => state.activeSection,
    isCreationMode: (state): boolean => state.editorMode === 'creation',
    isEditMode: (state): boolean => state.editorMode === 'edit'
  },

  actions: {
    setActiveSection(section: PricingSectionId): void {
      this.activeSection = section
    },

    // Open price list editor in creation mode
    openPriceListEditorForCreation(): void {
      this.editorMode = 'creation'
      this.editingPriceListId = null
      this.editingPriceListData = null
      this.activeSection = 'price-list-editor'
    },

    // Open price list editor in edit mode
    openPriceListEditorForEdit(priceListId: string, priceListData: PriceListData): void {
      this.editorMode = 'edit'
      this.editingPriceListId = priceListId
      this.editingPriceListData = priceListData
      this.activeSection = 'price-list-editor'
    },

    // Close editor and return to price lists
    closePriceListEditor(): void {
      this.editorMode = 'creation'
      this.editingPriceListId = null
      this.editingPriceListData = null
      this.activeSection = 'price-lists'
    },

    resetState(): void {
      this.activeSection = 'price-lists'
      this.editorMode = 'creation'
      this.editingPriceListId = null
      this.editingPriceListData = null
    }
  },

  persist: true
})

