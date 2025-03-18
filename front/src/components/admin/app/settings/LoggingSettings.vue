<!--
  File: LoggingSettings.vue
  Description: Logging configuration settings component
  Purpose: Configure application logging levels, destinations, and retention policies
-->

<template>
  <div class="settings-section">
    <h2 class="text-h6 mb-4">Logging Settings</h2>
    
    <!-- Log Levels -->
    <v-card variant="outlined" class="mb-4">
      <v-card-title class="text-subtitle-1">
        <v-icon start icon="mdi-format-list-bulleted" class="mr-2"></v-icon>
        Log Levels
      </v-card-title>
      <v-card-text>
        <v-select
          v-model="defaultLogLevel"
          :items="logLevels"
          label="Default Log Level"
          variant="outlined"
          density="comfortable"
        ></v-select>
        
        <div class="text-subtitle-2 mt-4 mb-2">Component-specific Log Levels</div>
        
        <v-list>
          <v-list-item
            v-for="component in logComponents"
            :key="component.id"
          >
            <template v-slot:prepend>
              <v-icon :icon="component.icon" class="me-3"></v-icon>
            </template>
            
            <template v-slot:title>
              {{ component.name }}
            </template>
            
            <template v-slot:append>
              <v-select
                v-model="component.level"
                :items="logLevels"
                variant="underlined"
                density="compact"
                hide-details
                class="max-width-select"
              ></v-select>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
    
    <!-- Log Storage -->
    <v-card variant="outlined" class="mb-4">
      <v-card-title class="text-subtitle-1">
        <v-icon start icon="mdi-harddisk" class="mr-2"></v-icon>
        Log Storage
      </v-card-title>
      <v-card-text>
        <v-select
          v-model="logStorage"
          :items="storageOptions"
          label="Log Storage Location"
          variant="outlined"
          density="comfortable"
        ></v-select>
        
        <v-text-field
          v-model="logPath"
          label="Log File Path"
          variant="outlined"
          density="comfortable"
          placeholder="/var/log/myapp/"
          class="mt-4"
          :disabled="logStorage !== 'File System'"
        ></v-text-field>
        
        <v-text-field
          v-model="databaseTable"
          label="Database Table"
          variant="outlined"
          density="comfortable"
          placeholder="application_logs"
          class="mt-4"
          :disabled="logStorage !== 'Database'"
        ></v-text-field>
        
        <v-text-field
          v-model="logPrefix"
          label="Log File Prefix"
          variant="outlined"
          density="comfortable"
          placeholder="app-log-"
          class="mt-4"
        ></v-text-field>
        
        <v-switch
          v-model="dailyRotation"
          color="primary"
          label="Enable daily log rotation"
          hide-details
          class="mt-4"
        ></v-switch>
      </v-card-text>
    </v-card>
    
    <!-- Retention Policy -->
    <v-card variant="outlined" class="mb-4">
      <v-card-title class="text-subtitle-1">
        <v-icon start icon="mdi-clock-outline" class="mr-2"></v-icon>
        Retention Policy
      </v-card-title>
      <v-card-text>
        <v-radio-group v-model="retentionType">
          <v-radio
            label="Keep logs for a specific time period"
            value="time"
          ></v-radio>
          
          <v-select
            v-model="retentionPeriod"
            :items="retentionPeriods"
            label="Retention Period"
            variant="outlined"
            density="comfortable"
            class="ms-4 mt-2"
            :disabled="retentionType !== 'time'"
          ></v-select>
          
          <v-radio
            label="Keep specific number of log files"
            value="count"
            class="mt-4"
          ></v-radio>
          
          <v-text-field
            v-model="maxLogFiles"
            label="Maximum Log Files"
            type="number"
            variant="outlined"
            density="comfortable"
            class="ms-4 mt-2"
            :disabled="retentionType !== 'count'"
          ></v-text-field>
          
          <v-radio
            label="Keep logs until storage limit is reached"
            value="size"
            class="mt-4"
          ></v-radio>
          
          <v-text-field
            v-model="maxLogSize"
            label="Maximum Total Size (MB)"
            type="number"
            variant="outlined"
            density="comfortable"
            class="ms-4 mt-2"
            :disabled="retentionType !== 'size'"
          ></v-text-field>
        </v-radio-group>
        
        <v-switch
          v-model="compressOldLogs"
          color="primary"
          label="Compress old logs"
          hide-details
          class="mt-4"
        ></v-switch>
        
        <v-switch
          v-model="archiveLogsBeforeDelete"
          color="primary"
          label="Archive logs before deletion"
          hide-details
          class="mt-2"
        ></v-switch>
      </v-card-text>
    </v-card>
    
    <!-- Log Monitoring -->
    <v-card variant="outlined">
      <v-card-title class="text-subtitle-1">
        <v-icon start icon="mdi-alert-circle-outline" class="mr-2"></v-icon>
        Log Monitoring & Alerts
      </v-card-title>
      <v-card-text>
        <v-switch
          v-model="enableAlerts"
          color="primary"
          label="Enable log monitoring alerts"
          hide-details
        ></v-switch>
        
        <div class="text-subtitle-2 mt-4 mb-2">Send alerts for:</div>
        
        <v-checkbox
          v-model="alertOnError"
          label="Error logs"
          color="primary"
          hide-details
          :disabled="!enableAlerts"
        ></v-checkbox>
        
        <v-checkbox
          v-model="alertOnWarning"
          label="Warning logs"
          color="primary"
          hide-details
          :disabled="!enableAlerts"
          class="mt-2"
        ></v-checkbox>
        
        <v-checkbox
          v-model="alertOnCritical"
          label="Critical logs"
          color="primary"
          hide-details
          :disabled="!enableAlerts"
          class="mt-2"
        ></v-checkbox>
        
        <v-select
          v-model="alertMethod"
          :items="alertMethods"
          label="Alert Notification Method"
          variant="outlined"
          density="comfortable"
          class="mt-4"
          :disabled="!enableAlerts"
        ></v-select>
        
        <v-text-field
          v-model="alertRecipients"
          label="Alert Recipients"
          placeholder="admin@example.com, sysadmin@example.com"
          variant="outlined"
          density="comfortable"
          class="mt-4"
          :disabled="!enableAlerts || alertMethod === 'None'"
        ></v-text-field>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// Log levels
const defaultLogLevel = ref('Info');
const logLevels = ['Trace', 'Debug', 'Info', 'Warning', 'Error', 'Critical', 'None'];

// Log components
const logComponents = ref([
  {
    id: 1,
    name: 'Authentication',
    icon: 'mdi-shield-account-outline',
    level: 'Info'
  },
  {
    id: 2,
    name: 'Database',
    icon: 'mdi-database-outline',
    level: 'Warning'
  },
  {
    id: 3,
    name: 'API Requests',
    icon: 'mdi-api',
    level: 'Info'
  },
  {
    id: 4,
    name: 'User Actions',
    icon: 'mdi-account-outline',
    level: 'Info'
  },
  {
    id: 5,
    name: 'Background Services',
    icon: 'mdi-cogs',
    level: 'Warning'
  }
]);

// Log storage
const logStorage = ref('File System');
const storageOptions = ['File System', 'Database', 'Cloud Storage', 'Syslog'];
const logPath = ref('/var/log/myapp/');
const databaseTable = ref('application_logs');
const logPrefix = ref('app-log-');
const dailyRotation = ref(true);

// Retention policy
const retentionType = ref('time');
const retentionPeriod = ref('30 days');
const retentionPeriods = [
  '1 day',
  '7 days',
  '14 days',
  '30 days',
  '60 days',
  '90 days',
  '180 days',
  '1 year'
];
const maxLogFiles = ref(30);
const maxLogSize = ref(1000);
const compressOldLogs = ref(true);
const archiveLogsBeforeDelete = ref(false);

// Monitoring and alerts
const enableAlerts = ref(true);
const alertOnError = ref(true);
const alertOnWarning = ref(false);
const alertOnCritical = ref(true);
const alertMethod = ref('Email');
const alertMethods = ['None', 'Email', 'SMS', 'Webhook', 'Slack', 'Teams'];
const alertRecipients = ref('admin@example.com');
</script>

<style scoped>

</style>