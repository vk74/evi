<!--
  File: Application.System.Logging.vue - frontend file
  Description: System logging settings with hierarchical dependencies
  Purpose: Enable/disable logging functionality with console-dependent settings
  Version: 1.1.0
  
  Features:
  - Console logging enable/disable
  - Debug events logging (depends on console logging being enabled)  
  - File logging (independent setting)
  - Hierarchical settings logic - dependent settings auto-disable when parent is disabled
-->

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAppSettingsStore } from '@/modules/admin/settings/state.app.settings';
import { fetchSettings } from '@/modules/admin/settings/service.fetch.settings';
import { updateSettingFromComponent } from '@/modules/admin/settings/service.update.settings';
import { useUiStore } from '@/core/state/uistate';
import DataLoading from '@/core/ui/loaders/DataLoading.vue';

// Section path identifier
const section_path = 'Application.System.Logging';

// Block identifiers
const consoleBlockPath = 'Application.System.Logging.ConsoleLoggingBlock';
const fileBlockPath = 'Application.System.Logging.FileLoggingBlock';

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

// Local UI state for immediate interaction - initialize with null (not set)
const consoleLoggingEnabled = ref<boolean | null>(null);
const debugEventsEnabled = ref<boolean | null>(null);
const fileLoggingEnabled = ref<boolean | null>(null);

// Define all settings that need to be loaded
const allSettings = [
  'turn.on.console.logging',
  'console.log.debug.events',
  'turn.on.file.logging'
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
 * Check if debug events setting should be disabled based on hierarchical rules
 * Debug events only work when console logging is enabled
 */
const isDebugEventsDisabled = computed(() => {
  // Standard disabled checks (loading, error)
  const standardDisabled = isSettingDisabled('console.log.debug.events');
  
  // Hierarchical disabled - debug events depend on console logging being enabled
  const hierarchicalDisabled = !consoleLoggingEnabled.value;
  
  return standardDisabled || hierarchicalDisabled;
});

// Computed properties for block expansion state
const isConsoleBlockExpanded = computed(() => 
  appSettingsStore.isBlockExpanded(consoleBlockPath)
);

const isFileBlockExpanded = computed(() => 
  appSettingsStore.isBlockExpanded(fileBlockPath)
);

// Icons for block expansion
const consoleChevronIcon = computed(() => 
  isConsoleBlockExpanded.value ? 'mdi-chevron-up' : 'mdi-chevron-down'
);

const fileChevronIcon = computed(() => 
  isFileBlockExpanded.value ? 'mdi-chevron-up' : 'mdi-chevron-down'
);

/**
 * Toggle console block expansion
 */
function toggleConsoleBlock() {
  appSettingsStore.toggleBlock(consoleBlockPath);
}

/**
 * Toggle file block expansion
 */
function toggleFileBlock() {
  appSettingsStore.toggleBlock(fileBlockPath);
}

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
    case 'turn.on.console.logging':
      consoleLoggingEnabled.value = Boolean(value);
      break;
    case 'console.log.debug.events':
      debugEventsEnabled.value = Boolean(value);
      break;
    case 'turn.on.file.logging':
      fileLoggingEnabled.value = Boolean(value);
      break;
  }
}

/**
 * Load all settings from the backend and update local state
 */
async function loadSettings() {
  isLoadingSettings.value = true;
  
  try {
    console.log('Loading settings for Application.System.Logging');
    
    // Load all settings in parallel
    const loadPromises = allSettings.map(settingName => loadSetting(settingName));
    await Promise.allSettled(loadPromises);
    
    // Check if we have any successful loads
    const successfulLoads = allSettings.filter(settingName => 
      !settingLoadingStates.value[settingName] && !settingErrorStates.value[settingName]
    );
    
    if (successfulLoads.length === 0) {
      console.log('No settings loaded successfully - using defaults');
    } else {
      console.log(`Successfully loaded ${successfulLoads.length} out of ${allSettings.length} settings`);
      
      // Show success toast for initial load
      uiStore.showSuccessSnackbar('настройки успешно загружены');
    }
    
  } catch (error) {
    console.error('Failed to load logging settings:', error);
  } finally {
    isLoadingSettings.value = false;
    // Enable user changes after initial load is complete
    isFirstLoad.value = false;
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
  consoleLoggingEnabled, 
  (newValue) => {
    if (!isFirstLoad.value) {
      updateSetting('turn.on.console.logging', newValue);
      
      // Hierarchical logic: if console logging is disabled, automatically disable debug events
      if (!newValue && debugEventsEnabled.value) {
        console.log('[Frontend] Console logging disabled, automatically disabling debug events');
        debugEventsEnabled.value = false;
        // Note: The watch on debugEventsEnabled will handle the backend update
      }
    }
  }
);

watch(
  debugEventsEnabled, 
  (newValue) => {
    if (!isFirstLoad.value) {
      updateSetting('console.log.debug.events', newValue);
    }
  }
);

watch(
  fileLoggingEnabled, 
  (newValue) => {
    if (!isFirstLoad.value) {
      updateSetting('turn.on.file.logging', newValue);
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
  console.log('Application.System.Logging component initialized');
  loadSettings();
});
</script>

<template>
  <div class="logging-container">
    <h2 class="text-h6 mb-4">
      логирование работы системы
    </h2>
    
    <!-- Loading indicator -->
    <DataLoading
      :loading="isLoadingSettings"
      size="medium"
    />
    
    <template v-if="!isLoadingSettings">
      <!-- Console Logging Block -->
      <div class="logging-block">
        <!-- Console block header -->
        <div 
          class="block-header"
          :class="{ 'block-expanded': isConsoleBlockExpanded }"
          @click="toggleConsoleBlock"
        >
          <div class="block-header-content">
            <v-icon 
              :icon="consoleChevronIcon"
              size="small"
              class="chevron-icon"
            />
            <h3 class="block-title">
              вывод логов в консоль
            </h3>
          </div>
        </div>
        
        <!-- Divider line -->
        <div class="block-divider" />
        
        <!-- Console block content -->
        <v-expand-transition>
          <div
            v-if="isConsoleBlockExpanded"
            class="block-content"
          >
            <div class="settings-content">
              <div class="d-flex align-center mb-3">
                <v-switch
                  v-model="consoleLoggingEnabled"
                  color="teal-darken-2"
                  label="включить вывод логов в консоль"
                  hide-details
                  :disabled="isSettingDisabled('turn.on.console.logging')"
                  :loading="settingLoadingStates['turn.on.console.logging']"
                />
                <v-tooltip
                  v-if="settingErrorStates['turn.on.console.logging']"
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
                      @click="retrySetting('turn.on.console.logging')"
                      style="cursor: pointer;"
                    />
                  </template>
                  <div class="pa-2">
                    <p class="text-subtitle-2 mb-2">ошибка загрузки настройки</p>
                    <p class="text-caption">нажмите для повторной попытки</p>
                  </div>
                </v-tooltip>
              </div>
              
              <div class="d-flex align-center mb-3">
                <v-switch
                  v-model="debugEventsEnabled"
                  color="teal-darken-2"
                  label="вывод событий дебаггинга"
                  hide-details
                  :disabled="isDebugEventsDisabled"
                  :loading="settingLoadingStates['console.log.debug.events']"
                />
                
                <!-- Error tooltip -->
                <v-tooltip
                  v-if="settingErrorStates['console.log.debug.events']"
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
                      @click="retrySetting('console.log.debug.events')"
                      style="cursor: pointer;"
                    />
                  </template>
                  <div class="pa-2">
                    <p class="text-subtitle-2 mb-2">ошибка загрузки настройки</p>
                    <p class="text-caption">нажмите для повторной попытки</p>
                  </div>
                </v-tooltip>
                
                
              </div>
              

            </div>
            
            <!-- Bottom divider when expanded -->
            <div class="block-divider" />
          </div>
        </v-expand-transition>
      </div>
      
      <!-- File Logging Block -->
      <div class="logging-block">
        <!-- File block header -->
        <div 
          class="block-header"
          :class="{ 'block-expanded': isFileBlockExpanded }"
          @click="toggleFileBlock"
        >
          <div class="block-header-content">
            <v-icon 
              :icon="fileChevronIcon"
              size="small"
              class="chevron-icon"
            />
            <h3 class="block-title">
              запись логов в файл
            </h3>
          </div>
        </div>
        
        <!-- Divider line -->
        <div class="block-divider" />
        
        <!-- File block content -->
        <v-expand-transition>
          <div
            v-if="isFileBlockExpanded"
            class="block-content"
          >
            <div class="settings-content">
              <div class="d-flex align-center mb-3">
                <v-switch
                  v-model="fileLoggingEnabled"
                  color="teal-darken-2"
                  label="включить запись логов в файл"
                  hide-details
                  :disabled="isSettingDisabled('turn.on.file.logging')"
                  :loading="settingLoadingStates['turn.on.file.logging']"
                />
                <v-tooltip
                  v-if="settingErrorStates['turn.on.file.logging']"
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
                      @click="retrySetting('turn.on.file.logging')"
                      style="cursor: pointer;"
                    />
                  </template>
                  <div class="pa-2">
                    <p class="text-subtitle-2 mb-2">ошибка загрузки настройки</p>
                    <p class="text-caption">нажмите для повторной попытки</p>
                  </div>
                </v-tooltip>
              </div>
              
              <div class="setting-note">
                функция находится в разработке
              </div>
            </div>
            
            <!-- Bottom divider when expanded -->
            <div class="block-divider" />
          </div>
        </v-expand-transition>
      </div>
    </template>
  </div>
</template>

<style scoped>
.logging-container {
  /* Base container styling */
  position: relative;
}

.logging-block {
  margin-bottom: 16px;
}

.block-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  user-select: none;
}

.block-header:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.block-header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chevron-icon {
  color: rgba(0, 0, 0, 0.6);
  transition: transform 0.3s ease;
}

.block-expanded .chevron-icon {
  transform: rotate(180deg);
}

.block-title {
  font-size: 0.95rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
  margin: 0;
}

.block-divider {
  height: 1px;
  background-color: rgba(0, 0, 0, 0.3);
  margin: 0;
}

.block-content {
  background-color: rgba(0, 0, 0, 0.01);
  transition: background-color 0.2s ease;
}

.settings-content {
  padding: 16px 20px;
}

.settings-content .v-switch {
  margin-bottom: 12px;
}

.settings-content .v-switch:last-child {
  margin-bottom: 0;
}

.setting-note {
  font-size: 0.8rem;
  color: rgba(0, 0, 0, 0.6);
  font-style: italic;
  margin-top: 8px;
  padding-left: 12px;
}

/* Make dividers same color as border in parent component */
:deep(.v-divider) {
  border-color: rgba(0, 0, 0, 0.12);
  opacity: 1;
}


</style> 