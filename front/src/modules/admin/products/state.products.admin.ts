/**
 * @file state.products.admin.ts
 * Version: 1.5.0
 * Pinia store for managing products admin module state.
 * Frontend file that handles active section management for products administration.
 *
 * Changes in v1.2.0:
 * - Added originalProductData to track initial product state for change detection
 * - Added getChangedFields getter to return only changed fields
 * - Added hasChanges getter to determine if form has unsaved changes
 * - Added setOriginalProductData and updateOriginalProductData actions
 * 
 * Changes in v1.3.0:
 * - Added statusCode field to formData
 * - Added statuses array to store product statuses from API
 * - Added setProductStatuses action to update statuses
 * - Updated getChangedFields to track statusCode changes
 * 
 * Changes in v1.4.0:
 * - Added statusesLastFetched timestamp for cache management
 * - Added STATUS_CACHE_DURATION constant (10 minutes)
 * - Added areStatusesFresh() getter to check cache validity
 * - Updated setProductStatuses to set timestamp
 * - Added clearStatuses() action to invalidate cache
 * 
 * Changes in v1.5.0:
 * - Removed caching logic for product statuses
 * - Removed STATUS_CACHE_DURATION constant
 * - Removed statusesLastFetched from state
 * - Removed areStatusesFresh() getter
 * - Updated setProductStatuses to not set timestamp
 * - Simplified clearStatuses() to only clear statuses array
 */
import { defineStore } from 'pinia'
import type {
  ProductsAdminState,
  ProductSectionId,
  ProductEditorSectionId,
  ProductEditorMode,
  ProductFormData,
  Product,
  ProductWithFullData,
  UpdateProductRequest,
  ProductStatus
} from './types.products.admin'

export const useProductsAdminStore = defineStore('productsAdmin', {
  state: (): ProductsAdminState & { 
    originalProductData: ProductWithFullData | null
    statuses: ProductStatus[] | null
  } => ({
    activeSection: 'products-list',
    activeEditorSection: 'details',
    editorMode: 'creation',
    editingProductId: null,
    editingProductData: null,
    originalProductData: null,
    statuses: null,
    formData: {
      productCode: '',
      translationKey: '',
      statusCode: '',
      canBeOption: false,
      optionOnly: false,
      owner: '',
      specialistsGroups: [],
      translations: {
        en: {
          name: '',
          shortDesc: '',
          longDesc: '',
          techSpecs: {},
          areaSpecifics: {},
          industrySpecifics: {},
          keyFeatures: {},
          productOverview: {}
        },
        ru: {
          name: '',
          shortDesc: '',
          longDesc: '',
          techSpecs: {},
          areaSpecifics: {},
          industrySpecifics: {},
          keyFeatures: {},
          productOverview: {}
        }
      },
      visibility: {
        isVisibleOwner: false,
        isVisibleGroups: false,
        isVisibleTechSpecs: false,
        isVisibleAreaSpecs: false,
        isVisibleIndustrySpecs: false,
        isVisibleKeyFeatures: false,
        isVisibleOverview: false,
        isVisibleLongDescription: false
      }
    }
  }),

  getters: {
    getCurrentSection: (state): ProductSectionId => state.activeSection,

    /**
     * Gets changed fields by comparing formData with originalProductData
     * Returns only fields that have actually changed (without productId)
     */
    getChangedFields(): Omit<UpdateProductRequest, 'productId'> {
      if (!this.originalProductData || this.editorMode !== 'edit') {
        return {}
      }

      const changes: Omit<UpdateProductRequest, 'productId'> = {}
      const current = this.formData
      const original = this.originalProductData

      // Compare basic fields
      if (current.productCode !== original.product_code) {
        changes.productCode = current.productCode
      }
      if (current.translationKey !== original.translation_key) {
        changes.translationKey = current.translationKey
      }
      if (current.statusCode !== (original.status_code || '')) {
        changes.statusCode = current.statusCode
      }
      if (current.canBeOption !== original.can_be_option) {
        changes.canBeOption = current.canBeOption
      }
      if (current.optionOnly !== original.option_only) {
        changes.optionOnly = current.optionOnly
      }
      if (current.owner !== (original.owner || '')) {
        changes.owner = current.owner
      }
      if (current.backupOwner !== (original.backupOwner || '')) {
        changes.backupOwner = current.backupOwner
      }

      // Compare specialistsGroups arrays
      const currentGroups = current.specialistsGroups || []
      const originalGroups = original.specialistsGroups || []
      if (JSON.stringify(currentGroups.sort()) !== JSON.stringify(originalGroups.sort())) {
        changes.specialistsGroups = currentGroups
      }

      // Compare translations (deep comparison)
      const currentTranslations = current.translations || {}
      const originalTranslations = original.translations || {}
      if (JSON.stringify(currentTranslations) !== JSON.stringify(originalTranslations)) {
        changes.translations = currentTranslations
      }

      // Compare visibility object
      const currentVisibility = current.visibility
      const originalVisibility = {
        isVisibleOwner: original.is_visible_owner,
        isVisibleGroups: original.is_visible_groups,
        isVisibleTechSpecs: original.is_visible_tech_specs,
        isVisibleAreaSpecs: original.is_visible_area_specs,
        isVisibleIndustrySpecs: original.is_visible_industry_specs,
        isVisibleKeyFeatures: original.is_visible_key_features,
        isVisibleOverview: original.is_visible_overview,
        isVisibleLongDescription: original.is_visible_long_description
      }

      if (JSON.stringify(currentVisibility) !== JSON.stringify(originalVisibility)) {
        changes.visibility = currentVisibility
      }

      return changes
    },

    /**
     * Checks if there are any unsaved changes
     */
    hasChanges(): boolean {
      if (!this.originalProductData || this.editorMode !== 'edit') {
        return false
      }
      
      const changes = this.getChangedFields
      return Object.keys(changes).length > 0
    }
  },

  actions: {
    setActiveSection(section: ProductSectionId): void {
      this.activeSection = section
    },

    setActiveEditorSection(section: ProductEditorSectionId): void {
      this.activeEditorSection = section
    },

    openProductEditor(mode: ProductEditorMode, productId?: string, productData?: ProductWithFullData): void {
      this.editorMode = mode
      this.editingProductId = productId || null
      this.editingProductData = productData || null
      
      if (mode === 'creation') {
        this.resetFormData()
        this.originalProductData = null
      } else if (productData) {
        this.populateFormWithFullProductData(productData)
        this.setOriginalProductData(productData)
      }
    },

    closeProductEditor(): void {
      this.editorMode = 'creation'
      this.editingProductId = null
      this.editingProductData = null
      this.originalProductData = null
      this.activeEditorSection = 'details'
      this.resetFormData()
    },

    resetFormData(): void {
      this.formData = {
        productCode: '',
        translationKey: '',
        statusCode: '',
        canBeOption: false,
        optionOnly: false,
        owner: '',
        specialistsGroups: [],
        translations: {
          en: {
            name: '',
            shortDesc: '',
            longDesc: '',
            techSpecs: {},
            areaSpecifics: {},
            industrySpecifics: {},
            keyFeatures: {},
            productOverview: {}
          },
          ru: {
            name: '',
            shortDesc: '',
            longDesc: '',
            techSpecs: {},
            areaSpecifics: {},
            industrySpecifics: {},
            keyFeatures: {},
            productOverview: {}
          }
        },
        visibility: {
          isVisibleOwner: false,
          isVisibleGroups: false,
          isVisibleTechSpecs: false,
          isVisibleAreaSpecs: false,
          isVisibleIndustrySpecs: false,
          isVisibleKeyFeatures: false,
          isVisibleOverview: false,
          isVisibleLongDescription: false
        }
      }
    },

    populateFormWithProduct(product: ProductWithFullData): void {
      this.formData = {
        productCode: product.product_code,
        translationKey: product.translation_key,
        statusCode: product.status_code || '',
        canBeOption: product.can_be_option,
        optionOnly: product.option_only,
        owner: product.owner || '',
        backupOwner: product.backupOwner || '',
        specialistsGroups: product.specialistsGroups || [],
        translations: product.translations || {
          en: { name: '', shortDesc: '', longDesc: '', techSpecs: {}, areaSpecifics: {}, industrySpecifics: {}, keyFeatures: {}, productOverview: {} },
          ru: { name: '', shortDesc: '', longDesc: '', techSpecs: {}, areaSpecifics: {}, industrySpecifics: {}, keyFeatures: {}, productOverview: {} }
        },
        visibility: {
          isVisibleOwner: product.is_visible_owner,
          isVisibleGroups: product.is_visible_groups,
          isVisibleTechSpecs: product.is_visible_tech_specs,
          isVisibleAreaSpecs: product.is_visible_area_specs,
          isVisibleIndustrySpecs: product.is_visible_industry_specs,
          isVisibleKeyFeatures: product.is_visible_key_features,
          isVisibleOverview: product.is_visible_overview,
          isVisibleLongDescription: product.is_visible_long_description
        }
      }
    },

    /**
     * Populates form with full product data including translations and relationships
     */
    populateFormWithFullProductData(productData: ProductWithFullData): void {
      // Ensure translations have proper structure
      const defaultTranslations = {
        en: { name: '', shortDesc: '', longDesc: '', techSpecs: {}, areaSpecifics: {}, industrySpecifics: {}, keyFeatures: {}, productOverview: {} },
        ru: { name: '', shortDesc: '', longDesc: '', techSpecs: {}, areaSpecifics: {}, industrySpecifics: {}, keyFeatures: {}, productOverview: {} }
      }
      
      const translations = productData.translations || defaultTranslations
      
      // Ensure each language has all required fields
      const safeTranslations = {
        en: { ...defaultTranslations.en, ...translations.en },
        ru: { ...defaultTranslations.ru, ...translations.ru }
      }
      
      this.formData = {
        productCode: productData.product_code,
        translationKey: productData.translation_key,
        statusCode: productData.status_code || '',
        canBeOption: productData.can_be_option,
        optionOnly: productData.option_only,
        owner: productData.owner || '',
        backupOwner: productData.backupOwner || '',
        specialistsGroups: productData.specialistsGroups || [],
        translations: safeTranslations,
        visibility: {
          isVisibleOwner: productData.is_visible_owner,
          isVisibleGroups: productData.is_visible_groups,
          isVisibleTechSpecs: productData.is_visible_tech_specs,
          isVisibleAreaSpecs: productData.is_visible_area_specs,
          isVisibleIndustrySpecs: productData.is_visible_industry_specs,
          isVisibleKeyFeatures: productData.is_visible_key_features,
          isVisibleOverview: productData.is_visible_overview,
          isVisibleLongDescription: productData.is_visible_long_description
        }
      }
    },

    /**
     * Sets original product data for change tracking
     */
    setOriginalProductData(productData: ProductWithFullData): void {
      this.originalProductData = { ...productData }
    },

    /**
     * Updates original product data after successful update
     * This resets the hasChanges state by syncing originalProductData with current data
     */
    updateOriginalProductData(): void {
      if (this.editingProductData) {
        this.originalProductData = { ...this.editingProductData }
      }
    },

    /**
     * Sets editing product data
     */
    setEditingProductData(productData: ProductWithFullData): void {
      this.editingProductData = productData
      this.populateFormWithFullProductData(productData)
      // Set original data for change tracking when in edit mode
      if (this.editorMode === 'edit') {
        this.setOriginalProductData(productData)
      }
    },

    /**
     * Opens product editor in edit mode with product ID
     */
    openProductEditorForEdit(productId: string): void {
      this.editorMode = 'edit'
      this.editingProductId = productId
      this.activeSection = 'product-editor'
      this.activeEditorSection = 'details'
    },

    /**
     * Checks if product data needs to be loaded
     */
    needsProductDataLoad(productId: string): boolean {
      return !this.editingProductData || this.editingProductData.product_id !== productId
    },

    /**
     * Gets current product data if available
     */
    getCurrentProductData(): ProductWithFullData | null {
      return this.editingProductData
    },

    /**
     * Clears product data (useful for cache invalidation)
     */
    clearProductData(): void {
      this.editingProductData = null
    },

    /**
     * Forces reload of product data by clearing cache
     */
    invalidateProductData(): void {
      this.clearProductData()
    },

    /**
     * Sets product statuses array from API response
     */
    setProductStatuses(statuses: ProductStatus[]): void {
      this.statuses = statuses
    },

    /**
     * Clears product statuses array
     */
    clearStatuses(): void {
      this.statuses = null
    },

    resetState(): void {
      this.activeSection = 'products-list'
      this.activeEditorSection = 'details'
      this.editorMode = 'creation'
      this.editingProductId = null
      this.editingProductData = null
      this.originalProductData = null
      this.statuses = null
      this.resetFormData()
    },

    /**
     * Updates product data from form
     */
    async updateProductFromForm(): Promise<boolean> {
      if (!this.editingProductId) {
        return false
      }

      try {
        const { serviceUpdateProduct } = await import('./service.update.product')
        const result = await serviceUpdateProduct.updateProductFromForm()
        return result !== null
      } catch (error) {
        console.error('Error updating product from form:', error)
        return false
      }
    },

    /**
     * Checks if form has unsaved changes
     */
    hasUnsavedChanges(): boolean {
      if (!this.editingProductData) {
        return false
      }

      // Compare current form data with stored product data
      const current = this.formData
      const stored = this.editingProductData

      return (
        current.productCode !== stored.product_code ||
        current.translationKey !== stored.translation_key ||
        current.statusCode !== (stored.status_code || '') ||
        current.canBeOption !== stored.can_be_option ||
        current.optionOnly !== stored.option_only ||
        current.owner !== (stored.owner || '') ||
        current.backupOwner !== (stored.backupOwner || '') ||
        JSON.stringify(current.specialistsGroups) !== JSON.stringify(stored.specialistsGroups || []) ||
        JSON.stringify(current.translations) !== JSON.stringify(stored.translations || {}) ||
        JSON.stringify(current.visibility) !== JSON.stringify({
          isVisibleOwner: stored.is_visible_owner,
          isVisibleGroups: stored.is_visible_groups,
          isVisibleTechSpecs: stored.is_visible_tech_specs,
          isVisibleAreaSpecs: stored.is_visible_area_specs,
          isVisibleIndustrySpecs: stored.is_visible_industry_specs,
          isVisibleKeyFeatures: stored.is_visible_key_features,
          isVisibleOverview: stored.is_visible_overview,
          isVisibleLongDescription: stored.is_visible_long_description
        })
      )
    },

    /**
     * Resets form to match stored product data
     */
    resetFormToStoredData(): void {
      if (this.editingProductData) {
        this.populateFormWithFullProductData(this.editingProductData)
      }
    }
  },

  persist: true
})
