/**
 * state.app.settings.ts
 * 
 * State management for the application settings module using Pinia.
 * Tracks the selected section ID, expanded sections, and caches settings data.
 */

import { defineStore } from 'pinia';
import { 
  AppSetting, 
  SettingsCacheEntry 
} from './types.settings';

// Define the interface for the store state
interface AppSettingsState {
  // UI State
  selectedSectionId: string;      // Currently selected section ID
  expandedSections: string[];     // List of expanded section IDs
  
  // Settings Data State
  settingsCache: Record<string, SettingsCacheEntry>; // Cache of settings by section
  isLoading: boolean;             // Whether settings are currently being loaded
  lastError: string | null;       // Last error encountered when loading settings
}

// Cache TTL in milliseconds (5 minutes)
export const SETTINGS_CACHE_TTL = 5 * 60 * 1000;

/**
 * App Settings Store
 * Manages which settings section is selected, which sections are expanded,
 * and caches settings data from the API
 */
export const useAppSettingsStore = defineStore('appSettings', {
  // Initial state
  state: (): AppSettingsState => ({
    selectedSectionId: 'application', // Default to application section
    expandedSections: [], // Start with all sections collapsed
    settingsCache: {}, // Empty cache to start
    isLoading: false,
    lastError: null
  }),
  
  // Getters
  getters: {
    // Get the currently selected section ID
    getSelectedSectionId: (state): string => {
      return state.selectedSectionId;
    },
    
    // Get all expanded section IDs
    getExpandedSections: (state): string[] => {
      return state.expandedSections;
    },
    
    // Check if settings for a specific section exist and are not expired
    hasValidCache: (state) => (sectionId: string): boolean => {
      const cacheEntry = state.settingsCache[sectionId];
      if (!cacheEntry) return false;
      
      const now = Date.now();
      return (now - cacheEntry.timestamp) < SETTINGS_CACHE_TTL;
    },
    
    // Get settings for a specific section from cache
    getCachedSettings: (state) => (sectionId: string): AppSetting[] | null => {
      const cacheEntry = state.settingsCache[sectionId];
      if (!cacheEntry) return null;
      
      // Check if cache has expired
      const now = Date.now();
      if ((now - cacheEntry.timestamp) >= SETTINGS_CACHE_TTL) {
        return null; // Cache expired
      }
      
      return cacheEntry.data;
    },
    
    // Get all settings from cache
    getAllCachedSettings: (state): Record<string, AppSetting[]> => {
      const result: Record<string, AppSetting[]> = {};
      
      // Filter out expired entries
      const now = Date.now();
      Object.entries(state.settingsCache).forEach(([sectionId, entry]) => {
        if ((now - entry.timestamp) < SETTINGS_CACHE_TTL) {
          result[sectionId] = entry.data;
        }
      });
      
      return result;
    },
    
    // Check if settings are currently loading
    isLoadingSettings: (state): boolean => {
      return state.isLoading;
    },
    
    // Get the last error encountered
    getLastError: (state): string | null => {
      return state.lastError;
    }
  },
  
  // Actions
  actions: {
    // Set the selected section
    setSelectedSection(id: string) {
      this.selectedSectionId = id;
    },
    
    // Expand a section
    expandSection(id: string) {
      if (!this.expandedSections.includes(id)) {
        this.expandedSections.push(id);
      }
    },
    
    // Collapse a section
    collapseSection(id: string) {
      this.expandedSections = this.expandedSections.filter(sectionId => sectionId !== id);
    },
    
    // Toggle a section's expanded state
    toggleSection(id: string) {
      if (this.expandedSections.includes(id)) {
        this.collapseSection(id);
      } else {
        this.expandSection(id);
      }
    },
    
    // Set the loading state
    setLoading(isLoading: boolean) {
      this.isLoading = isLoading;
    },
    
    // Set the last error
    setError(error: string | null) {
      this.lastError = error;
    },
    
    // Add settings to cache for a section
    cacheSettings(sectionId: string, settings: AppSetting[]) {
      // Filter settings for this exact section
      const sectionSettings = settings.filter(
        setting => setting.sections_path === sectionId
      );
      
      this.settingsCache[sectionId] = {
        timestamp: Date.now(),
        data: sectionSettings
      };
      
      console.log(`Cached ${sectionSettings.length} settings for section: ${sectionId}`);
    },
    
    // Clear cache for a specific section
    clearSectionCache(sectionId: string) {
      if (this.settingsCache[sectionId]) {
        delete this.settingsCache[sectionId];
        console.log(`Cleared cache for section: ${sectionId}`);
      }
    },
    
    // Clear all cache
    clearAllCache() {
      this.settingsCache = {};
      console.log('Cleared all settings cache');
    }
  },
  
  // Enable persistence to keep state between sessions
  persist: true
});