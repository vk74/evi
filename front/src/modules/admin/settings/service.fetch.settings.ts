/**
 * @file service.fetch.settings.ts
 * Version: 1.0.0
 * Service for fetching application settings from the backend.
 * Frontend file that provides unified interface for getting and caching settings with 5-minute TTL.
 *
 * Functionality:
 * - Provides a unified interface for getting and caching settings
 * - Uses the Pinia store for caching with a TTL of 5 minutes
 */

import { api } from '@/core/api/service.axios'
import { useAppSettingsStore } from './state.app.settings';
import { useUiStore } from '@/core/state/uistate';
import { 
  AppSetting, 
  FetchSettingsRequest,
  FetchSettingByNameRequest, 
  FetchSettingsBySectionRequest,
  FetchAllSettingsRequest,
  FetchSettingsResponse,
  SETTINGS_CACHE_TTL
} from './types.settings';

/**
 * Fetches application settings from the backend for a specific section.
 * First checks the cache, and only requests from backend if cache is empty or expired.
 * 
 * @param section_path - The section path to fetch settings for
 * @param forceRefresh - Whether to force a refresh from the server (bypass cache)
 * @param isPublicOnly - Whether to fetch only public settings
 * @returns Promise that resolves to an array of settings
 */
export async function fetchSettings(section_path: string, forceRefresh = false, isPublicOnly = false): Promise<AppSetting[]> {
  const store = useAppSettingsStore();
  const uiStore = useUiStore();
  
  console.log(`Fetching settings for section: ${section_path}${forceRefresh ? ' (forced refresh)' : ''}`);
  
  try {
    // Check if we have valid cache and not forcing refresh
    if (!forceRefresh && store.hasValidCache(section_path)) {
      const cachedSettings = store.getCachedSettings(section_path);
      console.log(`Using cached settings for section: ${section_path}`, cachedSettings);
      return cachedSettings || [];
    }
    
    // Set loading state
    store.setLoading(true);
    store.setError(null);
    
    // Prepare request parameters
    const requestData: FetchSettingsBySectionRequest = {
      type: 'bySection',  // Using bySection type to fetch settings for a specific section
      sectionPath: section_path,
      environment: 'all', // Get settings for all environments
      includeConfidential: false, // Don't include confidential settings
      isPublicOnly: isPublicOnly || undefined // Only apply filter if explicitly requested
    };
    
    // Make API request using the centralized api client
    const response = await api.post<FetchSettingsResponse>(
      '/api/core/settings/fetch-settings',
      requestData
    );
    
    // Handle response
    if (response.data.success && response.data.settings) {
      // Cache the settings
      store.cacheSettings(section_path, response.data.settings);
      
      // Clear any previous errors
      store.setError(null);
      
      // Return the settings
      return response.data.settings;
    } else {
      // Handle error case
      const errorMessage = response.data.error || 'Unknown error fetching settings';
      store.setError(errorMessage);
      
      // Show error message to user
      uiStore.showErrorSnackbar(`Error loading settings: ${errorMessage}`);
      
      // Return empty settings array
      return [];
    }
  } catch (error) {
    // Handle exception
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error fetching settings for section ${section_path}:`, error);
    
    // Set error in store
    store.setError(errorMessage);
    
    // Show error message to user
    uiStore.showErrorSnackbar(`Error loading settings: ${errorMessage}`);
    
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
 * @param section_path - The section path the setting belongs to
 * @param settingName - The unique name of the setting to get
 * @param defaultValue - Default value to return if setting not found
 * @returns The setting value or default value if not found
 */
export function getSettingValue<T>(section_path: string, settingName: string, defaultValue: T): T {
  const store = useAppSettingsStore();
  const settings = store.getCachedSettings(section_path);
  
  if (!settings) return defaultValue;
  
  const setting = settings.find(s => s.setting_name === settingName);
  if (!setting) return defaultValue;
  
  // Return the value or default value if null/undefined
  return (setting.value !== null && setting.value !== undefined) ? setting.value : defaultValue;
}

/**
 * Fetches a specific setting by its name directly from the backend.
 * 
 * @param section_path - The section path the setting belongs to
 * @param settingName - The unique name of the setting to get
 * @returns Promise that resolves to the setting or null if not found
 */
export async function fetchSettingByName(section_path: string, settingName: string): Promise<AppSetting | null> {
  const store = useAppSettingsStore();
  const uiStore = useUiStore();
  
  try {
    // Prepare request parameters
    const requestData: FetchSettingByNameRequest = {
      type: 'byName',
      sectionPath: section_path,
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
      // Cache the setting in the store
      store.cacheSettings(section_path, [response.data.setting]);
      
      return response.data.setting;
    }
    
    return null;
  } catch (error) {
    // Handle exception
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error fetching setting ${settingName} for section ${section_path}:`, error);
    
    // Show error message to user
    uiStore.showErrorSnackbar(`Error getting setting: ${errorMessage}`);
    
    return null;
  }
}

/**
 * Checks if the cache for a section has expired.
 * 
 * @param section_path - The section path to check
 * @returns True if cache has expired or doesn't exist, false otherwise
 */
export function isSettingsCacheExpired(section_path: string): boolean {
  const store = useAppSettingsStore();
  return !store.hasValidCache(section_path);
}

/**
 * Fetches UI settings from the backend
 * Uses public API for anonymous users, authenticated API for logged-in users
 * 
 * @returns Promise that resolves to an array of UI settings
 */
export async function fetchUiSettings(): Promise<AppSetting[]> {
  const uiStore = useUiStore();
  
  // Check if user is authenticated
  const { useUserAuthStore } = await import('@/core/auth/state.user.auth');
  const userAuthStore = useUserAuthStore();
  const isAuthenticated = userAuthStore.isAuthenticated;
  
  console.log(`[Fetch UI Settings] Fetching UI settings (authenticated: ${isAuthenticated})`);
  
  try {
    if (!isAuthenticated) {
      // User is not authenticated - use public API
      console.log('[Fetch UI Settings] Using public API for anonymous user');
      const { fetchPublicUiSettings } = await import('@/core/services/service.fetch.public.ui.settings');
      const publicResponse = await fetchPublicUiSettings();
      
      if (publicResponse.success && publicResponse.settings) {
        // Convert PublicUiSetting to AppSetting format
        const appSettings: AppSetting[] = publicResponse.settings.map(setting => ({
          section_path: setting.section_path,
          setting_name: setting.setting_name,
          environment: 'all',
          value: setting.value,
          confidentiality: false,
          is_public: setting.is_public
        }));
        
        console.log(`[Fetch UI Settings] Fetched ${appSettings.length} public UI settings`);
        return appSettings;
      } else {
        throw new Error(publicResponse.error || 'Failed to fetch public UI settings');
      }
    } else {
      // User is authenticated - use full settings API
      console.log('[Fetch UI Settings] Using authenticated API');
      
      // Prepare request parameters for all UI settings
      const requestData: FetchAllSettingsRequest = {
        type: 'all',
        environment: 'all',
        includeConfidential: false,
        isPublicOnly: true // Only fetch public settings
      };
      
      // Make API request using the centralized api client
      const response = await api.post<FetchSettingsResponse>(
        '/api/core/settings/fetch-settings',
        requestData
      );
      
      // Handle response
      if (response.data.success && response.data.settings) {
        console.log(`[Fetch UI Settings] Fetched ${response.data.settings.length} authenticated UI settings`);
        return response.data.settings;
      } else {
        // Handle error case
        const errorMessage = response.data.error || 'Unknown error fetching UI settings';
        throw new Error(errorMessage);
      }
    }
  } catch (error) {
    // Handle exception
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Fetch UI Settings] Error:', errorMessage);
    
    // Show error message to user
    uiStore.showErrorSnackbar(`Error loading UI settings: ${errorMessage}`);
    
    // Re-throw error so caller can handle it
    throw error;
  }
}

/**
 * Gets the time in seconds until the cache expires.
 * 
 * @param section_path - The section path to check
 * @returns Time in seconds until expiration, or 0 if already expired
 */
export function getSettingsCacheTimeRemaining(section_path: string): number {
  const store = useAppSettingsStore();
  const cache = store.settingsCache[section_path];
  
  if (!cache) return 0;
  
  const now = Date.now();
  const expirationTime = cache.timestamp + SETTINGS_CACHE_TTL;
  const remainingMs = Math.max(0, expirationTime - now);
  
  return Math.floor(remainingMs / 1000); // Convert to seconds
}

/**
 * Gets default values for specified settings from cache
 * 
 * @param section_path - The section path the settings belong to
 * @param settingNames - Array of setting names to get default values for
 * @returns Object with setting names as keys and their default values
 */
export function getDefaultValues(
  section_path: string, 
  settingNames: string[]
): Record<string, any> {
  const store = useAppSettingsStore();
  const settings = store.getCachedSettings(section_path);
  
  if (!settings || settings.length === 0) {
    console.warn(`No settings found for section: ${section_path}`);
    return {};
  }
  
  const defaultValues: Record<string, any> = {};
  
  settingNames.forEach(settingName => {
    const setting = settings.find(s => s.setting_name === settingName);
    if (setting) {
      // Use default_value if available, otherwise use current value as fallback
      defaultValues[settingName] = setting.default_value !== undefined && setting.default_value !== null 
        ? setting.default_value 
        : setting.value;
    } else {
      console.warn(`Setting ${settingName} not found in section ${section_path}`);
    }
  });
  
  console.log(`Retrieved default values for ${Object.keys(defaultValues).length} settings:`, defaultValues);
  return defaultValues;
}

