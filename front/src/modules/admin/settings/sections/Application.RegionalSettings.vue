<!--
  Version: 1.5.0
  File: Application.RegionalSettings.vue - frontend file
  Description: Regional settings configuration including timezone, country, default language, and time format
  Purpose: Configure regional application settings with full backend integration and settings store
  Frontend file that manages regional settings UI and integrates with settings store
  Updated: Added 12-hour AM/PM time format toggle setting
  
  Changes in v1.5.0:
  - Countries list now loaded dynamically from backend API instead of hardcoded values
-->

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAppSettingsStore } from '@/modules/admin/settings/state.app.settings';
import { fetchSettings } from '@/modules/admin/settings/service.fetch.settings';
import { updateSettingFromComponent } from '@/modules/admin/settings/service.update.settings';
import { useUiStore } from '@/core/state/uistate';
import DataLoading from '@/core/ui/loaders/DataLoading.vue';
import { PhCaretUpDown, PhWarningCircle } from '@phosphor-icons/vue';
import { getCountries } from '@/core/helpers/get.countries';

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

// Language options - computed to support reactive translations
// Values are ISO 639-1 language codes
const languageOptions = computed(() => [
  { value: 'en', title: t('admin.settings.application.regionalsettings.languages.english') },
  { value: 'ru', title: t('admin.settings.application.regionalsettings.languages.russian') }
]);

// Define all settings that need to be loaded
const allSettings = [
  'current.timezone',
  'current.country',
  'default.language',
  'time.format.12h'
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
    case 'default.language':
      selectedLanguage.value = safeString(value);
      break;
    case 'time.format.12h':
      use12HourFormat.value = safeBoolean(value);
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
    updateSetting('default.language', newValue);
  }
});

watch(use12HourFormat, (newValue) => {
  if (!isFirstLoad.value && newValue !== null) {
    updateSetting('time.format.12h', newValue);
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

// Initialize component
onMounted(async () => {
  console.log('Application.RegionalSettings component initialized');
  
  // Load countries list first
  await loadCountries();
  
  // Clear cache to ensure we get fresh data including new settings
  appSettingsStore.clearSectionCache(section_path);
  console.log('Cleared cache for Regional Settings section to ensure fresh data load');
  
  loadSettings();
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
        <!-- Timezone Selection and 12H Format Toggle Row -->
        <div class="mb-6">
          <div class="timezone-row">
            <!-- Timezone Selection -->
            <div class="timezone-select-container">
              <v-select
                v-model="selectedTimezone"
                :items="timezoneOptions"
                :label="t('admin.settings.application.regionalsettings.timezone.label')"
                variant="outlined"
                color="teal-darken-2"
                density="comfortable"
                item-title="title"
                item-value="value"
                class="regional-select"
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
                    Ошибка загрузки настройки
                  </p>
                  <p class="text-caption">
                    Нажмите для повторной попытки
                  </p>
                </div>
              </v-tooltip>
            </div>

            <!-- 12-Hour Format Toggle -->
            <div class="time-format-toggle-container">
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
                    Ошибка загрузки настройки
                  </p>
                  <p class="text-caption">
                    Нажмите для повторной попытки
                  </p>
                </div>
              </v-tooltip>
            </div>
          </div>
        </div>

        <!-- Country Selection -->
        <div class="mb-6">
          <div class="d-flex align-center">
            <v-select
              v-model="selectedCountry"
              :items="countryOptions"
              :label="t('admin.settings.application.regionalsettings.country.label')"
              variant="outlined"
              color="teal-darken-2"
              density="comfortable"
              item-title="title"
              item-value="value"
              class="regional-select"
              :disabled="isSettingDisabled('current.country') || isLoadingCountries"
              :loading="settingLoadingStates['current.country'] || isLoadingCountries"
            >
              <template #append-inner>
                <PhCaretUpDown class="dropdown-icon" />
              </template>
            </v-select>
            <v-tooltip
              v-if="settingErrorStates['current.country']"
              location="top"
              max-width="300"
            >
              <template #activator="{ props }">
                <span v-bind="props" style="cursor: pointer;" @click="retrySetting('current.country')">
                  <PhWarningCircle :size="16" class="ms-2" />
                </span>
              </template>
              <div class="pa-2">
                <p class="text-subtitle-2 mb-2">
                  Ошибка загрузки настройки
                </p>
                <p class="text-caption">
                  Нажмите для повторной попытки
                </p>
              </div>
            </v-tooltip>
          </div>
        </div>

        <!-- Default Language Selection -->
        <div class="mb-6">
          <div class="d-flex align-center">
            <v-select
              v-model="selectedLanguage"
              :items="languageOptions"
              :label="t('admin.settings.application.regionalsettings.language.label')"
              variant="outlined"
              color="teal-darken-2"
              density="comfortable"
              item-title="title"
              item-value="value"
              class="regional-select"
              :disabled="isSettingDisabled('default.language')"
              :loading="settingLoadingStates['default.language']"
            >
              <template #append-inner>
                <PhCaretUpDown class="dropdown-icon" />
              </template>
            </v-select>
            <v-tooltip
              v-if="settingErrorStates['default.language']"
              location="top"
              max-width="300"
            >
              <template #activator="{ props }">
                <span v-bind="props" style="cursor: pointer;" @click="retrySetting('default.language')">
                  <PhWarningCircle :size="16" class="ms-2" />
                </span>
              </template>
              <div class="pa-2">
                <p class="text-subtitle-2 mb-2">
                  Ошибка загрузки настройки
                </p>
                <p class="text-caption">
                  Нажмите для повторной попытки
                </p>
              </div>
            </v-tooltip>
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
}

.section-content {
  max-width: 600px;
}

.regional-select {
  max-width: 200px;
}

/* Timezone row layout */
.timezone-row {
  display: flex;
  align-items: top;
  gap: 40px;
  flex-wrap: nowrap;
}

.timezone-select-container {
  display: flex;
  align-items: center;
  min-width: 200px;
}

.time-format-toggle-container {
  display: flex;
  align-items: center;
  min-width: 250px;
  flex-shrink: 0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .timezone-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .timezone-select-container,
  .time-format-toggle-container {
    min-width: auto;
    width: 100%;
  }
}
</style>

