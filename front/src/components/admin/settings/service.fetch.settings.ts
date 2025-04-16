/**
 * service.fetch.settings.ts
 * 
 * Service for fetching application settings from the backend.
 * Provides a unified interface for getting and caching settings.
 * Uses the Pinia store for caching with a TTL of 5 minutes.
 */

import { api } from '@/core/api/service.axios'
import { useAppSettingsStore } from './state.app.settings';
import { useUiStore } from '@/core/state/uistate';
import { 
  AppSetting, 
  FetchSettingsRequest,
  FetchSettingByNameRequest, 
  FetchSettingsBySectionRequest,
  FetchSettingsResponse,
  SETTINGS_CACHE_TTL
} from './types.settings';

/**
 * Fetches application settings from the backend for a specific section.
 * First checks the cache, and only requests from backend if cache is empty or expired.
 * 
 * @param sectionId - The section ID to fetch settings for
 * @param forceRefresh - Whether to force a refresh from the server (bypass cache)
 * @returns Promise that resolves to an array of settings
 */
export async function fetchSettings(sectionId: string, forceRefresh = false): Promise<AppSetting[]> {
  const store = useAppSettingsStore();
  const uiStore = useUiStore();
  
  console.log(`Fetching settings for section: ${sectionId}${forceRefresh ? ' (forced refresh)' : ''}`);
  
  try {
    // Check if we have valid cache and not forcing refresh
    if (!forceRefresh && store.hasValidCache(sectionId)) {
      const cachedSettings = store.getCachedSettings(sectionId);
      console.log(`Using cached settings for section: ${sectionId}`, cachedSettings);
      return cachedSettings || [];
    }
    
    // Set loading state
    store.setLoading(true);
    store.setError(null);
    
    // Prepare request parameters
    const requestData: FetchSettingsBySectionRequest = {
      type: 'bySection',  // Using bySection type to fetch settings for a specific section
      sectionPath: sectionId,
      environment: 'all', // Get settings for all environments
      includeConfidential: false // Don't include confidential settings
    };
    
    // Make API request using the centralized api client
    const response = await api.post<FetchSettingsResponse>(
      '/api/core/settings/fetch-settings',
      requestData
    );
    
    // Handle response
    if (response.data.success && response.data.settings) {
      // Cache the settings
      store.cacheSettings(sectionId, response.data.settings);
      
      // Clear any previous errors
      store.setError(null);
      
      // Return the settings
      return response.data.settings;
    } else {
      // Handle error case
      const errorMessage = response.data.error || 'Unknown error fetching settings';
      store.setError(errorMessage);
      
      // Show error message to user
      uiStore.showErrorSnackbar(`Ошибка загрузки настроек: ${errorMessage}`);
      
      // Return empty settings array
      return [];
    }
  } catch (error) {
    // Handle exception
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error fetching settings for section ${sectionId}:`, error);
    
    // Set error in store
    store.setError(errorMessage);
    
    // Show error message to user
    uiStore.showErrorSnackbar(`Ошибка загрузки настроек: ${errorMessage}`);
    
    // Return empty settings array
    return [];
  } finally {
    // Clear loading state
    store.setLoading(false);
  }
}

/**
 * Gets a specific setting value by its name.
 * 
 * @param sectionId - The section ID the setting belongs to
 * @param settingName - The unique name of the setting to get
 * @param defaultValue - Default value to return if setting not found
 * @returns The setting value or default value if not found
 */
export function getSettingValue<T>(sectionId: string, settingName: string, defaultValue: T): T {
  const store = useAppSettingsStore();
  const settings = store.getCachedSettings(sectionId);
  
  if (!settings) return defaultValue;
  
  const setting = settings.find(s => s.setting_name === settingName);
  if (!setting) return defaultValue;
  
  // Return the value or default value if null/undefined
  return (setting.value !== null && setting.value !== undefined) ? setting.value : defaultValue;
}

/**
 * Fetches a specific setting by its name directly from the backend.
 * 
 * @param sectionId - The section ID the setting belongs to
 * @param settingName - The unique name of the setting to get
 * @returns Promise that resolves to the setting or null if not found
 */
export async function fetchSettingByName(sectionId: string, settingName: string): Promise<AppSetting | null> {
  const uiStore = useUiStore();
  
  try {
    // Prepare request parameters
    const requestData: FetchSettingByNameRequest = {
      type: 'byName',
      sectionPath: sectionId,
      settingName: settingName,
      environment: 'all',
      includeConfidential: false
    };
    
    // Make API request using the centralized api client
    const response = await api.post<FetchSettingsResponse>(
      '/api/core/settings/fetch-settings',
      requestData
    );
    
    // Handle response - using optional setting property for byName requests
    if (response.data.success && response.data.setting) {
      return response.data.setting;
    }
    
    return null;
  } catch (error) {
    // Handle exception
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error fetching setting ${settingName} for section ${sectionId}:`, error);
    
    // Show error message to user
    uiStore.showErrorSnackbar(`Ошибка получения настройки: ${errorMessage}`);
    
    return null;
  }
}

/**
 * Checks if the cache for a section has expired.
 * 
 * @param sectionId - The section ID to check
 * @returns True if cache has expired or doesn't exist, false otherwise
 */
export function isSettingsCacheExpired(sectionId: string): boolean {
  const store = useAppSettingsStore();
  return !store.hasValidCache(sectionId);
}

/**
 * Gets the time in seconds until the cache expires.
 * 
 * @param sectionId - The section ID to check
 * @returns Time in seconds until expiration, or 0 if already expired
 */
export function getSettingsCacheTimeRemaining(sectionId: string): number {
  const store = useAppSettingsStore();
  const cache = store.settingsCache[sectionId];
  
  if (!cache) return 0;
  
  const now = Date.now();
  const expirationTime = cache.timestamp + SETTINGS_CACHE_TTL;
  const remainingMs = Math.max(0, expirationTime - now);
  
  return Math.floor(remainingMs / 1000); // Convert to seconds
}