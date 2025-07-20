/**
 * @file types.admin.ts
 * Version: 1.0.0
 * Type definitions for main administration module.
 * Frontend file that defines TypeScript types and interfaces for admin functionality.
 */

export type SubModuleId = 
  | 'SubModuleServiceAdmin'
  | 'SubModuleCatalogAdmin' 
  | 'SubModuleUsersAdmin'
  | 'SubModuleAppSettings'

export type DrawerMode = 'auto' | 'opened' | 'closed'

export interface AdminState {
  activeSubModule: SubModuleId
  drawerMode: DrawerMode
  previousModule: SubModuleId | null
}

/*
export interface AdminStoreActions {
  setActiveSubModule(module: SubModuleId): void
  setDrawerMode(mode: DrawerMode): void
  returnToPreviousModule(): void
  resetAllState(): void
}
  */