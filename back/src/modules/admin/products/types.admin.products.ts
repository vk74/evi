/**
 * types.admin.products.ts - version 1.0.0
 * Type definitions for products administration module.
 * 
 * Contains TypeScript interfaces and types for products admin functionality.
 * 
 * File: types.admin.products.ts
 */

// Product type enum
export enum ProductType {
    PRODUCT = 'product',
    PRODUCT_AND_OPTION = 'product_and_option',
    OPTION = 'option'
}

// Language code enum
export enum LanguageCode {
    ENGLISH = 'en',
    RUSSIAN = 'ru'
}

// Product translation data interface
export interface ProductTranslationData {
    name: string
    shortDesc: string
    longDesc?: string
    techSpecs?: Record<string, any>
    areaSpecifics?: Record<string, any>
    industrySpecifics?: Record<string, any>
    keyFeatures?: Record<string, any>
    productOverview?: Record<string, any>
}

// Product translations interface
export interface ProductTranslations {
    en?: ProductTranslationData
    ru?: ProductTranslationData
}

// Create product request interface
export interface CreateProductRequest {
    productCode: string
    translationKey: string
    canBeOption: boolean
    optionOnly: boolean
    owner: string
    backupOwner?: string
    specialistsGroups: string[]
    translations: ProductTranslations
}

// Create product response interface
export interface CreateProductResponse {
    success: boolean
    message: string
    data?: {
        id: string
        productCode: string
        translationKey: string
    }
}

// Product error interface
export interface ProductError {
    code: string
    message: string
    details?: Record<string, any>
}

// Base API response interface
export interface ApiResponse {
    success: boolean
    message: string
    data?: any
}

// Product interface for database operations
export interface Product {
    product_id: string
    product_code: string
    translation_key: string
    can_be_option: boolean
    option_only: boolean
    is_published: boolean
    is_visible_owner: boolean
    is_visible_groups: boolean
    is_visible_tech_specs: boolean
    is_visible_area_specs: boolean
    is_visible_industry_specs: boolean
    is_visible_key_features: boolean
    is_visible_overview: boolean
    is_visible_long_description: boolean
    created_by: string
    created_at: Date
    updated_by?: string
    updated_at: Date
}

// Product translation interface for database operations
export interface ProductTranslation {
    translation_id: string
    product_id: string
    language_code: LanguageCode
    name: string
    short_desc: string
    long_desc?: string
    tech_specs?: Record<string, any>
    area_specifics?: Record<string, any>
    industry_specifics?: Record<string, any>
    key_features?: Record<string, any>
    product_overview?: Record<string, any>
    created_by: string
    created_at: Date
    updated_by?: string
    updated_at: Date
}

// Product list item interface (for future use)
export interface ProductListItem {
    product_id: string
    product_code: string
    translation_key: string
    can_be_option: boolean
    option_only: boolean
    is_published: boolean
    created_at: Date
    created_by: string
    updated_at?: Date
    updated_by?: string
}

// Fetch products query interface (for future use)
export interface FetchProductsQuery {
    page?: string
    itemsPerPage?: string
    searchQuery?: string
    sortBy?: string
    sortDesc?: string
}

// Fetch products params interface (for future use)
export interface FetchProductsParams {
    page: number
    itemsPerPage: number
    searchQuery?: string
    sortBy: string
    sortDesc: boolean
}

// Fetch single product response interface
export interface FetchProductResponse extends ApiResponse {
    data?: {
        product: Product
        translations: ProductTranslation[]
        owner?: string
        backupOwner?: string
        specialistsGroups: string[]
    }
}

// Product with full data interface (for editor)
export interface ProductWithFullData extends Product {
    translations: ProductTranslations
    owner?: string
    backupOwner?: string
    specialistsGroups: string[]
}

// Update product request interface
export interface UpdateProductRequest {
    productId: string
    productCode?: string
    translationKey?: string
    canBeOption?: boolean
    optionOnly?: boolean
    owner?: string
    backupOwner?: string
    specialistsGroups?: string[]
    translations?: ProductTranslations
    visibility?: {
        isVisibleOwner?: boolean
        isVisibleGroups?: boolean
        isVisibleTechSpecs?: boolean
        isVisibleAreaSpecs?: boolean
        isVisibleIndustrySpecs?: boolean
        isVisibleKeyFeatures?: boolean
        isVisibleOverview?: boolean
        isVisibleLongDescription?: boolean
    }
}

// Update product response interface
export interface UpdateProductResponse extends ApiResponse {
    data?: {
        product: Product
        translations: ProductTranslation[]
        owner?: string
        backupOwner?: string
        specialistsGroups: string[]
    }
}

// Fetch all products parameters interface
export interface FetchAllProductsParams {
    page: number
    itemsPerPage: number
    searchQuery?: string
    sortBy?: string
    sortDesc?: boolean
    typeFilter?: string
    publishedFilter?: string
}

// Product list item interface (for list view)
export interface ProductListItem {
    product_id: string
    product_code: string
    translation_key: string
    can_be_option: boolean
    option_only: boolean
    is_published: boolean
    is_visible_owner: boolean
    is_visible_groups: boolean
    is_visible_tech_specs: boolean
    is_visible_area_specs: boolean
    is_visible_industry_specs: boolean
    is_visible_key_features: boolean
    is_visible_overview: boolean
    is_visible_long_description: boolean
    created_at: Date
    created_by: string
    updated_at?: Date
    updated_by?: string
    // Computed fields
    owner?: string
    specialists_groups?: string[]
    // Translation data for current language
    name?: string
}

// Fetch all products result interface
export interface FetchAllProductsResult {
    success: boolean
    message: string
    data?: {
        products: ProductListItem[]
        pagination: {
            totalItems: number
            totalPages: number
            currentPage: number
            itemsPerPage: number
        }
    }
}

// Delete products request interface
export interface DeleteProductsRequest {
    productIds: string[]
}

// Delete products response interface
export interface DeleteProductsResponse extends ApiResponse {
    data?: {
        deletedProducts: Array<{id: string, product_code: string}>
        errors: Array<{id: string, error: string}>
        totalRequested: number
        totalDeleted: number
        totalErrors: number
    }
}

// Delete products parameters interface
export interface DeleteProductsParams {
    productIds: string[]
}

// Delete products result interface
export interface DeleteProductsResult {
    deletedProducts: Array<{id: string, product_code: string}>
    errors: Array<{id: string, error: string}>
    totalRequested: number
    totalDeleted: number
    totalErrors: number
}
