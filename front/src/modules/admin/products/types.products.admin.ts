/**
 * @file types.products.admin.ts
 * Type definitions for products administration module.
 * Version: 1.3.0
 * Frontend types for products admin functionality.
  
  Changes in v1.2.0:
  - Removed catalog publication related interfaces: CatalogSection, FetchPublishingSectionsResponse, UpdateProductSectionsPublishRequest, UpdateProductSectionsPublishResponse, ProductCatalogPublicationState
  - Removed 'catalog publication' from ProductEditorSectionId type
  
  Changes in v1.0.5:
  - Added status_code field to Product interface
  - Added statusCode field to ProductFormData, CreateProductRequest, and UpdateProductRequest
  - Added ProductStatus interface for status reference data
  - Updated FetchProductResponse and ProductWithFullData to include status_code
  
  Changes in v1.0.6:
  - Added status_code field to ProductListItem interface
  - Added statusFilter field to FetchAllProductsParams interface
  
  Changes in v1.0.7:
  - Updated ProductStatus interface to contain only status_code field (removed description, is_active, display_order)
  - Statuses now fetched from app.product_status UDT enum instead of product_statuses table
  
  Changes in v1.1.0:
  - Removed canBeOption and optionOnly from ProductFormData, CreateProductRequest, UpdateProductRequest interfaces
  - Removed can_be_option and option_only from Product and ProductListItem interfaces
  - Removed typeFilter from FetchAllProductsParams interface
  - All products are now equal, no type distinction
  
  Changes in v1.3.0:
  - Removed backupOwner from ProductFormData, CreateProductRequest, UpdateProductRequest, ProductWithFullData, FetchProductResponse, UpdateProductResponse
  - Removed JSONB fields (areaSpecifics, industrySpecifics, keyFeatures, productOverview) from ProductTranslationData and ProductTranslation
  - Removed visibility flags (isVisibleAreaSpecs, isVisibleIndustrySpecs, isVisibleKeyFeatures, isVisibleOverview) from ProductVisibility, Product, ProductListItem, UpdateProductRequest
 */

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

// Product visibility settings interface
export interface ProductVisibility {
  isVisibleOwner: boolean
  isVisibleGroups: boolean
  isVisibleTechSpecs: boolean
  isVisibleLongDescription: boolean
}

// Product form data interface
export interface ProductFormData {
  productCode: string
  translationKey: string
  owner: string
  specialistsGroups: string[]
  translations: ProductTranslations
  visibility: ProductVisibility
  statusCode?: string
}

// Create product request interface
export interface CreateProductRequest {
  productCode: string
  translationKey: string
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


// Product status interface for reference data
export interface ProductStatus {
  status_code: string
}

// Product interface for list view
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
  created_at: Date
  created_by: string
  updated_at?: Date
  updated_by?: string
}

// Product with translations interface
export interface ProductWithTranslations extends Product {
  translations: ProductTranslations
}

// API error interface
export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
}

// Product editor mode
export type ProductEditorMode = 'creation' | 'edit'

// Product editor sections
export type ProductEditorSectionId = 'details' | 'options' | 'preferences'

// Product admin sections
export type ProductSectionId = 'products-list' | 'product-editor'

// Products admin state interface
export interface ProductsAdminState {
  activeSection: ProductSectionId
  activeEditorSection: ProductEditorSectionId
  editorMode: ProductEditorMode
  editingProductId: string | null
  editingProductData: ProductWithFullData | null
  formData: ProductFormData
}

// Fetch products query interface
export interface FetchProductsQuery {
  page?: string
  itemsPerPage?: string
  searchQuery?: string
  sortBy?: string
  sortDesc?: string
}

// Fetch products response interface
export interface FetchProductsResponse {
  success: boolean
  message: string
  data?: {
    products: Product[]
    pagination: {
      totalItems: number
      totalPages: number
      currentPage: number
      itemsPerPage: number
    }
  }
}

// Fetch single product response interface
export interface FetchProductResponse {
  success: boolean
  message: string
  data?: {
    product: Product
    translations: ProductTranslation[]
    owner?: string
    specialistsGroups: string[]
    statuses?: ProductStatus[]
  }
}

// Product translation interface for API responses
export interface ProductTranslation {
  translation_id: string
  product_id: string
  language_code: string
  name: string
  short_desc: string
  long_desc?: string
  tech_specs?: Record<string, any>
  created_by: string
  created_at: Date
  updated_by?: string
  updated_at: Date
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
export interface UpdateProductResponse {
  success: boolean
  message: string
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
export interface DeleteProductsResponse {
  success: boolean
  message: string
  data?: {
    deletedProducts: Array<{id: string, product_code: string}>
    errors: Array<{id: string, error: string}>
    totalRequested: number
    totalDeleted: number
    totalErrors: number
  }
}

// Delete products result interface
export interface DeleteProductsResult {
  success: boolean
  message: string
  data?: {
    deletedProducts: Array<{id: string, product_code: string}>
    errors: Array<{id: string, error: string}>
    totalRequested: number
    totalDeleted: number
    totalErrors: number
  }
}
