/**
 * @file types.pricing.admin.ts
 * Version: 1.1.4
 * Type definitions for pricing administration module.
 * Frontend types for pricing admin functionality.
 * File: types.pricing.admin.ts (frontend)
 */

// Pricing section interface for menu navigation
export interface Section {
  id: PricingSectionId
  title: string
  icon: string
  visible?: boolean
}

// Pricing admin sections
export type PricingSectionId = 'price-lists' | 'price-list-editor' | 'currencies' | 'settings'

// Editor modes
export type PriceListEditorMode = 'creation' | 'edit'

// Price list data interface
export interface PriceListData {
  id: string
  code: string
  name: string
  currency: string
  status: 'draft' | 'active' | 'archived' | string
  validFrom?: string
  validTo?: string | null
  itemsCount?: number
}

// Pricing admin state interface
export interface PricingAdminState {
  activeSection: PricingSectionId
  editorMode: PriceListEditorMode
  editingPriceListId: string | null
  editingPriceListData: PriceListData | null
  // Currencies state
  currencies: Currency[]
  isCurrenciesLoading: boolean
  currenciesError: string | null
  // Change tracking for currencies
  currenciesOriginal: Currency[]
  currenciesCreated: Currency[]
  currenciesUpdated: Record<string, Partial<Currency>>
  currenciesDeleted: string[]
}

// Currency type aligned with backend CurrencyDto
export interface Currency {
  code: string
  name: string
  symbol: string | null
  active: boolean
}

