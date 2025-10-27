/**
 * @file state.pricing.admin.ts
 * Version: 1.2.5
 * Pinia store for managing pricing admin module state.
 * Frontend file that handles active section management for pricing administration.
 * File: state.pricing.admin.ts (frontend)
 */
import { defineStore } from 'pinia'
import type { PricingAdminState, PricingSectionId, PriceListEditorMode, PriceListData, Currency } from './types.pricing.admin'
import { fetchCurrenciesService } from './currencies/service.fetch.currencies'
import { updateCurrenciesService, type UpdateCurrenciesPayload } from './currencies/service.update.currencies'

export const usePricingAdminStore = defineStore('pricingAdmin', {
  state: (): PricingAdminState => ({
    activeSection: 'price-lists',
    editorMode: 'creation',
    editingPriceListId: null,
    editingPriceListData: null,
    currencies: [],
    isCurrenciesLoading: false,
    currenciesError: null,
    // change tracking
    currenciesOriginal: [],
    currenciesCreated: [],
    currenciesUpdated: {},
    currenciesDeleted: []
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
    },

    // Clear editing price list data (useful for logout or manual cleanup)
    clearEditingPriceList(): void {
      this.editingPriceListId = null
      this.editingPriceListData = null
      this.editorMode = 'creation'
    }
    ,
    async loadCurrencies(): Promise<void> {
      try {
        this.isCurrenciesLoading = true
        this.currenciesError = null
        const data = await fetchCurrenciesService()
        this.currencies = data
        // snapshot for change tracking
        this.currenciesOriginal = JSON.parse(JSON.stringify(data))
        this.currenciesCreated = []
        this.currenciesUpdated = {}
        this.currenciesDeleted = []
      } catch (e) {
        this.currenciesError = e instanceof Error ? e.message : String(e)
      } finally {
        this.isCurrenciesLoading = false
      }
    }
    ,
    markCurrencyChanged(code: string, field: keyof Currency, value: any): void {
      if (this.currenciesDeleted.includes(code)) return
      // Don't track changes for newly created currencies - they are already in currenciesCreated
      const isNewCurrency = this.currenciesCreated.some(c => c.code === code)
      if (isNewCurrency) return
      if (!this.currenciesUpdated[code]) this.currenciesUpdated[code] = {}
      ;(this.currenciesUpdated[code] as any)[field] = value
    }
    ,
    addTempCurrency(currency: Currency): void {
      this.currencies.push(currency)
      this.currenciesCreated.push(currency)
    }
    ,
    markCurrencyDeleted(code: string): void {
      // remove from created if was new
      const createdIndex = this.currenciesCreated.findIndex(c => c.code === code)
      if (createdIndex >= 0) {
        this.currenciesCreated.splice(createdIndex, 1)
      } else {
        if (!this.currenciesDeleted.includes(code)) this.currenciesDeleted.push(code)
      }
      this.currencies = this.currencies.filter(c => c.code !== code)
      delete this.currenciesUpdated[code]
    }
    ,
    getHasPendingChanges(): boolean {
      return this.currenciesCreated.length > 0 || this.currenciesDeleted.length > 0 || Object.keys(this.currenciesUpdated).length > 0
    }
    ,
    async saveCurrenciesChanges(): Promise<{ created: number, updated: number, deleted: number }> {
      // basic validation before sending
      const isValidCode = (c: string) => /^[A-Z]{3}$/.test(c)
      for (const c of this.currenciesCreated) {
        if (!isValidCode(c.code)) throw new Error('currency code must be 3 uppercase letters')
        if (!c.name || !c.name.trim()) throw new Error('currency name is required')
        if (!c.symbol || !c.symbol.trim()) throw new Error('currency symbol is required')
      }
      if (this.currenciesUpdated['code' as any]) {
        throw new Error('code change is not supported')
      }
      const payload: UpdateCurrenciesPayload = {
        created: this.currenciesCreated.length ? this.currenciesCreated : undefined,
        updated: Object.keys(this.currenciesUpdated).length ? Object.entries(this.currenciesUpdated).map(([code, diff]) => ({ code, ...(diff as any) })) : undefined,
        deleted: this.currenciesDeleted.length ? this.currenciesDeleted : undefined
      }
      const result = await updateCurrenciesService(payload)
      // refresh list and clear tracking
      await this.loadCurrencies()
      return result
    }
    ,
    discardCurrenciesChanges(): void {
      this.currencies = JSON.parse(JSON.stringify(this.currenciesOriginal))
      this.currenciesCreated = []
      this.currenciesUpdated = {}
      this.currenciesDeleted = []
    }
  },

  // No persistence - always reload from server
})

