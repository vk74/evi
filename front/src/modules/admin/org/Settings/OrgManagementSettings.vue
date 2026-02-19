<!--
  File: OrgManagementSettings.vue
  Version: 1.1.0
  Description: Organization management settings component
  Purpose: Configure organization related settings including group membership rules and user registration from org admin module
-->

<script setup lang="ts">
import { computed, onMounted, watch, ref, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAppSettingsStore } from '@/modules/admin/settings/state.app.settings';
import { fetchSettings } from '@/modules/admin/settings/service.fetch.settings';
import { updateSettingFromComponent } from '@/modules/admin/settings/service.update.settings';
import { useUiStore } from '@/core/state/uistate';
import DataLoading from '@/core/ui/loaders/DataLoading.vue';
import { PhWarningCircle } from '@phosphor-icons/vue';

// Section path identifiers - same as in respective components
const groupsManagementPath = 'AdminOrgMgmt';
const usersManagementPath = 'AdminOrgMgmt';

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
const onlyAddActiveMembers = ref<boolean | null>(null);
const registrationPageEnabled = ref<boolean | null>(null);

// Define all settings that need to be loaded with their section paths
const allSettings = [
  { name: 'add.only.active.users.to.groups', path: groupsManagementPath },
  { name: 'registration.page.enabled', path: usersManagementPath }
];

// Initialize loading states for all settings
allSettings.forEach(setting => {
  settingLoadingStates.value[setting.name] = true;
  settingErrorStates.value[setting.name] = false;
  settingRetryAttempts.value[setting.name] = 0;
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
function updateSetting(settingName: string, sectionPath: string, value: any) {
  // Only update if setting is not disabled
  if (!isSettingDisabled(settingName)) {
    console.log(`Updating setting ${settingName} to:`, value);
    updateSettingFromComponent(sectionPath, settingName, value);
  }
}

/**
 * Load a single setting by name
 */
async function loadSetting(settingName: string, sectionPath: string): Promise<boolean> {
  settingLoadingStates.value[settingName] = true;
  settingErrorStates.value[settingName] = false;
  
  try {
    console.log(`Loading setting: ${settingName} from ${sectionPath}`);
    
    // Try to get setting from cache first
    const cachedSettings = appSettingsStore.getCachedSettings(sectionPath);
    const cachedSetting = cachedSettings?.find(s => s.setting_name === settingName);
    
    if (cachedSetting) {
      console.log(`Found cached setting: ${settingName}`, cachedSetting.value);
      updateLocalSetting(settingName, cachedSetting.value);
      settingLoadingStates.value[settingName] = false;
      return true;
    }
    
    // If not in cache, fetch from backend
    const settings = await fetchSettings(sectionPath);
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
      setTimeout(() => loadSetting(settingName, sectionPath), 5000);
    } else {
      // Show error toast only on final failure
      uiStore.showErrorSnackbar(`${t('admin.org.settings.messages.error.loading')}: ${settingName}`);
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

  switch (settingName) {
    case 'add.only.active.users.to.groups':
      onlyAddActiveMembers.value = safeBoolean(value);
      break;
    case 'registration.page.enabled':
      registrationPageEnabled.value = safeBoolean(value);
      break;
  }
}

/**
 * Load all settings from the backend and update local state
 */
async function loadSettings() {
  isLoadingSettings.value = true;
  
  try {
    console.log('Loading settings for Organization Management');
    
    // Disable watch effects during initial load
    isFirstLoad.value = true;
    
    // Group settings by their section paths
    const settingsByPath = new Map<string, typeof allSettings>();
    allSettings.forEach(setting => {
      if (!settingsByPath.has(setting.path)) {
        settingsByPath.set(setting.path, []);
      }
      settingsByPath.get(setting.path)!.push(setting);
    });
    
    // Load settings for each section path
    const loadPromises = Array.from(settingsByPath.entries()).map(async ([sectionPath, settings]) => {
      try {
        const loadedSettings = await fetchSettings(sectionPath);
        
        if (loadedSettings && loadedSettings.length > 0) {
          console.log(`Successfully loaded ${loadedSettings.length} settings for section: ${sectionPath}`);
          
          settings.forEach(setting => {
            const loadedSetting = loadedSettings.find(s => s.setting_name === setting.name);
            if (loadedSetting) {
              updateLocalSetting(setting.name, loadedSetting.value);
              settingLoadingStates.value[setting.name] = false;
              settingErrorStates.value[setting.name] = false;
            } else {
              console.warn(`Setting ${setting.name} not found in loaded settings`);
              settingLoadingStates.value[setting.name] = false;
              settingErrorStates.value[setting.name] = true;
            }
          });
        } else {
          settings.forEach(setting => {
            settingLoadingStates.value[setting.name] = false;
            settingErrorStates.value[setting.name] = true;
          });
        }
      } catch (error) {
        console.error(`Failed to load settings for section ${sectionPath}:`, error);
        settings.forEach(setting => {
          settingLoadingStates.value[setting.name] = false;
          settingErrorStates.value[setting.name] = true;
        });
      }
    });
    
    await Promise.all(loadPromises);
    
    // Enable user changes after all settings are loaded and local state is updated
    await nextTick();
    isFirstLoad.value = false;
    
    // Show success toast for initial load
    uiStore.showSuccessSnackbar(t('admin.org.settings.messages.settings.loaded'));
    
  } catch (error) {
    console.error('Failed to load organization management settings:', error);
    
    // Mark all settings as failed to load
    allSettings.forEach(setting => {
      settingLoadingStates.value[setting.name] = false;
      settingErrorStates.value[setting.name] = true;
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
  const setting = allSettings.find(s => s.name === settingName);
  if (setting) {
    settingRetryAttempts.value[settingName] = 0;
    settingErrorStates.value[settingName] = false;
    await loadSetting(settingName, setting.path);
  }
}

// Watch for changes in local state - only after first load is complete
watch(
  onlyAddActiveMembers, 
  (newValue) => {
    if (!isFirstLoad.value) {
      updateSetting('add.only.active.users.to.groups', groupsManagementPath, newValue);
    }
  }
);

watch(
  registrationPageEnabled, 
  (newValue) => {
    if (!isFirstLoad.value) {
      updateSetting('registration.page.enabled', usersManagementPath, newValue);
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
  console.log('OrgManagementSettings component initialized');
  loadSettings();
});
</script>

<template>
  <div class="org-management-settings-container">
    <h2 class="text-h6 mb-4">
      {{ t('admin.org.settings.title') }}
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
        <div class="d-flex align-center mb-4">
          <v-switch
            v-model="onlyAddActiveMembers"
            color="teal-darken-2"
            :label="t('admin.org.settings.only.active.members.label')"
            hide-details
            :disabled="isSettingDisabled('add.only.active.users.to.groups')"
            :loading="settingLoadingStates['add.only.active.users.to.groups']"
          />
          <v-tooltip
            v-if="settingErrorStates['add.only.active.users.to.groups']"
            location="top"
            max-width="300"
          >
            <template #activator="{ props }">
              <v-icon 
                size="small" 
                class="ms-2" 
                color="error"
                v-bind="props"
                style="cursor: pointer;"
                @click="retrySetting('add.only.active.users.to.groups')"
              >
                <PhWarningCircle :size="20" />
              </v-icon>
            </template>
            <div class="pa-2">
              <p class="text-subtitle-2 mb-2">
                {{ t('admin.org.settings.messages.error.tooltip.title') }}
              </p>
              <p class="text-caption">
                {{ t('admin.org.settings.messages.error.tooltip.retry') }}
              </p>
            </div>
          </v-tooltip>
        </div>

        <div class="d-flex align-center mb-2">
          <v-switch
            v-model="registrationPageEnabled"
            color="teal-darken-2"
            :label="t('admin.org.settings.registration.page.enabled.label')"
            hide-details
            :disabled="isSettingDisabled('registration.page.enabled')"
            :loading="settingLoadingStates['registration.page.enabled']"
          />
          <v-tooltip
            v-if="settingErrorStates['registration.page.enabled']"
            location="top"
            max-width="300"
          >
            <template #activator="{ props }">
              <v-icon 
                size="small" 
                class="ms-2" 
                color="error"
                v-bind="props"
                style="cursor: pointer;"
                @click="retrySetting('registration.page.enabled')"
              >
                <PhWarningCircle :size="20" />
              </v-icon>
            </template>
            <div class="pa-2">
              <p class="text-subtitle-2 mb-2">
                {{ t('admin.org.settings.messages.error.tooltip.title') }}
              </p>
              <p class="text-caption">
                {{ t('admin.org.settings.messages.error.tooltip.retry') }}
              </p>
            </div>
          </v-tooltip>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.org-management-settings-container {
  /* Base container styling */
  position: relative;
  padding: 24px;
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

/* Make dividers same color as border in parent component */
:deep(.v-divider) {
  border-color: rgba(0, 0, 0, 0.12);
  opacity: 1;
}
</style>

