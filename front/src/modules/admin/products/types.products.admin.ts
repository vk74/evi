/**
 * @file types.products.admin.ts
 * Version: 1.0.0
 * Type definitions for products administration module.
 * Frontend file that defines TypeScript types and interfaces for products admin functionality.
 */

export type ProductSectionId = 
  | 'products-list'
  | 'product-editor'
  | 'settings'

export interface Section {
  id: ProductSectionId
  title: string
  icon: string
  visible?: boolean
}

export interface ProductsAdminState {
  activeSection: ProductSectionId
}
