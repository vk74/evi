/**
 * appstate.ts
 * State store for the main navigation menu of the application.
 * Manages navigation between main modules, drawer display modes,
 * and preserves states between user sessions.
 */
import { defineStore } from 'pinia';

// Type definitions
export type ModuleName = 
  | 'Catalog'
  | 'Work'
  | 'AR'
  | 'Admin'
  | 'XLS'
  | 'Account'
  | 'Settings'
  | 'SessionData'
  | 'KnowledgeBase'
  | 'Login'
  | 'NewUserRegistration';

export type AdminSubModule = 
  | 'catalogAdmin'
  | 'serviceAdmin'
  | 'usersAdmin'
  | 'appAdmin';

export type DrawerMode = 'auto' | 'opened' | 'closed';

// Interface for the store state
interface AppState {
  activeModule: ModuleName;
  previousModule: ModuleName | null;
  drawerMode: DrawerMode;
  availableModules: ModuleName[];
  activeAdminSubModule: AdminSubModule;
}

// Guaranteed initialization of the list of all available modules
const DEFAULT_MODULES: ModuleName[] = [
  'Catalog',
  'Work',
  'AR',
  'Admin',
  'XLS',
  'Account',
  'Settings',
  'SessionData',
  'KnowledgeBase',
  'Login',
  'NewUserRegistration'
];

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    activeModule: 'Login', // Default active module
    previousModule: null, // Previous active module
    drawerMode: 'closed', // Modes: 'auto', 'opened', 'closed'
    // List of all available modules for validation
    availableModules: DEFAULT_MODULES,
    // Default admin sub-module is app settings
    activeAdminSubModule: 'appAdmin'
  }),

  getters: {
    /**
     * Get the current active module
     * @returns The name of the active module
     */
    getCurrentModule: (state): ModuleName => state.activeModule,

    /**
     * Check if a module is active
     * @param moduleName - The name of the module to check
     * @returns true if the module is active
     */
    isModuleActive: (state) => (moduleName: ModuleName): boolean => {
      return state.activeModule === moduleName;
    },

    /**
     * Get the current active admin sub-module
     * @returns The name of the active admin sub-module
     */
    getActiveAdminSubModule: (state): AdminSubModule => state.activeAdminSubModule
  },

  actions: {
    /**
     * Set the active module with saving the previous state
     * @param moduleName - The name of the module to activate
     */
    setActiveModule(moduleName: ModuleName): void {
      if (this.availableModules.includes(moduleName) && this.activeModule !== moduleName) {
        this.previousModule = this.activeModule;
        this.activeModule = moduleName;
      }
    },

    /**
     * Return to the previously active module
     */
    returnToPreviousModule(): void {
      if (this.previousModule) {
        const temp = this.activeModule;
        this.activeModule = this.previousModule;
        this.previousModule = temp;
      }
    },

    /**
     * Set the drawer display mode
     * @param mode - The new display mode
     */
    setDrawerMode(mode: DrawerMode): void {
      if (['auto', 'opened', 'closed'].includes(mode)) {
        this.drawerMode = mode;
      } else {
        console.warn('Invalid drawer mode:', mode);
      }
    },

    /**
     * Set the active admin sub-module
     * @param subModule - The admin sub-module to activate
     */
    setActiveAdminSubModule(subModule: AdminSubModule): void {
      this.activeAdminSubModule = subModule;
    },

    /**
     * Reset the store state
     */
    resetState(): void { 
      this.activeModule = 'Login'; 
      this.previousModule = null; 
      this.drawerMode = 'closed'; 
      this.availableModules = DEFAULT_MODULES; 
      this.activeAdminSubModule = 'appAdmin';
    }
  },

  // Persist configuration will be added manually after TypeScript compilation
  // to match the specific plugin format used in the project
});