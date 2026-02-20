<!--
  File: Application.System.Modules.vue - frontend file
  Description: Combined module visibility settings (Work, Reports, Knowledge Base)
  Purpose: Enable/disable visibility for application modules in one section
  Version: 1.0.0

  Features:
  - Work, Reports, Knowledge Base module visibility toggles
  - Settings cache integration
  - Loading states and error handling per setting
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
import { PhWarningCircle } from '@phosphor-icons/vue';

// Section path identifier
const section_path = 'Application.System.Modules';

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

// Local UI state for each module toggle
const workModuleVisible = ref<boolean | null>(null);
const reportsModuleVisible = ref<boolean | null>(null);
const knowledgeBaseModuleVisible = ref<boolean | null>(null);

// Define all settings that need to be loaded
const allSettings = [
  'work.module.is.visible',
  'reports.module.is.visible',
  'knowledgebase.module.is.visible'
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
  if (!isSettingDisabled(settingName)) {
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
    const cachedSettings = appSettingsStore.getCachedSettings(section_path);
    const cachedSetting = cachedSettings?.find(s => s.setting_name === settingName);

    if (cachedSetting) {
      updateLocalSetting(settingName, cachedSetting.value);
      settingLoadingStates.value[settingName] = false;
      return true;
    }

    const settings = await fetchSettings(section_path);
    const setting = settings?.find(s => s.setting_name === settingName);

    if (setting) {
      updateLocalSetting(settingName, setting.value);
      settingLoadingStates.value[settingName] = false;
      return true;
    }
    throw new Error(`Setting ${settingName} not found`);
  } catch (error) {
    console.error(`Failed to load setting ${settingName}:`, error);
    settingErrorStates.value[settingName] = true;
    settingLoadingStates.value[settingName] = false;

    if (settingRetryAttempts.value[settingName] < 1) {
      settingRetryAttempts.value[settingName]++;
      setTimeout(() => loadSetting(settingName), 5000);
    } else {
      uiStore.showErrorSnackbar(`ошибка загрузки настройки: ${settingName}`);
    }
    return false;
  }
}

/**
 * Update local setting value based on setting name
 */
function updateLocalSetting(settingName: string, value: any) {
  const safeBoolean = (val: any) => val === null ? null : Boolean(val);

  switch (settingName) {
    case 'work.module.is.visible':
      workModuleVisible.value = safeBoolean(value);
      break;
    case 'reports.module.is.visible':
      reportsModuleVisible.value = safeBoolean(value);
      break;
    case 'knowledgebase.module.is.visible':
      knowledgeBaseModuleVisible.value = safeBoolean(value);
      break;
  }
}

/**
 * Load all settings from the backend and update local state
 */
async function loadSettings() {
  isLoadingSettings.value = true;

  try {
    isFirstLoad.value = true;

    const settings = await fetchSettings(section_path);

    if (settings && settings.length > 0) {
      allSettings.forEach(settingName => {
        const setting = settings.find(s => s.setting_name === settingName);
        if (setting) {
          updateLocalSetting(settingName, setting.value);
          settingLoadingStates.value[settingName] = false;
          settingErrorStates.value[settingName] = false;
        } else {
          settingLoadingStates.value[settingName] = false;
          settingErrorStates.value[settingName] = true;
        }
      });

      await nextTick();
      isFirstLoad.value = false;
      uiStore.showSuccessSnackbar('настройки успешно загружены');
    } else {
      allSettings.forEach(settingName => {
        settingLoadingStates.value[settingName] = false;
        settingErrorStates.value[settingName] = true;
      });
      await nextTick();
      isFirstLoad.value = false;
    }
  } catch (error) {
    console.error('Failed to load modules settings:', error);
    allSettings.forEach(settingName => {
      settingLoadingStates.value[settingName] = false;
      settingErrorStates.value[settingName] = true;
    });
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

// Watchers for local state - only after first load
watch(workModuleVisible, (newValue) => {
  if (!isFirstLoad.value) updateSetting('work.module.is.visible', newValue);
});
watch(reportsModuleVisible, (newValue) => {
  if (!isFirstLoad.value) updateSetting('reports.module.is.visible', newValue);
});
watch(knowledgeBaseModuleVisible, (newValue) => {
  if (!isFirstLoad.value) updateSetting('knowledgebase.module.is.visible', newValue);
});

watch(
  () => appSettingsStore.isLoading,
  (isLoading) => { isLoadingSettings.value = isLoading; }
);

onMounted(() => {
  loadSettings();
});
</script>

<template>
  <div class="modules-settings-container">
    <h2 class="text-h6 mb-4">
      {{ t('admin.settings.application.system.modules.title') }}
    </h2>

    <DataLoading
      :loading="isLoadingSettings"
      size="medium"
    />

    <template v-if="!isLoadingSettings">
      <div class="settings-section">
        <div class="section-content">
          <!-- Work module -->
          <div class="d-flex align-center mb-2">
            <v-switch
              v-model="workModuleVisible"
              color="teal-darken-2"
              :label="t('admin.settings.application.work.enabled.label')"
              hide-details
              :disabled="isSettingDisabled('work.module.is.visible')"
              :loading="settingLoadingStates['work.module.is.visible']"
            />
            <v-tooltip
              v-if="settingErrorStates['work.module.is.visible']"
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
                  @click="retrySetting('work.module.is.visible')"
                >
                  <PhWarningCircle :size="20" />
                </v-icon>
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

          <!-- Reports module -->
          <div class="d-flex align-center mb-2">
            <v-switch
              v-model="reportsModuleVisible"
              color="teal-darken-2"
              :label="t('admin.settings.application.reports.enabled.label')"
              hide-details
              :disabled="isSettingDisabled('reports.module.is.visible')"
              :loading="settingLoadingStates['reports.module.is.visible']"
            />
            <v-tooltip
              v-if="settingErrorStates['reports.module.is.visible']"
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
                  @click="retrySetting('reports.module.is.visible')"
                >
                  <PhWarningCircle :size="20" />
                </v-icon>
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

          <!-- Knowledge Base module -->
          <div class="d-flex align-center mb-2">
            <v-switch
              v-model="knowledgeBaseModuleVisible"
              color="teal-darken-2"
              :label="t('admin.settings.application.knowledgebase.enabled.label')"
              hide-details
              :disabled="isSettingDisabled('knowledgebase.module.is.visible')"
              :loading="settingLoadingStates['knowledgebase.module.is.visible']"
            />
            <v-tooltip
              v-if="settingErrorStates['knowledgebase.module.is.visible']"
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
                  @click="retrySetting('knowledgebase.module.is.visible')"
                >
                  <PhWarningCircle :size="20" />
                </v-icon>
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
    </template>
  </div>
</template>

<style scoped>
.modules-settings-container {
  position: relative;
}

.settings-section {
  padding: 16px 0;
  transition: background-color 0.2s ease;
}

.settings-section:hover {
  background-color: rgba(0, 0, 0, 0.01);
}
</style>
