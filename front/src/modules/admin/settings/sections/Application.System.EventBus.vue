<!--
  File: Application.System.EventBus.vue
  Description: Event bus system settings
  Purpose: Enable/disable event bus functionality
  Version: 1.0
-->

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useAppSettingsStore } from '@/modules/admin/settings/state.app.settings';
import { fetchSettings, getSettingValue } from '@/modules/admin/settings/service.fetch.settings';
import DataLoading from '@/core/ui/loaders/DataLoading.vue';

// Section path identifier
const section_path = 'Application.System.EventBus';

// Store reference
const appSettingsStore = useAppSettingsStore();

// Loading state
const isLoadingSettings = ref(true);

// Module enabled state
const enabled = ref(false);

/**
 * Load settings from the backend
 */
async function loadSettings() {
  isLoadingSettings.value = true;
  
  try {
    console.log('Loading settings for Event Bus');
    const settings = await fetchSettings(section_path);
    
    // Apply settings to component
    if (settings && settings.length > 0) {
      console.log('Received settings:', settings);
      enabled.value = getSettingValue(section_path, 'enabled', false);
    } else {
      console.log('No settings received for Event Bus - using defaults');
    }
  } catch (error) {
    console.error('Failed to load event bus settings:', error);
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
  console.log('Application.System.EventBus component initialized');
  loadSettings();
});
</script>

<template>
  <div class="eventbus-container">
    <h2 class="text-h6 mb-4">
      event bus
    </h2>
    
    <!-- Loading indicator -->
    <DataLoading
      :loading="isLoadingSettings"
      size="medium"
    />
    
    <template v-if="!isLoadingSettings">
      <div class="settings-section">
        <div class="section-content">
          <v-switch
            v-model="enabled"
            color="teal-darken-2"
            label="ВКЛЮЧИТЬ МОДУЛЬ"
            hide-details
            class="mb-4"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.eventbus-container {
  /* Base container styling */
}

.settings-section {
  padding: 16px 0;
  transition: background-color 0.2s ease;
}

.settings-section:hover {
  background-color: rgba(0, 0, 0, 0.01);
}
</style> 