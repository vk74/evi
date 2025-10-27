/**
 * @file types.pricing.admin.ts
 * Version: 1.3.1
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

// Price list data interface (for UI/state)
export interface PriceListData {
  id: number
  name: string
  description: string | null
  currency_code: string
  isActive: boolean
  owner: string | null
  items?: PriceListItem[] // Optional items array
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

// ============================================
// Price List Types for API
// ============================================

// Price list item from API (list view)
export interface PriceListSummary {
  price_list_id: number
  name: string
  description: string | null
  currency_code: string
  is_active: boolean
  owner_id: string | null
  owner_username: string | null
  created_at: string
  updated_at: string
}

// Full price list from API (single fetch)
export interface PriceListFull {
  price_list_id: number
  name: string
  description: string | null
  currency_code: string
  is_active: boolean
  owner_id: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

// Fetch all price lists params
export interface FetchAllPriceListsParams {
  page: number
  itemsPerPage: number
  searchQuery?: string
  sortBy?: string
  sortDesc?: boolean
  statusFilter?: 'all' | 'active' | 'inactive'
  currencyFilter?: string
}

// Fetch all price lists result
export interface FetchAllPriceListsResult {
  success: boolean
  message?: string
  data?: {
    priceLists: PriceListItem[]
    pagination: {
      currentPage: number
      itemsPerPage: number
      totalItems: number
      totalPages: number
    }
  }
}

// Fetch single price list result
export interface FetchPriceListResult {
  success: boolean
  message?: string
  data?: {
    priceList: PriceListFull
    items: PriceListItem[]
  }
}

// Create price list request
export interface CreatePriceListRequest {
  name: string
  description?: string
  currency_code: string
  is_active?: boolean
  owner?: string
}

// Create price list result
export interface CreatePriceListResult {
  success: boolean
  message: string
  data?: {
    priceList: PriceListFull
  }
}

// Update price list request
export interface UpdatePriceListRequest {
  price_list_id: number
  name?: string
  description?: string
  currency_code?: string
  is_active?: boolean
  owner?: string
}

// Update price list result
export interface UpdatePriceListResult {
  success: boolean
  message: string
  data?: {
    priceList: PriceListFull
  }
}

// Delete price lists request
export interface DeletePriceListsRequest {
  priceListIds: number[]
}

// Delete price lists result
export interface DeletePriceListsResult {
  success: boolean
  message: string
  data?: {
    totalDeleted: number
    totalErrors: number
  }
}

// ============================================
// Price List Item Types
// ============================================

// Price item type from API
export interface PriceItemType {
  type_code: string
  type_name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// Price list item from API
export interface PriceListItem {
  item_id: number
  price_list_id: number
  item_type: string
  item_code: string
  item_name: string
  list_price: number
  wholesale_price: number | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

// Create price list item request
export interface CreatePriceListItemRequest {
  item_type: string
  item_code: string
  item_name: string
  list_price: number
  wholesale_price?: number | null
}

// Create price list item result
export interface CreatePriceListItemResult {
  success: boolean
  message: string
  data?: {
    item: PriceListItem
  }
}

// Fetch price item types result
export interface FetchPriceItemTypesResult {
  success: boolean
  message?: string
  data?: {
    types: PriceItemType[]
  }
}

export interface FetchPriceListItemsResult {
  success: boolean
  message?: string
  data?: {
    items: PriceListItem[]
  }
}

// ============================================
// Price List Items - Delete Types
// ============================================

// Delete price list items request
export interface DeletePriceListItemsRequest {
  itemCodes: string[]
}

// Delete price list items result
export interface DeletePriceListItemsResult {
  success: boolean
  message: string
  data?: {
    totalDeleted: number
    totalErrors: number
    deletedItems: string[]
    errorItems: string[]
  }
}

// ============================================
// Price List Items - Update Types
// ============================================

// Update price list items request
export interface UpdatePriceListItemsRequest {
  updates: Array<{
    itemCode: string
    changes: {
      itemType?: string
      itemName?: string
      listPrice?: number
      wholesalePrice?: number | null
    }
  }>
}

// Update price list items result
export interface UpdatePriceListItemsResult {
  success: boolean
  message: string
  data?: {
    totalUpdated: number
    totalErrors: number
    updatedItems: string[]
    errorItems: string[]
  }
}

