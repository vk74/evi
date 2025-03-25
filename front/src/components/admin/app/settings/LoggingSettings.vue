<!--
  File: LoggingSettings.vue
  Description: Logging configuration settings component
  Purpose: Configure application logging based on backend logger parameters
  
  Updated: 
  - Standardized divider colors to match other settings components
  - Used standard border-color rgba(0, 0, 0, 0.12) with opacity 1
-->

<script setup lang="ts">
import { ref } from 'vue';

/**
 * Core logger settings based on the backend service
 * Contains global configuration parameters for the entire logging system
 */
const appName = ref('ev2');
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
</script>

<template>
  <div class="logging-settings-container">
    <h2 class="text-h6 mb-4">настройки логирования</h2>
    
    <!-- Core Settings -->
    <div class="settings-section mb-4">
      <div class="section-title text-subtitle-1 d-flex align-center mb-4">
        <v-icon start icon="mdi-tune" class="mr-2"></v-icon>
        основные настройки
      </div>
      
      <div class="section-content">
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="appName"
              label="название приложения"
              variant="outlined"
              density="comfortable"
              hint="идентификатор приложения в системах сбора логов"
              color="teal-darken-2"
            ></v-text-field>
          </v-col>
          
          <v-col cols="12" md="6">
            <v-select
              v-model="timestampFormat"
              :items="['ISO', 'UTC', 'Local']"
              label="формат временной метки"
              variant="outlined"
              density="comfortable"
              color="teal-darken-2"
            ></v-select>
          </v-col>
        </v-row>
      </div>
      <v-divider class="mt-4"></v-divider>
    </div>
    
    <!-- Console Transport Settings -->
    <div class="settings-section mb-4">
      <div class="section-title text-subtitle-1 d-flex align-center mb-4">
        <v-icon start icon="mdi-console" class="mr-2"></v-icon>
        вывод журналов событий в консоль node.js
      </div>
      
      <div class="section-content">
        <v-switch
          v-model="consoleTransport.enabled"
          color="teal-darken-2"
          label="включить логирование в консоль"
          hide-details
          class="mb-4"
        ></v-switch>
        
        <v-expand-transition>
          <div v-if="consoleTransport.enabled">
            <!-- Console Format -->
            <v-select
              v-model="consoleTransport.outputFormat"
              :items="consoleTransport.outputFormats"
              label="формат вывода"
              variant="outlined"
              density="comfortable"
              class="mb-4"
              color="teal-darken-2"
              style="max-width: 200px;"
            ></v-select>
            
            <!-- Console Operation Types Settings -->
            <div class="mb-4">
              <span class="text-subtitle-2 mb-4 d-block">настройки типов операций</span>
              
              <v-list>
                <v-list-item
                  v-for="(level, opType) in consoleTransport.operationLevels"
                  :key="opType"
                >
                  <template v-slot:prepend>
                    <v-icon :icon="operationTypesMetadata[opType].icon" class="me-3" color="teal-darken-2"></v-icon>
                  </template>
                  
                  <template v-slot:title>
                    {{ opType }}
                  </template>
                  
                  <template v-slot:subtitle>
                    {{ operationTypesMetadata[opType].description }}
                  </template>
                  
                  <template v-slot:append>
                    <v-select
                      v-model="consoleTransport.operationLevels[opType]"
                      :items="logLevels"
                      variant="underlined"
                      density="compact"
                      hide-details
                      class="max-width-select"
                      color="teal-darken-2"
                    ></v-select>
                  </template>
                </v-list-item>
              </v-list>
            </div>
            
            <!-- Console Context Settings -->
            <div>
              <span class="text-subtitle-2 mb-2 d-block">контекст логирования</span>
              
              <v-row>
                <v-col cols="12" sm="6" md="3">
                  <v-checkbox
                    v-model="consoleTransport.context.includeModule"
                    label="название модуля"
                    color="teal-darken-2"
                    hide-details
                  ></v-checkbox>
                </v-col>
                
                <v-col cols="12" sm="6" md="3">
                  <v-checkbox
                    v-model="consoleTransport.context.includeFileName"
                    label="имя файла источника"
                    color="teal-darken-2"
                    hide-details
                  ></v-checkbox>
                </v-col>
                
                <v-col cols="12" sm="6" md="3">
                  <v-checkbox
                    v-model="consoleTransport.context.includeOperationType"
                    label="тип операции"
                    color="teal-darken-2"
                    hide-details
                  ></v-checkbox>
                </v-col>
                
                <v-col cols="12" sm="6" md="3">
                  <v-checkbox
                    v-model="consoleTransport.context.includeUserId"
                    label="id пользователя"
                    color="teal-darken-2"
                    hide-details
                  ></v-checkbox>
                </v-col>
              </v-row>
            </div>
          </div>
        </v-expand-transition>
      </div>
      <v-divider class="mt-4"></v-divider>
    </div>
    
    <!-- File Transport Settings -->
    <div class="settings-section mb-4">
      <div class="section-title text-subtitle-1 d-flex align-center mb-4">
        <v-icon start icon="mdi-file-outline" class="mr-2"></v-icon>
        логирование в файловую систему
      </div>
      
      <div class="section-content">
        <v-switch
          v-model="fileTransport.enabled"
          color="teal-darken-2"
          label="включить логирование в файловую систему"
          hide-details
          class="mb-2"
        ></v-switch>
        
        <v-alert
          type="info"
          variant="tonal"
          density="compact"
          class="mb-4 mt-2"
          color="teal-darken-2"
        >
          запись журналов событий в файловую систему находится в разработке
        </v-alert>
        
        <v-expand-transition>
          <div v-if="fileTransport.enabled">
            <!-- File Operation Types Settings -->
            <div class="mb-4">
              <span class="text-subtitle-2 mb-4 d-block">настройки типов операций</span>
              
              <v-list>
                <v-list-item
                  v-for="(level, opType) in fileTransport.operationLevels"
                  :key="opType"
                >
                  <template v-slot:prepend>
                    <v-icon :icon="operationTypesMetadata[opType].icon" class="me-3" color="teal-darken-2"></v-icon>
                  </template>
                  
                  <template v-slot:title>
                    {{ opType }}
                  </template>
                  
                  <template v-slot:subtitle>
                    {{ operationTypesMetadata[opType].description }}
                  </template>
                  
                  <template v-slot:append>
                    <v-select
                      v-model="fileTransport.operationLevels[opType]"
                      :items="logLevels"
                      variant="underlined"
                      density="compact"
                      hide-details
                      class="max-width-select"
                      color="teal-darken-2"
                    ></v-select>
                  </template>
                </v-list-item>
              </v-list>
            </div>
            
            <!-- File Storage Settings -->
            <div class="mb-4">
              <span class="text-subtitle-2 mb-2 d-block">настройки хранения</span>
              
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="fileTransport.filePath"
                    label="путь к файлам логов"
                    variant="outlined"
                    density="comfortable"
                    placeholder="/var/log/app/"
                    color="teal-darken-2"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="fileTransport.filePrefix"
                    label="префикс файлов логов"
                    variant="outlined"
                    density="comfortable"
                    placeholder="app-log-"
                    color="teal-darken-2"
                  ></v-text-field>
                </v-col>
              </v-row>
              
              <v-switch
                v-model="fileTransport.dailyRotation"
                color="teal-darken-2"
                label="ежедневная ротация логов"
                hide-details
                class="mb-4 mt-2"
              ></v-switch>
            </div>
            
            <!-- File Retention Policy -->
            <div class="mb-4">
              <span class="text-subtitle-2 mb-2 d-block">политика хранения</span>
              
              <v-radio-group v-model="fileTransport.retentionType" color="teal-darken-2">
                <v-radio
                  label="хранить логи определенный период времени"
                  value="time"
                  color="teal-darken-2"
                ></v-radio>
                
                <v-select
                  v-model="fileTransport.retentionPeriod"
                  :items="fileTransport.retentionPeriods"
                  label="период хранения"
                  variant="outlined"
                  density="comfortable"
                  class="ms-4 mt-2"
                  :disabled="fileTransport.retentionType !== 'time'"
                  color="teal-darken-2"
                  style="max-width: 200px;"
                ></v-select>
                
                <v-radio
                  label="хранить определенное количество файлов логов"
                  value="count"
                  class="mt-4"
                  color="teal-darken-2"
                ></v-radio>
                
                <v-text-field
                  v-model="fileTransport.maxLogFiles"
                  label="максимальное количество файлов"
                  type="number"
                  variant="outlined"
                  density="comfortable"
                  class="ms-4 mt-2"
                  :disabled="fileTransport.retentionType !== 'count'"
                  color="teal-darken-2"
                  style="max-width: 200px;"
                ></v-text-field>
                
                <v-radio
                  label="хранить логи до достижения лимита размера"
                  value="size"
                  class="mt-4"
                  color="teal-darken-2"
                ></v-radio>
                
                <v-text-field
                  v-model="fileTransport.maxLogSize"
                  label="максимальный общий размер (МБ)"
                  type="number"
                  variant="outlined"
                  density="comfortable"
                  class="ms-4 mt-2"
                  :disabled="fileTransport.retentionType !== 'size'"
                  color="teal-darken-2"
                  style="max-width: 200px;"
                ></v-text-field>
              </v-radio-group>
              
              <v-switch
                v-model="fileTransport.compressOldLogs"
                color="teal-darken-2"
                label="сжимать старые логи"
                hide-details
                class="mt-4"
              ></v-switch>
              
              <v-switch
                v-model="fileTransport.archiveLogsBeforeDelete"
                color="teal-darken-2"
                label="архивировать логи перед удалением"
                hide-details
                class="mt-2"
              ></v-switch>
            </div>
            
            <!-- File Context Settings -->
            <div>
              <span class="text-subtitle-2 mb-2 d-block">контекст логирования</span>
              
              <v-row>
                <v-col cols="12" sm="6" md="3">
                  <v-checkbox
                    v-model="fileTransport.context.includeModule"
                    label="название модуля"
                    color="teal-darken-2"
                    hide-details
                  ></v-checkbox>
                </v-col>
                
                <v-col cols="12" sm="6" md="3">
                  <v-checkbox
                    v-model="fileTransport.context.includeFileName"
                    label="имя файла источника"
                    color="teal-darken-2"
                    hide-details
                  ></v-checkbox>
                </v-col>
                
                <v-col cols="12" sm="6" md="3">
                  <v-checkbox
                    v-model="fileTransport.context.includeOperationType"
                    label="тип операции"
                    color="teal-darken-2"
                    hide-details
                  ></v-checkbox>
                </v-col>
                
                <v-col cols="12" sm="6" md="3">
                  <v-checkbox
                    v-model="fileTransport.context.includeUserId"
                    label="id пользователя"
                    color="teal-darken-2"
                    hide-details
                  ></v-checkbox>
                </v-col>
              </v-row>
            </div>
          </div>
        </v-expand-transition>
      </div>
      <v-divider class="mt-4"></v-divider>
    </div>
    
    <!-- Event Codes Examples -->
    <div class="settings-section">
      <div class="section-title text-subtitle-1 d-flex align-center mb-4">
        <v-icon start icon="mdi-barcode" class="mr-2"></v-icon>
        примеры кодов событий
      </div>
      
      <div class="section-content">
        <p class="text-body-2 mb-2">
          коды событий используются для идентификации определенных действий в системе.
          формат: <code>MODULE:SUBMODULE:FUNCTION:OPERATION:NUMBER</code>
        </p>
        
        <v-list density="compact" lines="one">
          <v-list-item
            v-for="(code, index) in ['ADMIN:USERS:USEREDITOR:UPDATE:001', 'ADMIN:SYSTEM:SESSION:DROP:004']"
            :key="index"
            :title="code"
            prepend-icon="mdi-code-tags"
            class="event-code-item"
          >
            <template v-slot:prepend>
              <v-icon icon="mdi-code-tags" color="teal-darken-2"></v-icon>
            </template>
          </v-list-item>
        </v-list>
      </div>
    </div>
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

/* Adjust spacing for selects in list items */
.max-width-select {
  max-width: 120px;
}

/* Style list items */
:deep(.v-list-item:hover) {
  background-color: rgba(0, 0, 0, 0.03);
}

/* Ensure all text fields have consistent width */
.logging-settings-container :deep(.v-text-field.v-input) {
  max-width: 100%;
}

/* Style the event code list items */
.event-code-item {
  border-radius: 4px;
  transition: background-color 0.2s ease;
}
</style>