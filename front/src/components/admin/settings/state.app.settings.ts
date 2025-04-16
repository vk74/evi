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
  selectedSectionPath: string;      // Currently selected section path
  expandedSections: string[];     // List of expanded section paths
  
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
    selectedSectionPath: 'Application', // Default to application section
    expandedSections: [], // Start with all sections collapsed
    settingsCache: {}, // Empty cache to start
    isLoading: false,
    lastError: null
  }),
  
  // Getters
  getters: {
    // Get the currently selected section path
    getSelectedSectionPath: (state): string => {
      return state.selectedSectionPath;
    },
    
    // Get all expanded section paths
    getExpandedSections: (state): string[] => {
      return state.expandedSections;
    },
    
    // Check if settings for a specific section exist and are not expired
    hasValidCache: (state) => (section_path: string): boolean => {
      const cacheEntry = state.settingsCache[section_path];
      if (!cacheEntry) return false;
      
      const now = Date.now();
      return (now - cacheEntry.timestamp) < SETTINGS_CACHE_TTL;
    },
    
    // Get settings for a specific section from cache
    getCachedSettings: (state) => (section_path: string): AppSetting[] | null => {
      const cacheEntry = state.settingsCache[section_path];
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
      Object.entries(state.settingsCache).forEach(([section_path, entry]) => {
        if ((now - entry.timestamp) < SETTINGS_CACHE_TTL) {
          result[section_path] = entry.data;
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
    setSelectedSection(path: string) {
      this.selectedSectionPath = path;
    },
    
    // Expand a section
    expandSection(path: string) {
      if (!this.expandedSections.includes(path)) {
        this.expandedSections.push(path);
      }
    },
    
    // Collapse a section
    collapseSection(path: string) {
      this.expandedSections = this.expandedSections.filter(section_path => section_path !== path);
    },
    
    // Toggle a section's expanded state
    toggleSection(path: string) {
      if (this.expandedSections.includes(path)) {
        this.collapseSection(path);
      } else {
        this.expandSection(path);
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
    cacheSettings(section_path: string, settings: AppSetting[]) {
      // Filter settings for this exact section
      const sectionSettings = settings.filter(
        setting => setting.section_path === section_path
      );
      
      this.settingsCache[section_path] = {
        timestamp: Date.now(),
        data: sectionSettings
      };
      
      console.log(`Cached ${sectionSettings.length} settings for section: ${section_path}`);
    },
    
    // Clear cache for a specific section
    clearSectionCache(section_path: string) {
      if (this.settingsCache[section_path]) {
        delete this.settingsCache[section_path];
        console.log(`Cleared cache for section: ${section_path}`);
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