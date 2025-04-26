<!--
  File: Application.Logging.Console.vue
  Description: Console transport settings for application logging
  Purpose: Configure console output for the application logging system
  Version: 1.0
-->

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useAppSettingsStore } from '@/components/admin/settings/state.app.settings';
import { fetchSettings, getSettingValue } from '@/components/admin/settings/service.fetch.settings';
import DataLoading from '@/core/ui/loaders/DataLoading.vue';

// Section path identifier - using component name for better consistency
const section_path = 'Application.Logging.Console';

// Store reference
const appSettingsStore = useAppSettingsStore();

// Loading state
const isLoadingSettings = ref(true);

/**
 * Console Transport Settings
 * Contains settings specific to console logging transport
 */
const enabled = ref(true);
const outputFormat = ref('console');
const outputFormats = ['console', 'json', 'elastic'];

/**
 * Operation levels for different types of events
 */
const operationLevels = ref({
  APP: 'INFO',
  SYSTEM: 'INFO',
  SECURITY: 'WARN',
  AUDIT: 'INFO',
  INTGRN: 'INFO',
  PERFORMANCE: 'DEBUG'
});

/**
 * Contextual information to include in logs
 */
const context = ref({
  includeModule: true,
  includeFileName: true,
  includeOperationType: true,
  includeUserId: true
});

/**
 * Operation types metadata
 * Contains descriptions and icons for each operation type
 */
const operationTypesMetadata = {
  APP: {
    description: 'пользовательские операции, бизнес-логика',
    icon: 'mdi-account-outline'
  },
  SYSTEM: {
    description: 'обслуживающие процессы',
    icon: 'mdi-cogs'
  },
  SECURITY: {
    description: 'события безопасности',
    icon: 'mdi-shield-account-outline'
  },
  AUDIT: {
    description: 'события для регуляторного учета',
    icon: 'mdi-clipboard-text-outline'
  },
  INTGRN: {
    description: 'взаимодействие с внешними системами',
    icon: 'mdi-connection'
  },
  PERFORMANCE: {
    description: 'метрики производительности',
    icon: 'mdi-speedometer'
  }
};

/**
 * Available log levels for dropdowns
 */
const logLevels = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];

/**
 * Log level descriptions to display in tooltips
 */
const logLevelDescriptions = {
  'DEBUG': 'Детальная информация для разработчиков. Самый подробный уровень логирования.',
  'INFO': 'Общая информация о работе приложения. Стандартный уровень для большинства операций.',
  'WARN': 'Предупреждения, которые не останавливают работу, но требуют внимания.',
  'ERROR': 'Ошибки, препятствующие выполнению отдельной операции.',
  'FATAL': 'Критические ошибки, из-за которых приложение не может продолжать работу.'
};

/**
 * Load settings from the backend
 */
async function loadSettings() {
  isLoadingSettings.value = true;
  
  try {
    console.log('Loading settings for Console Transport Logging');
    const settings = await fetchSettings(section_path);
    
    // Apply settings to component
    if (settings && settings.length > 0) {
      console.log('Received settings:', settings);
      
      // Get specific settings by name with fallback values
      enabled.value = getSettingValue(section_path, 'enabled', true);
      outputFormat.value = getSettingValue(section_path, 'outputFormat', 'console');
      
      // Operation levels
      const loadedLevels = getSettingValue(section_path, 'operationLevels', null);
      if (loadedLevels) {
        operationLevels.value = { ...operationLevels.value, ...loadedLevels };
      }
      
      // Context settings
      const loadedContext = getSettingValue(section_path, 'context', null);
      if (loadedContext) {
        context.value = { ...context.value, ...loadedContext };
      }
    } else {
      console.log('No settings received for Console Transport Logging - using defaults');
    }
  } catch (error) {
    console.error('Failed to load console transport settings:', error);
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
  console.log('Application.Logging.Console component initialized');
  loadSettings();
});
</script>

<template>
  <div class="console-logging-container">
    <h2 class="text-h6 mb-4">вывод журналов событий в консоль node.js</h2>
    
    <!-- Loading indicator -->
    <DataLoading :loading="isLoadingSettings" size="medium" />
    
    <template v-if="!isLoadingSettings">
      <!-- Console Transport -->
      <div class="settings-section mb-4">
        <div class="section-content">
          <v-switch
            v-model="enabled"
            color="teal-darken-2"
            label="активировать вывод в консоль node.js"
            hide-details
            class="mb-4"
          ></v-switch>
          
          <v-select
            v-model="outputFormat"
            :items="outputFormats"
            label="формат вывода"
            variant="outlined"
            density="comfortable"
            color="teal-darken-2"
            :disabled="!enabled"
            class="mb-4"
            style="max-width: 200px;"
          ></v-select>
          
          <div class="mt-4">
            <p class="text-subtitle-2 mb-2">уровни логирования по типам операций</p>
            
            <v-row>
              <v-col 
                v-for="(value, key) in operationLevels" 
                :key="key"
                cols="12" 
                sm="6" 
                md="4"
              >
                <div class="d-flex align-center mb-1">
                  <v-icon :icon="operationTypesMetadata[key].icon" size="small" class="mr-1"></v-icon>
                  <span class="text-body-2">{{ key }}</span>
                  <v-tooltip location="top">
                    <template v-slot:activator="{ props }">
                      <v-icon 
                        icon="mdi-help-circle-outline" 
                        size="x-small" 
                        v-bind="props"
                        class="ms-1"
                      ></v-icon>
                    </template>
                    <div class="pa-2">{{ operationTypesMetadata[key].description }}</div>
                  </v-tooltip>
                </div>
                
                <v-select
                  v-model="operationLevels[key]"
                  :items="logLevels"
                  variant="outlined"
                  density="compact"
                  color="teal-darken-2"
                  :disabled="!enabled"
                  hide-details
                >
                  <template v-slot:item="{ item, props }">
                    <v-list-item v-bind="props" :title="item.title">
                      <v-tooltip location="right" max-width="300">
                        <template v-slot:activator="{ props: tooltipProps }">
                          <v-icon 
                            icon="mdi-help-circle-outline" 
                            size="x-small" 
                            class="ms-1"
                            v-bind="tooltipProps"
                          ></v-icon>
                        </template>
                        <div class="pa-2">{{ logLevelDescriptions[item.title] }}</div>
                      </v-tooltip>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>
            </v-row>
          </div>
          
          <div class="context-settings mt-4">
            <p class="text-subtitle-2 mb-2">контекстная информация в логах</p>
            
            <v-row>
              <v-col cols="12" sm="6">
                <v-switch
                  v-model="context.includeModule"
                  color="teal-darken-2"
                  label="название модуля"
                  density="compact"
                  hide-details
                  :disabled="!enabled"
                  class="mb-2"
                ></v-switch>
                
                <v-switch
                  v-model="context.includeFileName"
                  color="teal-darken-2"
                  label="имя файла"
                  density="compact"
                  hide-details
                  :disabled="!enabled"
                  class="mb-2"
                ></v-switch>
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-switch
                  v-model="context.includeOperationType"
                  color="teal-darken-2"
                  label="тип операции"
                  density="compact"
                  hide-details
                  :disabled="!enabled"
                  class="mb-2"
                ></v-switch>
                
                <v-switch
                  v-model="context.includeUserId"
                  color="teal-darken-2"
                  label="ID пользователя"
                  density="compact"
                  hide-details
                  :disabled="!enabled"
                  class="mb-2"
                ></v-switch>
              </v-col>
            </v-row>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.console-logging-container {
  /* Base container styling */
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