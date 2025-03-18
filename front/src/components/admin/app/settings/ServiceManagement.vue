<!--
  File: ServiceManagement.vue
  Description: Service management settings component
  Purpose: Configure application services, API connections, third-party integrations
-->

<template>
  <div class="settings-section">
    <h2 class="text-h6 mb-4">Service Management</h2>
    
    <!-- API Configuration -->
    <v-card variant="outlined" class="mb-4">
      <v-card-title class="text-subtitle-1">
        <v-icon start icon="mdi-api" class="mr-2"></v-icon>
        API Configuration
      </v-card-title>
      <v-card-text>
        <v-text-field
          v-model="apiEndpoint"
          label="API Endpoint URL"
          variant="outlined"
          density="comfortable"
          placeholder="https://api.example.com/v1"
        ></v-text-field>
        
        <v-select
          v-model="apiVersion"
          :items="apiVersions"
          label="API Version"
          variant="outlined"
          density="comfortable"
          class="mt-4"
        ></v-select>
        
        <v-slider
          v-model="apiTimeout"
          label="API Timeout (seconds)"
          min="5"
          max="60"
          step="5"
          thumb-label
          class="mt-4"
        ></v-slider>
        
        <v-switch
          v-model="enableApiCaching"
          color="primary"
          label="Enable API Caching"
          hide-details
          class="mt-4"
        ></v-switch>
      </v-card-text>
    </v-card>
    
    <!-- Service Health -->
    <v-card variant="outlined" class="mb-4">
      <v-card-title class="text-subtitle-1">
        <v-icon start icon="mdi-heart-pulse" class="mr-2"></v-icon>
        Service Health
      </v-card-title>
      <v-card-text>
        <div class="d-flex align-center mb-4">
          <div class="me-auto">
            <div class="text-body-1">Health Check Status</div>
            <div class="text-caption text-medium-emphasis">Last checked: {{ lastHealthCheck }}</div>
          </div>
          <v-chip
            :color="healthStatus === 'Healthy' ? 'success' : healthStatus === 'Degraded' ? 'warning' : 'error'"
            size="small"
            class="me-2"
          >
            {{ healthStatus }}
          </v-chip>
          <v-btn
            variant="tonal"
            color="primary"
            size="small"
            prepend-icon="mdi-refresh"
            @click="checkHealth"
          >
            Check now
          </v-btn>
        </div>
        
        <v-select
          v-model="healthCheckInterval"
          :items="healthCheckIntervals"
          label="Health Check Interval"
          variant="outlined"
          density="comfortable"
        ></v-select>
        
        <v-switch
          v-model="autoRestart"
          color="primary"
          label="Auto-restart unhealthy services"
          hide-details
          class="mt-4"
        ></v-switch>
        
        <v-switch
          v-model="alertOnFailure"
          color="primary"
          label="Alert administrators on service failure"
          hide-details
          class="mt-2"
        ></v-switch>
      </v-card-text>
    </v-card>
    
    <!-- Third-party Integrations -->
    <v-card variant="outlined" class="mb-4">
      <v-card-title class="d-flex align-center text-subtitle-1">
        <v-icon start icon="mdi-connection" class="mr-2"></v-icon>
        Integrations
        <v-spacer></v-spacer>
        <v-btn
          size="small"
          color="primary"
          variant="text"
          prepend-icon="mdi-plus"
        >
          Add
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-list>
          <v-list-item
            v-for="integration in integrations"
            :key="integration.id"
            :subtitle="integration.description"
          >
            <template v-slot:prepend>
              <v-avatar
                size="36"
                :color="integration.enabled ? 'primary' : 'grey-lighten-2'"
                class="me-3"
              >
                <v-icon :icon="integration.icon" color="white"></v-icon>
              </v-avatar>
            </template>
            
            <template v-slot:title>
              {{ integration.name }}
            </template>
            
            <template v-slot:append>
              <v-switch
                v-model="integration.enabled"
                color="primary"
                hide-details
              ></v-switch>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
    
    <!-- Background Services -->
    <v-card variant="outlined">
      <v-card-title class="text-subtitle-1">
        <v-icon start icon="mdi-cogs" class="mr-2"></v-icon>
        Background Services
      </v-card-title>
      <v-card-text>
        <v-list>
          <v-list-item
            v-for="service in backgroundServices"
            :key="service.id"
            :subtitle="service.description"
          >
            <template v-slot:prepend>
              <v-icon :icon="service.icon" class="me-3" color="primary"></v-icon>
            </template>
            
            <template v-slot:title>
              {{ service.name }}
            </template>
            
            <template v-slot:append>
              <v-switch
                v-model="service.enabled"
                color="primary"
                hide-details
              ></v-switch>
            </template>
          </v-list-item>
        </v-list>
        
        <v-alert
          type="info"
          variant="tonal"
          border="start"
          class="mt-4"
          density="compact"
        >
          Disabling background services may affect application performance and functionality.
        </v-alert>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// API Configuration
const apiEndpoint = ref('https://api.example.com/v1');
const apiVersion = ref('v1.0');
const apiVersions = ['v1.0', 'v1.1', 'v2.0-beta'];
const apiTimeout = ref(30);
const enableApiCaching = ref(true);

// Service Health
const healthStatus = ref('Healthy');
const lastHealthCheck = ref('Today, 09:45 AM');
const healthCheckInterval = ref('Every 15 minutes');
const healthCheckIntervals = [
  'Manual only',
  'Every 5 minutes',
  'Every 15 minutes',
  'Every 30 minutes',
  'Every hour',
  'Daily'
];
const autoRestart = ref(true);
const alertOnFailure = ref(true);

/**
 * Simulates checking the health of services
 * In a real implementation, this would make API calls to check service status
 */
const checkHealth = () => {
  lastHealthCheck.value = new Date().toLocaleString();
  // Randomly set health status for demo purposes
  const statuses = ['Healthy', 'Degraded', 'Unhealthy'];
  const randomIndex = Math.floor(Math.random() * statuses.length);
  healthStatus.value = statuses[randomIndex];
};

// Third-party Integrations
const integrations = ref([
  {
    id: 1,
    name: 'Email Service (SendGrid)',
    description: 'Handles email notifications and alerts',
    icon: 'mdi-email-outline',
    enabled: true
  },
  {
    id: 2,
    name: 'Payment Gateway (Stripe)',
    description: 'Processes payments and subscriptions',
    icon: 'mdi-credit-card-outline',
    enabled: true
  },
  {
    id: 3,
    name: 'Storage Service (AWS S3)',
    description: 'Handles file storage and retrieval',
    icon: 'mdi-cloud-outline',
    enabled: true
  },
  {
    id: 4,
    name: 'Analytics (Google Analytics)',
    description: 'Tracks user behavior and metrics',
    icon: 'mdi-chart-line',
    enabled: false
  }
]);

// Background Services
const backgroundServices = ref([
  {
    id: 1,
    name: 'Data Synchronization',
    description: 'Syncs data between services and databases',
    icon: 'mdi-sync',
    enabled: true
  },
  {
    id: 2,
    name: 'Scheduled Reports',
    description: 'Generates and sends scheduled reports',
    icon: 'mdi-file-chart-outline',
    enabled: true
  },
  {
    id: 3,
    name: 'Automated Backups',
    description: 'Creates regular backups of application data',
    icon: 'mdi-backup-restore',
    enabled: true
  },
  {
    id: 4,
    name: 'Notification Service',
    description: 'Processes and sends notifications to users',
    icon: 'mdi-bell-outline',
    enabled: true
  }
]);
</script>

<style scoped>

</style>