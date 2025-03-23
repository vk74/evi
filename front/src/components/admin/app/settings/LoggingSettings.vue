<!--
  File: LoggingSettings.vue
  Description: Logging configuration settings component
  Purpose: Configure application logging based on backend logger parameters
  Author: Updated to match real backend logger configuration with separate transport settings
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
  <div class="settings-section logging-settings">
    <h2 class="text-h6 mb-4">настройки логирования</h2>
    
    <!-- Core Settings -->
    <v-card variant="outlined" class="mb-4">
      <v-card-title class="text-subtitle-1 mb-4">
        <v-icon start icon="mdi-tune" class="mr-2"></v-icon>
        основные настройки
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="appName"
              label="Название приложения"
              variant="outlined"
              density="comfortable"
              hint="идентификатор приложения в системах сбора логов"
            ></v-text-field>
          </v-col>
          
          <v-col cols="12" md="6">
            <v-select
              v-model="timestampFormat"
              :items="['ISO', 'UTC', 'Local']"
              label="формат временной метки"
              variant="outlined"
              density="comfortable"
            ></v-select>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    
    <!-- Console Transport Settings -->
    <v-card variant="outlined" class="mb-4">
      <v-card-title class="text-subtitle-1 mb-4">
        <v-icon start icon="mdi-console" class="mr-2"></v-icon>
        вывод журналов событий в консоль node.js
      </v-card-title>
      
      <v-card-text>
        <v-switch
          v-model="consoleTransport.enabled"
          color="primary"
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
                    <v-icon :icon="operationTypesMetadata[opType].icon" class="me-3"></v-icon>
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
                    label="Название модуля"
                    color="primary"
                    hide-details
                  ></v-checkbox>
                </v-col>
                
                <v-col cols="12" sm="6" md="3">
                  <v-checkbox
                    v-model="consoleTransport.context.includeFileName"
                    label="имя файла источника"
                    color="primary"
                    hide-details
                  ></v-checkbox>
                </v-col>
                
                <v-col cols="12" sm="6" md="3">
                  <v-checkbox
                    v-model="consoleTransport.context.includeOperationType"
                    label="тип операции"
                    color="primary"
                    hide-details
                  ></v-checkbox>
                </v-col>
                
                <v-col cols="12" sm="6" md="3">
                  <v-checkbox
                    v-model="consoleTransport.context.includeUserId"
                    label="ID пользователя"
                    color="primary"
                    hide-details
                  ></v-checkbox>
                </v-col>
              </v-row>
            </div>
          </div>
        </v-expand-transition>
      </v-card-text>
    </v-card>
    
    <!-- File Transport Settings -->
    <v-card variant="outlined" class="mb-4">
      <v-card-title class="text-subtitle-1 mb-4">
        <v-icon start icon="mdi-file-outline" class="mr-2"></v-icon>
        логирование в файловую систему
      </v-card-title>
      
      <v-card-text>
        <v-switch
          v-model="fileTransport.enabled"
          color="primary"
          label="включить логирование в файловую систему"
          hide-details
          class="mb-2"
        ></v-switch>
        
        <v-alert
          type="info"
          variant="tonal"
          density="compact"
          class="mb-4 mt-2"
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
                    <v-icon :icon="operationTypesMetadata[opType].icon" class="me-3"></v-icon>
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
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="fileTransport.filePrefix"
                    label="префикс файлов логов"
                    variant="outlined"
                    density="comfortable"
                    placeholder="app-log-"
                  ></v-text-field>
                </v-col>
              </v-row>
              
              <v-switch
                v-model="fileTransport.dailyRotation"
                color="primary"
                label="ежедневная ротация логов"
                hide-details
                class="mb-4 mt-2"
              ></v-switch>
            </div>
            
            <!-- File Retention Policy -->
            <div class="mb-4">
              <span class="text-subtitle-2 mb-2 d-block">политика хранения</span>
              
              <v-radio-group v-model="fileTransport.retentionType">
                <v-radio
                  label="хранить логи определенный период времени"
                  value="time"
                ></v-radio>
                
                <v-select
                  v-model="fileTransport.retentionPeriod"
                  :items="fileTransport.retentionPeriods"
                  label="период хранения"
                  variant="outlined"
                  density="comfortable"
                  class="ms-4 mt-2"
                  :disabled="fileTransport.retentionType !== 'time'"
                ></v-select>
                
                <v-radio
                  label="Хранить определенное количество файлов логов"
                  value="count"
                  class="mt-4"
                ></v-radio>
                
                <v-text-field
                  v-model="fileTransport.maxLogFiles"
                  label="Максимальное количество файлов"
                  type="number"
                  variant="outlined"
                  density="comfortable"
                  class="ms-4 mt-2"
                  :disabled="fileTransport.retentionType !== 'count'"
                ></v-text-field>
                
                <v-radio
                  label="Хранить логи до достижения лимита размера"
                  value="size"
                  class="mt-4"
                ></v-radio>
                
                <v-text-field
                  v-model="fileTransport.maxLogSize"
                  label="Максимальный общий размер (МБ)"
                  type="number"
                  variant="outlined"
                  density="comfortable"
                  class="ms-4 mt-2"
                  :disabled="fileTransport.retentionType !== 'size'"
                ></v-text-field>
              </v-radio-group>
              
              <v-switch
                v-model="fileTransport.compressOldLogs"
                color="primary"
                label="Сжимать старые логи"
                hide-details
                class="mt-4"
              ></v-switch>
              
              <v-switch
                v-model="fileTransport.archiveLogsBeforeDelete"
                color="primary"
                label="Архивировать логи перед удалением"
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
                    label="Название модуля"
                    color="primary"
                    hide-details
                  ></v-checkbox>
                </v-col>
                
                <v-col cols="12" sm="6" md="3">
                  <v-checkbox
                    v-model="fileTransport.context.includeFileName"
                    label="Имя файла источника"
                    color="primary"
                    hide-details
                  ></v-checkbox>
                </v-col>
                
                <v-col cols="12" sm="6" md="3">
                  <v-checkbox
                    v-model="fileTransport.context.includeOperationType"
                    label="Тип операции"
                    color="primary"
                    hide-details
                  ></v-checkbox>
                </v-col>
                
                <v-col cols="12" sm="6" md="3">
                  <v-checkbox
                    v-model="fileTransport.context.includeUserId"
                    label="ID пользователя"
                    color="primary"
                    hide-details
                  ></v-checkbox>
                </v-col>
              </v-row>
            </div>
          </div>
        </v-expand-transition>
      </v-card-text>
    </v-card>
    
    <!-- Event Codes Examples -->
    <v-card variant="outlined">
      <v-card-title class="text-subtitle-1 mb-4">
        <v-icon start icon="mdi-barcode" class="mr-2"></v-icon>
        примеры кодов событий
      </v-card-title>
      <v-card-text>
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
          ></v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </div>
</template>

<style scoped>
/* Target cards in this component for grey borders */
:deep(.v-card.v-card--variant-outlined) {
  border-color: rgba(0, 0, 0, 0.12) !important;
}

/* Add subtle hover effect to cards */
.logging-settings .v-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.logging-settings .v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
}

/* Adjust spacing for selects in list items */
.max-width-select {
  max-width: 120px;
}
</style>