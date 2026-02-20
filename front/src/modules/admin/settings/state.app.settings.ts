/**
 * @file state.app.settings.ts
 * Version: 1.4.1
 * State management for the application settings module using Pinia.
 * Frontend file that tracks selected section ID, expanded sections, and caches settings data.
 *
 * Functionality:
 * - Tracks the selected section ID, expanded sections, and caches settings data
 * - Manages settings cache with TTL of 5 minutes
 * - Provides methods for updating, sorting, selecting, and clearing the cache
 * - Persists UI state (selectedSectionPath, expandedSections, expandedBlocks) to localStorage
 * - Cross-tab cache invalidation via BroadcastChannel
 *
 * Changes in v1.4.1:
 * - Module visibility getters (Work, Reports, KnowledgeBase) now read from Application.System.Modules cache
 *
 * Changes in v1.4.0:
 * - Added cross-tab cache invalidation using BroadcastChannel API
 * - When a setting is updated in one tab, all other tabs receive the update immediately
 * - initCrossTabSync() must be called once from App.vue to start listening
 *
 * Changes in v1.3.0:
 * - updateCachedSetting() syncs publicSettingsCache when updated setting is_public (fix cache coherency)
 * - Use SETTINGS_CACHE_TTL from types.settings, removed local duplicate
 * - Removed routine console.log; kept lifecycle/error logs; rollback log no longer prints value
 *
 * Changes in v1.2.0:
 * - Renamed UI settings cache and helpers to public settings cache and helpers
 * - Updated to use fetchPublicSettings service instead of fetchUiSettings
 * - Removed legacy UI settings terminology from store state and logs
 */

import { defineStore } from 'pinia';
import { 
  AppSetting, 
  SettingsCacheEntry,
  SETTINGS_CACHE_TTL,
  PUBLIC_SETTINGS_CACHE_TTL
} from './types.settings';

// Channel name for cross-tab settings synchronization
const SETTINGS_CHANNEL_NAME = 'evi-settings-sync';

/**
 * Message format for cross-tab communication
 */
interface SettingsSyncMessage {
  type: 'setting-updated';
  sectionPath: string;
  settingName: string;
  updatedSetting: AppSetting;
}

// Module-level channel reference (created lazily on initCrossTabSync)
let settingsChannel: BroadcastChannel | null = null;

// Define the interface for the store state
interface AppSettingsState {
  // UI State
  selectedSectionPath: string;      // Currently selected section path
  expandedSections: string[];     // List of expanded section paths
  expandedBlocks: string[];       // List of expanded setting blocks
  
  // Settings Data State
  settingsCache: Record<string, SettingsCacheEntry>; // Cache of settings by section
  publicSettingsCache: Record<string, SettingsCacheEntry>; // Cache of public settings
  isLoading: boolean;             // Whether settings are currently being loaded
  lastError: string | null;       // Last error encountered when loading settings
}

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
    publicSettingsCache: {}, // Empty public settings cache to start
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
    
    // Check if Work module is visible based on settings (from Application.System.Modules)
    isWorkModuleVisible: (state) => (): boolean => {
      const publicCacheEntry = state.publicSettingsCache['Application.System.Modules'];
      if (publicCacheEntry) {
        const now = Date.now();
        if ((now - publicCacheEntry.timestamp) < PUBLIC_SETTINGS_CACHE_TTL) {
          const visibilitySetting = publicCacheEntry.data.find(
            setting => setting.setting_name === 'work.module.is.visible'
          );
          return visibilitySetting ? visibilitySetting.value === true : false;
        }
      }
      const cacheEntry = state.settingsCache['Application.System.Modules'];
      if (!cacheEntry) return false;
      const now = Date.now();
      if ((now - cacheEntry.timestamp) >= SETTINGS_CACHE_TTL) return false;
      const visibilitySetting = cacheEntry.data.find(
        setting => setting.setting_name === 'work.module.is.visible'
      );
      return visibilitySetting ? visibilitySetting.value === true : false;
    },

    // Check if Reports module is visible based on settings (from Application.System.Modules)
    isReportsModuleVisible: (state) => (): boolean => {
      const publicCacheEntry = state.publicSettingsCache['Application.System.Modules'];
      if (publicCacheEntry) {
        const now = Date.now();
        if ((now - publicCacheEntry.timestamp) < PUBLIC_SETTINGS_CACHE_TTL) {
          const visibilitySetting = publicCacheEntry.data.find(
            setting => setting.setting_name === 'reports.module.is.visible'
          );
          return visibilitySetting ? visibilitySetting.value === true : false;
        }
      }
      const cacheEntry = state.settingsCache['Application.System.Modules'];
      if (!cacheEntry) return false;
      const now = Date.now();
      if ((now - cacheEntry.timestamp) >= SETTINGS_CACHE_TTL) return false;
      const visibilitySetting = cacheEntry.data.find(
        setting => setting.setting_name === 'reports.module.is.visible'
      );
      return visibilitySetting ? visibilitySetting.value === true : false;
    },

    // Check if KnowledgeBase module is visible based on settings (from Application.System.Modules)
    isKnowledgeBaseModuleVisible: (state) => (): boolean => {
      const publicCacheEntry = state.publicSettingsCache['Application.System.Modules'];
      if (publicCacheEntry) {
        const now = Date.now();
        if ((now - publicCacheEntry.timestamp) < PUBLIC_SETTINGS_CACHE_TTL) {
          const visibilitySetting = publicCacheEntry.data.find(
            setting => setting.setting_name === 'knowledgebase.module.is.visible'
          );
          return visibilitySetting ? visibilitySetting.value === true : false;
        }
      }
      const cacheEntry = state.settingsCache['Application.System.Modules'];
      if (!cacheEntry) return false;
      const now = Date.now();
      if ((now - cacheEntry.timestamp) >= SETTINGS_CACHE_TTL) return false;
      const visibilitySetting = cacheEntry.data.find(
        setting => setting.setting_name === 'knowledgebase.module.is.visible'
      );
      return visibilitySetting ? visibilitySetting.value === true : false;
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
    },
    
    // Clear cache for a specific section
    clearSectionCache(section_path: string) {
      if (this.settingsCache[section_path]) {
        delete this.settingsCache[section_path];
      }
    },
    
    // Clear all cache
    clearAllCache() {
      this.settingsCache = {};
      this.publicSettingsCache = {};
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
      } else {
        // Update existing setting
        cacheEntry.data[settingIndex] = updatedSetting;
      }
      
      // Refresh the timestamp to extend cache TTL
      cacheEntry.timestamp = Date.now();

      // Sync with publicSettingsCache if setting is public
      if (updatedSetting.is_public) {
        const publicEntry = this.publicSettingsCache[sectionPath];
        if (publicEntry) {
          const idx = publicEntry.data.findIndex(s => s.setting_name === settingName);
          if (idx !== -1) {
            publicEntry.data[idx] = updatedSetting;
          } else {
            publicEntry.data.push(updatedSetting);
          }
          publicEntry.timestamp = Date.now();
        }
      }

      // Broadcast update to other tabs
      if (settingsChannel) {
        try {
          const msg: SettingsSyncMessage = {
            type: 'setting-updated',
            sectionPath,
            settingName,
            updatedSetting
          };
          settingsChannel.postMessage(msg);
        } catch {
          // Channel closed or unavailable -- safe to ignore
        }
      }

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
      console.log(`Rolled back setting ${sectionPath}.${settingName}`);
    },

    /**
     * Load public settings from backend
     * @returns Promise that resolves when public settings are loaded
     * @throws Error if settings cannot be loaded
     */
    async loadPublicSettings(): Promise<void> {
      // Import the service to fetch public settings
      const { fetchPublicSettings } = await import('./service.fetch.settings');
      const publicSettings = await fetchPublicSettings();
      
      // Group public settings by section
      const settingsBySection: Record<string, AppSetting[]> = {};
      publicSettings.forEach(setting => {
        if (!settingsBySection[setting.section_path]) {
          settingsBySection[setting.section_path] = [];
        }
        settingsBySection[setting.section_path].push(setting);
      });
      
      // Cache public settings by section
      Object.entries(settingsBySection).forEach(([sectionPath, settings]) => {
        this.publicSettingsCache[sectionPath] = {
          timestamp: Date.now(),
          data: settings
        };
      });
      
      console.log(`Loaded ${publicSettings.length} public settings for ${Object.keys(settingsBySection).length} sections`);
    },

    /**
     * Get all public settings from cache
     * @returns Array of all public settings
     */
    getPublicSettings(): AppSetting[] {
      const allSettings: AppSetting[] = [];
      Object.values(this.publicSettingsCache).forEach(cacheEntry => {
        allSettings.push(...cacheEntry.data);
      });
      return allSettings;
    },

    /**
     * Check if public settings cache is valid
     * @returns boolean indicating if public settings cache is valid
     */
    hasValidPublicSettingsCache(): boolean {
      const now = Date.now();
      return Object.values(this.publicSettingsCache).some(cacheEntry => 
        (now - cacheEntry.timestamp) < PUBLIC_SETTINGS_CACHE_TTL
      );
    },

    /**
     * Clear public settings cache
     * Used when user logs out to invalidate cached settings
     */
    clearPublicSettingsCache(): void {
      console.log('[App Settings Store] Clearing public settings cache');
      this.publicSettingsCache = {};
    },

    /**
     * Apply a setting update received from another browser tab.
     * Updates both settingsCache and publicSettingsCache without broadcasting again.
     */
    applyRemoteSettingUpdate(sectionPath: string, settingName: string, updatedSetting: AppSetting): void {
      // Update settingsCache
      const cacheEntry = this.settingsCache[sectionPath];
      if (cacheEntry) {
        const idx = cacheEntry.data.findIndex(s => s.setting_name === settingName);
        if (idx !== -1) {
          cacheEntry.data[idx] = updatedSetting;
        } else {
          cacheEntry.data.push(updatedSetting);
        }
        cacheEntry.timestamp = Date.now();
      }

      // Update publicSettingsCache if setting is public
      if (updatedSetting.is_public) {
        const publicEntry = this.publicSettingsCache[sectionPath];
        if (publicEntry) {
          const idx = publicEntry.data.findIndex(s => s.setting_name === settingName);
          if (idx !== -1) {
            publicEntry.data[idx] = updatedSetting;
          } else {
            publicEntry.data.push(updatedSetting);
          }
          publicEntry.timestamp = Date.now();
        }
      }
    },

    /**
     * Initialize cross-tab synchronization via BroadcastChannel.
     * Should be called once from App.vue on mount.
     * When another tab updates a setting, this tab applies the change immediately.
     */
    initCrossTabSync(): void {
      if (typeof BroadcastChannel === 'undefined') {
        // BroadcastChannel not supported (e.g. some older browsers) -- skip silently
        return;
      }

      // Avoid double-initialization
      if (settingsChannel) {
        return;
      }

      try {
        settingsChannel = new BroadcastChannel(SETTINGS_CHANNEL_NAME);
        settingsChannel.onmessage = (event: MessageEvent<SettingsSyncMessage>) => {
          const msg = event.data;
          if (msg && msg.type === 'setting-updated') {
            this.applyRemoteSettingUpdate(msg.sectionPath, msg.settingName, msg.updatedSetting);
          }
        };
      } catch {
        // Failed to create channel -- safe to ignore
        settingsChannel = null;
      }
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