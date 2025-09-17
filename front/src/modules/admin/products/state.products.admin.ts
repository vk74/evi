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

    openProductEditor(mode: ProductEditorMode, productId?: string, productData?: Product): void {
      this.editorMode = mode
      this.editingProductId = productId || null
      this.editingProductData = productData || null
      
      if (mode === 'creation') {
        this.resetFormData()
      } else if (productData) {
        this.populateFormWithProduct(productData)
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

    populateFormWithProduct(product: Product): void {
      this.formData = {
        productCode: product.product_code,
        translationKey: product.translation_key,
        canBeOption: product.can_be_option,
        optionOnly: product.option_only,
        owner: '', // Will be populated from separate API call
        specialistsGroups: [], // Will be populated from separate API call
        translations: { 
          en: { name: '', shortDesc: '' }, 
          ru: { name: '', shortDesc: '' } 
        }, // Will be populated from separate API call
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
      this.formData = {
        productCode: productData.product_code,
        translationKey: productData.translation_key,
        canBeOption: productData.can_be_option,
        optionOnly: productData.option_only,
        owner: productData.owner || '',
        backupOwner: productData.backupOwner || '',
        specialistsGroups: productData.specialistsGroups || [],
        translations: productData.translations || {
          en: { name: '', shortDesc: '', longDesc: '', techSpecs: {}, areaSpecifics: {}, industrySpecifics: {}, keyFeatures: {}, productOverview: {} },
          ru: { name: '', shortDesc: '', longDesc: '', techSpecs: {}, areaSpecifics: {}, industrySpecifics: {}, keyFeatures: {}, productOverview: {} }
        },
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

    resetState(): void {
      this.activeSection = 'products-list'
      this.activeEditorSection = 'details'
      this.editorMode = 'creation'
      this.editingProductId = null
      this.editingProductData = null
      this.resetFormData()
    }
  },

  persist: true
})
