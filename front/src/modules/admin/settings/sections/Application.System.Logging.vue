<!--
  File: Application.System.Logging.vue
  Description: System logging settings
  Purpose: Enable/disable logging functionality
  Version: 1.0
-->

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useAppSettingsStore } from '@/modules/admin/settings/state.app.settings';
import { fetchSettings, getSettingValue } from '@/modules/admin/settings/service.fetch.settings';
import DataLoading from '@/core/ui/loaders/DataLoading.vue';

// Section path identifier
const section_path = 'Application.System.Logging';

// Block identifiers
const consoleBlockPath = 'Application.System.Logging.ConsoleLoggingBlock';
const fileBlockPath = 'Application.System.Logging.FileLoggingBlock';

// Store reference
const appSettingsStore = useAppSettingsStore();

// Loading state
const isLoadingSettings = ref(true);

// Console logging settings
const consoleLoggingEnabled = ref(false);
const debugEventsEnabled = ref(false);

// File logging settings
const fileLoggingEnabled = ref(false);

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
 * Load settings from the backend
 */
async function loadSettings() {
  isLoadingSettings.value = true;
  
  try {
    console.log('Loading settings for Logging');
    const settings = await fetchSettings(section_path);
    
    // Apply settings to component
    if (settings && settings.length > 0) {
      console.log('Received settings:', settings);
      consoleLoggingEnabled.value = getSettingValue(section_path, 'consoleLoggingEnabled', false);
      debugEventsEnabled.value = getSettingValue(section_path, 'debugEventsEnabled', false);
      fileLoggingEnabled.value = getSettingValue(section_path, 'fileLoggingEnabled', false);
    } else {
      console.log('No settings received for Logging - using defaults');
    }
  } catch (error) {
    console.error('Failed to load logging settings:', error);
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
              <v-switch
                v-model="consoleLoggingEnabled"
                color="teal-darken-2"
                label="включить вывод логов в консоль"
                hide-details
                class="mb-3"
              />
              <v-switch
                v-model="debugEventsEnabled"
                color="teal-darken-2"
                label="вывод событий дебаггинга"
                hide-details
                class="mb-3"
              />
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
              <v-switch
                v-model="fileLoggingEnabled"
                color="teal-darken-2"
                label="включить запись логов в файл"
                hide-details
                class="mb-3"
              />
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
</style> 