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
const consoleLoggingEnabled = ref<boolean | null>(null);
const debugEventsEnabled = ref<boolean | null>(null);
const infoEventsEnabled = ref<boolean | null>(null);
const errorEventsEnabled = ref<boolean | null>(null);
const fileLoggingEnabled = ref<boolean | null>(null);

// Define all settings that need to be loaded
const allSettings = [
  'turn.on.console.logging',
  'console.log.debug.events',
  'console.log.info.events',
  'console.log.error.events',
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

/**
 * Check if info events setting should be disabled based on hierarchical rules
 * Info events only work when console logging is enabled
 */
const isInfoEventsDisabled = computed(() => {
  // Standard disabled checks (loading, error)
  const standardDisabled = isSettingDisabled('console.log.info.events');
  
  // Hierarchical disabled - info events depend on console logging being enabled
  const hierarchicalDisabled = !consoleLoggingEnabled.value;
  
  return standardDisabled || hierarchicalDisabled;
});

/**
 * Check if error events setting should be disabled based on hierarchical rules
 * Error events only work when console logging is enabled
 */
const isErrorEventsDisabled = computed(() => {
  // Standard disabled checks (loading, error)
  const standardDisabled = isSettingDisabled('console.log.error.events');
  
  // Hierarchical disabled - error events depend on console logging being enabled
  const hierarchicalDisabled = !consoleLoggingEnabled.value;
  
  return standardDisabled || hierarchicalDisabled;
});


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
    case 'console.log.info.events':
      infoEventsEnabled.value = Boolean(value);
      break;
    case 'console.log.error.events':
      errorEventsEnabled.value = Boolean(value);
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
      
      // Hierarchical logic: if console logging is disabled, automatically disable all dependent events
      if (!newValue) {
        if (debugEventsEnabled.value) {
          console.log('[Frontend] Console logging disabled, automatically disabling debug events');
          debugEventsEnabled.value = false;
        }
        if (infoEventsEnabled.value) {
          console.log('[Frontend] Console logging disabled, automatically disabling info events');
          infoEventsEnabled.value = false;
        }
        if (errorEventsEnabled.value) {
          console.log('[Frontend] Console logging disabled, automatically disabling error events');
          errorEventsEnabled.value = false;
        }
        // Note: The watchers on individual events will handle the backend updates
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
  infoEventsEnabled, 
  (newValue) => {
    if (!isFirstLoad.value) {
      updateSetting('console.log.info.events', newValue);
    }
  }
);

watch(
  errorEventsEnabled, 
  (newValue) => {
    if (!isFirstLoad.value) {
      updateSetting('console.log.error.events', newValue);
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
      {{ t('admin.settings.application.system.logging.title') }}
    </h2>
    
    <!-- Loading indicator -->
    <DataLoading
      :loading="isLoadingSettings"
      size="medium"
    />
    
    <template v-if="!isLoadingSettings">
      <!-- Console Logging Section -->
      <div class="settings-group mb-4">
        <h3 class="text-subtitle-1 mb-2 font-weight-medium">
          {{ t('admin.settings.application.system.logging.console.title') }}
        </h3>
        
        <div class="settings-subgroup">
          <!-- Main console logging row with event types on the right -->
          <div class="console-logging-row">
            <!-- Left side: Main console logging switch -->
            <div class="console-main-switch">
              <div class="d-flex align-center">
                <v-switch
                  v-model="consoleLoggingEnabled"
                  color="teal-darken-2"
                  :label="t('admin.settings.application.system.logging.console.enabled.label')"
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
                      style="cursor: pointer;"
                      @click="retrySetting('turn.on.console.logging')"
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

            <!-- Right side: Event type switches -->
            <div class="console-event-switches">
              <!-- Debug events -->
              <div class="d-flex align-center mb-2">
                <v-switch
                  v-model="debugEventsEnabled"
                  color="teal-darken-2"
                  :label="t('admin.settings.application.system.logging.console.debug.events.label')"
                  hide-details
                  :disabled="isDebugEventsDisabled"
                  :loading="settingLoadingStates['console.log.debug.events']"
                  density="compact"
                />
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
                      style="cursor: pointer;"
                      @click="retrySetting('console.log.debug.events')"
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

              <!-- Info events -->
              <div class="d-flex align-center mb-2">
                <v-switch
                  v-model="infoEventsEnabled"
                  color="teal-darken-2"
                  :label="t('admin.settings.application.system.logging.console.info.events.label')"
                  hide-details
                  :disabled="isInfoEventsDisabled"
                  :loading="settingLoadingStates['console.log.info.events']"
                  density="compact"
                />
                <v-tooltip
                  v-if="settingErrorStates['console.log.info.events']"
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
                      @click="retrySetting('console.log.info.events')"
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

              <!-- Error events -->
              <div class="d-flex align-center">
                <v-switch
                  v-model="errorEventsEnabled"
                  color="teal-darken-2"
                  :label="t('admin.settings.application.system.logging.console.error.events.label')"
                  hide-details
                  :disabled="isErrorEventsDisabled"
                  :loading="settingLoadingStates['console.log.error.events']"
                  density="compact"
                />
                <v-tooltip
                  v-if="settingErrorStates['console.log.error.events']"
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
                      @click="retrySetting('console.log.error.events')"
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
          </div>
        </div>
      </div>
      
      <!-- File Logging Section -->
      <div class="settings-group mb-6">
        <h3 class="text-subtitle-1 mb-2 font-weight-medium">
          {{ t('admin.settings.application.system.logging.file.title') }}
        </h3>
        
        <div class="settings-subgroup">
          <div class="d-flex align-center mb-3">
            <v-switch
              v-model="fileLoggingEnabled"
              color="teal-darken-2"
              :label="t('admin.settings.application.system.logging.file.enabled.label')"
              hide-details
              :disabled="isSettingDisabled('turn.on.file.logging')"
              :loading="settingLoadingStates['turn.on.file.logging']"
            />
            <span class="text-caption text-grey ms-3">в разработке</span>
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
                  style="cursor: pointer;"
                  @click="retrySetting('turn.on.file.logging')"
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
          
          <div class="setting-note">
            {{ t('admin.settings.application.security.sessionmanagement.in.development') }}
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.logging-container {
  /* Base container styling */
  position: relative;
}

.settings-group {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  padding: 16px;
  background-color: rgba(0, 0, 0, 0.02);
}

.settings-subgroup {
  margin-bottom: 16px;
}

.settings-subgroup:last-child {
  margin-bottom: 0;
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

/* Console logging layout styles */
.console-logging-row {
  display: flex;
  align-items: flex-start;
  gap: 32px;
  min-height: 120px;
}

.console-main-switch {
  flex: 0 0 auto;
  min-width: 280px;
}

.console-event-switches {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
}

.console-event-switches .v-switch {
  margin-bottom: 0;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .console-logging-row {
    flex-direction: column;
    gap: 16px;
    min-height: auto;
  }
  
  .console-main-switch {
    min-width: auto;
    width: 100%;
  }
  
  .console-event-switches {
    margin-top: 0;
  }
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