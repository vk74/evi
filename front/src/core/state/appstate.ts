/**
 * appstate.ts - version 1.3.0
 * State store for the main navigation menu of the application.
 * Manages navigation between main modules, drawer display modes,
 * and preserves states between user sessions.
 * 
 * Changes in v1.1.0:
 * - Added userCountry state to store user's country location
 * - Added getUserCountry getter to retrieve user country
 * - Added loadUserCountry action to load country from API
 * - Added setUserCountry action to update country value
 * - Added clearUserCountry action to clear country on logout
 * - Added isLoadingCountry flag to prevent duplicate requests
 * 
 * Changes in v1.2.0:
 * - Renamed userCountry -> userLocation throughout the file
 * - Renamed getUserCountry -> getUserLocation
 * - Renamed loadUserCountry -> loadUserLocation
 * - Renamed setUserCountry -> setUserLocation
 * - Renamed clearUserCountry -> clearUserLocation
 * - Renamed isLoadingCountry -> isLoadingLocation
 * 
 * Changes in v1.3.0:
 * - Added 'About' module to DEFAULT_MODULES array
 */
import { defineStore } from 'pinia';
import { ModuleName, AdminSubModule, DrawerMode } from '../../types.app';
import { getUserLocation as getUserLocationAPI } from '@/core/services/service.get.user.location';

// Interface for the store state
interface AppState {
  activeModule: ModuleName;
  previousModule: ModuleName | null;
  drawerMode: DrawerMode;
  availableModules: ModuleName[];
  activeAdminSubModule: AdminSubModule;
  userLocation: string | null;
  isLoadingLocation: boolean;
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
  'License',
  'DeveloperInfo',
  'Components',
  'KnowledgeBase',
  'About',
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
    activeAdminSubModule: 'appAdmin',
    // User location (region)
    userLocation: null,
    // Loading flag to prevent duplicate requests
    isLoadingLocation: false
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
    getActiveAdminSubModule: (state): AdminSubModule => state.activeAdminSubModule,

    /**
     * Get user location (region)
     * @returns User location value or null
     */
    getUserLocation: (state): string | null => state.userLocation
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
      this.userLocation = null;
      this.isLoadingLocation = false;
    },

    /**
     * Load user location from API
     * Loads user location from backend and updates state
     * Does not load if already loading or if location is already loaded
     */
    async loadUserLocation(): Promise<void> {
      // Prevent duplicate requests
      if (this.isLoadingLocation) {
        return;
      }

      // Skip if location is already loaded (optional optimization)
      // We allow reloading to ensure fresh data
      
      this.isLoadingLocation = true;
      
      try {
        const location = await getUserLocationAPI();
        this.userLocation = location;
        console.log('[AppStore] User location loaded:', location);
      } catch (error) {
        console.error('[AppStore] Failed to load user location:', error);
        // Don't block app functionality if location load fails
        // Set to null to indicate no location loaded
        this.userLocation = null;
      } finally {
        this.isLoadingLocation = false;
      }
    },

    /**
     * Set user location value directly
     * Used after successful location update via API
     * @param location - Location value to set (string or null)
     */
    setUserLocation(location: string | null): void {
      this.userLocation = location;
      console.log('[AppStore] User location updated:', location);
    },

    /**
     * Clear user location
     * Called on logout to reset state
     */
    clearUserLocation(): void {
      this.userLocation = null;
      this.isLoadingLocation = false;
      console.log('[AppStore] User location cleared');
    }
  },

  // Persist configuration will be added manually after TypeScript compilation
  // to match the specific plugin format used in the project
});