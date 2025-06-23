<!--
  File: Application.Logging.vue
  Description: Logging configuration settings component
  Purpose: Configure application logging based on backend logger parameters
  Version: 1.1
-->

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useAppSettingsStore } from '@/modules/admin/settings/state.app.settings';
import { fetchSettings, getSettingValue } from '@/modules/admin/settings/service.fetch.settings';
import DataLoading from '@/core/ui/loaders/DataLoading.vue';

// Section path identifier - using component name for better consistency
const section_path = 'Application.Logging';

// Store reference
const appSettingsStore = useAppSettingsStore();

// Loading state
const isLoadingSettings = ref(true);

/**
 * Core logger settings based on the backend service
 * Contains global configuration parameters for the entire logging system
 */
const loggingEnabled = ref(true);
const appName = ref('ev2');
const appNameEnabled = ref(true);
const timestampFormat = ref('ISO');

/**
 * Console Transport Settings
 * Contains settings specific to console logging transport
 */
const consoleTransport = ref({
  enabled: true,
  outputFormat: 'console',
  outputFormats: ['console', 'json', 'elastic'],
  operationLevels: {
    APP: 'INFO',
    SYSTEM: 'INFO',
    SECURITY: 'WARN',
    AUDIT: 'INFO',
    INTGRN: 'INFO',
    PERFORMANCE: 'DEBUG'
  },
  context: {
    includeModule: true,
    includeFileName: true,
    includeOperationType: true,
    includeUserId: true
  }
});

/**
 * File Transport Settings
 * Contains settings specific to file logging transport including retention policies
 */
const fileTransport = ref({
  enabled: false,
  operationLevels: {
    APP: 'WARN',
    SYSTEM: 'WARN',
    SECURITY: 'ERROR',
    AUDIT: 'WARN',
    INTGRN: 'WARN',
    PERFORMANCE: 'INFO'
  },
  context: {
    includeModule: true,
    includeFileName: true,
    includeOperationType: true,
    includeUserId: true
  },
  filePath: '/var/log/app/',
  filePrefix: 'app-log-',
  dailyRotation: true,
  retentionType: 'time',
  retentionPeriod: '30 days',
  retentionPeriods: [
    '1 day',
    '7 days',
    '14 days',
    '30 days',
    '60 days',
    '90 days',
    '180 days',
    '1 year'
  ],
  maxLogFiles: 30,
  maxLogSize: 1000,
  compressOldLogs: true,
  archiveLogsBeforeDelete: false
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
    console.log('Loading settings for Application Logging');
    const settings = await fetchSettings(section_path);
    
    // Apply settings to component
    if (settings && settings.length > 0) {
      console.log('Received settings:', settings);
      
      // Get specific settings by name with fallback values
      loggingEnabled.value = getSettingValue(section_path, 'loggingEnabled', true);
      appName.value = getSettingValue(section_path, 'appName', 'ev2');
      appNameEnabled.value = getSettingValue(section_path, 'appNameEnabled', true);
      timestampFormat.value = getSettingValue(section_path, 'timestampFormat', 'ISO');
    } else {
      console.log('No settings received for Application Logging - using defaults');
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
  console.log('Application.Logging component initialized');
  loadSettings();
});
</script>

<template>
  <div class="logging-settings-container">
    <h2 class="text-h6 mb-4">
      настройки логирования
    </h2>
    
    <v-alert
      type="info"
      variant="tonal"
      density="compact"
      class="mb-4 mt-2"
    >
      компонент находится в разработке
    </v-alert>
    
    <!-- Loading indicator -->
    <DataLoading
      :loading="isLoadingSettings"
      size="medium"
    />
    
    <template v-if="!isLoadingSettings">
      <!-- Core Settings -->
      <div class="settings-section mb-4">
        <div class="section-title text-subtitle-1 d-flex align-center mb-4">
          <v-icon
            start
            icon="mdi-tune"
            class="mr-2"
          />
          основные настройки
        </div>
        
        <div class="section-content">
          <v-switch
            v-model="loggingEnabled"
            color="teal-darken-2"
            label="включить логирование"
            hide-details
            class="mb-2"
          />
          
          <v-switch
            v-model="appNameEnabled"
            color="teal-darken-2"
            label="идентификатор приложения"
            hide-details
            class="mb-2"
            :disabled="!loggingEnabled"
          />
          
          <v-text-field
            v-model="appName"
            label="название приложения"
            variant="outlined"
            density="comfortable"
            color="teal-darken-2"
            :disabled="!appNameEnabled"
            class="mb-4"
          >
            <template #append>
              <v-tooltip
                location="top"
                max-width="400"
              >
                <template #activator="{ props }">
                  <v-icon 
                    icon="mdi-help-circle-outline" 
                    size="small" 
                    v-bind="props"
                    color="teal-darken-2"
                  />
                </template>
                <div class="pa-2">
                  Используется для группировки логов в системах SIEM, мониторинга и аналитики. Индикатор приложения будет добавлен ко всем записям в логах, в виде префикса, чтобы их можно было фильтровать и отличать от логов других приложений.
                </div>
              </v-tooltip>
            </template>
          </v-text-field>
          
          <v-select
            v-model="timestampFormat"
            :items="['ISO', 'UTC', 'Local']"
            label="формат метки времени"
            variant="outlined"
            density="comfortable"
            color="teal-darken-2"
            style="max-width: 200px;"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.logging-settings-container {
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