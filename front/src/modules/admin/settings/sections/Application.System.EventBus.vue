<!--
  File: Application.System.EventBus.vue - frontend file
  Description: Event bus system settings with domain-specific event generation controls
  Purpose: Enable/disable event generation in different application domains
  Version: 2.1.0
  
  Features:
  - Main event bus enable/disable switch
  - 11 domain-specific event generation switches
  - Hierarchical settings logic - domain switches depend on main event bus being enabled
  - Error handling and retry functionality for each setting
  - Settings grouped in columns for better UX
  - Cache integration for settings management
-->

<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAppSettingsStore } from '@/modules/admin/settings/state.app.settings';
import { fetchSettings } from '@/modules/admin/settings/service.fetch.settings';
import { updateSettingFromComponent } from '@/modules/admin/settings/service.update.settings';
import { useUiStore } from '@/core/state/uistate';
import DataLoading from '@/core/ui/loaders/DataLoading.vue';
import { PhWarningCircle } from '@phosphor-icons/vue';

// Section path identifier
const section_path = 'Application.System.EventBus';

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
const domainSettings = ref<Record<string, boolean | null>>({
  'generate.events.in.domain.helpers': null,
  'generate.events.in.domain.connectionHandler': null,
  'generate.events.in.domain.userEditor': null,
  'generate.events.in.domain.groupEditor': null,
  'generate.events.in.domain.usersList': null,
  'generate.events.in.domain.groupsList': null,
  'generate.events.in.domain.settings': null,
  'generate.events.in.domain.logger': null,
  'generate.events.in.domain.system': null,
  'generate.events.in.domain.auth': null,
  'generate.events.in.domain.PublicPasswordPolicies': null,
  'generate.events.in.domain.catalog': null,
  'generate.events.in.domain.services': null,
  'generate.events.in.domain.adminServices': null,
  'generate.events.in.domain.products': null,
  'generate.events.in.domain.account': null,
  'generate.events.in.domain.validation': null,
  'generate.events.in.domain.adminCatalog': null
});

// Define all settings that need to be loaded
const allSettings = [
  'generate.events.in.domain.helpers',
  'generate.events.in.domain.connectionHandler',
  'generate.events.in.domain.userEditor',
  'generate.events.in.domain.groupEditor',
  'generate.events.in.domain.usersList',
  'generate.events.in.domain.groupsList',
  'generate.events.in.domain.settings',
  'generate.events.in.domain.logger',
  'generate.events.in.domain.system',
  'generate.events.in.domain.auth',
  'generate.events.in.domain.PublicPasswordPolicies',
  'generate.events.in.domain.catalog',
  'generate.events.in.domain.services',
  'generate.events.in.domain.adminServices',
  'generate.events.in.domain.products',
  'generate.events.in.domain.account',
  'generate.events.in.domain.validation',
  'generate.events.in.domain.adminCatalog'
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
 * Check if domain settings should be disabled based on loading/error state
 */
const isDomainSettingDisabled = (settingName: string) => {
  return isSettingDisabled(settingName);
};

/**
 * Group domain settings for better UX
 */
const domainGroups = computed(() => {
  return [
    {
      title: t('admin.settings.groups.security'),
      settings: [
        {
          name: 'generate.events.in.domain.auth',
          translationKey: 'auth'
        },
        {
          name: 'generate.events.in.domain.PublicPasswordPolicies',
          translationKey: 'PublicPasswordPolicies'
        },
        {
          name: 'generate.events.in.domain.validation',
          translationKey: 'validation'
        }
      ]
    },
    {
      title: t('admin.settings.groups.usersmanagement'),
      settings: [
        {
          name: 'generate.events.in.domain.userEditor',
          translationKey: 'userEditor'
        },
        {
          name: 'generate.events.in.domain.groupEditor',
          translationKey: 'groupEditor'
        },
        {
          name: 'generate.events.in.domain.usersList',
          translationKey: 'usersList'
        },
        {
          name: 'generate.events.in.domain.groupsList',
          translationKey: 'groupsList'
        },
        {
          name: 'generate.events.in.domain.account',
          translationKey: 'account'
        }
      ]
    },
    {
      title: t('admin.settings.groups.system'),
      settings: [
        {
          name: 'generate.events.in.domain.settings',
          translationKey: 'settings'
        },
        {
          name: 'generate.events.in.domain.logger',
          translationKey: 'logger'
        },
        {
          name: 'generate.events.in.domain.system',
          translationKey: 'system'
        },
        {
          name: 'generate.events.in.domain.adminServices',
          translationKey: 'adminServices'
        },
        {
          name: 'generate.events.in.domain.adminCatalog',
          translationKey: 'adminCatalog'
        }
      ]
    },
    {
      title: t('admin.settings.groups.coreServices'),
      settings: [
        {
          name: 'generate.events.in.domain.helpers',
          translationKey: 'helpers'
        },
        {
          name: 'generate.events.in.domain.connectionHandler',
          translationKey: 'connectionHandler'
        }
      ]
    },
    {
      title: t('admin.settings.groups.businessServices'),
      settings: [
        {
          name: 'generate.events.in.domain.catalog',
          translationKey: 'catalog'
        },
        {
          name: 'generate.events.in.domain.services',
          translationKey: 'services'
        },
        {
          name: 'generate.events.in.domain.products',
          translationKey: 'products'
        }
      ]
    }
  ];
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
  // Helper function to safely convert values without changing null
  const safeBoolean = (val: any) => val === null ? null : Boolean(val);

  if (domainSettings.value.hasOwnProperty(settingName)) {
    domainSettings.value[settingName] = safeBoolean(value);
  }
}

/**
 * Load all settings from the backend and update local state
 */
async function loadSettings() {
  isLoadingSettings.value = true;
  
  try {
    console.log('Loading settings for Application.System.EventBus');
    
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
    console.error('Failed to load event bus settings:', error);
    
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



// Watch for changes in domain settings
Object.keys(domainSettings.value).forEach(settingName => {
  watch(
    () => domainSettings.value[settingName],
    (newValue) => {
      if (!isFirstLoad.value) {
        updateSetting(settingName, newValue);
      }
    }
  );
});

// Watch for changes in loading state from the store
watch(
  () => appSettingsStore.isLoading,
  (isLoading) => {
    isLoadingSettings.value = isLoading;
  }
);

// Initialize component
onMounted(() => {
  console.log('Application.System.EventBus component initialized');
  
  // Clear cache and force fresh load to ensure we get all settings including new ones
  appSettingsStore.clearSectionCache(section_path);
  console.log('Cleared cache for EventBus section to ensure fresh data load');
  
  loadSettings();
});
</script>

<template>
  <div class="eventbus-container">
    <h2 class="text-h6 mb-4">
      {{ t('admin.settings.application.system.eventbus.title') }}
    </h2>
    
    <!-- Loading indicator -->
    <DataLoading
      :loading="isLoadingSettings"
      size="medium"
    />
    
    <template v-if="!isLoadingSettings">
      <!-- Common title for all domain groups -->
      <div class="common-title mb-4">
        <h3 class="text-subtitle-1">
          {{ t('admin.settings.application.system.eventbus.domains.title') }}
        </h3>
      </div>

      <!-- Domain Settings Grid -->
      <div class="domain-settings-grid">
        <div 
          v-for="group in domainGroups" 
          :key="group.title"
          class="settings-group"
        >
          <h3 class="text-subtitle-1 mb-2 font-weight-medium">
            {{ group.title }}
          </h3>
          <div class="settings-subgroup">
            <div 
              v-for="setting in group.settings" 
              :key="setting.name"
              class="setting-item"
            >
              <div class="d-flex align-center">
                <v-switch
                  v-model="domainSettings[setting.name]"
                  color="teal-darken-2"
                  :label="t(`admin.settings.application.system.eventbus.domains.${setting.translationKey}.label`)"
                  hide-details
                  :disabled="isDomainSettingDisabled(setting.name)"
                  :loading="settingLoadingStates[setting.name]"
                  density="compact"
                />
                <v-tooltip
                  v-if="settingErrorStates[setting.name]"
                  location="top"
                  max-width="300"
                >
                  <template #activator="{ props }">
                    <span v-bind="props" style="cursor: pointer;" @click="retrySetting(setting.name)">
                      <PhWarningCircle :size="16" class="ms-2" />
                    </span>
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
    </template>
  </div>
</template>

<style scoped>
.eventbus-container {
  /* Base container styling */
  position: relative;
}



.domain-settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
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

.setting-item {
  padding: 4px 0;
}

.setting-item .v-switch {
  margin-bottom: 0;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .domain-settings-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

@media (max-width: 600px) {
  .domain-settings-grid {
    gap: 16px;
  }
}
</style> 