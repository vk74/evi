/**
 * @file state.products.admin.ts
 * Version: 1.1.0
 * Pinia store for managing products admin module state.
 * Frontend file that handles active section management for products administration.
 */
import { defineStore } from 'pinia'
import type {
  ProductsAdminState,
  ProductSectionId,
  ProductEditorSectionId,
  ProductEditorMode,
  ProductFormData,
  Product,
  ProductWithFullData
} from './types.products.admin'

export const useProductsAdminStore = defineStore('productsAdmin', {
  state: (): ProductsAdminState => ({
    activeSection: 'products-list',
    activeEditorSection: 'details',
    editorMode: 'creation',
    editingProductId: null,
    editingProductData: null,
    formData: {
      productCode: '',
      translationKey: '',
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
    getCurrentSection: (state): ProductSectionId => state.activeSection
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
      } else if (productData) {
        this.populateFormWithFullProductData(productData)
      }
    },

    closeProductEditor(): void {
      this.editorMode = 'creation'
      this.editingProductId = null
      this.editingProductData = null
      this.activeEditorSection = 'details'
      this.resetFormData()
    },

    resetFormData(): void {
      this.formData = {
        productCode: '',
        translationKey: '',
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
     * Sets editing product data
     */
    setEditingProductData(productData: ProductWithFullData): void {
      this.editingProductData = productData
      this.populateFormWithFullProductData(productData)
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

    resetState(): void {
      this.activeSection = 'products-list'
      this.activeEditorSection = 'details'
      this.editorMode = 'creation'
      this.editingProductId = null
      this.editingProductData = null
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
