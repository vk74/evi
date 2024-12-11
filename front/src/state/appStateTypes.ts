/**
 * @file appStateTypes.ts
 * 
 * Типы для основного хранилища состояния приложения.
 * Используется совместно с appstate.js
 */

/** Доступные модули приложения */
export type AvailableModule = 
  | 'Catalog'
  | 'Work'
  | 'AR'
  | 'Admin'
  | 'XLS'
  | 'Account'
  | 'Settings'
  | 'Help'
  | 'Login'
  | 'NewUserRegistration';

/** Режимы отображения бокового меню */
export type DrawerMode = 'auto' | 'opened' | 'closed';

/** Состояние хранилища */
export interface AppState {
  activeModule: AvailableModule;
  previousModule: AvailableModule | null;
  drawerMode: DrawerMode;
  availableModules: AvailableModule[];
}

/** Геттеры хранилища */
export interface AppGetters {
  getCurrentModule: () => AvailableModule;
  isModuleActive: (moduleName: AvailableModule) => boolean;
}

/** Методы хранилища */
export interface AppActions {
  setActiveModule: (moduleName: AvailableModule) => void;
  returnToPreviousModule: () => void;
  setDrawerMode: (mode: DrawerMode) => void;
  resetState: () => void;
}