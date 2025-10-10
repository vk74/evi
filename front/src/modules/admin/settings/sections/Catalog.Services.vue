<!--
  File: Catalog.Services.vue - frontend file
  Description: Catalog services settings administration module
  Purpose: Configure catalog services-related settings and parameters
  Version: 1.1.0
  
  Features:
  - Service card color picker with preset colors
  - Settings cache integration
  - Loading states and error handling
  - Retry functionality for failed settings
-->

<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAppSettingsStore } from '@/modules/admin/settings/state.app.settings';
import { fetchSettings } from '@/modules/admin/settings/service.fetch.settings';
import { updateSettingFromComponent } from '@/modules/admin/settings/service.update.settings';
import { useUiStore } from '@/core/state/uistate';
import DataLoading from '@/core/ui/loaders/DataLoading.vue';
import { PhPaintBrush } from '@phosphor-icons/vue';
import { getRgbFromHex } from '@/core/helpers/color.helpers';

// Section path identifier
const section_path = 'Catalog.Services';

// Store references
const appSettingsStore = useAppSettingsStore();
const uiStore = useUiStore();

// Translations
const { t, locale } = useI18n();

// Loading states
const isLoadingSettings = ref(true);

// Flag to track first load vs user changes
const isFirstLoad = ref(true);

// Individual setting loading states
const settingLoadingStates = ref<Record<string, boolean>>({});
const settingErrorStates = ref<Record<string, boolean>>({});
const settingRetryAttempts = ref<Record<string, number>>({});

// Local UI state for immediate interaction - initialize with null (not set)
const serviceCardColor = ref<string | null>(null);

// Color picker state
const showColorPicker = ref(false);
const selectedColor = ref('#F5F5F5');

// Preset colors palette
const presetColors = [
  '#F8F0F0', '#F5F0F0', '#F2E8E8', '#EFE0E0', '#ECD8D8', '#E9D0D0', '#E6C8C8',
  '#F8F2F0', '#F5F2F0', '#F2ECE8', '#EFE6E0', '#ECE0D8', '#E9DAD0', '#E6D4C8',
  '#F8F8F0', '#F5F5F0', '#F2F2E8', '#EFEFE0', '#ECECD8', '#E9E9D0', '#E6E6C8',
  '#F0F8F8', '#E8F5F0', '#E0F2E8', '#D8EFE0', '#D0ECD8', '#C8E9D0', '#C0E6C8',
  '#F0F8F8', '#E8F5F5', '#E0F2F2', '#D8EFEF', '#D0ECEC', '#C8E9E9', '#C0E6E6',
  '#F0F0F8', '#E8E8F5', '#E0E0F2', '#D8D8EF', '#D0D0EC', '#C8C8E9', '#C0C0E6',
  '#F5F0F8', '#F2E8F5', '#EFE0F2', '#ECD8EF', '#E9D0EC', '#E6C8E9', '#E3C0E6',
  '#FFFFFF', '#F8F8F8', '#F0F0F0', '#E8E8E8', '#E0E0E0', '#D8D8D8', '#D0D0D0'
];

// Define all settings that need to be loaded
const allSettings = [
  'card.color'
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
      uiStore.showErrorSnackbar(`ошибка загрузки настройки: ${settingName}`);
    }
    
    return false;
  }
}

/**
 * Update local setting value based on setting name
 */
function updateLocalSetting(settingName: string, value: any) {
  switch (settingName) {
    case 'card.color':
      serviceCardColor.value = value || '#F5F5F5';
      selectedColor.value = value || '#F5F5F5';
      break;
  }
}

/**
 * Open color picker dialog
 */
const openColorPicker = () => {
  selectedColor.value = serviceCardColor.value || '#F5F5F5';
  showColorPicker.value = true;
}

/**
 * Apply selected color and close dialog
 */
const applyColor = () => {
  serviceCardColor.value = selectedColor.value;
  showColorPicker.value = false;
}

/**
 * Load all settings from the backend and update local state
 */
async function loadSettings() {
  isLoadingSettings.value = true;
  
  try {
    console.log('Loading settings for Catalog.Services');
    
    // Disable watch effects during initial load
    isFirstLoad.value = true;
    
    // Load all settings for the section in one request
    const settings = await fetchSettings(section_path);
    
    if (settings && settings.length > 0) {
      console.log(`Successfully loaded ${settings.length} settings for section: ${section_path}`);
      
      // Update local state for each setting
      allSettings.forEach(settingName => {
        const setting = settings.find(s => s.setting_name === settingName);
        if (setting) {
          updateLocalSetting(settingName, setting.value);
          settingLoadingStates.value[settingName] = false;
          settingErrorStates.value[settingName] = false;
        } else {
          console.warn(`Setting ${settingName} not found in loaded settings`);
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
      console.log('No settings loaded - using defaults');
      
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
    console.error('Failed to load catalog services settings:', error);
    
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
watch(
  serviceCardColor,
  (newValue) => {
    if (!isFirstLoad.value) {
      updateSetting('card.color', newValue);
    }
  }
);

// Watch for changes in loading state from the store
watch(
  () => appSettingsStore.isLoading,
  (isLoading) => {
    isLoadingSettings.value = isLoading;
  }
);

// Initialize component
onMounted(() => {
  console.log('Catalog.Services component initialized');
  loadSettings();
});
</script>

<template>
  <div class="catalog-services-container">
    <h2 class="text-h6 mb-4">
      {{ t('admin.settings.catalog.services.title') }}
    </h2>
    
    <!-- Loading indicator -->
    <DataLoading
      :loading="isLoadingSettings"
      size="medium"
    />
    
    <template v-if="!isLoadingSettings">
      <!-- Settings content -->
      <div class="settings-section">
        <div class="section-content">
          <!-- ==================== SERVICE CARD COLOR SECTION ==================== -->
          <div class="color-picker-container">
            <v-text-field
              v-model="serviceCardColor"
              :label="t('admin.settings.catalog.services.cardColor.label')"
              variant="outlined"
              density="comfortable"
              placeholder="#F5F5F5"
              :rules="[v => /^#[0-9A-Fa-f]{6}$/.test(v) || t('admin.settings.catalog.services.cardColor.picker.validHex')]"
              color="teal"
              :disabled="isSettingDisabled('card.color')"
              :loading="settingLoadingStates['card.color']"
            >
              <template #prepend-inner>
                <div
                  class="color-preview"
                  :style="{ backgroundColor: serviceCardColor || '#F5F5F5' }"
                  @click="openColorPicker"
                />
              </template>
              <template #append-inner>
                <v-btn icon variant="text" size="small" @click="openColorPicker">
                  <PhPaintBrush />
                </v-btn>
              </template>
            </v-text-field>

            <!-- Color Picker Dialog -->
            <v-dialog
              v-model="showColorPicker"
              max-width="400"
              persistent
            >
              <v-card>
                <v-card-title class="text-subtitle-1">
                  {{ t('admin.settings.catalog.services.cardColor.picker.title') }}
                </v-card-title>
                <v-card-text>
                  <div class="color-picker-content">
                    <div class="color-preview-large mb-4">
                      <div
                        class="preview-box"
                        :style="{ backgroundColor: selectedColor }"
                      />
                      <div class="color-info">
                        <div class="hex-code">
                          {{ selectedColor }}
                        </div>
                        <div class="rgb-code">
                          {{ getRgbFromHex(selectedColor) }}
                        </div>
                      </div>
                    </div>
                    <div class="preset-colors mb-4">
                      <div class="preset-title mb-2">
                        {{ t('admin.settings.catalog.services.cardColor.picker.basicColors') }}
                      </div>
                      <div class="color-grid">
                        <div
                          v-for="color in presetColors"
                          :key="color"
                          class="color-swatch"
                          :style="{ backgroundColor: color }"
                          @click.stop="selectedColor = color"
                        />
                      </div>
                    </div>
                    <div class="custom-color-input">
                      <div class="input-title mb-2">
                        {{ t('admin.settings.catalog.services.cardColor.picker.customColor') }}
                      </div>
                      <v-text-field
                        v-model="selectedColor"
                        :label="t('admin.settings.catalog.services.cardColor.picker.hexCode')"
                        variant="outlined"
                        density="compact"
                        placeholder="#000000"
                        :rules="[v => /^#[0-9A-Fa-f]{6}$/.test(v) || t('admin.settings.catalog.services.cardColor.picker.validHex')]"
                        color="teal"
                      />
                    </div>
                  </div>
                </v-card-text>
                <v-card-actions>
                  <v-spacer />
                  <v-btn
                    color="grey"
                    variant="text"
                    @click="showColorPicker = false"
                  >
                    {{ t('admin.catalog.editor.actions.cancel') }}
                  </v-btn>
                  <v-btn
                    color="teal"
                    variant="text"
                    @click="applyColor"
                  >
                    {{ t('admin.catalog.editor.actions.save') }}
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </div>

          <!-- Error tooltip for card.color -->
          <v-tooltip
            v-if="settingErrorStates['card.color']"
            location="top"
            max-width="300"
          >
            <template #activator="{ props }">
              <v-icon 
                icon="mdi-alert-circle" 
                size="small" 
                class="ms-2" 
                color="error"
                v-bind="props"
                style="cursor: pointer;"
                @click="retrySetting('card.color')"
              />
            </template>
            <div class="pa-2">
              <p class="text-subtitle-2 mb-2">
                {{ t('admin.settings.usersmanagement.groupsmanagement.messages.error.tooltip.title') }}
              </p>
              <p class="text-caption">
                {{ t('admin.settings.usersmanagement.groupsmanagement.messages.error.tooltip.retry') }}
              </p>
            </div>
          </v-tooltip>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.catalog-services-container {
  /* Base container styling */
  position: relative;
}

.settings-section {
  padding: 16px 0;
  transition: background-color 0.2s ease;
}

.settings-section:hover {
  background-color: rgba(0, 0, 0, 0.01);
}

.section-title {
  font-weight: 500;
}

/* Color picker styles */
.color-picker-container {
  position: relative;
}

.color-preview {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 2px solid rgba(var(--v-border-color), var(--v-border-opacity));
  cursor: pointer;
  transition: transform 0.2s ease;
}

.color-preview:hover {
  transform: scale(1.1);
}

.color-preview-large {
  display: flex;
  align-items: center;
  gap: 16px;
}

.preview-box {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  border: 2px solid rgba(var(--v-border-color), var(--v-border-opacity));
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.color-info {
  flex-grow: 1;
}

.hex-code {
  font-family: 'Roboto Mono', monospace;
  font-size: 1.1rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
}

.rgb-code {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.6);
  margin-top: 4px;
}

.preset-title,
.input-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.color-swatch {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  border: 2px solid rgba(var(--v-border-color), var(--v-border-opacity));
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  z-index: 10;
  pointer-events: auto;
}

.color-swatch:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
</style>

