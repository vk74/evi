/**
 * @file types.pricing.admin.ts
 * Version: 1.1.1
 * Type definitions for pricing administration module.
 * Frontend types for pricing admin functionality.
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
}

