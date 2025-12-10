/**
 * @file types.pricing.admin.ts
 * Version: 1.5.0
 * Type definitions for pricing administration module.
 * Frontend types for pricing admin functionality.
 * File: types.pricing.admin.ts (frontend)
 * 
 * Changes in v1.3.5:
 * - Added roundingPrecision to Currency type for UI display and persistence
 * 
 * Changes in v1.3.6:
 * - Added roundingPrecision to FetchPriceListResult data
 * 
 * Changes in v1.3.7:
 * - Added region field to PriceListSummary, PriceListFull, CreatePriceListRequest, and UpdatePriceListRequest
 * 
 * Changes in v1.3.8:
 * - Added 'tax' to PricingSectionId type union (renamed from 'vat')
 * 
 * Changes in v1.3.9:
 * - Added TaxableCategory, FetchTaxableCategoriesResult, UpdateTaxableCategoriesRequest, UpdateTaxableCategoriesResult types for taxable_categories management
 * 
 * Changes in v1.4.0:
 * - Added region field to TaxableCategory and UpdateTaxableCategoriesRequest for region bindings
 * 
 * Changes in v1.5.0:
 * - Added RegionCategoryBinding, FetchTaxRegionsResult, UpdateTaxRegionsRequest, UpdateTaxRegionsResult types for tax regions bindings with VAT rates
 */

// Pricing section interface for menu navigation
export interface Section {
  id: PricingSectionId
  title: string
  icon: string
  visible?: boolean
}

// Pricing admin sections
export type PricingSectionId = 'price-lists' | 'price-list-editor' | 'tax' | 'currencies' | 'settings'

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
  region?: string | null
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
  roundingPrecision: number
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
  region: string | null
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
  region: string | null
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
  statusFilter?: 'all' | 'active' | 'disabled'
  currencyFilter?: string
}

// Fetch all price lists result
export interface FetchAllPriceListsResult {
  success: boolean
  message?: string
  data?: {
    priceLists: PriceListSummary[]
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
    roundingPrecision?: number | null
  }
}

// Create price list request
export interface CreatePriceListRequest {
  name: string
  description?: string
  currency_code: string
  is_active?: boolean
  owner?: string
  region?: string | null
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
  region?: string | null
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
      itemCode?: string
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

// ============================================
// Taxable Categories Types - DEPRECATED/REMOVED
// ============================================

/*
// Taxable Category type aligned with backend DTO
export interface TaxableCategory {
  category_id: number
  category_name: string
  region: string | null
  created_at: Date
  updated_at: Date | null
}

// Fetch taxable categories result
export interface FetchTaxableCategoriesResult {
  success: boolean
  message: string
  data?: TaxableCategory[]
}

// Update taxable categories request (full table state)
export interface UpdateTaxableCategoriesRequest {
  categories: Array<{
    category_id?: number // optional, negative for new categories
    category_name: string
    region?: string | null // region name for binding
    _delete?: boolean // flag for deletion
  }>
}

// Update taxable categories result
export interface UpdateTaxableCategoriesResult {
  success: boolean
  message: string
  data?: {
    totalRecords: number
  }
}
*/

// ============================================
// Tax Regions Bindings Types (with VAT rates)
// ============================================

// Region-Category Binding type
export interface RegionCategoryBinding {
  id: number
  region_id: number
  region_name: string
  category_name: string
  vat_rate: number | null // 0-99 or null
}

// Fetch tax regions result
export interface FetchTaxRegionsResult {
  success: boolean
  message: string
  data?: {
    regions: Array<{
      region_id: number
      region_name: string
    }>
    bindings: RegionCategoryBinding[]
  }
}

// Update tax regions request (for one region)
export interface UpdateTaxRegionsRequest {
  region_id: number
  bindings: Array<{
    id?: number
    category_name: string
    vat_rate: number | null // null means delete binding (or explicit _delete)
    _delete?: boolean
  }>
}

// Update tax regions result
export interface UpdateTaxRegionsResult {
  success: boolean
  message: string
  data?: {
    totalBindings: number
    created: number
    updated: number
    deleted: number
  }
}

