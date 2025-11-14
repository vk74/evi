/**
 * @file state.app.settings.ts
 * Version: 1.1.0
 * State management for the application settings module using Pinia.
 * Frontend file that tracks selected section ID, expanded sections, and caches settings data.
 *
 * Functionality:
 * - Tracks the selected section ID, expanded sections, and caches settings data
 * - Manages settings cache with TTL of 5 minutes
 * - Provides methods for updating, sorting, selecting, and clearing the cache
 * - Persists UI state (selectedSectionPath, expandedSections, expandedBlocks) to localStorage
 */

import { defineStore } from 'pinia';
import { 
  AppSetting, 
  SettingsCacheEntry,
  UI_SETTINGS_CACHE_TTL
} from './types.settings';

// Define the interface for the store state
interface AppSettingsState {
  // UI State
  selectedSectionPath: string;      // Currently selected section path
  expandedSections: string[];     // List of expanded section paths
  expandedBlocks: string[];       // List of expanded setting blocks
  
  // Settings Data State
  settingsCache: Record<string, SettingsCacheEntry>; // Cache of settings by section
  uiSettingsCache: Record<string, SettingsCacheEntry>; // Cache of UI settings
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
    expandedBlocks: [     // Start with both logging blocks expanded by default
      'Application.System.Logging.ConsoleLoggingBlock',
      'Application.System.Logging.FileLoggingBlock'
    ],
    settingsCache: {}, // Empty cache to start
    uiSettingsCache: {}, // Empty UI settings cache to start
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
    
    // Get all expanded block paths
    getExpandedBlocks: (state): string[] => {
      return state.expandedBlocks;
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
    },
    
    // Check if a specific block is expanded
    isBlockExpanded: (state) => (blockPath: string): boolean => {
      return state.expandedBlocks.includes(blockPath);
    },
    
    // Check if Work module is visible based on settings
    isWorkModuleVisible: (state) => (): boolean => {
      // First check UI settings cache
      const uiCacheEntry = state.uiSettingsCache['Application.Work'];
      if (uiCacheEntry) {
        const now = Date.now();
        if ((now - uiCacheEntry.timestamp) < UI_SETTINGS_CACHE_TTL) {
          const visibilitySetting = uiCacheEntry.data.find(
            setting => setting.setting_name === 'work.module.is.visible'
          );
          return visibilitySetting ? visibilitySetting.value === true : false; // Default to false
        }
      }
      
      // Fallback to regular cache
      const cacheEntry = state.settingsCache['Application.Work'];
      if (!cacheEntry) return false; // Default to hidden if no cache entry
      
      // Check if cache has expired
      const now = Date.now();
      if ((now - cacheEntry.timestamp) >= SETTINGS_CACHE_TTL) {
        return false; // Default to hidden if cache expired
      }
      
      // Find the work.module.is.visible setting
      const visibilitySetting = cacheEntry.data.find(
        setting => setting.setting_name === 'work.module.is.visible'
      );
      
      return visibilitySetting ? visibilitySetting.value === true : false; // Default to false
    },
    
    // Check if Reports module is visible based on settings
    isReportsModuleVisible: (state) => (): boolean => {
      // First check UI settings cache
      const uiCacheEntry = state.uiSettingsCache['Application.Reports'];
      if (uiCacheEntry) {
        const now = Date.now();
        if ((now - uiCacheEntry.timestamp) < UI_SETTINGS_CACHE_TTL) {
          const visibilitySetting = uiCacheEntry.data.find(
            setting => setting.setting_name === 'reports.module.is.visible'
          );
          return visibilitySetting ? visibilitySetting.value === true : false; // Default to false
        }
      }
      
      // Fallback to regular cache
      const cacheEntry = state.settingsCache['Application.Reports'];
      if (!cacheEntry) return false; // Default to hidden if no cache entry
      
      // Check if cache has expired
      const now = Date.now();
      if ((now - cacheEntry.timestamp) >= SETTINGS_CACHE_TTL) {
        return false; // Default to hidden if cache expired
      }
      
      // Find the reports.module.is.visible setting
      const visibilitySetting = cacheEntry.data.find(
        setting => setting.setting_name === 'reports.module.is.visible'
      );
      
      return visibilitySetting ? visibilitySetting.value === true : false; // Default to false
    },
    
    // Check if KnowledgeBase module is visible based on settings
    isKnowledgeBaseModuleVisible: (state) => (): boolean => {
      // First check UI settings cache
      const uiCacheEntry = state.uiSettingsCache['Application.KnowledgeBase'];
      if (uiCacheEntry) {
        const now = Date.now();
        if ((now - uiCacheEntry.timestamp) < UI_SETTINGS_CACHE_TTL) {
          const visibilitySetting = uiCacheEntry.data.find(
            setting => setting.setting_name === 'knowledgebase.module.is.visible'
          );
          return visibilitySetting ? visibilitySetting.value === true : false; // Default to false
        }
      }
      
      // Fallback to regular cache
      const cacheEntry = state.settingsCache['Application.KnowledgeBase'];
      if (!cacheEntry) return false; // Default to hidden if no cache entry
      
      // Check if cache has expired
      const now = Date.now();
      if ((now - cacheEntry.timestamp) >= SETTINGS_CACHE_TTL) {
        return false; // Default to hidden if cache expired
      }
      
      // Find the knowledgebase.module.is.visible setting
      const visibilitySetting = cacheEntry.data.find(
        setting => setting.setting_name === 'knowledgebase.module.is.visible'
      );
      
      return visibilitySetting ? visibilitySetting.value === true : false; // Default to false
    },
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
    
    // Expand a block
    expandBlock(blockPath: string) {
      if (!this.expandedBlocks.includes(blockPath)) {
        this.expandedBlocks.push(blockPath);
      }
    },
    
    // Collapse a block
    collapseBlock(blockPath: string) {
      this.expandedBlocks = this.expandedBlocks.filter(path => path !== blockPath);
    },
    
    // Toggle a block's expanded state
    toggleBlock(blockPath: string) {
      if (this.expandedBlocks.includes(blockPath)) {
        this.collapseBlock(blockPath);
      } else {
        this.expandBlock(blockPath);
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
      this.uiSettingsCache = {};
      console.log('Cleared all settings cache');
    },
    
    /**
     * Sets the value of a specific setting in the cache
     * 
     * @param sectionPath - The section path of the setting
     * @param settingName - The name of the setting
     * @param value - The new value for the setting
     * @returns boolean indicating if setting was found and updated
     */
    setSetting(sectionPath: string, settingName: string, value: any): boolean {
      const cacheEntry = this.settingsCache[sectionPath];
      if (!cacheEntry) return false;
      
      // Find the setting in the cache
      const settingIndex = cacheEntry.data.findIndex(
        setting => setting.setting_name === settingName
      );
      
      if (settingIndex === -1) return false;
      
      // Update the setting value locally
      cacheEntry.data[settingIndex].value = value;
      console.log(`Local cache updated for setting ${sectionPath}.${settingName}`, value);
      
      return true;
    },
    
    /**
     * Updates a setting in cache with the full setting object
     * Used after API confirms the update was successful
     * 
     * @param sectionPath - The section path of the setting
     * @param settingName - The name of the setting
     * @param updatedSetting - The updated setting object from API
     * @returns boolean indicating if cache was updated
     */
    updateCachedSetting(sectionPath: string, settingName: string, updatedSetting: AppSetting): boolean {
      const cacheEntry = this.settingsCache[sectionPath];
      if (!cacheEntry) return false;
      
      // Find the setting in the cache
      const settingIndex = cacheEntry.data.findIndex(
        setting => setting.setting_name === settingName
      );
      
      if (settingIndex === -1) {
        // Setting not found in cache, add it
        cacheEntry.data.push(updatedSetting);
        console.log(`Added new setting to cache: ${sectionPath}.${settingName}`);
      } else {
        // Update existing setting
        cacheEntry.data[settingIndex] = updatedSetting;
        console.log(`Updated cached setting: ${sectionPath}.${settingName}`);
      }
      
      // Refresh the timestamp to extend cache TTL
      cacheEntry.timestamp = Date.now();
      return true;
    },
    
    /**
     * Roll back a setting to previous value
     * Used when API update fails and we need to revert optimistic update
     * 
     * @param sectionPath - The section path of the setting
     * @param settingName - The name of the setting
     * @param originalValue - The original value to restore
     */
    rollbackSetting(sectionPath: string, settingName: string, originalValue: any): void {
      this.setSetting(sectionPath, settingName, originalValue);
      console.log(`Rolled back setting ${sectionPath}.${settingName} to:`, originalValue);
    },

    /**
     * Load UI settings from backend
     * @returns Promise that resolves when UI settings are loaded
     * @throws Error if settings cannot be loaded
     */
    async loadUiSettings(): Promise<void> {
      // Import the service to fetch UI settings
      const { fetchUiSettings } = await import('./service.fetch.settings');
      const uiSettings = await fetchUiSettings();
      
      // Group UI settings by section
      const settingsBySection: Record<string, AppSetting[]> = {};
      uiSettings.forEach(setting => {
        if (!settingsBySection[setting.section_path]) {
          settingsBySection[setting.section_path] = [];
        }
        settingsBySection[setting.section_path].push(setting);
      });
      
      // Cache UI settings by section
      Object.entries(settingsBySection).forEach(([sectionPath, settings]) => {
        this.uiSettingsCache[sectionPath] = {
          timestamp: Date.now(),
          data: settings
        };
      });
      
      console.log(`Loaded ${uiSettings.length} UI settings for ${Object.keys(settingsBySection).length} sections`);
    },

    /**
     * Get all UI settings from cache
     * @returns Array of all UI settings
     */
    getUiSettings(): AppSetting[] {
      const allSettings: AppSetting[] = [];
      Object.values(this.uiSettingsCache).forEach(cacheEntry => {
        allSettings.push(...cacheEntry.data);
      });
      return allSettings;
    },

    /**
     * Check if UI settings cache is valid
     * @returns boolean indicating if UI settings cache is valid
     */
    hasValidUiSettingsCache(): boolean {
      const now = Date.now();
      return Object.values(this.uiSettingsCache).some(cacheEntry => 
        (now - cacheEntry.timestamp) < UI_SETTINGS_CACHE_TTL
      );
    },

    /**
     * Clear UI settings cache
     * Used when user logs out to invalidate cached settings
     */
    clearUiSettingsCache(): void {
      console.log('[App Settings Store] Clearing UI settings cache');
      this.uiSettingsCache = {};
    }
  },
  
  // Persistence configuration
  // Only persist UI state (selected section, expanded sections/blocks)
  // Do NOT persist cache data - it will be loaded fresh on each page reload
  persist: {
    key: 'evi-app-settings',
    storage: localStorage,
    pick: [
      'selectedSectionPath',
      'expandedSections',
      'expandedBlocks'
    ]
  }
});