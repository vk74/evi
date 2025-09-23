/**
 * @file types.products.admin.ts
 * Type definitions for products administration module.
 * Version: 1.0.1
 * Frontend types for products admin functionality.
 */

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

// Product visibility settings interface
export interface ProductVisibility {
  isVisibleOwner: boolean
  isVisibleGroups: boolean
  isVisibleTechSpecs: boolean
  isVisibleAreaSpecs: boolean
  isVisibleIndustrySpecs: boolean
  isVisibleKeyFeatures: boolean
  isVisibleOverview: boolean
  isVisibleLongDescription: boolean
}

// Product form data interface
export interface ProductFormData {
  productCode: string
  translationKey: string
  canBeOption: boolean
  optionOnly: boolean
  owner: string
  backupOwner?: string
  specialistsGroups: string[]
  translations: ProductTranslations
  visibility: ProductVisibility
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


// Product interface for list view
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
export type ProductEditorSectionId = 'details' | 'options' | 'preferences' | 'catalog publication'

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
    backupOwner?: string
    specialistsGroups: string[]
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
  area_specifics?: Record<string, any>
  industry_specifics?: Record<string, any>
  key_features?: Record<string, any>
  product_overview?: Record<string, any>
  created_by: string
  created_at: Date
  updated_by?: string
  updated_at: Date
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
export interface UpdateProductResponse {
  success: boolean
  message: string
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

// Catalog section interface for product publication
export interface CatalogSection {
  id: string
  name: string
  owner: string
  status: string
  is_public: boolean
  selected?: boolean // For API responses indicating current selection
}

// Fetch publishing sections request interface
export interface FetchPublishingSectionsRequest {
  productId?: string
  searchQuery?: string
  page?: number
  itemsPerPage?: number
  sortBy?: string
  sortDesc?: boolean
}

// Fetch publishing sections response interface
export interface FetchPublishingSectionsResponse {
  success: boolean
  message: string
  data?: {
    sections: CatalogSection[]
    pagination: {
      totalItems: number
      totalPages: number
      currentPage: number
      itemsPerPage: number
    }
  }
}

// Update product sections publish request interface
export interface UpdateProductSectionsPublishRequest {
  productId: string
  sectionIds: string[]
}

// Update product sections publish response interface
export interface UpdateProductSectionsPublishResponse {
  success: boolean
  message: string
  updatedCount: number
  addedCount: number
  removedCount: number
}


// Product catalog publication state interface
export interface ProductCatalogPublicationState {
  publishingSections: CatalogSection[]
  isPublishingSectionsLoading: boolean
  publishingSectionsError: string | null
  selectedSections: Set<string>
  isPublishing: boolean
  isUnpublishing: boolean
}