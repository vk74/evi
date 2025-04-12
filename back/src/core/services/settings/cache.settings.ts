/**
 * cache.settings.ts
 * In-memory cache for application settings.
 */

import { AppSetting, SettingsCache } from './types.settings';

// In-memory cache object
let settingsCache: SettingsCache = {};

// Logging helper
function logCache(message: string, meta?: object): void {
  console.log(`[${new Date().toISOString()}] [SettingsCache] ${message}`, meta || '');
}

/**
 * Set the entire cache contents
 * @param settings Array of settings to cache
 */
export function setCache(settings: AppSetting[]): void {
  settingsCache = settings.reduce((cache, setting) => {
    cache[setting.setting_name] = setting;
    return cache;
  }, {} as SettingsCache);
  
  logCache('Settings cache updated', { 
    settingsCount: settings.length,
    groups: [...new Set(settings.map(s => s.setting_group))]
  });
}

/**
 * Clear the entire cache
 */
export function clearCache(): void {
  settingsCache = {};
  logCache('Settings cache cleared');
}

/**
 * Get a setting value by name
 * @param settingName The unique name of the setting
 * @returns The setting value or null if not found
 */
export function getSetting(settingName: string): AppSetting | null {
  const setting = settingsCache[settingName];
  
  if (!setting) {
    logCache('Setting not found in cache', { settingName });
    return null;
  }

  logCache('Setting retrieved from cache', { 
    settingName,
    settingGroup: setting.setting_group 
  });
  
  return setting;
}

/**
 * Get all cached settings
 * @returns Object containing all cached settings
 */
export function getAllSettings(): SettingsCache {
  logCache('Retrieved all settings from cache', { 
    settingsCount: Object.keys(settingsCache).length 
  });
  return settingsCache;
}

/**
 * Check if a setting exists in cache
 * @param settingName The unique name of the setting
 * @returns boolean indicating if setting exists
 */
export function hasSetting(settingName: string): boolean {
  return settingName in settingsCache;
}

/**
 * Parse setting value based on its type
 * @param setting The setting to parse
 * @returns The parsed value
 */
export function parseSettingValue(setting: AppSetting): any {
  try {
    switch (setting.setting_type) {
      case 'boolean':
        return setting.setting_value.toLowerCase() === 'true';
      case 'number':
        return Number(setting.setting_value);
      case 'json':
        return JSON.parse(setting.setting_value);
      default:
        return setting.setting_value;
    }
  } catch (error) {
    logCache('Error parsing setting value', {
      settingName: setting.setting_name,
      settingType: setting.setting_type,
      error
    });
    return null;
  }
}