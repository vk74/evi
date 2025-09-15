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
  Product
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
      isPublished: false,
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
        isPublished: false,
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
        productCode: product.productCode,
        translationKey: product.translationKey,
        canBeOption: product.canBeOption,
        optionOnly: product.optionOnly,
        isPublished: product.isPublished,
        owner: product.ownerName,
        specialistsGroups: product.specialistsGroups.map(g => g.groupName),
        translations: product.translations,
        visibility: product.visibility
      }
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
