/**
 * cache.settings.ts - backend file
 * version: 1.0.05
 * In-memory cache for application settings.
 * Uses event bus for logging operations.
 */

import { AppSetting, SettingsCache } from './types.settings';
import fabricEvents from '../../../core/eventBus/fabric.events';
import { SETTINGS_CACHE_EVENTS, SETTINGS_FALLBACK_EVENTS } from './events.settings';

/**
 * Safe event creation that handles cases when event system is not yet initialized
 */
function createEventSafely(eventName: string, payload?: any, errorData?: string): void {
  try {
    fabricEvents.createAndPublishEvent({
      eventName,
      payload,
      errorData
    });
  } catch (error) {
    // If event system is not ready, fall back to console logging  
    const message = `[SettingsCache] ${eventName}`;
    if (errorData) {
      console.error(message, payload || '', 'Error:', errorData);
      // Also try to publish fallback error event
      try {
        fabricEvents.createAndPublishEvent({
          eventName: SETTINGS_FALLBACK_EVENTS.CACHE_FALLBACK_ERROR.eventName,
          payload: {
            eventName,
            payload,
            errorData
          },
          errorData: errorData
        });
      } catch (fallbackError) {
        // If even fallback event fails, just log to console
        console.error('[SettingsCache] Fallback event failed:', fallbackError);
      }
    } else if (payload) {
      console.log(message, payload);
      // Also try to publish fallback log event
      try {
        fabricEvents.createAndPublishEvent({
          eventName: SETTINGS_FALLBACK_EVENTS.CACHE_FALLBACK_LOG.eventName,
          payload: {
            eventName,
            payload
          }
        });
      } catch (fallbackError) {
        // If even fallback event fails, just log to console
        console.error('[SettingsCache] Fallback event failed:', fallbackError);
      }
    } else {
      console.log(message);
      // Also try to publish fallback log event
      try {
        fabricEvents.createAndPublishEvent({
          eventName: SETTINGS_FALLBACK_EVENTS.CACHE_FALLBACK_LOG.eventName,
          payload: {
            eventName
          }
        });
      } catch (fallbackError) {
        // If even fallback event fails, just log to console
        console.error('[SettingsCache] Fallback event failed:', fallbackError);
      }
    }
  }
}

// In-memory cache object
let settingsCache: SettingsCache = {};

/**
 * Generate cache key from section_path and setting_name
 * This should match the key generation in service.load.settings.ts
 */
function generateCacheKey(sectionPath: string, settingName: string): string {
  return `${sectionPath}/${settingName}`;
}

/**
 * Set the entire cache contents
 * @param settings Array of settings to cache
 */
export function setCache(settings: AppSetting[]): void {
  settingsCache = settings.reduce((cache, setting) => {
    const cacheKey = generateCacheKey(setting.section_path, setting.setting_name);
    cache[cacheKey] = setting;
    return cache;
  }, {} as SettingsCache);

  const sectionSet = new Set(settings.map(s => s.section_path));
  

  
  createEventSafely(SETTINGS_CACHE_EVENTS.INITIALIZED.eventName, {
    settingsCount: settings.length,
    sectionsCount: sectionSet.size
  });
  
  createEventSafely(SETTINGS_CACHE_EVENTS.SECTIONS_INFO.eventName, {
    sections: Array.from(sectionSet)
  });
}

/**
 * Clear the entire cache
 */
export function clearCache(): void {
  settingsCache = {};
  
  createEventSafely(SETTINGS_CACHE_EVENTS.CLEARED.eventName, null);
}

/**
 * Get a setting value by section path and name
 * @param sectionPath The section path of the setting
 * @param settingName The unique name of the setting
 * @returns The setting value or null if not found
 */
export function getSetting(sectionPath: string, settingName: string): AppSetting | null {
  const cacheKey = generateCacheKey(sectionPath, settingName);
  const setting = settingsCache[cacheKey];

  if (!setting) {
    createEventSafely(SETTINGS_CACHE_EVENTS.SETTING_NOT_FOUND.eventName, {
      sectionPath,
      settingName
    });
    return null;
  }

  return setting;
}

/**
 * Get all cached settings
 * @returns Object containing all cached settings
 */
export function getAllSettings(): SettingsCache {
  return settingsCache;
}

/**
 * Check if a setting exists in cache
 * @param sectionPath The section path of the setting
 * @param settingName The unique name of the setting
 * @returns boolean indicating if setting exists
 */
export function hasSetting(sectionPath: string, settingName: string): boolean {
  const cacheKey = generateCacheKey(sectionPath, settingName);
  return cacheKey in settingsCache;
}

/**
 * Parse setting value based on its type
 * @param setting The setting to parse
 * @returns The parsed value
 */
export function parseSettingValue(setting: AppSetting): any {
  try {
    return setting.value !== null ? setting.value : setting.default_value;
  } catch (error) {
    createEventSafely(
      SETTINGS_CACHE_EVENTS.PARSE_VALUE_ERROR.eventName, 
      { settingName: setting.setting_name },
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}

/**
 * Update a single setting in the cache
 * @param setting The updated setting object to cache
 * @returns boolean indicating if the update was successful
 */
export function updateCachedSetting(setting: AppSetting): boolean {
  const cacheKey = generateCacheKey(setting.section_path, setting.setting_name);
  settingsCache[cacheKey] = setting;
  
  createEventSafely(SETTINGS_CACHE_EVENTS.SETTING_UPDATED.eventName, {
    sectionPath: setting.section_path,
    settingName: setting.setting_name
  });
  
  return true;
}