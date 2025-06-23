/**
 * types.catalog.admin.ts
 * Типы для модуля управления каталогом
 */

export type CatalogSectionId = 'settings' | 'visualization' | 'access'

export interface CatalogAdminState {
  activeSection: CatalogSectionId
}

export interface Section {
  id: CatalogSectionId
  title: string
  icon: string
}