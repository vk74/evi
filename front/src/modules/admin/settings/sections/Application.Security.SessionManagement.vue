<!--
  File: Application.Security.SessionManagement.vue
  Version: 1.0.0
  Description: Session management settings component for frontend
  Purpose: Configure session-related security settings including duration, limits, and concurrent sessions
  Frontend file that manages session configuration UI and integrates with settings store
-->

<script setup lang="ts">
import { computed, onMounted, watch, ref } from 'vue';
import { useAppSettingsStore } from '@/modules/admin/settings/state.app.settings';
import { fetchSettings } from '@/modules/admin/settings/service.fetch.settings';
import { updateSettingFromComponent } from '@/modules/admin/settings/service.update.settings';
import DataLoading from '@/core/ui/loaders/DataLoading.vue';

// Section path identifier - using component name for better consistency
const section_path = 'Application.Security.SessionManagement';

// Store reference
const appSettingsStore = useAppSettingsStore();

// Loading state
const isLoadingSettings = ref(true);

// Session duration options (10 minutes to 24 hours)
const sessionDurationOptions = [
  { title: '10 минут', value: '10' },
  { title: '15 минут', value: '15' },
  { title: '30 минут', value: '30' },
  { title: '1 час', value: '60' },
  { title: '2 часа', value: '120' },
  { title: '4 часа', value: '240' },
  { title: '8 часов', value: '480' },
  { title: '12 часов', value: '720' },
  { title: '1 сутки', value: '1440' },
  { title: '2 суток', value: '2880' },
  { title: '3 суток', value: '4320' },
  { title: '5 суток', value: '7200' },
  { title: 'неделя', value: '10080' }
];

/**
 * Direct binding to the setting values from Pinia store
 * These computed properties will automatically update when the store changes
 */
const sessionDuration = computed({
  get: () => {
    const settings = appSettingsStore.getCachedSettings(section_path);
    if (!settings || settings.length === 0) return '30';
    
    const setting = settings.find(s => s.setting_name === 'session.duration');
    const value = setting?.value !== undefined && setting?.value !== null 
      ? setting.value.toString() 
      : '30';
    
    console.log('Computed setting "session.duration" value:', value);
    return value;
  },
  set: (newValue) => {
    console.log('Setting session.duration value changed to:', newValue);
    updateSettingFromComponent(section_path, 'session.duration', Number(newValue));
  }
});

const concurrentSessions = computed({
  get: () => {
    const settings = appSettingsStore.getCachedSettings(section_path);
    if (!settings || settings.length === 0) return true;
    
    const setting = settings.find(s => s.setting_name === 'session.concurrent.enabled');
    const value = setting?.value !== undefined && setting?.value !== null 
      ? setting.value 
      : true;
    
    console.log('Computed setting "session.concurrent.enabled" value:', value);
    return value;
  },
  set: (newValue) => {
    console.log('Setting session.concurrent.enabled value changed to:', newValue);
    updateSettingFromComponent(section_path, 'session.concurrent.enabled', newValue);
  }
});

const maxSessionsPerUser = computed({
  get: () => {
    const settings = appSettingsStore.getCachedSettings(section_path);
    if (!settings || settings.length === 0) return 2;
    
    const setting = settings.find(s => s.setting_name === 'session.max.per.user');
    const value = setting?.value !== undefined && setting?.value !== null 
      ? setting.value 
      : 2;
    
    console.log('Computed setting "session.max.per.user" value:', value);
    return value;
  },
  set: (newValue) => {
    console.log('Setting session.max.per.user value changed to:', newValue);
    updateSettingFromComponent(section_path, 'session.max.per.user', newValue);
  }
});

/**
 * Load settings from the backend
 */
async function loadSettings() {
  isLoadingSettings.value = true;
  
  try {
    console.log('Loading settings for Session Management');
    const settings = await fetchSettings(section_path);
    
    if (settings && settings.length > 0) {
      console.log('Received settings:', settings);
    } else {
      console.log('No settings received for Session Management');
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  } finally {
    isLoadingSettings.value = false;
  }
}

// Watch for changes in loading state from the store
watch(
  () => appSettingsStore.isLoading,
  (isLoading) => {
    isLoadingSettings.value = isLoading;
  }
);

// Initialize component
onMounted(() => {
  console.log('Application.Security.SessionManagement component initialized');
  loadSettings();
});
</script>

<template>
  <div class="session-management-container">
    <h2 class="text-h6 mb-4">
      управление сессиями
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
        <div class="d-flex align-center mb-2">
          <v-select
            v-model="sessionDuration"
            :items="sessionDurationOptions"
            label="длительность сессии"
            variant="outlined"
            density="comfortable"
            color="teal-darken-2"
            style="max-width: 200px;"
          />
          <v-tooltip
            location="top"
            max-width="300"
          >
            <template #activator="{ props }">
              <v-icon 
                icon="mdi-help-circle-outline" 
                size="small" 
                class="ms-2" 
                color="teal-darken-2"
                v-bind="props"
              />
            </template>
            <div class="pa-2">
              Более длинная сессия улучшает удобство пользователей, но может снизить безопасность
            </div>
          </v-tooltip>
        </div>
        <div class="d-flex align-center mb-2">
          <v-switch
            v-model="concurrentSessions"
            color="teal-darken-2"
            label="разрешить одновременные сессии"
            hide-details
            class="mb-2"
          />
          <span class="text-caption text-grey ms-3">функция находится в разработке</span>
        </div>
        <div class="d-flex align-center">
          <v-text-field
            v-model="maxSessionsPerUser"
            label="максимальное количество сессий на пользователя"
            type="number"
            variant="outlined"
            density="comfortable"
            class="mt-4"
            color="teal-darken-2"
            :disabled="!concurrentSessions"
            style="max-width: 400px;"
          />
          <span class="text-caption text-grey ms-3">функция находится в разработке</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.session-management-container {
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

/* Make dividers same color as border in parent component */
:deep(.v-divider) {
  border-color: rgba(0, 0, 0, 0.12);
  opacity: 1;
}
</style> 