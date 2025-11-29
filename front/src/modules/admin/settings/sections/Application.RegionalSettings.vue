<!--
  Version: 1.9.0
  File: Application.RegionalSettings.vue - frontend file
  Description: Regional settings configuration including timezone, country, fallback language, and time format
  Purpose: Configure regional application settings with full backend integration and settings store
  Frontend file that manages regional settings UI and integrates with settings store
  
  Changes in v1.5.0:
  - Countries list now loaded dynamically from backend API instead of hardcoded values
  
  Changes in v1.6.0:
  - Reorganized UI into 3 separate blocks: Time Settings, Regions, Languages
  - Added regions table with add/remove functionality (UI-only for now)
  - Added Russian and English language toggles (UI-only for now)
  - Language options now display in lowercase
  - Updated styling to match Application.Security.SessionManagement.vue
  - Added table styling matching Catalog.Settings.vue
  
  Changes in v1.7.0:
  - Integrated regions table with settings system (app.regions setting)
  - Integrated allowed languages toggles with settings system (allowed.languages setting)
  - Regions saved manually via UPDATE button
  - Allowed languages saved automatically on toggle change
  - Changed Region interface: country → value
  - Added loading/error states for new settings
  
  Changes in v1.8.0:
  - Renamed setting from default.language to fallback.language
  - Updated label translations: "default language" → "fallback language" (EN), "язык по умолчанию" → "резервный язык" (RU)
  
  Changes in v1.9.0:
  - Migrated regions block from app.settings to standalone app.regions table
  - Regions now use dedicated CRUD API endpoints
  - Removed app.regions from settings loading
  - Auto-save on blur/Enter for region name edits
  - Removed UPDATE/CANCEL buttons for regions
  - Regions block is now standalone and ready for extraction
-->

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAppSettingsStore } from '@/modules/admin/settings/state.app.settings';
import { fetchSettings } from '@/modules/admin/settings/service.fetch.settings';
import { updateSettingFromComponent } from '@/modules/admin/settings/service.update.settings';
import { useUiStore } from '@/core/state/uistate';
import DataLoading from '@/core/ui/loaders/DataLoading.vue';
import { PhCaretUpDown, PhWarningCircle, PhPlus, PhTrash } from '@phosphor-icons/vue';
import { getCountries } from '@/core/helpers/get.countries';
import type { Region } from '@/modules/admin/settings/types.admin.regions';
import { fetchAllRegions } from '@/modules/admin/settings/service.admin.fetch.regions';
import { createRegion } from '@/modules/admin/settings/service.admin.create.region';
import { updateRegion } from '@/modules/admin/settings/service.admin.update.region';
import { deleteRegions } from '@/modules/admin/settings/service.admin.delete.regions';

// Section path identifier
const section_path = 'Application.RegionalSettings';

// Store references
const appSettingsStore = useAppSettingsStore();
const uiStore = useUiStore();

// Translations
const { t } = useI18n();

// Loading states
const isLoadingSettings = ref(true);

// Flag to track first load vs user changes
const isFirstLoad = ref(true);

// Individual setting loading states
const settingLoadingStates = ref<Record<string, boolean>>({});
const settingErrorStates = ref<Record<string, boolean>>({});
const settingRetryAttempts = ref<Record<string, number>>({});

// Countries list - loaded dynamically from backend
const countriesList = ref<string[]>([]);
const isLoadingCountries = ref(false);

// Local UI state for immediate interaction - initialize with null (not set)
const selectedTimezone = ref<string | null>(null);
const selectedCountry = ref<string | null>(null);
const selectedLanguage = ref<string | null>(null);
const use12HourFormat = ref<boolean | null>(null);

// Regions state - standalone API-based
const regions = ref<Region[]>([]);
const isLoadingRegions = ref(false);
const regionsError = ref<string | null>(null);
const isSavingRegions = ref(false);

// Track new (unsaved) regions with temporary negative IDs
let nextTempId = -1;

// Original state snapshot for change tracking
interface RegionsSnapshot {
  regions: Region[];
}
const regionsOriginal = ref<RegionsSnapshot | null>(null);

// Language toggles state - UI only for now
const russianEnabled = ref<boolean>(false);
const englishEnabled = ref<boolean>(false);

// Generate timezone options from GMT-12 to GMT+14
const timezoneOptions = ref([
  { value: 'GMT-12', title: 'GMT-12' },
  { value: 'GMT-11', title: 'GMT-11' },
  { value: 'GMT-10', title: 'GMT-10' },
  { value: 'GMT-9', title: 'GMT-9' },
  { value: 'GMT-8', title: 'GMT-8' },
  { value: 'GMT-7', title: 'GMT-7' },
  { value: 'GMT-6', title: 'GMT-6' },
  { value: 'GMT-5', title: 'GMT-5' },
  { value: 'GMT-4', title: 'GMT-4' },
  { value: 'GMT-3', title: 'GMT-3' },
  { value: 'GMT-2', title: 'GMT-2' },
  { value: 'GMT-1', title: 'GMT-1' },
  { value: 'GMT', title: 'GMT' },
  { value: 'GMT+1', title: 'GMT+1' },
  { value: 'GMT+2', title: 'GMT+2' },
  { value: 'GMT+3', title: 'GMT+3' },
  { value: 'GMT+4', title: 'GMT+4' },
  { value: 'GMT+5', title: 'GMT+5' },
  { value: 'GMT+6', title: 'GMT+6' },
  { value: 'GMT+7', title: 'GMT+7' },
  { value: 'GMT+8', title: 'GMT+8' },
  { value: 'GMT+9', title: 'GMT+9' },
  { value: 'GMT+10', title: 'GMT+10' },
  { value: 'GMT+11', title: 'GMT+11' },
  { value: 'GMT+12', title: 'GMT+12' },
  { value: 'GMT+13', title: 'GMT+13' },
  { value: 'GMT+14', title: 'GMT+14' }
]);

// Country options - computed to support reactive translations with dynamically loaded countries
const countryOptions = computed(() => {
  return countriesList.value.map(countryCode => ({
    value: countryCode,
    title: t(`admin.settings.application.regionalsettings.countries.${countryCode}`)
  }));
});

// Allowed languages state (full-name identifiers, e.g. 'english', 'russian')
const allowedLanguages = ref<string[]>([]);

// Language options - computed to support reactive translations
// Values are full language names, filtered by allowed.languages
const languageOptions = computed(() => {
  const allLanguages = [
    { value: 'english', title: t('admin.settings.application.regionalsettings.languages.english').toLowerCase() },
    { value: 'russian', title: t('admin.settings.application.regionalsettings.languages.russian').toLowerCase() }
  ];

  if (!allowedLanguages.value.length) {
    return allLanguages;
  }

  const filtered = allLanguages.filter(opt => allowedLanguages.value.includes(opt.value));
  return filtered.length > 0 ? filtered : allLanguages;
});

// Define all settings that need to be loaded (regions are now handled separately via API)
const allSettings = [
  'current.timezone',
  'current.country',
  'fallback.language',
  'time.format.12h',
  'allowed.languages'
];

// Initialize loading states for all settings
allSettings.forEach(settingName => {
  settingLoadingStates.value[settingName] = true;
  settingErrorStates.value[settingName] = false;
  settingRetryAttempts.value[settingName] = 0;
});

/**
 * Check if any settings are still loading
 */
const hasLoadingSettings = computed(() => {
  return Object.values(settingLoadingStates.value).some(loading => loading);
});

/**
 * Check if any settings have errors
 */
const hasErrorSettings = computed(() => {
  return Object.values(settingErrorStates.value).some(error => error);
});

/**
 * Check if a specific setting is disabled (loading or has error)
 */
const isSettingDisabled = (settingName: string) => {
  return settingLoadingStates.value[settingName] || settingErrorStates.value[settingName];
};

/**
 * Update setting in store when local state changes
 */
function updateSetting(settingName: string, value: any) {
  // Only update if setting is not disabled
  if (!isSettingDisabled(settingName)) {
    console.log(`Updating setting ${settingName} to:`, value);
    updateSettingFromComponent(section_path, settingName, value);
  }
}

/**
 * Load a single setting by name
 */
async function loadSetting(settingName: string): Promise<boolean> {
  settingLoadingStates.value[settingName] = true;
  settingErrorStates.value[settingName] = false;
  
  try {
    console.log(`Loading setting: ${settingName}`);
    
    // Try to get setting from cache first
    const cachedSettings = appSettingsStore.getCachedSettings(section_path);
    const cachedSetting = cachedSettings?.find(s => s.setting_name === settingName);
    
    if (cachedSetting) {
      console.log(`Found cached setting: ${settingName}`, cachedSetting.value);
      updateLocalSetting(settingName, cachedSetting.value);
      settingLoadingStates.value[settingName] = false;
      return true;
    }
    
    // If not in cache, fetch from backend
    const settings = await fetchSettings(section_path);
    const setting = settings?.find(s => s.setting_name === settingName);
    
    if (setting) {
      console.log(`Successfully loaded setting: ${settingName}`, setting.value);
      updateLocalSetting(settingName, setting.value);
      settingLoadingStates.value[settingName] = false;
      return true;
    } else {
      throw new Error(`Setting ${settingName} not found`);
    }
  } catch (error) {
    console.error(`Failed to load setting ${settingName}:`, error);
    settingErrorStates.value[settingName] = true;
    settingLoadingStates.value[settingName] = false;
    
    // Try retry if we haven't exceeded attempts
    if (settingRetryAttempts.value[settingName] < 1) {
      settingRetryAttempts.value[settingName]++;
      console.log(`Retrying setting ${settingName} in 5 seconds...`);
      setTimeout(() => loadSetting(settingName), 5000);
    } else {
      // Show error toast only on final failure
      uiStore.showErrorSnackbar(`Ошибка загрузки настройки: ${settingName}`);
    }
    
    return false;
  }
}

/**
 * Update local setting value based on setting name
 */
function updateLocalSetting(settingName: string, value: any) {
  // Helper function to safely convert values without changing null
  const safeString = (val: any) => val === null ? null : String(val);
  const safeBoolean = (val: any) => val === null ? null : Boolean(val);

  switch (settingName) {
    case 'current.timezone':
      selectedTimezone.value = safeString(value);
      break;
    case 'current.country':
      selectedCountry.value = safeString(value);
      break;
    case 'fallback.language':
      selectedLanguage.value = safeString(value);
      break;
    case 'time.format.12h':
      use12HourFormat.value = safeBoolean(value);
      break;
    case 'allowed.languages':
      // Handle allowed languages array: sync with boolean toggles
      const languagesArray = Array.isArray(value) ? value : [];
      russianEnabled.value = languagesArray.includes('russian');
      englishEnabled.value = languagesArray.includes('english');
      allowedLanguages.value = languagesArray;
      break;
  }
}

/**
 * Load all settings from the backend and update local state
 */
async function loadSettings() {
  isLoadingSettings.value = true;
  
  try {
    console.log('Loading settings for Regional Settings');
    
    // Disable watch effects during initial load
    isFirstLoad.value = true;
    
    // Load all settings for the section in one request (force refresh to get new settings)
    const settings = await fetchSettings(section_path, true);
    
    if (settings && settings.length > 0) {
      console.log(`Successfully loaded ${settings.length} settings for section: ${section_path}`);
      
      // Update local state for each setting
      allSettings.forEach(settingName => {
        const setting = settings.find(s => s.setting_name === settingName);
        if (setting) {
          console.log(`Found setting ${settingName}:`, setting.value);
          updateLocalSetting(settingName, setting.value);
          settingLoadingStates.value[settingName] = false;
          settingErrorStates.value[settingName] = false;
        } else {
          console.warn(`Setting ${settingName} not found in loaded settings`);
          console.log('Available settings:', settings.map(s => s.setting_name));
          settingLoadingStates.value[settingName] = false;
          settingErrorStates.value[settingName] = true;
        }
      });
      
      // Enable user changes after all settings are loaded and local state is updated
      // Use nextTick to ensure all synchronous updates complete before enabling watchers
      await nextTick();
      isFirstLoad.value = false;
      
      // Show success toast for initial load
      uiStore.showSuccessSnackbar('настройки успешно загружены');
    } else {
      console.log('No settings loaded - showing errors');
      
      // Mark all settings as failed to load
      allSettings.forEach(settingName => {
        settingLoadingStates.value[settingName] = false;
        settingErrorStates.value[settingName] = true;
      });
      
      // Enable user changes even if no settings loaded
      await nextTick();
      isFirstLoad.value = false;
    }
    
  } catch (error) {
    console.error('Failed to load regional settings:', error);
    
    // Mark all settings as failed to load
    allSettings.forEach(settingName => {
      settingLoadingStates.value[settingName] = false;
      settingErrorStates.value[settingName] = true;
    });
    
    // Enable user changes even on error
    await nextTick();
    isFirstLoad.value = false;
  } finally {
    isLoadingSettings.value = false;
  }
}

/**
 * Retry loading a specific setting
 */
async function retrySetting(settingName: string) {
  settingRetryAttempts.value[settingName] = 0;
  settingErrorStates.value[settingName] = false;
  await loadSetting(settingName);
}

// Watch for changes in local state - only after first load is complete
watch(selectedTimezone, (newValue) => {
  if (!isFirstLoad.value && newValue !== null) {
    updateSetting('current.timezone', newValue);
  }
});

watch(selectedCountry, (newValue) => {
  if (!isFirstLoad.value && newValue !== null) {
    updateSetting('current.country', newValue);
  }
});

watch(selectedLanguage, (newValue) => {
  if (!isFirstLoad.value && newValue !== null) {
    updateSetting('fallback.language', newValue);
  }
});

watch(use12HourFormat, (newValue) => {
  if (!isFirstLoad.value && newValue !== null) {
    updateSetting('time.format.12h', newValue);
  }
});

// Watch for changes in allowed languages - automatic save
watch(russianEnabled, (newValue) => {
  if (!isFirstLoad.value) {
    // Build array from enabled toggles, maintain alphabetical order
    const languagesArray: string[] = [];
    if (englishEnabled.value) languagesArray.push('english');
    if (newValue) languagesArray.push('russian');
    // Sort alphabetically: ["english", "russian"]
    languagesArray.sort();
    
    updateSetting('allowed.languages', languagesArray);
    allowedLanguages.value = languagesArray;

    // Ensure fallback.language stays within allowed languages
    if (selectedLanguage.value && !languagesArray.includes(selectedLanguage.value)) {
      selectedLanguage.value = languagesArray[0] || null;
    }
  }
});

watch(englishEnabled, (newValue) => {
  if (!isFirstLoad.value) {
    // Build array from enabled toggles, maintain alphabetical order
    const languagesArray: string[] = [];
    if (newValue) languagesArray.push('english');
    if (russianEnabled.value) languagesArray.push('russian');
    // Sort alphabetically: ["english", "russian"]
    languagesArray.sort();
    
    updateSetting('allowed.languages', languagesArray);
    allowedLanguages.value = languagesArray;

    // Ensure fallback.language stays within allowed languages
    if (selectedLanguage.value && !languagesArray.includes(selectedLanguage.value)) {
      selectedLanguage.value = languagesArray[0] || null;
    }
  }
});

// Watch for changes in loading state from the store
watch(
  () => appSettingsStore.isLoading,
  (isLoading) => {
    isLoadingSettings.value = isLoading;
  }
);

// Load countries list from backend
async function loadCountries(): Promise<void> {
  try {
    isLoadingCountries.value = true;
    const countries = await getCountries();
    countriesList.value = countries;
  } catch (error) {
    console.error('Failed to load countries:', error);
    // Fallback to hardcoded list on error
    countriesList.value = ['russia', 'kazakhstan'];
  } finally {
    isLoadingCountries.value = false;
  }
}

/**
 * Load all regions from API
 */
async function loadRegions(): Promise<void> {
  isLoadingRegions.value = true;
  regionsError.value = null;
  
  try {
    const response = await fetchAllRegions();
    
    if (response.success && response.data) {
      regions.value = response.data;
      console.log('Regions loaded successfully:', regions.value.length);
      
      // Create snapshot of initial state for change tracking
      createRegionsSnapshot();
    } else {
      throw new Error(response.message || 'Failed to load regions');
    }
  } catch (error) {
    console.error('Failed to load regions:', error);
    regionsError.value = error instanceof Error ? error.message : 'Failed to load regions';
    uiStore.showErrorSnackbar('Ошибка загрузки регионов');
  } finally {
    isLoadingRegions.value = false;
  }
}

/**
 * Create snapshot of current regions state for change tracking
 */
function createRegionsSnapshot(): void {
  regionsOriginal.value = {
    regions: JSON.parse(JSON.stringify(regions.value))
  };
}

/**
 * Check if region is new (not yet saved to database)
 */
function isNewRegion(regionId: number): boolean {
  return regionId < 0;
}

/**
 * Add new region - add locally (no API call)
 */
function addRegion(): void {
  // Add temporary region with negative ID (not yet saved to DB)
  regions.value.push({
    region_id: nextTempId--,
    region_name: '',
    created_at: new Date(),
    updated_at: null
  });
}

/**
 * Validate region name format (only letters and digits, any alphabet)
 */
function validateRegionNameFormat(name: string): { isValid: boolean; error?: string } {
  // Allow empty names (will be filtered later)
  if (!name || name.trim().length === 0) {
    return { isValid: true };
  }
  
  // Check: only letters (any alphabet) and digits, no special characters or punctuation
  // Using Unicode property escapes: \p{L} for letters, \p{N} for digits
  // Allows letters from any alphabet (Latin, Cyrillic, Arabic, etc.) and digits
  const validPattern = /^[\p{L}\p{N}]+$/u;
  
  if (!validPattern.test(name.trim())) {
    return {
      isValid: false,
      error: 'Название региона может содержать только буквы (любой алфавит) и цифры. Спецсимволы и знаки препинания запрещены'
    };
  }
  
  return { isValid: true };
}

/**
 * Update region name locally (no API call, just updates local state)
 */
function updateRegionName(region: Region, newName: string): void {
  const trimmedName = newName.trim();
  
  // Validate length
  if (trimmedName.length > 100) {
    uiStore.showErrorSnackbar('Название региона не может превышать 100 символов');
    return;
  }
  
  // Validate format (only letters and digits)
  const formatValidation = validateRegionNameFormat(trimmedName);
  if (!formatValidation.isValid && formatValidation.error) {
    uiStore.showErrorSnackbar(formatValidation.error);
    return;
  }
  
  // Update local state
  region.region_name = trimmedName;
}

/**
 * Remove region locally (no API call)
 */
function removeRegion(regionId: number): void {
  const index = regions.value.findIndex(r => r.region_id === regionId);
  if (index > -1) {
    regions.value.splice(index, 1);
  }
}

/**
 * Check if there are pending changes compared to original state
 */
const hasRegionsChanges = computed(() => {
  if (!regionsOriginal.value) {
    return false;
  }
  
  const original = regionsOriginal.value;
  
  // Check length
  if (original.regions.length !== regions.value.length) {
    return true;
  }
  
  // Check each region
  for (let i = 0; i < regions.value.length; i++) {
    const current = regions.value[i];
    const orig = original.regions.find(r => r.region_id === current.region_id);
    
    // New region (negative ID) - definitely a change
    if (isNewRegion(current.region_id)) {
      // Only count as change if name is not empty
      if (current.region_name && current.region_name.trim().length > 0) {
        return true;
      }
      continue;
    }
    
    // Region not found in original - it was added (shouldn't happen with our logic, but check anyway)
    if (!orig) {
      return true;
    }
    
    // Check if region name changed
    if (orig.region_name !== current.region_name) {
      return true;
    }
  }
  
  // Check for deleted regions (regions in original but not in current)
  for (const orig of original.regions) {
    const current = regions.value.find(r => r.region_id === orig.region_id);
    if (!current) {
      return true;
    }
  }
  
  return false;
});

/**
 * Cancel changes - reset to initial state
 */
function cancelRegionsChanges(): void {
  if (!regionsOriginal.value) {
    // If no snapshot exists, reload from server
    loadRegions();
    return;
  }
  
  const original = regionsOriginal.value;
  
  // Restore regions from snapshot
  regions.value = JSON.parse(JSON.stringify(original.regions));
  
  // Reset temp ID counter
  nextTempId = -1;
}

/**
 * Update regions - save all changes via API
 */
async function updateRegionsChanges(): Promise<void> {
  if (!regionsOriginal.value || !hasRegionsChanges.value) {
    return;
  }
  
  isSavingRegions.value = true;
  
  try {
    const original = regionsOriginal.value;
    
    // Remove new regions with empty names before processing
    const newEmptyRegions = regions.value.filter(r => 
      isNewRegion(r.region_id) && (!r.region_name || r.region_name.trim().length === 0)
    );
    newEmptyRegions.forEach(emptyRegion => {
      const index = regions.value.findIndex(r => r.region_id === emptyRegion.region_id);
      if (index > -1) {
        regions.value.splice(index, 1);
      }
    });
    
    // Find regions to create (new regions with non-empty names)
    const regionsToCreate: Region[] = regions.value.filter(r => 
      isNewRegion(r.region_id) && r.region_name && r.region_name.trim().length > 0
    );
    
    // Find regions to update (existing regions with changed names)
    const regionsToUpdate: Region[] = regions.value.filter(current => {
      if (isNewRegion(current.region_id)) return false;
      
      const orig = original.regions.find(r => r.region_id === current.region_id);
      if (!orig) return false;
      
      return orig.region_name !== current.region_name && 
             current.region_name && 
             current.region_name.trim().length > 0;
    });
    
    // Find regions to delete (regions in original but not in current)
    const regionsToDelete: number[] = original.regions
      .filter(orig => !regions.value.find(r => r.region_id === orig.region_id))
      .map(r => r.region_id);
    
    // Validate new regions
    for (const region of regionsToCreate) {
      const trimmedName = region.region_name.trim();
      if (trimmedName.length === 0) {
        throw new Error('Название региона не может быть пустым');
      }
      if (trimmedName.length > 100) {
        throw new Error('Название региона не может превышать 100 символов');
      }
      
      // Validate format (only letters and digits)
      const formatValidation = validateRegionNameFormat(trimmedName);
      if (!formatValidation.isValid && formatValidation.error) {
        throw new Error(formatValidation.error);
      }
    }
    
    // Validate updated regions
    for (const region of regionsToUpdate) {
      const trimmedName = region.region_name.trim();
      if (trimmedName.length === 0) {
        throw new Error('Название региона не может быть пустым');
      }
      if (trimmedName.length > 100) {
        throw new Error('Название региона не может превышать 100 символов');
      }
      
      // Validate format (only letters and digits)
      const formatValidation = validateRegionNameFormat(trimmedName);
      if (!formatValidation.isValid && formatValidation.error) {
        throw new Error(formatValidation.error);
      }
    }
    
    // Execute all operations
    const createPromises = regionsToCreate.map(region => 
      createRegion({ region_name: region.region_name.trim() })
    );
    
    const updatePromises = regionsToUpdate.map(region =>
      updateRegion({
        region_id: region.region_id,
        region_name: region.region_name.trim()
      })
    );
    
    // Wait for all create and update operations
    const results = await Promise.all([...createPromises, ...updatePromises]);
    
    // Check for errors in create/update operations
    const errors = results.filter(r => !r.success);
    if (errors.length > 0) {
      throw new Error(errors.map(e => e.message).join('; '));
    }
    
    // Delete regions if any
    if (regionsToDelete.length > 0) {
      const deleteResponse = await deleteRegions({ region_ids: regionsToDelete });
      if (!deleteResponse.success) {
        throw new Error(deleteResponse.message || 'Failed to delete regions');
      }
    }
    
    // Reload regions to get fresh data from server
    await loadRegions();
    
    uiStore.showSuccessSnackbar('Регионы успешно обновлены');
  } catch (error) {
    console.error('Failed to update regions:', error);
    uiStore.showErrorSnackbar(error instanceof Error ? error.message : 'Ошибка обновления регионов');
  } finally {
    isSavingRegions.value = false;
  }
}

/**
 * Table headers for regions table
 */
interface TableHeader {
  title: string;
  key: string;
  width?: string;
  sortable?: boolean;
}

const regionsTableHeaders = computed<TableHeader[]>(() => [
  { title: 'region', key: 'region', width: '85%' },
  { title: 'actions', key: 'actions', width: '15%', sortable: false }
]);

// Initialize component
onMounted(async () => {
  console.log('Application.RegionalSettings component initialized');
  
  // Load countries list first
  await loadCountries();
  
  // Clear cache to ensure we get fresh data including new settings
  appSettingsStore.clearSectionCache(section_path);
  console.log('Cleared cache for Regional Settings section to ensure fresh data load');
  
  // Load settings (time settings and languages)
  loadSettings();
  
  // Load regions separately via API
  loadRegions();
});
</script>

<template>
  <div class="regional-settings-container">
    <h2 class="text-h6 mb-4">
      {{ t('admin.settings.application.regionalsettings.title') }}
    </h2>
    
    <!-- Loading indicator -->
    <DataLoading
      :loading="isLoadingSettings"
      size="medium"
    />
    
    <!-- Settings content (only shown when not loading) -->
    <div
      v-if="!isLoadingSettings"
      class="settings-section"
    >
      <div class="section-content">
        <!-- ==================== TIME SETTINGS BLOCK ==================== -->
        <div class="settings-group mb-6">
          <h3 class="text-subtitle-1 mb-4 font-weight-medium">
            {{ t('admin.settings.application.regionalsettings.time.settings.title') }}
          </h3>
          
          <!-- Timezone Selection -->
          <div class="d-flex align-center mb-3">
            <v-select
              v-model="selectedTimezone"
              :items="timezoneOptions"
              :label="t('admin.settings.application.regionalsettings.timezone.label')"
              variant="outlined"
              color="teal-darken-2"
              density="comfortable"
              item-title="title"
              item-value="value"
              style="max-width: 300px;"
              :disabled="isSettingDisabled('current.timezone')"
              :loading="settingLoadingStates['current.timezone']"
            >
              <template #append-inner>
                <PhCaretUpDown class="dropdown-icon" />
              </template>
            </v-select>
            <v-tooltip
              v-if="settingErrorStates['current.timezone']"
              location="top"
              max-width="300"
            >
              <template #activator="{ props }">
                <span v-bind="props" style="cursor: pointer;" @click="retrySetting('current.timezone')">
                  <PhWarningCircle :size="16" class="ms-2" />
                </span>
              </template>
              <div class="pa-2">
                <p class="text-subtitle-2 mb-2">
                  ошибка загрузки настройки
                </p>
                <p class="text-caption">
                  нажмите для повторной попытки
                </p>
              </div>
            </v-tooltip>
          </div>

          <!-- 12-Hour Format Toggle -->
          <div class="d-flex align-center mb-3">
            <v-switch
              v-model="use12HourFormat"
              color="teal-darken-2"
              :label="t('admin.settings.application.regionalsettings.time12h.label')"
              hide-details
              :disabled="isSettingDisabled('time.format.12h')"
              :loading="settingLoadingStates['time.format.12h']"
              density="compact"
            />
            <v-tooltip
              v-if="settingErrorStates['time.format.12h']"
              location="top"
              max-width="300"
            >
              <template #activator="{ props }">
                <span v-bind="props" style="cursor: pointer;" @click="retrySetting('time.format.12h')">
                  <PhWarningCircle :size="16" class="ms-2" />
                </span>
              </template>
              <div class="pa-2">
                <p class="text-subtitle-2 mb-2">
                  ошибка загрузки настройки
                </p>
                <p class="text-caption">
                  нажмите для повторной попытки
                </p>
              </div>
            </v-tooltip>
          </div>
        </div>

        <!-- ==================== REGIONS BLOCK ==================== -->
        <div class="settings-group mb-6">
          <div class="d-flex align-center mb-4">
            <h3 class="text-subtitle-1 font-weight-medium">
              {{ t('admin.settings.application.regionalsettings.regions.title') }}
            </h3>
            <v-tooltip
              v-if="regionsError"
              location="top"
              max-width="300"
            >
              <template #activator="{ props }">
                <span v-bind="props" style="cursor: pointer;" @click="loadRegions" class="ms-2">
                  <PhWarningCircle :size="16" />
                </span>
              </template>
              <div class="pa-2">
                <p class="text-subtitle-2 mb-2">
                  ошибка загрузки регионов
                </p>
                <p class="text-caption">
                  {{ regionsError }}
                </p>
                <p class="text-caption mt-1">
                  нажмите для повторной попытки
                </p>
              </div>
            </v-tooltip>
          </div>
          
          <!-- Loading state for regions -->
          <DataLoading
            v-if="isLoadingRegions"
            :loading="isLoadingRegions"
            size="small"
          />
          
          <div
            v-else
            class="regions-table-wrapper"
          >
            <v-data-table
              :headers="regionsTableHeaders"
              :items="regions"
              :items-per-page="-1"
              hide-default-footer
              class="regions-table"
            >
              <template #[`item.region`]="{ item }">
                <v-text-field
                  :model-value="item.region_name"
                  variant="plain"
                  density="compact"
                  hide-details
                  class="region-input"
                  :placeholder="isNewRegion(item.region_id) ? t('admin.settings.application.regionalsettings.regions.placeholder') : ''"
                  @update:model-value="updateRegionName(item, $event)"
                  maxlength="100"
                />
              </template>

              <template #[`item.actions`]="{ item }">
                <v-btn
                  icon
                  size="small"
                  color="error"
                  variant="text"
                  @click="removeRegion(item.region_id)"
                >
                  <PhTrash :size="18" />
                </v-btn>
              </template>
            </v-data-table>
          </div>

          <div class="table-actions mt-4">
            <v-btn
              color="teal"
              variant="outlined"
              :disabled="isLoadingRegions"
              @click="addRegion"
            >
              <template #prepend>
                <PhPlus />
              </template>
              {{ t('admin.settings.application.regionalsettings.regions.actions.add').toUpperCase() }}
            </v-btn>
            <v-btn
              color="grey"
              variant="outlined"
              :disabled="isLoadingRegions || !hasRegionsChanges"
              class="ms-2"
              @click="cancelRegionsChanges"
            >
              {{ t('admin.settings.application.regionalsettings.regions.actions.cancel').toUpperCase() }}
            </v-btn>
            <v-btn
              color="teal"
              variant="outlined"
              :disabled="!hasRegionsChanges || isSavingRegions"
              :loading="isSavingRegions"
              :class="['ms-2', { 'btn-glow-active': hasRegionsChanges && !isSavingRegions }]"
              @click="updateRegionsChanges"
            >
              {{ t('admin.settings.application.regionalsettings.regions.actions.update').toUpperCase() }}
            </v-btn>
          </div>
        </div>

        <!-- ==================== LANGUAGES BLOCK ==================== -->
        <div class="settings-group mb-6">
          <h3 class="text-subtitle-1 mb-4 font-weight-medium">
            {{ t('admin.settings.application.regionalsettings.languages.title') }}
          </h3>
          
          <!-- Default Language Selection -->
          <div class="d-flex align-center mb-3">
            <v-select
              v-model="selectedLanguage"
              :items="languageOptions"
              :label="t('admin.settings.application.regionalsettings.language.label')"
              variant="outlined"
              color="teal-darken-2"
              density="comfortable"
              item-title="title"
              item-value="value"
              style="max-width: 300px;"
              :disabled="isSettingDisabled('fallback.language')"
              :loading="settingLoadingStates['fallback.language']"
            >
              <template #append-inner>
                <PhCaretUpDown class="dropdown-icon" />
              </template>
            </v-select>
            <v-tooltip
              v-if="settingErrorStates['fallback.language']"
              location="top"
              max-width="300"
            >
              <template #activator="{ props }">
                <span v-bind="props" style="cursor: pointer;" @click="retrySetting('fallback.language')">
                  <PhWarningCircle :size="16" class="ms-2" />
                </span>
              </template>
              <div class="pa-2">
                <p class="text-subtitle-2 mb-2">
                  ошибка загрузки настройки
                </p>
                <p class="text-caption">
                  нажмите для повторной попытки
                </p>
              </div>
            </v-tooltip>
          </div>

          <!-- Allowed Languages Section -->
          <div class="mb-3">
            <h4 class="text-subtitle-2 mb-3 font-weight-medium">
              {{ t('admin.settings.application.regionalsettings.allowed.languages.label') }}
            </h4>
            
            <!-- Russian Language Toggle -->
            <div class="d-flex align-center mb-3">
              <v-switch
                v-model="russianEnabled"
                color="teal-darken-2"
                label="russian"
                hide-details
                density="compact"
                :disabled="isSettingDisabled('allowed.languages')"
                :loading="settingLoadingStates['allowed.languages']"
              />
              <v-tooltip
                v-if="settingErrorStates['allowed.languages']"
                location="top"
                max-width="300"
              >
                <template #activator="{ props }">
                  <span v-bind="props" style="cursor: pointer;" @click="retrySetting('allowed.languages')">
                    <PhWarningCircle :size="16" class="ms-2" />
                  </span>
                </template>
                <div class="pa-2">
                  <p class="text-subtitle-2 mb-2">
                    ошибка загрузки настройки
                  </p>
                  <p class="text-caption">
                    нажмите для повторной попытки
                  </p>
                </div>
              </v-tooltip>
            </div>

            <!-- English Language Toggle -->
            <div class="d-flex align-center mb-3">
              <v-switch
                v-model="englishEnabled"
                color="teal-darken-2"
                label="english"
                hide-details
                density="compact"
                :disabled="isSettingDisabled('allowed.languages')"
                :loading="settingLoadingStates['allowed.languages']"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Dropdown icon positioning */
.dropdown-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.regional-settings-container {
  position: relative;
}

.settings-section {
  padding: 16px 0;
  transition: background-color 0.2s ease;
}

.settings-section:hover {
  background-color: rgba(0, 0, 0, 0.01);
}

.settings-group {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  padding: 16px;
  background-color: rgba(0, 0, 0, 0.02);
}

.section-content {
  max-width: 600px;
}

/* Regions table styles - matching Catalog.Settings.vue */
.regions-table-wrapper {
  width: 100%;
}

.regions-table {
  width: 100%;
}

.regions-table :deep(.v-data-table-footer) {
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.regions-table :deep(.v-data-table__tr) {
  position: relative;
}

.regions-table :deep(.v-data-table__tr::after) {
  content: '';
  position: absolute;
  bottom: 0;
  left: 7px;
  right: 7px;
  height: 1px;
  background-color: rgba(var(--v-border-color), var(--v-border-opacity));
}

.regions-table :deep(tbody > tr:last-child::after) {
  display: none;
}

.regions-table :deep(.v-data-table__td),
.regions-table :deep(.v-data-table__th) {
  border-bottom: none !important;
}

/* Header bottom separator */
.regions-table :deep(thead) {
  position: relative;
}

.regions-table :deep(thead::after) {
  content: '';
  position: absolute;
  bottom: 0;
  left: 7px;
  right: 7px;
  height: 1px;
  background-color: rgba(var(--v-border-color), var(--v-border-opacity));
}

/* Region input field styles - remove borders */
.region-input {
  max-width: 100%;
}

.region-input :deep(.v-field) {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
  position: relative;
}

.region-input :deep(.v-field__outline) {
  display: none !important;
}

.region-input :deep(.v-field__input) {
  padding: 0 !important;
}

.table-actions {
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

/* Update button glow animation when active */
.btn-glow-active {
  animation: soft-glow 2s ease-in-out infinite;
  box-shadow: 0 0 8px rgba(20, 184, 166, 0.3);
}

@keyframes soft-glow {
  0%, 100% {
    box-shadow: 0 0 8px rgba(20, 184, 166, 0.3);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 16px rgba(20, 184, 166, 0.5);
    transform: scale(1.01);
  }
}
</style>

