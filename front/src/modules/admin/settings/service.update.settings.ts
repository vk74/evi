/**
 * service.update.settings.ts
 * 
 * Service for updating application settings.
 * Communicates with the backend API to update settings and shows feedback via snackbars.
 */

import { api } from '@/core/api/service.axios';
import { useAppSettingsStore } from './state.app.settings';
import { useUiStore } from '@/core/state/uistate';
import { AppSetting, UpdateSettingRequest, UpdateSettingResponse } from './types.settings';
import { useDebounceFn } from '@vueuse/core';

/**
 * Updates a setting value on the backend
 * 
 * @param sectionPath - The section path of the setting to update
 * @param settingName - The name of the setting to update
 * @param value - The new value for the setting
 * @returns Promise resolving to the updated setting or null if update failed
 */
export async function updateSetting(
  sectionPath: string, 
  settingName: string, 
  value: any
): Promise<AppSetting | null> {
  const store = useAppSettingsStore();
  const uiStore = useUiStore();
  
  console.log(`Updating setting ${sectionPath}.${settingName} with value:`, value);

  try {
    // Prepare request data
    const requestData: UpdateSettingRequest = {
      sectionPath,
      settingName,
      value
    };
    
    // Make API request
    const response = await api.post<UpdateSettingResponse>(
      '/api/core/settings/update-settings',
      requestData
    );
    
    // Handle response
    if (response.data.success && response.data.updatedSetting) {
      console.log(`Setting ${sectionPath}.${settingName} updated successfully`, response.data.updatedSetting);
      
      // Update local cache with new value
      store.updateCachedSetting(sectionPath, settingName, response.data.updatedSetting);
      
      // Show success message
      uiStore.showSuccessSnackbar(`Настройка успешно обновлена`);
      
      return response.data.updatedSetting;
    } else {
      // Handle error
      const errorMessage = response.data.error || 'Неизвестная ошибка';
      console.error(`Failed to update setting ${sectionPath}.${settingName}:`, errorMessage);
      
      // Show error message
      uiStore.showErrorSnackbar(`Ошибка обновления настройки: ${errorMessage}`);
      
      return null;
    }
  } catch (error) {
    // Handle exception
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    console.error(`Exception updating setting ${sectionPath}.${settingName}:`, error);
    
    // Show error message
    uiStore.showErrorSnackbar(`Ошибка при обновлении настройки: ${errorMessage}`);
    
    return null;
  }
}

/**
 * Debounced version of the updateSetting function
 * Delays the actual update request by 750ms to avoid excessive API calls
 */
export const debouncedUpdateSetting = useDebounceFn(updateSetting, 750);

/**
 * Updates a setting when a component changes its value
 * This function is intended to be called from component v-model bindings
 * 
 * @param sectionPath - The section path of the setting
 * @param settingName - The name of the setting
 * @param value - The new value for the setting
 */
export function updateSettingFromComponent(
  sectionPath: string,
  settingName: string,
  value: any
): void {
  const store = useAppSettingsStore();
  
  // Update local store immediately for responsive UI
  store.setSetting(sectionPath, settingName, value);
  
  // Debounce the actual API update
  debouncedUpdateSetting(sectionPath, settingName, value);
}