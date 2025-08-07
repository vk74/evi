<!--
version: 1.0.0
Frontend file for catalog service card component.
Displays service information in a card format.
File: CatalogServiceCard.vue
-->
<script setup lang="ts">
import type { CatalogService } from './types.services';

// ==================== PROPS ====================
interface Props {
  service: CatalogService;
}

const props = defineProps<Props>();

// ==================== HELPER FUNCTIONS ====================
function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high': return 'error';
    case 'medium': return 'warning';
    case 'low': return 'success';
    default: return 'grey';
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return 'success';
    case 'inactive': return 'grey';
    case 'maintenance': return 'warning';
    default: return 'grey';
  }
}

function getPriorityText(priority: string): string {
  switch (priority) {
    case 'high': return 'Высокий';
    case 'medium': return 'Средний';
    case 'low': return 'Низкий';
    default: return priority;
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'active': return 'Активен';
    case 'inactive': return 'Неактивен';
    case 'maintenance': return 'Обслуживание';
    default: return status;
  }
}
</script>

<template>
  <v-card
    class="service-card"
    elevation="2"
    hover
  >
    <v-card-title class="d-flex align-center">
      <v-icon
        :icon="service.icon"
        :color="service.color"
        class="me-3"
        size="large"
      />
      <div class="flex-grow-1">
        <div class="text-h6">{{ service.name }}</div>
        <div class="text-caption text-grey">
          {{ service.category }}
        </div>
      </div>
    </v-card-title>

    <v-card-text>
      <p class="text-body-2 mb-3">
        {{ service.description }}
      </p>

      <!-- Service-specific info -->
      <div class="mb-2">
        <v-chip
          :color="getPriorityColor(service.priority)"
          size="small"
          class="me-2"
        >
          {{ getPriorityText(service.priority) }} приоритет
        </v-chip>
        
        <v-chip
          :color="getStatusColor(service.status)"
          size="small"
        >
          {{ getStatusText(service.status) }}
        </v-chip>
      </div>

      <!-- Owner info -->
      <div class="mt-3">
        <div class="text-caption text-grey">
          Владелец: {{ service.owner }}
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.service-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  background-color: rgb(242, 242, 242);
}

.service-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: rgba(0, 0, 0, 0.24);
}

.service-card .v-card-title {
  padding-bottom: 8px;
}

.service-card .v-card-text {
  flex-grow: 1;
  padding-top: 0;
}
</style> 