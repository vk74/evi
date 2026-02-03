/**
 * @file service.update.settings.ts
 * Version: 1.1.0
 * Service for updating application settings.
 * Frontend file that communicates with backend API to update settings and shows feedback via snackbars.
 * 
 * Changes in v1.1.0:
 * - Added optimistic UI update rollback mechanism
 * - updateSetting now accepts optional originalValue to restore if API call fails
 * - updateSettingFromComponent captures original value before optimistic update
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
 * @param originalValue - The original value to restore if update fails (optional)
 * @returns Promise resolving to the updated setting or null if update failed
 */
export async function updateSetting(
  sectionPath: string, 
  settingName: string, 
  value: any,
  originalValue?: any
): Promise<AppSetting | null> {
  console.log('🔥 updateSetting called:', { sectionPath, settingName, value });
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
      uiStore.showSuccessSnackbar(`Setting updated successfully`);
      
      return response.data.updatedSetting;
    } else {
      // Handle error
      const errorMessage = response.data.error || 'Unknown error';
      console.error(`Failed to update setting ${sectionPath}.${settingName}:`, errorMessage);
      
      // Rollback optimistic update if original value provided
      if (originalValue !== undefined) {
        console.warn(`Restoring original value for ${sectionPath}.${settingName}`);
        store.rollbackSetting(sectionPath, settingName, originalValue);
      }
      
      // Show error message
      uiStore.showErrorSnackbar(`Error updating setting: ${errorMessage}`);
      
      return null;
    }
  } catch (error) {
    // Handle exception
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Exception updating setting ${sectionPath}.${settingName}:`, error);
    
    // Rollback optimistic update if original value provided
    if (originalValue !== undefined) {
      console.warn(`Restoring original value for ${sectionPath}.${settingName}`);
      store.rollbackSetting(sectionPath, settingName, originalValue);
    }
    
    // Show error message
    uiStore.showErrorSnackbar(`Error updating setting: ${errorMessage}`);
    
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
  console.log('🚀 updateSettingFromComponent called:', { sectionPath, settingName, value });
  const store = useAppSettingsStore();
  
  // Capture original value for rollback BEFORE updating store
  let originalValue = undefined;
  const cachedSettings = store.getCachedSettings(sectionPath);
  if (cachedSettings) {
    const setting = cachedSettings.find(s => s.setting_name === settingName);
    if (setting) {
      // Clone value if object/array to avoid reference issues, otherwise primitive is fine
      // For simple settings primitive copy is enough
      originalValue = setting.value;
    }
  }

  // Update local store immediately for responsive UI
  console.log('💾 Updating local store...');
  store.setSetting(sectionPath, settingName, value);
  
  // Debounce the actual API update
  console.log('⏰ Scheduling debounced API update...');
  debouncedUpdateSetting(sectionPath, settingName, value, originalValue);
}

/**
 * Updates multiple settings at once
 * 
 * @param updates - Array of setting updates to perform
 * @returns Promise resolving to array of results for each update
 */
export async function updateMultipleSettings(
  updates: Array<{ sectionPath: string; settingName: string; value: any }>
): Promise<Array<{ success: boolean; settingName: string; error?: string }>> {
  const uiStore = useUiStore();
  
  console.log(`Updating ${updates.length} settings:`, updates);

  try {
    // Process all updates in parallel
    const results = await Promise.allSettled(
      updates.map(async ({ sectionPath, settingName, value }) => {
        try {
          const result = await updateSetting(sectionPath, settingName, value);
          return {
            success: !!result,
            settingName,
            error: result ? undefined : 'Update failed'
          };
        } catch (error) {
          return {
            success: false,
            settingName,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    // Process results
    const processedResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          success: false,
          settingName: updates[index]?.settingName || 'unknown',
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error'
        };
      }
    });

    // Count successes and failures
    const successCount = processedResults.filter(r => r.success).length;
    const failureCount = processedResults.filter(r => !r.success).length;

    if (failureCount === 0) {
      uiStore.showSuccessSnackbar(`All settings updated successfully (${successCount})`);
    } else if (successCount === 0) {
      uiStore.showErrorSnackbar(`Error updating settings (${failureCount})`);
    } else {
      uiStore.showErrorSnackbar(`Updated ${successCount} settings, errors: ${failureCount}`);
    }

    return processedResults;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Exception updating multiple settings:', error);
    uiStore.showErrorSnackbar(`Error during bulk settings update: ${errorMessage}`);
    
    return updates.map(({ settingName }) => ({
      success: false,
      settingName,
      error: errorMessage
    }));
  }
}