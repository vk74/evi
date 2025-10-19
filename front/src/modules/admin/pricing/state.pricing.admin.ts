/**
 * @file state.pricing.admin.ts
 * Version: 1.2.0
 * Pinia store for managing pricing admin module state.
 * Frontend file that handles active section management for pricing administration.
 * File: state.pricing.admin.ts (frontend)
 */
import { defineStore } from 'pinia'
import type { PricingAdminState, PricingSectionId, PriceListEditorMode, PriceListData, Currency } from './types.pricing.admin'
import { fetchCurrenciesService } from './currencies/service.fetch.currencies'

export const usePricingAdminStore = defineStore('pricingAdmin', {
  state: (): PricingAdminState => ({
    activeSection: 'price-lists',
    editorMode: 'creation',
    editingPriceListId: null,
    editingPriceListData: null,
    currencies: [],
    isCurrenciesLoading: false,
    currenciesError: null
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
    ,
    async loadCurrencies(): Promise<void> {
      try {
        this.isCurrenciesLoading = true
        this.currenciesError = null
        const data = await fetchCurrenciesService()
        this.currencies = data
      } catch (e) {
        this.currenciesError = e instanceof Error ? e.message : String(e)
      } finally {
        this.isCurrenciesLoading = false
      }
    }
  },

  persist: true
})

