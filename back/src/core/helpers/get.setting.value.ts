/**
 * get.setting.value.ts - backend file
 * version: 1.0.0
 * 
 * Purpose: Helper for retrieving application settings values
 * Logic: Abstraction layer for settings retrieval from cache
 * Architecture: Designed to support future migration to external cache (valkey/memcached)
 *               without changes to consumer services
 */

import { getAllSettings } from '../../modules/admin/settings/cache.settings';

/**
 * Get setting value by section path and name
 * Returns setting value or default value if not found
 * 
 * @param sectionPath - Section path (e.g., 'Catalog.Products')
 * @param settingName - Setting name (e.g., 'display.optionsOnlyProducts')
 * @param defaultValue - Default value to return if setting not found
 * @returns Setting value or default value
 */
export async function getSettingValue<T>(
  sectionPath: string,
  settingName: string,
  defaultValue: T
): Promise<T> {
  const allSettings = getAllSettings();
  const settingsArray = Object.values(allSettings);
  
  const setting = settingsArray.find(
    s => s.section_path === sectionPath && s.setting_name === settingName
  );
  
  if (!setting || setting.value === null || setting.value === undefined) {
    return defaultValue;
  }
  
  return setting.value as T;
}

