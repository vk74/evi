/**
 * @file types.products.admin.ts
 * Version: 1.1.0
 * Type definitions for products administration module.
 * Frontend file that defines TypeScript types and interfaces for products admin functionality.
 */

export type ProductSectionId = 
  | 'products-list'
  | 'product-editor'
  | 'settings'

export type ProductEditorSectionId = 
  | 'details'
  | 'options'
  | 'preferences'
  | 'catalog publication'

export type ProductEditorMode = 'creation' | 'edit'

export interface Section {
  id: ProductSectionId
  title: string
  icon: string
  visible?: boolean
}

export interface ProductTranslation {
  name: string
  shortDesc: string
  longDesc: string
  techSpecs: Record<string, any>
  areaSpecifics: Record<string, any>
  industrySpecifics: Record<string, any>
  keyFeatures: Record<string, any>
  productOverview: Record<string, any>
}

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

export interface ProductFormData {
  productCode: string
  translationKey: string
  canBeOption: boolean
  optionOnly: boolean
  isPublished: boolean
  owner: string
  specialistsGroups: string[]
  translations: {
    en: ProductTranslation
    ru: ProductTranslation
  }
  visibility: ProductVisibility
}

export interface Product {
  productId: string
  productCode: string
  translationKey: string
  canBeOption: boolean
  optionOnly: boolean
  isPublished: boolean
  ownerId: string
  ownerName: string
  specialistsGroups: Array<{
    groupId: string
    groupName: string
  }>
  translations: {
    en: ProductTranslation
    ru: ProductTranslation
  }
  visibility: ProductVisibility
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
}

export interface ProductsAdminState {
  activeSection: ProductSectionId
  activeEditorSection: ProductEditorSectionId
  editorMode: ProductEditorMode
  editingProductId: string | null
  editingProductData: Product | null
  formData: ProductFormData
}
