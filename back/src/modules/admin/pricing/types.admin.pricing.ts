/**
 * version: 1.8.0
 * Backend types for pricing administration module.
 * Defines DTOs for currencies, price lists and other pricing-related entities.
 * File: types.admin.pricing.ts (backend)
 * 
 * Changes in v1.4.5:
 * - Added rounding_precision field to CurrencyDto and related payloads
 * 
 * Changes in v1.4.6:
 * - Added rounding_precision field to FetchPriceListResponse data
 * 
 * Changes in v1.4.7:
 * - Added region field to PriceListSummaryDto, PriceListFullDto, CreatePriceListRequest, and UpdatePriceListRequest
 * 
 * Changes in v1.4.8:
 * - Added RegionDto and FetchRegionsResponse types for regions management
 * 
 * Changes in v1.5.0:
 * - Removed RegionDto and FetchRegionsResponse types (moved to settings module)
 * - Removed RegionsVATDto, FetchRegionsVATResponse, UpdateRegionsVATRequest, UpdateRegionsVATResponse types (regions_vat table removed)
 * 
 * Changes in v1.6.0:
 * - Added TaxableCategoryDto, FetchTaxableCategoriesResponse, UpdateTaxableCategoriesRequest, UpdateTaxableCategoriesResponse types for taxable_categories management
 * 
 * Changes in v1.7.0:
 * - Added region field to TaxableCategoryDto and UpdateTaxableCategoriesRequest for region bindings
 * 
 * Changes in v1.8.0:
 * - Added RegionCategoryBindingDto, FetchTaxRegionsResponse, UpdateTaxRegionsRequest, UpdateTaxRegionsResponse types for tax regions bindings with VAT rates
 */

// ============================================
// Taxable Categories Types
// ============================================

// Taxable Category DTO aligned with database structure
export interface TaxableCategoryDto {
    category_id: number
    category_name: string
    region: string | null
    created_at: Date
    updated_at: Date | null
}

// Response for fetch taxable categories
export interface FetchTaxableCategoriesResponse {
    success: boolean
    message: string
    data?: TaxableCategoryDto[]
}

// Request for updating taxable categories (full table state)
export interface UpdateTaxableCategoriesRequest {
    categories: Array<{
        category_id?: number // optional, negative for new categories
        category_name: string
        region?: string | null // region name for binding
        _delete?: boolean // flag for deletion
    }>
}

// Response for update taxable categories
export interface UpdateTaxableCategoriesResponse {
    success: boolean
    message: string
    data?: {
        totalRecords: number
    }
}

// ============================================
// Tax Regions Bindings Types (with VAT rates)
// ============================================

// Region-Category Binding DTO with VAT rate
export interface RegionCategoryBindingDto {
    region_id: number
    region_name: string
    category_id: number
    category_name: string
    vat_rate: number | null // 0-99 or null
}

// Response for fetch tax regions bindings
export interface FetchTaxRegionsResponse {
    success: boolean
    message: string
    data?: {
        regions: Array<{
            region_id: number
            region_name: string
        }>
        categories: Array<{
            category_id: number
            category_name: string
        }>
        bindings: Array<{
            region_id: number
            category_id: number
            vat_rate: number | null
        }>
    }
}

// Request for updating tax regions bindings (for one region)
export interface UpdateTaxRegionsRequest {
    region_id: number
    bindings: Array<{
        category_id: number
        vat_rate: number | null // null means delete binding
    }>
}

// Response for update tax regions bindings
export interface UpdateTaxRegionsResponse {
    success: boolean
    message: string
    data?: {
        totalBindings: number
        created: number
        updated: number
        deleted: number
    }
}

// ============================================
// Currency Types
// ============================================

// Currency DTO aligned with frontend Currency type
export interface CurrencyDto {
    code: string
    name: string
    symbol: string | null
    active: boolean
    rounding_precision: number
}

// Update payload types
export interface UpdateCurrenciesPayload {
    created?: CurrencyDto[]
    updated?: Array<Partial<CurrencyDto> & { code: string }>
    deleted?: string[] // codes
}

export interface UpdateCurrenciesResult {
    created: number
    updated: number
    deleted: number
}

// ============================================
// Price List Types
// ============================================

// Price list item for list view (with owner info)
export interface PriceListSummaryDto {
    price_list_id: number
    name: string
    description: string | null
    currency_code: string
    is_active: boolean
    owner_id: string | null // UUID
    owner_username: string | null
    region: string | null
    created_at: string // ISO timestamp
    updated_at: string // ISO timestamp
}

// Full price list data (for single fetch/edit)
export interface PriceListFullDto {
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

// Request parameters for fetching all price lists
export interface FetchAllPriceListsParams {
    page: number
    itemsPerPage: number
    searchQuery?: string
    sortBy?: string
    sortDesc?: boolean
    statusFilter?: 'all' | 'active' | 'disabled'
    currencyFilter?: string // currency code or 'all'
}

// Response for fetch all price lists
export interface FetchAllPriceListsResult {
    success: boolean
    message?: string
    data?: {
        priceLists: PriceListSummaryDto[]
        pagination: {
            currentPage: number
            itemsPerPage: number
            totalItems: number
            totalPages: number
        }
    }
}

// Request for creating a price list
export interface CreatePriceListRequest {
    name: string
    description?: string
    currency_code: string
    is_active?: boolean
    owner?: string // username (optional)
    region?: string | null
}

// Response for create price list
export interface CreatePriceListResponse {
    success: boolean
    message: string
    data?: {
        priceList: PriceListFullDto
    }
}

// Request for updating a price list
export interface UpdatePriceListRequest {
    price_list_id: number
    name?: string
    description?: string
    currency_code?: string
    is_active?: boolean
    owner?: string // username (optional)
    region?: string | null
}

// Response for update price list
export interface UpdatePriceListResponse {
    success: boolean
    message: string
    data?: {
        priceList: PriceListFullDto
    }
}

// Request for deleting price lists
export interface DeletePriceListsRequest {
    priceListIds: number[]
}

// Response for delete price lists
export interface DeletePriceListsResponse {
    success: boolean
    message: string
    data?: {
        totalDeleted: number
        totalErrors: number
    }
}

// Fetch single price list response
export interface FetchPriceListResponse {
    success: boolean
    message?: string
    data?: {
        priceList: PriceListFullDto
        items: PriceListItemDto[]
        rounding_precision?: number | null
    }
}

// ============================================
// Price List Item Types
// ============================================

// Price item type DTO
export interface PriceItemTypeDto {
    type_code: string
    type_name: string
    description: string | null
    is_active: boolean
    created_at: string
    updated_at: string
}

// Price list item DTO
export interface PriceListItemDto {
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

// Request for creating a price list item
export interface CreatePriceListItemRequest {
    item_type: string
    item_code: string
    item_name: string
    list_price: number
    wholesale_price?: number | null
}

// Response for create price list item
export interface CreatePriceListItemResponse {
    success: boolean
    message: string
    data?: {
        item: PriceListItemDto
    }
}

// Response for fetch price item types
export interface FetchPriceItemTypesResponse {
    success: boolean
    message?: string
    data?: {
        types: PriceItemTypeDto[]
    }
}

// ============================================
// Price List Items - Delete Types
// ============================================

// Request for deleting price list items
export interface DeletePriceListItemsRequest {
    itemCodes: string[]
}

// Response for delete price list items
export interface DeletePriceListItemsResponse {
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

// Request for updating price list items
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

// Response for update price list items
export interface UpdatePriceListItemsResponse {
    success: boolean
    message: string
    data?: {
        totalUpdated: number
        totalErrors: number
        updatedItems: string[]
        errorItems: string[]
    }
}


