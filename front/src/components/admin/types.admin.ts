/**
 * types.admin.ts
 * Типы для основного модуля администрирования
 */

export type SubModuleId = 
  | 'SubModuleServiceAdmin'
  | 'SubModuleCatalogAdmin' 
  | 'SubModuleUsersAdmin'
  | 'SubModuleAppAdmin'

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