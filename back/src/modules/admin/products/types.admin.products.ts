/**
 * types.admin.products.ts - version 1.3.1
 * Type definitions for products administration module.
 * 
 * Contains TypeScript interfaces and types for products admin functionality.
 * 
 * Backend file - types.admin.products.ts
  
  Changes in v1.2.0:
  - Removed catalog publication related interfaces: CatalogSection, FetchPublishingSectionsResponse, UpdateProductSectionsPublishRequest, UpdateProductSectionsPublishResponse
  
  Changes in v1.0.5:
  - Added status_code field to Product interface
  - Added statusCode field to CreateProductRequest and UpdateProductRequest
  - Added ProductStatus interface for status reference data
  - Updated FetchProductResponse to include statuses array
  
  Changes in v1.0.6:
  - Added statusFilter field to FetchAllProductsParams interface
  - Added status_code field to ProductListItem interface
  
  Changes in v1.0.7:
  - Updated ProductStatus interface to contain only status_code field (removed description, is_active, display_order)
  - Statuses now fetched from app.product_status UDT enum instead of product_statuses table
  
  Changes in v1.1.0:
  - Removed ProductType enum (no longer needed)
  - Removed canBeOption and optionOnly from CreateProductRequest interface
  - Removed can_be_option and option_only from Product interface
  - Removed canBeOption and optionOnly from UpdateProductRequest interface
  - Removed can_be_option and option_only from ProductListItem interface
  - Removed typeFilter from FetchAllProductsParams interface
  - All products are now equal, no type distinction
  
  Changes in v1.3.0:
  - Removed backupOwner from CreateProductRequest, UpdateProductRequest, ProductWithFullData, UpdateProductResponse
  - Removed JSONB fields (areaSpecifics, industrySpecifics, keyFeatures, productOverview) from ProductTranslationData and ProductTranslation
  - Removed visibility flags (is_visible_area_specs, is_visible_industry_specs, is_visible_key_features, is_visible_overview) from Product, ProductListItem, UpdateProductRequest
  
  Changes in v1.3.1:
  - Added AssignProductOwnerRequest and AssignProductOwnerResponse interfaces
 */

// Language code enum
export enum LanguageCode {
    ENGLISH = 'en',
    RUSSIAN = 'ru'
}

// Product status interface for reference data
export interface ProductStatus {
    status_code: string
}

// Product translation data interface
export interface ProductTranslationData {
    name: string
    shortDesc: string
    longDesc?: string
    techSpecs?: Record<string, any>
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
    owner: string
    specialistsGroups: string[]
    translations: ProductTranslations
    statusCode?: string
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
    status_code: string
    is_published: boolean
    is_visible_owner: boolean
    is_visible_groups: boolean
    is_visible_tech_specs: boolean
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
    created_by: string
    created_at: Date
    updated_by?: string
    updated_at: Date
}

// Product list item interface (for future use)
// ProductListItem interface moved to line 216 to avoid duplication

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
        specialistsGroups: string[]
        statuses?: ProductStatus[]
    }
}

// Product with full data interface (for editor)
export interface ProductWithFullData extends Product {
    translations: ProductTranslations
    owner?: string
    specialistsGroups: string[]
}

// Update product request interface
export interface UpdateProductRequest {
    productId: string
    productCode?: string
    translationKey?: string
    owner?: string
    specialistsGroups?: string[]
    translations?: ProductTranslations
    statusCode?: string
    visibility?: {
        isVisibleOwner?: boolean
        isVisibleGroups?: boolean
        isVisibleTechSpecs?: boolean
        isVisibleLongDescription?: boolean
    }
}

// Update product response interface
export interface UpdateProductResponse extends ApiResponse {
    data?: {
        product: Product
        translations: ProductTranslation[]
        owner?: string
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
    publishedFilter?: string
    statusFilter?: string
}

// Product list item interface (for list view)
export interface ProductListItem {
    product_id: string
    product_code: string
    translation_key: string
    status_code: string
    is_published: boolean
    is_visible_owner: boolean
    is_visible_groups: boolean
    is_visible_tech_specs: boolean
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

// Assign product owner request interface
export interface AssignProductOwnerRequest {
    productIds: string[]
    newOwnerUsername: string
}

// Assign product owner response interface
export interface AssignProductOwnerResponse extends ApiResponse {
    data?: {
        updatedProducts: Array<{id: string, product_code: string}>
        errors: Array<{id: string, error: string}>
        totalRequested: number
        totalUpdated: number
        totalErrors: number
    }
}

// Product region interface (for database operations)
export interface ProductRegion {
    region_id: number
    region_name: string
    category_id: number | null
    category_name: string | null
}

// Fetch product regions response interface
export interface FetchProductRegionsResponse extends ApiResponse {
    data?: ProductRegion[]
}

// Update product regions request interface
export interface UpdateProductRegionsRequest {
    regions: Array<{
        region_id: number
        category_id: number | null
    }>
}

// Update product regions response interface
export interface UpdateProductRegionsResponse extends ApiResponse {
    data?: {
        totalRecords: number
    }
}

