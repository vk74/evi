/**
 * version: 1.4.0
 * Backend types for pricing administration module.
 * Defines DTOs for currencies, price lists and other pricing-related entities.
 * File: types.admin.pricing.ts (backend)
 */

// ============================================
// Currency Types
// ============================================

// Currency DTO aligned with frontend Currency type
export interface CurrencyDto {
    code: string
    name: string
    symbol: string | null
    active: boolean
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
    statusFilter?: 'all' | 'active' | 'inactive'
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


