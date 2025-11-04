/**
 * Version: 1.0.0
 * Universal helper for getting any setting value from application settings system.
 * Frontend file that provides wrapper over getSettingValue from service.fetch.settings.ts.
 * Returns null if setting not found or is confidential, otherwise returns setting value.
 * Uses settings cache (TTL 5 minutes).
 * Filename: get.setting.value.ts (frontend)
 */

import { fetchSettings, getSettingValue } from '@/modules/admin/settings/service.fetch.settings';
import type { AppSetting } from '@/modules/admin/settings/types.settings';

/**
 * Get setting value by section path and setting name
 * @param sectionPath - Section path (e.g., 'Admin.Catalog.CountryProductPricelistID')
 * @param settingName - Setting name (e.g., 'country.product.price.list.mapping')
 * @returns Promise that resolves to setting value or null if not found or confidential
 */
export async function getSettingValueHelper<T = any>(
  sectionPath: string,
  settingName: string
): Promise<T | null> {
  try {
    // First, try to fetch settings to ensure cache is populated
    await fetchSettings(sectionPath, false);
    
    // Get setting value from cache
    // Use getSettingValue with null as default to check if setting exists
    const settings = await fetchSettings(sectionPath, false);
    const setting = settings.find(s => s.setting_name === settingName);
    
    if (!setting) {
      return null;
    }
    
    // Check if setting is confidential
    if (setting.confidentiality === true) {
      return null;
    }
    
    // Return setting value
    return (setting.value !== null && setting.value !== undefined) ? setting.value as T : null;
  } catch (error) {
    console.error(`[getSettingValueHelper] Error getting setting ${settingName} from ${sectionPath}:`, error);
    return null;
  }
}

/**
 * Get setting value synchronously from cache (if available)
 * @param sectionPath - Section path
 * @param settingName - Setting name
 * @returns Setting value or null if not found in cache or confidential
 */
export function getSettingValueSync<T = any>(
  sectionPath: string,
  settingName: string
): T | null {
  try {
    const { useAppSettingsStore } = require('@/modules/admin/settings/state.app.settings');
    const store = useAppSettingsStore();
    const settings = store.getCachedSettings(sectionPath);
    
    if (!settings) {
      return null;
    }
    
    const setting = settings.find(s => s.setting_name === settingName);
    
    if (!setting) {
      return null;
    }
    
    // Check if setting is confidential
    if (setting.confidentiality === true) {
      return null;
    }
    
    // Return setting value
    return (setting.value !== null && setting.value !== undefined) ? setting.value as T : null;
  } catch (error) {
    console.error(`[getSettingValueSync] Error getting setting ${settingName} from ${sectionPath}:`, error);
    return null;
  }
}

